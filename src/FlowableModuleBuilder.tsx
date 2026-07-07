import { useState, useEffect, useCallback, useRef } from "react";

// ─── Config ───────────────────────────────────────────────────────────────────
const BASE = "http://localhost:3000/flowable-api";

async function apiFetch(path: string) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${path}`);
  return res.json();
}

async function apiPost(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) { const txt = await res.text(); throw new Error(`${res.status} — ${txt}`); }
  return res.json();
}

async function apiPut(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) { const txt = await res.text(); throw new Error(`${res.status} — ${txt}`); }
  if (res.status === 204) return {};
  return res.json();
}

async function apiDelete(path: string) {
  const res = await fetch(`${BASE}${path}`, { method: "DELETE" });
  if (!res.ok) { const txt = await res.text(); throw new Error(`${res.status} — ${txt}`); }
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProcessDef {
  id: string; key: string; name: string;
  version: number; deploymentId: string; startFormDefined: boolean;
}
interface FormProperty {
  id: string; name: string; type: string;
  required: boolean; readable: boolean; writable: boolean;
  enumValues: { id: string; name: string }[];
}
interface FormData {
  formKey: string | null; processDefinitionId: string;
  formProperties: FormProperty[];
}
interface Module {
  id: string; processInstanceId: string;
  processKey: string; processName: string;
  fields: Record<string, string>;
  data: Record<string, unknown>[];
}

// ─── UI Spec types (parsed from BPMN Class fields) ────────────────────────────
interface UIComponentSpec {
  id: string;
  uiComponent: string;           // "table" | "button" | "label" | "stat" | "form" | "tabs"
  uiTitle?: string;
  uiLabel?: string;
  uiColor?: string;              // "danger" | "warning" | "success" | "info" | "default"
  uiSize?: string;               // "sm" | "md" | "lg"
  uiAction?: string;             // "METHOD:/path/{id}"
  uiConfirm?: string;
  uiDataSource?: string;         // "GET:/identity/users"
  uiColumns?: string;            // "id,firstName,email,enabled"
  uiBadgeColumns?: string;       // "enabled:true=Active:success,false=Inactive:danger;status:active=Active:success"
  uiSearchable?: string;
  uiRefreshable?: string;
  uiShowWhen?: string;
  uiIcon?: string;
  uiText?: string;
  uiTabs?: string;               // "ui,tasks,history" — defines which tabs appear
  [key: string]: string | undefined;
}

// ─── Badge column config (parsed from uiBadgeColumns field) ──────────────────
// Format: "columnName:value1=Label1:color1,value2=Label2:color2;anotherCol:..."
// Example: "enabled:true=Active:success,false=Inactive:danger"
interface BadgeRule {
  label: string;
  color: string;
}
type BadgeColumnMap = Record<string, Record<string, BadgeRule>>;

function parseBadgeColumns(raw: string | undefined): BadgeColumnMap {
  const result: BadgeColumnMap = {};
  if (!raw) return result;
  // Split by ";" for multiple columns
  for (const colDef of raw.split(";")) {
    const colonIdx = colDef.indexOf(":");
    if (colonIdx === -1) continue;
    const colName = colDef.substring(0, colonIdx).trim();
    const ruleStr = colDef.substring(colonIdx + 1).trim();
    result[colName] = {};
    // Each rule is "value=Label:color" separated by ","
    for (const rule of ruleStr.split(",")) {
      const eqIdx = rule.indexOf("=");
      if (eqIdx === -1) continue;
      const val = rule.substring(0, eqIdx).trim();
      const rest = rule.substring(eqIdx + 1).trim();
      const lastColon = rest.lastIndexOf(":");
      const label = lastColon !== -1 ? rest.substring(0, lastColon).trim() : rest;
      const color = lastColon !== -1 ? rest.substring(lastColon + 1).trim() : "default";
      result[colName][val] = { label, color };
    }
  }
  return result;
}

// ─── BPMN Parser ──────────────────────────────────────────────────────────────
async function fetchUISpec(proc: ProcessDef): Promise<UIComponentSpec[]> {
  let xmlText = "";
  for (const ext of [`${proc.key}.bpmn`, `${proc.key}.bpmn20.xml`]) {
    try {
      const res = await fetch(
        `${BASE}/repository/deployments/${proc.deploymentId}/resourcedata/${ext}`
      );
      if (res.ok) { xmlText = await res.text(); break; }
    } catch { /* try next */ }
  }
  if (!xmlText) return [];
  return parseBpmnUISpec(xmlText);
}

function parseBpmnUISpec(xml: string): UIComponentSpec[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "text/xml");
    const specs: UIComponentSpec[] = [];

    const serviceTasks = Array.from(doc.getElementsByTagName("serviceTask"))
      .concat(Array.from(doc.getElementsByTagName("bpmn:serviceTask")))
      .concat(Array.from(doc.getElementsByTagName("bpmn2:serviceTask")));

    for (const task of serviceTasks) {
      const taskId = task.getAttribute("id") ?? "";
      const fields: Record<string, string> = {};
      const fieldEls = [
        ...Array.from(task.getElementsByTagName("flowable:field")),
        ...Array.from(task.getElementsByTagName("activiti:field")),
      ];

      for (const field of fieldEls) {
        const name = field.getAttribute("name") ?? "";
        if (!name) continue;
        const stringValue = field.getAttribute("stringValue") ??
          field.getElementsByTagName("flowable:string")[0]?.textContent ??
          field.getElementsByTagName("activiti:string")[0]?.textContent ??
          field.getElementsByTagName("string")[0]?.textContent ?? "";
        fields[name] = stringValue.trim();
      }

      if (fields["uiComponent"]) {
        specs.push({ id: taskId, ...fields } as UIComponentSpec);
      }
    }
    return specs;
  } catch {
    return [];
  }
}

// ─── Color helpers ────────────────────────────────────────────────────────────
const COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  danger:  { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
  warning: { bg: "#fef9c3", text: "#92400e", border: "#fde68a" },
  success: { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
  info:    { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  default: { bg: "#f9fafb", text: "#374151", border: "#d1d5db" },
};

function colorStyle(color?: string) {
  return COLOR_MAP[color ?? "default"] ?? COLOR_MAP["default"];
}

// ─── Action executor ──────────────────────────────────────────────────────────
async function executeAction(actionStr: string, row: Record<string, unknown>) {
  const [method, ...pathParts] = actionStr.split(":");
  let path = pathParts.join(":");
  path = path.replace(/\{(\w+)\}/g, (_, key) => String(row[key] ?? ""));
  if (method === "DELETE") await apiDelete(path);
  else if (method === "PUT") await apiPut(path, {});
  else if (method === "POST") await apiPost(path, {});
}

// ─── showWhen evaluator ───────────────────────────────────────────────────────
function evalShowWhen(condition: string | undefined, row: Record<string, unknown>): boolean {
  if (!condition) return true;
  try {
    const eqMatch = condition.match(/^(\w+)==(.+)$/);
    if (eqMatch) return String(row[eqMatch[1]]) === eqMatch[2];
    const neqMatch = condition.match(/^(\w+)!=(.+)$/);
    if (neqMatch) return String(row[neqMatch[1]]) !== neqMatch[2];
  } catch { /* fall through */ }
  return true;
}

// ─── DynamicButton ────────────────────────────────────────────────────────────
function DynamicButton({ spec, row, onDone }: {
  spec: UIComponentSpec;
  row: Record<string, unknown>;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const c = colorStyle(spec.uiColor);
  const sizeMap = {
    sm: { padding: "4px 10px", fontSize: 12 },
    md: { padding: "6px 14px", fontSize: 13 },
    lg: { padding: "8px 18px", fontSize: 14 },
  };
  const sz = sizeMap[spec.uiSize as keyof typeof sizeMap] ?? sizeMap.sm;

  if (!evalShowWhen(spec.uiShowWhen, row)) return null;

  const doAction = async () => {
    if (!spec.uiAction) return;
    setBusy(true);
    try { await executeAction(spec.uiAction, row); onDone(); }
    catch (e) { alert(String(e)); }
    finally { setBusy(false); setConfirmOpen(false); }
  };

  const handleClick = () => {
    if (spec.uiConfirm) setConfirmOpen(true);
    else doAction();
  };

  return (
    <>
      <button
        disabled={busy}
        onClick={handleClick}
        style={{
          ...sz, borderRadius: 6, border: `1px solid ${c.border}`,
          background: c.bg, color: c.text, cursor: busy ? "default" : "pointer",
          fontWeight: 600, opacity: busy ? 0.6 : 1, whiteSpace: "nowrap",
        }}
      >
        {busy ? "…" : spec.uiLabel ?? spec.id}
      </button>

      {confirmOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 28, width: 380, boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>{spec.uiLabel ?? "Confirm"}</div>
            <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 20px" }}>{spec.uiConfirm}</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setConfirmOpen(false)} style={ghostBtn}>Cancel</button>
              <button onClick={doAction} disabled={busy}
                style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: c.text, color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
                {busy ? "…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── DynamicTable ─────────────────────────────────────────────────────────────
function DynamicTable({ spec, buttonSpecs }: {
  spec: UIComponentSpec;
  buttonSpecs: UIComponentSpec[];
}) {
  const [rows, setRows] = useState<Record<string, unknown>[] | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const columns = spec.uiColumns?.split(",").map((c) => c.trim()).filter(Boolean) ?? [];
  const rawDataSource = spec.uiDataSource ?? "";

  // ── Parse badge column rules from uiBadgeColumns ──
  // e.g. "enabled:true=Active:success,false=Inactive:danger"
  const badgeColumns: BadgeColumnMap = parseBadgeColumns(spec.uiBadgeColumns);

  const load = useCallback(async () => {
    if (!rawDataSource) {
      setError("No uiDataSource defined on this task. Add uiDataSource = GET:/your/endpoint in Flowable Class fields.");
      setRows([]);
      return;
    }
    setError("");
    setRows(null);
    try {
      const path = rawDataSource.replace(/^[A-Z]+:/i, "").trim();
      const res = await apiFetch(path);
      const data: Record<string, unknown>[] = Array.isArray(res)
        ? res
        : Array.isArray(res.data)
        ? res.data
        : [];
      setRows(data);
    } catch (e) {
      setError(String(e));
      setRows([]);
    }
  }, [rawDataSource]);

  useEffect(() => { load(); }, [load]);

  const filtered = (rows ?? []).filter((row) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return columns.some((c) => String(row[c] ?? "").toLowerCase().includes(q));
  });

  const hasButtons = buttonSpecs.length > 0;

  // ── Render a cell: badge if defined in uiBadgeColumns, otherwise plain text ──
  const renderCell = (col: string, row: Record<string, unknown>) => {
    const val = String(row[col] ?? "");

    // Badge column — rules defined in workflow via uiBadgeColumns
    if (badgeColumns[col]) {
      const rule = badgeColumns[col][val] ?? badgeColumns[col]["*"];
      if (rule) {
        const c = colorStyle(rule.color);
        return (
          <td key={col} style={{ padding: "10px 12px" }}>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 99,
              background: c.bg, color: c.text, border: `1px solid ${c.border}`,
            }}>
              {rule.label}
            </span>
          </td>
        );
      }
    }

    // id-style column — render as accent monospace
    if (col === "id") {
      return (
        <td key={col} style={{ padding: "10px 12px", fontFamily: "monospace", color: "#6366f1", fontWeight: 600 }}>
          {val}
        </td>
      );
    }

    // Plain value
    return (
      <td key={col} style={{ padding: "10px 12px", color: "#374151" }}>
        {val || "—"}
      </td>
    );
  };

  return (
    <div>
      {(spec.uiSearchable === "true" || spec.uiRefreshable === "true") && (
        <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
          {spec.uiSearchable === "true" && (
            <input
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputStyle, maxWidth: 280 }}
            />
          )}
          {spec.uiRefreshable === "true" && (
            <button onClick={load} style={ghostBtn}>↻ Refresh</button>
          )}
        </div>
      )}

      {error && (
        <div style={{ marginBottom: 12, padding: "12px 14px", borderRadius: 8, background: "#fef2f2", color: "#dc2626", fontSize: 13, lineHeight: 1.6 }}>
          <strong>Data load error</strong><br />{error}<br />
          <span style={{ fontSize: 11, color: "#9b1c1c", fontFamily: "monospace" }}>
            uiDataSource: "{rawDataSource}" → path: "{rawDataSource.replace(/^[A-Z]+:/i, "").trim()}"
          </span>
        </div>
      )}

      {rows === null ? <Loading /> : filtered.length === 0 ? <Empty text="No records found." /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                {columns.map((c) => (
                  <th key={c} style={{ textAlign: "left", padding: "9px 12px", fontWeight: 600, borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" }}>
                    {/* Humanize column header */}
                    {c.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                  </th>
                ))}
                {hasButtons && (
                  <th style={{ textAlign: "left", padding: "9px 12px", fontWeight: 600, borderBottom: "1px solid #e5e7eb" }}>
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  {columns.map((col) => renderCell(col, row))}
                  {hasButtons && (
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {buttonSpecs.map((btn) => (
                          <DynamicButton key={btn.id} spec={btn} row={row} onDone={load} />
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── DynamicLabel ─────────────────────────────────────────────────────────────
function DynamicLabel({ spec }: { spec: UIComponentSpec }) {
  const sizeMap = { sm: 13, md: 15, lg: 20 };
  const fs = sizeMap[spec.uiSize as keyof typeof sizeMap] ?? 14;
  return (
    <div style={{ fontSize: fs, color: "#374151", padding: "4px 0" }}>
      {spec.uiText ?? spec.uiLabel ?? spec.uiTitle ?? ""}
    </div>
  );
}

// ─── DynamicStat ──────────────────────────────────────────────────────────────
function DynamicStat({ spec }: { spec: UIComponentSpec }) {
  const [value, setValue] = useState<string>("…");
  const c = colorStyle(spec.uiColor);

  useEffect(() => {
    if (!spec.uiDataSource) return;
    const path = spec.uiDataSource.replace(/^GET:/i, "");
    apiFetch(path)
      .then((r) => setValue(String(r.total ?? r.count ?? r.value ?? Object.values(r)[0] ?? "?")))
      .catch(() => setValue("—"));
  }, [spec.uiDataSource]);

  return (
    <div style={{ padding: "16px 20px", borderRadius: 12, background: c.bg, border: `1.5px solid ${c.border}`, display: "inline-block", minWidth: 120 }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: c.text }}>{value}</div>
      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{spec.uiTitle ?? spec.uiLabel ?? ""}</div>
    </div>
  );
}

// ─── DynamicUIRenderer ────────────────────────────────────────────────────────
function DynamicUIRenderer({ proc }: { proc: ProcessDef }) {
  const [specs, setSpecs] = useState<UIComponentSpec[] | null>(null);
  const [error, setError] = useState("");
  const [showDebug, setShowDebug] = useState(false);
  const [rawXmlSnippet, setRawXmlSnippet] = useState("");

  useEffect(() => {
    setSpecs(null); setError(""); setRawXmlSnippet("");
    (async () => {
      let xmlText = "";
      for (const ext of [`${proc.key}.bpmn`, `${proc.key}.bpmn20.xml`]) {
        try {
          const res = await fetch(`${BASE}/repository/deployments/${proc.deploymentId}/resourcedata/${ext}`);
          if (res.ok) { xmlText = await res.text(); break; }
        } catch { /* try next */ }
      }
      if (!xmlText) {
        setError(`Could not fetch BPMN XML for process key "${proc.key}" (deploymentId: ${proc.deploymentId}).`);
        setSpecs([]);
        return;
      }
      setRawXmlSnippet(xmlText.substring(0, 600));
      const parsed = parseBpmnUISpec(xmlText);
      setSpecs(parsed);
    })();
  }, [proc.id, proc.key, proc.deploymentId]);

  if (specs === null) return <Loading />;

  const tables  = specs.filter((s) => s.uiComponent === "table");
  const buttons = specs.filter((s) => s.uiComponent === "button");
  const labels  = specs.filter((s) => s.uiComponent === "label");
  const stats   = specs.filter((s) => s.uiComponent === "stat");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Debug panel */}
      <div style={{ background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
        <button
          onClick={() => setShowDebug((v) => !v)}
          style={{ width: "100%", padding: "8px 14px", background: "none", border: "none", cursor: "pointer",
            textAlign: "left", fontSize: 12, color: "#6b7280", fontFamily: "monospace",
            display: "flex", justifyContent: "space-between" }}>
          <span>🔍 Debug: parsed {specs.length} UI spec(s) from BPMN Class fields</span>
          <span>{showDebug ? "▲ hide" : "▼ show"}</span>
        </button>
        {showDebug && (
          <div style={{ padding: "0 14px 12px", fontFamily: "monospace", fontSize: 11, color: "#374151" }}>
            {error && <div style={{ color: "#dc2626", marginBottom: 8 }}>{error}</div>}
            <div style={{ marginBottom: 8, color: "#6b7280" }}>
              Process: <strong>{proc.key}</strong> · deploymentId: <strong>{proc.deploymentId}</strong>
            </div>
            {specs.length === 0 ? (
              <div style={{ color: "#dc2626" }}>
                No serviceTasks with uiComponent field found.<br />
                <strong>BPMN snippet (first 600 chars):</strong><br />
                <pre style={{ background: "#f1f5f9", padding: 8, borderRadius: 4, fontSize: 10, whiteSpace: "pre-wrap", wordBreak: "break-all", maxHeight: 200, overflow: "auto" }}>
                  {rawXmlSnippet || "(empty — BPMN not loaded)"}
                </pre>
              </div>
            ) : (
              specs.map((s) => (
                <div key={s.id} style={{ marginBottom: 6, padding: "6px 8px", background: "#fff", borderRadius: 4, border: "1px solid #e5e7eb" }}>
                  <div style={{ fontWeight: 600, color: "#111", marginBottom: 3 }}>
                    Task: {s.id} → uiComponent: <span style={{ color: "#6366f1" }}>{s.uiComponent}</span>
                  </div>
                  {Object.entries(s).filter(([k]) => k !== "id" && k !== "uiComponent").map(([k, v]) => (
                    <div key={k} style={{ color: "#6b7280" }}>
                      &nbsp;&nbsp;{k}: <span style={{ color: "#374151" }}>{v}</span>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {specs.length === 0 && (
        <div style={{ padding: "24px", borderRadius: 10, border: "2px dashed #e5e7eb", color: "#9ca3af", textAlign: "center" }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>🔧</div>
          <div style={{ fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>No UI components found in BPMN</div>
          <div style={{ fontSize: 13, lineHeight: 1.7 }}>
            In Flowable Modeler, click a serviceTask → scroll to <strong>Class fields</strong> → add:<br />
            <code style={{ background: "#f3f4f6", padding: "1px 6px", borderRadius: 4, fontFamily: "monospace", marginRight: 4 }}>uiComponent = table</code>
            <code style={{ background: "#f3f4f6", padding: "1px 6px", borderRadius: 4, fontFamily: "monospace", marginRight: 4 }}>uiDataSource = GET:/your/api</code>
            <code style={{ background: "#f3f4f6", padding: "1px 6px", borderRadius: 4, fontFamily: "monospace" }}>uiColumns = id,name,status</code>
            <br /><br />
            To define badge columns (no code needed):<br />
            <code style={{ background: "#f3f4f6", padding: "1px 6px", borderRadius: 4, fontFamily: "monospace" }}>
              uiBadgeColumns = enabled:true=Active:success,false=Inactive:danger
            </code>
            <br /><br />
            To define tabs (no code needed):<br />
            <code style={{ background: "#f3f4f6", padding: "1px 6px", borderRadius: 4, fontFamily: "monospace" }}>
              uiTabs = ui,tasks,history
            </code>
          </div>
        </div>
      )}

      {labels.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {labels.map((s) => <DynamicLabel key={s.id} spec={s} />)}
        </div>
      )}

      {stats.length > 0 && (
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {stats.map((s) => <DynamicStat key={s.id} spec={s} />)}
        </div>
      )}

      {tables.map((tableSpec) => (
        <DynamicTable key={tableSpec.id} spec={tableSpec} buttonSpecs={buttons} />
      ))}

      {tables.length === 0 && buttons.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {buttons.map((btn) => (
            <DynamicButton key={btn.id} spec={btn} row={{}} onDone={() => {}} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ModuleView — tabs driven entirely by workflow ────────────────────────────
// The "tabs" serviceTask in your BPMN defines which tabs appear via uiTabs field.
// Example: uiTabs = ui,tasks,history
// If no tabs serviceTask is found, only the "UI" tab is shown.
// Supported tab IDs: "ui", "info", "tasks", "history"
function ModuleView({ module }: { module: Module }) {
  const [proc, setProc] = useState<ProcessDef | null>(null);
  const [specs, setSpecs] = useState<UIComponentSpec[] | null>(null);
  const [tab, setTab] = useState<string>("ui");
  const [tasks, setTasks] = useState<Record<string, unknown>[] | null>(null);
  const [history, setHistory] = useState<Record<string, unknown>[] | null>(null);
  const loaded = useRef(new Set<string>());

  // Load process def + UI specs (for tab config)
  useEffect(() => {
    setSpecs(null);
    loaded.current.clear();
    fetchAllProcessDefs()
      .then(async (ps) => {
        const found = ps.find((p) => p.key === module.processKey) ?? null;
        setProc(found);
        if (found) {
          const parsed = await fetchUISpec(found);
          setSpecs(parsed);
        } else {
          setSpecs([]);
        }
      })
      .catch(() => setSpecs([]));
  }, [module.processKey]);

  // ── Determine which tabs to show from the workflow ──
  // Look for a serviceTask with uiComponent = "tabs" and read its uiTabs field.
  // Falls back to just ["ui"] if not defined.
  const tabsSpec = specs?.find((s) => s.uiComponent === "tabs");
  const tabList: string[] = tabsSpec?.uiTabs
    ? tabsSpec.uiTabs.split(",").map((t) => t.trim()).filter(Boolean)
    : ["ui"];

  // Reset to first tab if current tab not in list
  const activeTab = tabList.includes(tab) ? tab : tabList[0] ?? "ui";

  const loadTab = useCallback(async (t: string) => {
    if (loaded.current.has(t)) return;
    loaded.current.add(t);
    try {
      if (t === "tasks") {
        const r = await apiFetch(`/runtime/tasks?processInstanceId=${module.processInstanceId}`);
        setTasks(r.data ?? []);
      } else if (t === "history") {
        const r = await apiFetch(`/history/historic-process-instances?processInstanceId=${module.processInstanceId}`);
        setHistory(r.data ?? []);
      }
    } catch {
      if (t === "tasks") setTasks([]);
      if (t === "history") setHistory([]);
    }
  }, [module.processInstanceId]);

  // Tab label map
  const TAB_LABELS: Record<string, string> = {
    ui: "UI", info: "Info", tasks: "Tasks", history: "History",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Tab bar — only render once specs are loaded */}
      {specs !== null && tabList.length > 1 && (
        <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", marginBottom: 20 }}>
          {tabList.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                if (t === "tasks" || t === "history") loadTab(t);
              }}
              style={{
                padding: "8px 16px", border: "none", background: "none", cursor: "pointer",
                fontSize: 13, fontWeight: activeTab === t ? 600 : 400,
                color: activeTab === t ? "#6366f1" : "#6b7280",
                borderBottom: activeTab === t ? "2px solid #6366f1" : "2px solid transparent",
              }}>
              {TAB_LABELS[t] ?? t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Tab content */}
      {specs === null && <Loading />}

      {specs !== null && activeTab === "ui" && (
        proc
          ? <DynamicUIRenderer proc={proc} />
          : <Loading />
      )}

      {specs !== null && activeTab === "info" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            ["Process", module.processName],
            ["Key", module.processKey],
            ["Instance ID", module.processInstanceId],
            ...Object.entries(module.fields),
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", gap: 12, fontSize: 13, padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
              <span style={{ color: "#6b7280", minWidth: 140, flexShrink: 0 }}>{k}</span>
              <span style={{ color: "#111827", wordBreak: "break-all" }}>{v || "—"}</span>
            </div>
          ))}
        </div>
      )}

      {specs !== null && activeTab === "tasks" && (
        tasks === null ? <Loading /> : tasks.length === 0 ? <Empty text="No active tasks." /> :
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(tasks as any[]).map((t) => (
              <div key={t.id} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fafafa" }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>
                  {t.assignee ?? "Unassigned"} · {new Date(t.createTime).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
      )}

      {specs !== null && activeTab === "history" && (
        history === null ? <Loading /> : history.length === 0 ? <Empty text="No history." /> :
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(history as any[]).map((h) => (
              <div key={h.id} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fafafa" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{h.processDefinitionId?.split(":")[0]}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
                    background: h.endTime ? "#f0fdf4" : "#eef2ff", color: h.endTime ? "#16a34a" : "#6366f1" }}>
                    {h.endTime ? "Completed" : "Running"}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>
                  Started {new Date(h.startTime).toLocaleString()}
                  {h.durationInMillis != null && ` · ${fmtDuration(h.durationInMillis)}`}
                </div>
              </div>
            ))}
          </div>
      )}
    </div>
  );
}

// ─── API helpers ──────────────────────────────────────────────────────────────
async function fetchAllProcessDefs(): Promise<ProcessDef[]> {
  const all: ProcessDef[] = [];
  let start = 0;
  while (true) {
    const page = await apiFetch(`/repository/process-definitions?size=100&start=${start}`);
    all.push(...(page.data ?? []));
    if (start + 100 >= (page.total ?? 0)) break;
    start += 100;
  }
  const map = new Map<string, ProcessDef>();
  for (const p of all) {
    const ex = map.get(p.key);
    if (!ex || p.version > ex.version) map.set(p.key, p);
  }
  return [...map.values()].sort((a, b) => (a.name || a.key).localeCompare(b.name || b.key));
}

async function fetchFormData(proc: ProcessDef): Promise<FormData> {
  return apiFetch(`/form/form-data?processDefinitionId=${encodeURIComponent(proc.id)}`);
}

// ─── Shared tiny components ───────────────────────────────────────────────────
function Loading() { return <p style={{ color: "#9ca3af", fontSize: 13 }}>Loading…</p>; }
function Empty({ text }: { text: string }) { return <p style={{ color: "#9ca3af", fontSize: 13 }}>{text}</p>; }
function fmtDuration(ms: number) {
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

const inputStyle: React.CSSProperties = {
  padding: "8px 11px", borderRadius: 8, border: "1px solid #d1d5db",
  fontSize: 14, outline: "none", background: "#f9fafb",
  width: "100%", boxSizing: "border-box",
};
const ghostBtn: React.CSSProperties = {
  padding: "7px 14px", borderRadius: 8, border: "1.5px solid #d1d5db",
  background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500,
};

// ─── DynamicForm ──────────────────────────────────────────────────────────────
function DynamicForm({ properties, values, onChange }: {
  properties: FormProperty[]; values: Record<string, string>;
  onChange: (id: string, val: string) => void;
}) {
  const visible = properties.filter((p) => p.readable && p.writable);
  if (visible.length === 0) return <Empty text="No writable fields found." />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {visible.map((p) => (
        <div key={p.id} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>
            {p.name}{p.required && <span style={{ color: "#ef4444", marginLeft: 3 }}>*</span>}
          </label>
          {p.type === "enum" ? (
            <select value={values[p.id] ?? ""} onChange={(e) => onChange(p.id, e.target.value)} style={inputStyle}>
              <option value="">— select —</option>
              {p.enumValues.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          ) : p.type === "boolean" ? (
            <input type="checkbox" checked={values[p.id] === "true"}
              onChange={(e) => onChange(p.id, e.target.checked ? "true" : "false")} />
          ) : (
            <input
              type={p.type === "long" ? "number" : p.type === "date" ? "date" : "text"}
              value={values[p.id] ?? ""}
              onChange={(e) => onChange(p.id, e.target.value)}
              placeholder={`Enter ${p.name.toLowerCase()}`}
              style={inputStyle}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Add Module Modal ─────────────────────────────────────────────────────────
type Step = "select" | "form" | "submitting" | "done";

function AddModuleModal({ onClose, onAdded }: {
  onClose: () => void; onAdded: (m: Module) => void;
}) {
  const [step, setStep] = useState<Step>("select");
  const [processes, setProcesses] = useState<ProcessDef[]>([]);
  const [selected, setSelected] = useState<ProcessDef | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const addLog = (msg: string) => setLog((l) => [...l, msg]);

  useEffect(() => {
    setLoading(true);
    fetchAllProcessDefs()
      .then((ps) => { setProcesses(ps); setSelected(ps.find((p) => p.startFormDefined) ?? ps[0] ?? null); })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const handleNext = async () => {
    if (!selected) return;
    setLoading(true); setError(""); setLog([]);
    try {
      addLog(`Fetching form for "${selected.name}"…`);
      const fd = await fetchFormData(selected);
      addLog(`✓ Got ${fd.formProperties.length} field(s)`);

      addLog("Reading UI spec from BPMN Class fields…");
      const uiSpecs = await fetchUISpec(selected);
      const tabsSpec = uiSpecs.find((s) => s.uiComponent === "tabs");
      const tabCount = tabsSpec?.uiTabs ? tabsSpec.uiTabs.split(",").length : 1;
      addLog(uiSpecs.length > 0
        ? `✓ Found ${uiSpecs.length} UI component(s): ${uiSpecs.map((s) => s.uiComponent).join(", ")} · ${tabCount} tab(s)`
        : "⚠ No uiComponent fields found — add them in Flowable Modeler → Class fields");

      setFormData(fd);
      const init: Record<string, string> = {};
      fd.formProperties.forEach((p) => { init[p.id] = ""; });
      setValues(init);
      setStep("form");
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!selected || !formData) return;
    const missing = formData.formProperties.filter((p) => p.required && !(values[p.id] ?? "").trim());
    if (missing.length) { setError(`Required: ${missing.map((p) => p.name).join(", ")}`); return; }
    setError(""); setStep("submitting"); setLog([]);
    try {
      addLog("Starting process instance…");
      const instance = await apiPost("/runtime/process-instances", {
        processDefinitionKey: selected.key,
        variables: Object.entries(values).filter(([, v]) => v !== "").map(([name, value]) => ({ name, value })),
      });
      addLog(`✓ Instance: ${instance.id}`);
      setStep("done");
      addLog("✓ Module ready — UI + tabs rendered from BPMN Class fields");
      setTimeout(() => {
        onAdded({
          id: instance.id, processInstanceId: instance.id,
          processKey: selected.key, processName: selected.name,
          fields: { ...values }, data: [],
        });
        onClose();
      }, 700);
    } catch (e) { setError(String(e)); setStep("form"); }
  };

  const title = { select: "Select workflow", form: "Configure module", submitting: "Starting…", done: "✓ Done" }[step];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", borderRadius: 14, width: 540, maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 60px rgba(0,0,0,0.2)", overflow: "hidden" }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>{title}</span>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 22, color: "#9ca3af" }}>×</button>
        </div>
        <div style={{ padding: "20px 22px", overflowY: "auto", flex: 1 }}>
          {step === "select" && (
            loading ? <Loading /> : <>
              <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 14px" }}>
                Choose a deployed workflow. React will read its BPMN Class fields to build the UI and tabs automatically.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {processes.map((p) => (
                  <label key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 9,
                    border: `2px solid ${selected?.id === p.id ? "#6366f1" : "#e5e7eb"}`, cursor: "pointer",
                    background: selected?.id === p.id ? "#eef2ff" : "#fafafa" }}>
                    <input type="radio" name="proc" checked={selected?.id === p.id} onChange={() => setSelected(p)} style={{ accentColor: "#6366f1" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name || p.key}</div>
                      <div style={{ fontSize: 12, color: "#9ca3af" }}>v{p.version} · {p.key}</div>
                    </div>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, fontWeight: 600,
                      background: p.startFormDefined ? "#f0fdf4" : "#fef9c3",
                      color: p.startFormDefined ? "#16a34a" : "#92400e" }}>
                      {p.startFormDefined ? "✓ form" : "⚠ no form"}
                    </span>
                  </label>
                ))}
              </div>
            </>
          )}

          {step === "form" && formData && (
            formData.formProperties.length === 0
              ? <p style={{ color: "#ef4444", fontSize: 14 }}>No form fields found. Add formProperty elements to the Start Event in Flowable Modeler.</p>
              : <DynamicForm properties={formData.formProperties} values={values}
                  onChange={(id, val) => setValues((v) => ({ ...v, [id]: val }))} />
          )}

          {log.length > 0 && (
            <div style={{ marginTop: 16, background: "#f8fafc", borderRadius: 8, padding: "10px 14px", fontFamily: "monospace", fontSize: 12, color: "#374151", maxHeight: 140, overflowY: "auto" }}>
              {log.map((l, i) => <div key={i}>{l}</div>)}
              {step === "submitting" && <div style={{ color: "#6366f1" }}>⏳ Working…</div>}
            </div>
          )}
          {error && <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "#fef2f2", color: "#dc2626", fontSize: 13 }}>{error}</div>}
        </div>
        <div style={{ padding: "14px 22px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={ghostBtn}>Cancel</button>
          {step === "select" && (
            <button onClick={handleNext} disabled={!selected || loading}
              style={{ padding: "8px 18px", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 600,
                cursor: selected && !loading ? "pointer" : "default", color: "#fff",
                background: selected && !loading ? "#6366f1" : "#c7d2fe" }}>Next →</button>
          )}
          {step === "form" && (
            <button onClick={handleSubmit} disabled={!formData || formData.formProperties.length === 0}
              style={{ padding: "8px 18px", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", background: "#6366f1", color: "#fff" }}>
              Start Process
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────
function DashboardStats() {
  const [stats, setStats] = useState({ processes: 0, tasks: 0, completed: 0 });
  useEffect(() => {
    Promise.allSettled([
      apiFetch("/repository/process-definitions?size=1"),
      apiFetch("/runtime/tasks?size=1"),
      apiFetch("/history/historic-process-instances?size=1&finished=true"),
    ]).then(([p, t, h]) => setStats({
      processes: p.status === "fulfilled" ? p.value.total ?? 0 : 0,
      tasks: t.status === "fulfilled" ? t.value.total ?? 0 : 0,
      completed: h.status === "fulfilled" ? h.value.total ?? 0 : 0,
    }));
  }, []);
  return (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 32 }}>
      {[
        { label: "Deployed workflows", value: stats.processes, color: "#6366f1" },
        { label: "Active tasks", value: stats.tasks, color: "#f97316" },
        { label: "Completed instances", value: stats.completed, color: "#22c55e" },
      ].map((c) => (
        <div key={c.label} style={{ flex: "1 1 140px", padding: "16px 20px", borderRadius: 12, background: c.color + "12", border: `1.5px solid ${c.color}28` }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: c.color }}>{c.value}</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{c.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function FlowableModuleBuilder() {
  const [modules, setModules] = useState<Module[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);
  const retryRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkConnection = useCallback(async () => {
    try {
      await apiFetch("/repository/process-definitions?size=1");
      setConnected(true);
      if (retryRef.current) { clearInterval(retryRef.current); retryRef.current = null; }
    } catch {
      setConnected(false);
      if (!retryRef.current) retryRef.current = setInterval(checkConnection, 10_000);
    }
  }, []);

  useEffect(() => {
    checkConnection();
    return () => { if (retryRef.current) clearInterval(retryRef.current); };
  }, [checkConnection]);

  const activeModule = modules.find((m) => m.id === activeId) ?? null;
  const moduleName = (m: Module) => m.fields["moduleName"] || m.fields["name"] || m.processName;
  const moduleIcon = (m: Module) => m.fields["moduleIcon"] || "📦";

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', system-ui, sans-serif", background: "#f8fafc", color: "#111827" }}>
      {/* Sidebar */}
      <div style={{ width: 240, background: "#fff", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid #f3f4f6" }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>🔧 Module Builder</div>
          <div style={{ marginTop: 5, fontSize: 11, fontWeight: 600, color: connected === true ? "#16a34a" : connected === false ? "#ef4444" : "#9ca3af" }}>
            {connected === true ? "● Flowable connected" : connected === false ? "● Flowable offline" : "● Checking…"}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 8px" }}>
          {modules.length === 0 && <p style={{ fontSize: 12, color: "#9ca3af", padding: "4px 8px" }}>No modules yet.</p>}
          {modules.map((m) => (
            <button key={m.id} onClick={() => setActiveId(m.id)} style={{
              display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "9px 10px",
              borderRadius: 8, border: "none", background: activeId === m.id ? "#eef2ff" : "transparent",
              cursor: "pointer", textAlign: "left", fontSize: 13,
              fontWeight: activeId === m.id ? 700 : 400, color: activeId === m.id ? "#6366f1" : "#374151",
            }}>
              <span style={{ fontSize: 18 }}>{moduleIcon(m)}</span>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{moduleName(m)}</span>
            </button>
          ))}
        </div>
        <div style={{ padding: "10px 8px", borderTop: "1px solid #f3f4f6" }}>
          <button onClick={() => setShowModal(true)} disabled={connected === false}
            style={{ width: "100%", padding: "9px", borderRadius: 8, border: "none",
              background: connected === false ? "#e5e7eb" : "#6366f1",
              color: connected === false ? "#9ca3af" : "#fff",
              cursor: connected === false ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700 }}>
            + Add Module
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {activeModule ? (
          <>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #e5e7eb", background: "#fff", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 26 }}>{moduleIcon(activeModule)}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 17 }}>{moduleName(activeModule)}</div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>
                  {activeModule.processName} · {activeModule.fields["moduleType"] || "module"}
                </div>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
              <ModuleView module={activeModule} />
            </div>
          </>
        ) : (
          <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>Flowable App</h1>
              <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>Build modules dynamically from your Flowable workflows — no hardcoding required.</p>
            </div>
            <DashboardStats />
            <div style={{ padding: 28, borderRadius: 12, border: "2px dashed #d1d5db", textAlign: "center", color: "#9ca3af" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🧩</div>
              <div style={{ fontWeight: 600, fontSize: 15, color: "#6b7280" }}>No module selected</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Pick one from the sidebar or click <strong>+ Add Module</strong>.</div>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <AddModuleModal onClose={() => setShowModal(false)}
          onAdded={(m) => { setModules((ms) => [...ms, m]); setActiveId(m.id); }} />
      )}
    </div>
  );
}

// import { useState, useEffect, useCallback, useRef } from "react";

// // ─── Config ───────────────────────────────────────────────────────────────────
// const BASE = "http://localhost:3000/flowable-api";

// async function apiFetch(path: string) {
//   const res = await fetch(`${BASE}${path}`);
//   if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${path}`);
//   return res.json();
// }

// async function apiPost(path: string, body: unknown) {
//   const res = await fetch(`${BASE}${path}`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(body),
//   });
//   if (!res.ok) { const txt = await res.text(); throw new Error(`${res.status} — ${txt}`); }
//   return res.json();
// }

// async function apiPut(path: string, body: unknown) {
//   const res = await fetch(`${BASE}${path}`, {
//     method: "PUT",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(body),
//   });
//   if (!res.ok) { const txt = await res.text(); throw new Error(`${res.status} — ${txt}`); }
//   if (res.status === 204) return {};
//   return res.json();
// }

// async function apiDelete(path: string) {
//   const res = await fetch(`${BASE}${path}`, { method: "DELETE" });
//   if (!res.ok) { const txt = await res.text(); throw new Error(`${res.status} — ${txt}`); }
// }

// // ─── Types ────────────────────────────────────────────────────────────────────
// interface ProcessDef {
//   id: string; key: string; name: string;
//   version: number; deploymentId: string; startFormDefined: boolean;
// }
// interface FormProperty {
//   id: string; name: string; type: string;
//   required: boolean; readable: boolean; writable: boolean;
//   enumValues: { id: string; name: string }[];
// }
// interface FormData {
//   formKey: string | null; processDefinitionId: string;
//   formProperties: FormProperty[];
// }
// interface Module {
//   id: string; processInstanceId: string;
//   processKey: string; processName: string;
//   fields: Record<string, string>;
//   data: Record<string, unknown>[];
// }

// // ─── UI Spec types (parsed from BPMN Class fields) ────────────────────────────
// interface UIComponentSpec {
//   id: string;
//   uiComponent: string;           // "table" | "button" | "label" | "stat" | "form"
//   uiTitle?: string;
//   uiLabel?: string;
//   uiColor?: string;              // "danger" | "warning" | "success" | "info" | "default"
//   uiSize?: string;               // "sm" | "md" | "lg"
//   uiAction?: string;             // "METHOD:/path/{id}"
//   uiConfirm?: string;
//   uiDataSource?: string;         // "GET:/identity/users"
//   uiColumns?: string;            // "id,firstName,email,enabled"
//   uiSearchable?: string;
//   uiRefreshable?: string;
//   uiShowWhen?: string;
//   uiIcon?: string;
//   uiText?: string;
//   [key: string]: string | undefined;
// }

// // ─── BPMN Parser ──────────────────────────────────────────────────────────────
// // Fetches deployed BPMN XML and extracts Class fields from each serviceTask
// async function fetchUISpec(proc: ProcessDef): Promise<UIComponentSpec[]> {
//   // Try .bpmn first, then .bpmn20.xml
//   let xmlText = "";
//   for (const ext of [`${proc.key}.bpmn`, `${proc.key}.bpmn20.xml`]) {
//     try {
//       const res = await fetch(
//         `${BASE}/repository/deployments/${proc.deploymentId}/resourcedata/${ext}`
//       );
//       if (res.ok) { xmlText = await res.text(); break; }
//     } catch { /* try next */ }
//   }
//   if (!xmlText) return [];
//   return parseBpmnUISpec(xmlText);
// }

// function parseBpmnUISpec(xml: string): UIComponentSpec[] {
//   try {
//     const parser = new DOMParser();
//     const doc = parser.parseFromString(xml, "text/xml");
//     const specs: UIComponentSpec[] = [];

//     // Find all serviceTasks
//     const serviceTasks = Array.from(doc.getElementsByTagName("serviceTask"))
//       .concat(Array.from(doc.getElementsByTagName("bpmn:serviceTask")))
//       .concat(Array.from(doc.getElementsByTagName("bpmn2:serviceTask")));

//     for (const task of serviceTasks) {
//       const taskId = task.getAttribute("id") ?? "";

//       // Find flowable:field elements (Class fields in Flowable Modeler)
//       const fields: Record<string, string> = {};
//       const fieldEls = [
//         ...Array.from(task.getElementsByTagName("flowable:field")),
//         ...Array.from(task.getElementsByTagName("activiti:field")),
//       ];

//       for (const field of fieldEls) {
//         const name = field.getAttribute("name") ?? "";
//         if (!name) continue;
//         // Value can be in stringValue attribute OR <flowable:string> child
//         const stringValue = field.getAttribute("stringValue") ??
//           field.getElementsByTagName("flowable:string")[0]?.textContent ??
//           field.getElementsByTagName("activiti:string")[0]?.textContent ??
//           field.getElementsByTagName("string")[0]?.textContent ?? "";
//         fields[name] = stringValue.trim();
//       }

//       // Only include tasks that have uiComponent defined
//       if (fields["uiComponent"]) {
//         specs.push({ id: taskId, ...fields } as UIComponentSpec);
//       }
//     }
//     return specs;
//   } catch {
//     return [];
//   }
// }

// // ─── Color helpers ────────────────────────────────────────────────────────────
// const COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
//   danger:  { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
//   warning: { bg: "#fef9c3", text: "#92400e", border: "#fde68a" },
//   success: { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
//   info:    { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
//   default: { bg: "#f9fafb", text: "#374151", border: "#d1d5db" },
// };

// function colorStyle(color?: string) {
//   return COLOR_MAP[color ?? "default"] ?? COLOR_MAP["default"];
// }

// // ─── Action executor ──────────────────────────────────────────────────────────
// // Parses "METHOD:/path/{id}" and executes the correct API call
// async function executeAction(actionStr: string, row: Record<string, unknown>) {
//   const [method, ...pathParts] = actionStr.split(":");
//   let path = pathParts.join(":");
//   // Replace {placeholders} with actual row values
//   path = path.replace(/\{(\w+)\}/g, (_, key) => String(row[key] ?? ""));
//   if (method === "DELETE") await apiDelete(path);
//   else if (method === "PUT") await apiPut(path, {});
//   else if (method === "POST") await apiPost(path, {});
// }

// // ─── showWhen evaluator ───────────────────────────────────────────────────────
// function evalShowWhen(condition: string | undefined, row: Record<string, unknown>): boolean {
//   if (!condition) return true;
//   try {
//     // Simple: "field==value" or "field!=value"
//     const eqMatch = condition.match(/^(\w+)==(.+)$/);
//     if (eqMatch) return String(row[eqMatch[1]]) === eqMatch[2];
//     const neqMatch = condition.match(/^(\w+)!=(.+)$/);
//     if (neqMatch) return String(row[neqMatch[1]]) !== neqMatch[2];
//   } catch { /* fall through */ }
//   return true;
// }

// // ─── DynamicButton ────────────────────────────────────────────────────────────
// function DynamicButton({ spec, row, onDone }: {
//   spec: UIComponentSpec;
//   row: Record<string, unknown>;
//   onDone: () => void;
// }) {
//   const [busy, setBusy] = useState(false);
//   const [confirmOpen, setConfirmOpen] = useState(false);
//   const c = colorStyle(spec.uiColor);
//   const sizeMap = { sm: { padding: "4px 10px", fontSize: 12 }, md: { padding: "6px 14px", fontSize: 13 }, lg: { padding: "8px 18px", fontSize: 14 } };
//   const sz = sizeMap[spec.uiSize as keyof typeof sizeMap] ?? sizeMap.sm;

//   if (!evalShowWhen(spec.uiShowWhen, row)) return null;

//   const doAction = async () => {
//     if (!spec.uiAction) return;
//     setBusy(true);
//     try { await executeAction(spec.uiAction, row); onDone(); }
//     catch (e) { alert(String(e)); }
//     finally { setBusy(false); setConfirmOpen(false); }
//   };

//   const handleClick = () => {
//     if (spec.uiConfirm) setConfirmOpen(true);
//     else doAction();
//   };

//   return (
//     <>
//       <button
//         disabled={busy}
//         onClick={handleClick}
//         style={{ ...sz, borderRadius: 6, border: `1px solid ${c.border}`, background: c.bg, color: c.text, cursor: busy ? "default" : "pointer", fontWeight: 600, opacity: busy ? 0.6 : 1, whiteSpace: "nowrap" }}
//       >
//         {busy ? "…" : spec.uiLabel ?? spec.id}
//       </button>

//       {confirmOpen && (
//         <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000 }}>
//           <div style={{ background: "#fff", borderRadius: 12, padding: 28, width: 380, boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }}>
//             <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>{spec.uiLabel ?? "Confirm"}</div>
//             <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 20px" }}>{spec.uiConfirm}</p>
//             <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
//               <button onClick={() => setConfirmOpen(false)} style={ghostBtn}>Cancel</button>
//               <button onClick={doAction} disabled={busy}
//                 style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: c.text, color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
//                 {busy ? "…" : "Confirm"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }

// // ─── DynamicTable ─────────────────────────────────────────────────────────────
// function DynamicTable({ spec, buttonSpecs }: {
//   spec: UIComponentSpec;
//   buttonSpecs: UIComponentSpec[];
// }) {
//   const [rows, setRows] = useState<Record<string, unknown>[] | null>(null);
//   const [error, setError] = useState("");
//   const [search, setSearch] = useState("");

//   const columns = spec.uiColumns?.split(",").map((c) => c.trim()).filter(Boolean) ?? [];
//   const rawDataSource = spec.uiDataSource ?? "";

//   const load = useCallback(async () => {
//     if (!rawDataSource) {
//       setError("No uiDataSource defined on this task. Add uiDataSource = GET:/identity/users in Flowable Class fields.");
//       setRows([]);
//       return;
//     }
//     setError("");
//     setRows(null);
//     try {
//       const path = rawDataSource.replace(/^[A-Z]+:/i, "").trim();
//       const res = await apiFetch(path);
//       const data: Record<string, unknown>[] = Array.isArray(res)
//         ? res
//         : Array.isArray(res.data)
//         ? res.data
//         : [];
//       setRows(data);
//     } catch (e) {
//       setError(String(e));
//       setRows([]);
//     }
//   }, [rawDataSource]);

//   useEffect(() => { load(); }, [load]);

//   const filtered = (rows ?? []).filter((row) => {
//     if (!search) return true;
//     const q = search.toLowerCase();
//     return columns.some((c) => String(row[c] ?? "").toLowerCase().includes(q));
//   });

//   const hasButtons = buttonSpecs.length > 0;

//   return (
//     <div>
//       {(spec.uiSearchable === "true" || spec.uiRefreshable === "true") && (
//         <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
//           {spec.uiSearchable === "true" && (
//             <input
//               placeholder="Search…"
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               style={{ ...inputStyle, maxWidth: 280 }}
//             />
//           )}
//           {spec.uiRefreshable === "true" && (
//             <button onClick={load} style={ghostBtn}>↻ Refresh</button>
//           )}
//         </div>
//       )}

//       {error && (
//         <div style={{ marginBottom: 12, padding: "12px 14px", borderRadius: 8, background: "#fef2f2", color: "#dc2626", fontSize: 13, lineHeight: 1.6 }}>
//           <strong>Data load error</strong><br />{error}<br />
//           <span style={{ fontSize: 11, color: "#9b1c1c", fontFamily: "monospace" }}>
//             uiDataSource: "{rawDataSource}" → path: "{rawDataSource.replace(/^[A-Z]+:/i, "").trim()}"
//           </span>
//         </div>
//       )}

//       {rows === null ? <Loading /> : filtered.length === 0 ? <Empty text="No records found." /> : (
//         <div style={{ overflowX: "auto" }}>
//           <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
//             <thead>
//               <tr style={{ background: "#f3f4f6" }}>
//                 {columns.map((c) => (
//                   <th key={c} style={{ textAlign: "left", padding: "9px 12px", fontWeight: 600, borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" }}>
//                     {c}
//                   </th>
//                 ))}
//                 {hasButtons && (
//                   <th style={{ textAlign: "left", padding: "9px 12px", fontWeight: 600, borderBottom: "1px solid #e5e7eb" }}>Actions</th>
//                 )}
//               </tr>
//             </thead>
//             <tbody>
//               {filtered.map((row, i) => (
//                 <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
//                   {columns.map((c) => {
//                     const val = String(row[c] ?? "");
//                     // "enabled" column renders as status badge
//                     if (c === "enabled" || c === "status") {
//                       const active = val === "true" || val === "active";
//                       return (
//                         <td key={c} style={{ padding: "10px 12px" }}>
//                           <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: active ? "#f0fdf4" : "#fef2f2", color: active ? "#16a34a" : "#dc2626" }}>
//                             {active ? "Active" : "Inactive"}
//                           </span>
//                         </td>
//                       );
//                     }
//                     // "id" column renders as monospace link-style
//                     if (c === "id") {
//                       return <td key={c} style={{ padding: "10px 12px", fontFamily: "monospace", color: "#6366f1", fontWeight: 600 }}>{val}</td>;
//                     }
//                     return <td key={c} style={{ padding: "10px 12px", color: "#374151" }}>{val || "—"}</td>;
//                   })}
//                   {hasButtons && (
//                     <td style={{ padding: "10px 12px" }}>
//                       <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
//                         {buttonSpecs.map((btn) => (
//                           <DynamicButton key={btn.id} spec={btn} row={row} onDone={load} />
//                         ))}
//                       </div>
//                     </td>
//                   )}
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── DynamicLabel ─────────────────────────────────────────────────────────────
// function DynamicLabel({ spec }: { spec: UIComponentSpec }) {
//   const sizeMap = { sm: 13, md: 15, lg: 20 };
//   const fs = sizeMap[spec.uiSize as keyof typeof sizeMap] ?? 14;
//   return (
//     <div style={{ fontSize: fs, color: "#374151", padding: "4px 0" }}>
//       {spec.uiText ?? spec.uiLabel ?? spec.uiTitle ?? ""}
//     </div>
//   );
// }

// // ─── DynamicStat ──────────────────────────────────────────────────────────────
// function DynamicStat({ spec }: { spec: UIComponentSpec }) {
//   const [value, setValue] = useState<string>("…");
//   const c = colorStyle(spec.uiColor);

//   useEffect(() => {
//     if (!spec.uiDataSource) return;
//     const path = spec.uiDataSource.replace(/^GET:/i, "");
//     apiFetch(path)
//       .then((r) => setValue(String(r.total ?? r.count ?? r.value ?? Object.values(r)[0] ?? "?")))
//       .catch(() => setValue("—"));
//   }, [spec.uiDataSource]);

//   return (
//     <div style={{ padding: "16px 20px", borderRadius: 12, background: c.bg, border: `1.5px solid ${c.border}`, display: "inline-block", minWidth: 120 }}>
//       <div style={{ fontSize: 28, fontWeight: 800, color: c.text }}>{value}</div>
//       <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{spec.uiTitle ?? spec.uiLabel ?? ""}</div>
//     </div>
//   );
// }

// // ─── DynamicUIRenderer ────────────────────────────────────────────────────────
// function DynamicUIRenderer({ proc }: { proc: ProcessDef }) {
//   const [specs, setSpecs] = useState<UIComponentSpec[] | null>(null);
//   const [error, setError] = useState("");
//   const [showDebug, setShowDebug] = useState(false);
//   const [rawXmlSnippet, setRawXmlSnippet] = useState("");

//   useEffect(() => {
//     setSpecs(null); setError(""); setRawXmlSnippet("");
//     (async () => {
//       // Try both extensions
//       let xmlText = "";
//       for (const ext of [`${proc.key}.bpmn`, `${proc.key}.bpmn20.xml`]) {
//         try {
//           const res = await fetch(`${BASE}/repository/deployments/${proc.deploymentId}/resourcedata/${ext}`);
//           if (res.ok) { xmlText = await res.text(); break; }
//         } catch { /* try next */ }
//       }
//       if (!xmlText) {
//         setError(`Could not fetch BPMN XML for process key "${proc.key}" (deploymentId: ${proc.deploymentId}). Check your proxy server.`);
//         setSpecs([]);
//         return;
//       }
//       // Show a small snippet for debugging
//       setRawXmlSnippet(xmlText.substring(0, 600));
//       const parsed = parseBpmnUISpec(xmlText);
//       setSpecs(parsed);
//     })();
//   }, [proc.id, proc.key, proc.deploymentId]);

//   if (specs === null) return <Loading />;

//   const tables = specs.filter((s) => s.uiComponent === "table");
//   const buttons = specs.filter((s) => s.uiComponent === "button");
//   const labels = specs.filter((s) => s.uiComponent === "label");
//   const stats = specs.filter((s) => s.uiComponent === "stat");

//   return (
//     <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

//       {/* Debug panel — toggle to see what was parsed */}
//       <div style={{ background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
//         <button
//           onClick={() => setShowDebug((v) => !v)}
//           style={{ width: "100%", padding: "8px 14px", background: "none", border: "none", cursor: "pointer",
//             textAlign: "left", fontSize: 12, color: "#6b7280", fontFamily: "monospace", display: "flex", justifyContent: "space-between" }}>
//           <span>🔍 Debug: parsed {specs.length} UI spec(s) from BPMN Class fields</span>
//           <span>{showDebug ? "▲ hide" : "▼ show"}</span>
//         </button>
//         {showDebug && (
//           <div style={{ padding: "0 14px 12px", fontFamily: "monospace", fontSize: 11, color: "#374151" }}>
//             {error && <div style={{ color: "#dc2626", marginBottom: 8 }}>{error}</div>}
//             <div style={{ marginBottom: 8, color: "#6b7280" }}>
//               Process: <strong>{proc.key}</strong> · deploymentId: <strong>{proc.deploymentId}</strong>
//             </div>
//             {specs.length === 0 ? (
//               <div style={{ color: "#dc2626" }}>
//                 No serviceTasks with uiComponent field found.<br />
//                 Check that your BPMN has Class fields set (not Form fields).<br /><br />
//                 <strong>BPMN snippet (first 600 chars):</strong><br />
//                 <pre style={{ background: "#f1f5f9", padding: 8, borderRadius: 4, fontSize: 10, whiteSpace: "pre-wrap", wordBreak: "break-all", maxHeight: 200, overflow: "auto" }}>
//                   {rawXmlSnippet || "(empty — BPMN not loaded)"}
//                 </pre>
//               </div>
//             ) : (
//               specs.map((s) => (
//                 <div key={s.id} style={{ marginBottom: 6, padding: "6px 8px", background: "#fff", borderRadius: 4, border: "1px solid #e5e7eb" }}>
//                   <div style={{ fontWeight: 600, color: "#111", marginBottom: 3 }}>Task: {s.id} → uiComponent: <span style={{ color: "#6366f1" }}>{s.uiComponent}</span></div>
//                   {Object.entries(s).filter(([k]) => k !== "id" && k !== "uiComponent").map(([k, v]) => (
//                     <div key={k} style={{ color: "#6b7280" }}>&nbsp;&nbsp;{k}: <span style={{ color: "#374151" }}>{v}</span></div>
//                   ))}
//                 </div>
//               ))
//             )}
//           </div>
//         )}
//       </div>

//       {specs.length === 0 && (
//         <div style={{ padding: "24px", borderRadius: 10, border: "2px dashed #e5e7eb", color: "#9ca3af", textAlign: "center" }}>
//           <div style={{ fontSize: 24, marginBottom: 8 }}>🔧</div>
//           <div style={{ fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>No UI components found in BPMN</div>
//           <div style={{ fontSize: 13, lineHeight: 1.7 }}>
//             In Flowable Modeler, click a serviceTask → scroll to <strong>Class fields</strong> → click + to add:<br />
//             <code style={{ background: "#f3f4f6", padding: "1px 6px", borderRadius: 4, fontFamily: "monospace", marginRight: 4 }}>uiComponent = table</code>
//             <code style={{ background: "#f3f4f6", padding: "1px 6px", borderRadius: 4, fontFamily: "monospace", marginRight: 4 }}>uiDataSource = GET:/identity/users</code>
//             <code style={{ background: "#f3f4f6", padding: "1px 6px", borderRadius: 4, fontFamily: "monospace" }}>uiColumns = id,firstName,email</code>
//             <br /><br />
//             Expand the debug panel above to see what was parsed.
//           </div>
//         </div>
//       )}

//       {labels.length > 0 && (
//         <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
//           {labels.map((s) => <DynamicLabel key={s.id} spec={s} />)}
//         </div>
//       )}

//       {stats.length > 0 && (
//         <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
//           {stats.map((s) => <DynamicStat key={s.id} spec={s} />)}
//         </div>
//       )}

//       {tables.map((tableSpec) => (
//         <DynamicTable key={tableSpec.id} spec={tableSpec} buttonSpecs={buttons} />
//       ))}

//       {tables.length === 0 && buttons.length > 0 && (
//         <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
//           {buttons.map((btn) => (
//             <DynamicButton key={btn.id} spec={btn} row={{}} onDone={() => {}} />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── ModuleView (info / tasks / history tabs) ─────────────────────────────────
// function ModuleView({ module }: { module: Module }) {
//   const [tab, setTab] = useState<"ui" | "info" | "tasks" | "history">("ui");
//   const [tasks, setTasks] = useState<Record<string, unknown>[] | null>(null);
//   const [history, setHistory] = useState<Record<string, unknown>[] | null>(null);
//   const loaded = useRef(new Set<string>());
//   const [proc, setProc] = useState<ProcessDef | null>(null);

//   useEffect(() => {
//     // Find the process def for this module so DynamicUIRenderer can fetch its BPMN
//     fetchAllProcessDefs()
//       .then((ps) => setProc(ps.find((p) => p.key === module.processKey) ?? null))
//       .catch(() => {});
//   }, [module.processKey]);

//   const loadTab = useCallback(async (t: "tasks" | "history") => {
//     if (loaded.current.has(t)) return;
//     loaded.current.add(t);
//     try {
//       if (t === "tasks") {
//         const r = await apiFetch(`/runtime/tasks?processInstanceId=${module.processInstanceId}`);
//         setTasks(r.data ?? []);
//       } else {
//         const r = await apiFetch(`/history/historic-process-instances?processInstanceId=${module.processInstanceId}`);
//         setHistory(r.data ?? []);
//       }
//     } catch {
//       if (t === "tasks") setTasks([]);
//       else setHistory([]);
//     }
//   }, [module.processInstanceId]);

//   return (
//     <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
//       <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", marginBottom: 20 }}>
//         {(["ui", "info", "tasks", "history"] as const).map((t) => (
//           <button key={t} onClick={() => { setTab(t); if (t === "tasks" || t === "history") loadTab(t); }}
//             style={{ padding: "8px 16px", border: "none", background: "none", cursor: "pointer", fontSize: 13,
//               fontWeight: tab === t ? 600 : 400, color: tab === t ? "#6366f1" : "#6b7280",
//               borderBottom: tab === t ? "2px solid #6366f1" : "2px solid transparent", textTransform: "capitalize" }}>
//             {t === "ui" ? "UI" : t}
//           </button>
//         ))}
//       </div>

//       {tab === "ui" && (
//         proc
//           ? <DynamicUIRenderer proc={proc} />
//           : <Loading />
//       )}

//       {tab === "info" && (
//         <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
//           {[["Process", module.processName], ["Key", module.processKey], ["Instance ID", module.processInstanceId],
//             ...Object.entries(module.fields)].map(([k, v]) => (
//             <div key={k} style={{ display: "flex", gap: 12, fontSize: 13, padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
//               <span style={{ color: "#6b7280", minWidth: 140, flexShrink: 0 }}>{k}</span>
//               <span style={{ color: "#111827", wordBreak: "break-all" }}>{v || "—"}</span>
//             </div>
//           ))}
//         </div>
//       )}

//       {tab === "tasks" && (
//         tasks === null ? <Loading /> : tasks.length === 0 ? <Empty text="No active tasks." /> :
//         <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
//           {(tasks as any[]).map((t) => (
//             <div key={t.id} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fafafa" }}>
//               <div style={{ fontWeight: 600, fontSize: 13 }}>{t.name}</div>
//               <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>{t.assignee ?? "Unassigned"} · {new Date(t.createTime).toLocaleDateString()}</div>
//             </div>
//           ))}
//         </div>
//       )}

//       {tab === "history" && (
//         history === null ? <Loading /> : history.length === 0 ? <Empty text="No history." /> :
//         <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
//           {(history as any[]).map((h) => (
//             <div key={h.id} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fafafa" }}>
//               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//                 <span style={{ fontWeight: 600, fontSize: 13 }}>{h.processDefinitionId?.split(":")[0]}</span>
//                 <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
//                   background: h.endTime ? "#f0fdf4" : "#eef2ff", color: h.endTime ? "#16a34a" : "#6366f1" }}>
//                   {h.endTime ? "Completed" : "Running"}
//                 </span>
//               </div>
//               <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>
//                 Started {new Date(h.startTime).toLocaleString()}
//                 {h.durationInMillis != null && ` · ${fmtDuration(h.durationInMillis)}`}
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── API helpers ──────────────────────────────────────────────────────────────
// async function fetchAllProcessDefs(): Promise<ProcessDef[]> {
//   const all: ProcessDef[] = [];
//   let start = 0;
//   while (true) {
//     const page = await apiFetch(`/repository/process-definitions?size=100&start=${start}`);
//     all.push(...(page.data ?? []));
//     if (start + 100 >= (page.total ?? 0)) break;
//     start += 100;
//   }
//   const map = new Map<string, ProcessDef>();
//   for (const p of all) {
//     const ex = map.get(p.key);
//     if (!ex || p.version > ex.version) map.set(p.key, p);
//   }
//   return [...map.values()].sort((a, b) => (a.name || a.key).localeCompare(b.name || b.key));
// }

// async function fetchFormData(proc: ProcessDef): Promise<FormData> {
//   return apiFetch(`/form/form-data?processDefinitionId=${encodeURIComponent(proc.id)}`);
// }

// // ─── Shared tiny components ───────────────────────────────────────────────────
// function Loading() { return <p style={{ color: "#9ca3af", fontSize: 13 }}>Loading…</p>; }
// function Empty({ text }: { text: string }) { return <p style={{ color: "#9ca3af", fontSize: 13 }}>{text}</p>; }
// function fmtDuration(ms: number) {
//   if (ms < 60000) return `${Math.round(ms / 1000)}s`;
//   if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
//   return `${(ms / 3600000).toFixed(1)}h`;
// }

// const inputStyle: React.CSSProperties = {
//   padding: "8px 11px", borderRadius: 8, border: "1px solid #d1d5db",
//   fontSize: 14, outline: "none", background: "#f9fafb",
//   width: "100%", boxSizing: "border-box",
// };
// const ghostBtn: React.CSSProperties = {
//   padding: "7px 14px", borderRadius: 8, border: "1.5px solid #d1d5db",
//   background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500,
// };

// // ─── DynamicForm ──────────────────────────────────────────────────────────────
// function DynamicForm({ properties, values, onChange }: {
//   properties: FormProperty[]; values: Record<string, string>;
//   onChange: (id: string, val: string) => void;
// }) {
//   const visible = properties.filter((p) => p.readable && p.writable);
//   if (visible.length === 0) return <Empty text="No writable fields found." />;
//   return (
//     <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
//       {visible.map((p) => (
//         <div key={p.id} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
//           <label style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>
//             {p.name}{p.required && <span style={{ color: "#ef4444", marginLeft: 3 }}>*</span>}
//           </label>
//           {p.type === "enum" ? (
//             <select value={values[p.id] ?? ""} onChange={(e) => onChange(p.id, e.target.value)} style={inputStyle}>
//               <option value="">— select —</option>
//               {p.enumValues.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
//             </select>
//           ) : p.type === "boolean" ? (
//             <input type="checkbox" checked={values[p.id] === "true"}
//               onChange={(e) => onChange(p.id, e.target.checked ? "true" : "false")} />
//           ) : (
//             <input type={p.type === "long" ? "number" : p.type === "date" ? "date" : "text"}
//               value={values[p.id] ?? ""} onChange={(e) => onChange(p.id, e.target.value)}
//               placeholder={`Enter ${p.name.toLowerCase()}`} style={inputStyle} />
//           )}
//         </div>
//       ))}
//     </div>
//   );
// }

// // ─── Add Module Modal ─────────────────────────────────────────────────────────
// type Step = "select" | "form" | "submitting" | "done";

// function AddModuleModal({ onClose, onAdded }: {
//   onClose: () => void; onAdded: (m: Module) => void;
// }) {
//   const [step, setStep] = useState<Step>("select");
//   const [processes, setProcesses] = useState<ProcessDef[]>([]);
//   const [selected, setSelected] = useState<ProcessDef | null>(null);
//   const [formData, setFormData] = useState<FormData | null>(null);
//   const [values, setValues] = useState<Record<string, string>>({});
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [log, setLog] = useState<string[]>([]);
//   const addLog = (msg: string) => setLog((l) => [...l, msg]);

//   useEffect(() => {
//     setLoading(true);
//     fetchAllProcessDefs()
//       .then((ps) => { setProcesses(ps); setSelected(ps.find((p) => p.startFormDefined) ?? ps[0] ?? null); })
//       .catch((e) => setError(String(e)))
//       .finally(() => setLoading(false));
//   }, []);

//   const handleNext = async () => {
//     if (!selected) return;
//     setLoading(true); setError(""); setLog([]);
//     try {
//       addLog(`Fetching form for "${selected.name}"…`);
//       const fd = await fetchFormData(selected);
//       addLog(`✓ Got ${fd.formProperties.length} field(s)`);

//       // Also peek at UI spec
//       addLog("Reading UI spec from BPMN Class fields…");
//       const uiSpecs = await fetchUISpec(selected);
//       addLog(uiSpecs.length > 0
//         ? `✓ Found ${uiSpecs.length} UI component(s): ${uiSpecs.map((s) => s.uiComponent).join(", ")}`
//         : "⚠ No uiComponent fields found yet — add them in Flowable Modeler → Class fields");

//       setFormData(fd);
//       const init: Record<string, string> = {};
//       fd.formProperties.forEach((p) => { init[p.id] = ""; });
//       setValues(init);
//       setStep("form");
//     } catch (e) { setError(String(e)); }
//     finally { setLoading(false); }
//   };

//   const handleSubmit = async () => {
//     if (!selected || !formData) return;
//     const missing = formData.formProperties.filter((p) => p.required && !(values[p.id] ?? "").trim());
//     if (missing.length) { setError(`Required: ${missing.map((p) => p.name).join(", ")}`); return; }
//     setError(""); setStep("submitting"); setLog([]);
//     try {
//       addLog("Starting process instance…");
//       const instance = await apiPost("/runtime/process-instances", {
//         processDefinitionKey: selected.key,
//         variables: Object.entries(values).filter(([, v]) => v !== "").map(([name, value]) => ({ name, value })),
//       });
//       addLog(`✓ Instance: ${instance.id}`);
//       setStep("done");
//       addLog("✓ Module ready — UI will be rendered from BPMN Class fields");
//       setTimeout(() => {
//         onAdded({
//           id: instance.id, processInstanceId: instance.id,
//           processKey: selected.key, processName: selected.name,
//           fields: { ...values }, data: [],
//         });
//         onClose();
//       }, 700);
//     } catch (e) { setError(String(e)); setStep("form"); }
//   };

//   const title = { select: "Select workflow", form: "Configure module", submitting: "Starting…", done: "✓ Done" }[step];

//   return (
//     <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
//       <div style={{ background: "#fff", borderRadius: 14, width: 540, maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 60px rgba(0,0,0,0.2)", overflow: "hidden" }}>
//         <div style={{ padding: "18px 22px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//           <span style={{ fontWeight: 700, fontSize: 16 }}>{title}</span>
//           <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 22, color: "#9ca3af" }}>×</button>
//         </div>
//         <div style={{ padding: "20px 22px", overflowY: "auto", flex: 1 }}>
//           {step === "select" && (
//             loading ? <Loading /> : <>
//               <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 14px" }}>Choose a deployed workflow. React will read its BPMN Class fields to build the UI automatically.</p>
//               <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
//                 {processes.map((p) => (
//                   <label key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 9,
//                     border: `2px solid ${selected?.id === p.id ? "#6366f1" : "#e5e7eb"}`, cursor: "pointer",
//                     background: selected?.id === p.id ? "#eef2ff" : "#fafafa" }}>
//                     <input type="radio" name="proc" checked={selected?.id === p.id} onChange={() => setSelected(p)} style={{ accentColor: "#6366f1" }} />
//                     <div style={{ flex: 1 }}>
//                       <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name || p.key}</div>
//                       <div style={{ fontSize: 12, color: "#9ca3af" }}>v{p.version} · {p.key}</div>
//                     </div>
//                     <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, fontWeight: 600,
//                       background: p.startFormDefined ? "#f0fdf4" : "#fef9c3", color: p.startFormDefined ? "#16a34a" : "#92400e" }}>
//                       {p.startFormDefined ? "✓ form" : "⚠ no form"}
//                     </span>
//                   </label>
//                 ))}
//               </div>
//             </>
//           )}

//           {step === "form" && formData && (
//             formData.formProperties.length === 0
//               ? <p style={{ color: "#ef4444", fontSize: 14 }}>No form fields found. Add formProperty elements to the Start Event in Flowable Modeler.</p>
//               : <DynamicForm properties={formData.formProperties} values={values}
//                   onChange={(id, val) => setValues((v) => ({ ...v, [id]: val }))} />
//           )}

//           {log.length > 0 && (
//             <div style={{ marginTop: 16, background: "#f8fafc", borderRadius: 8, padding: "10px 14px", fontFamily: "monospace", fontSize: 12, color: "#374151", maxHeight: 140, overflowY: "auto" }}>
//               {log.map((l, i) => <div key={i}>{l}</div>)}
//               {step === "submitting" && <div style={{ color: "#6366f1" }}>⏳ Working…</div>}
//             </div>
//           )}
//           {error && <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "#fef2f2", color: "#dc2626", fontSize: 13 }}>{error}</div>}
//         </div>
//         <div style={{ padding: "14px 22px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end", gap: 10 }}>
//           <button onClick={onClose} style={ghostBtn}>Cancel</button>
//           {step === "select" && (
//             <button onClick={handleNext} disabled={!selected || loading}
//               style={{ padding: "8px 18px", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 600,
//                 cursor: selected && !loading ? "pointer" : "default", color: "#fff",
//                 background: selected && !loading ? "#6366f1" : "#c7d2fe" }}>Next →</button>
//           )}
//           {step === "form" && (
//             <button onClick={handleSubmit} disabled={!formData || formData.formProperties.length === 0}
//               style={{ padding: "8px 18px", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", background: "#6366f1", color: "#fff" }}>
//               Start Process
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─── Dashboard stats ──────────────────────────────────────────────────────────
// function DashboardStats() {
//   const [stats, setStats] = useState({ processes: 0, tasks: 0, completed: 0 });
//   useEffect(() => {
//     Promise.allSettled([
//       apiFetch("/repository/process-definitions?size=1"),
//       apiFetch("/runtime/tasks?size=1"),
//       apiFetch("/history/historic-process-instances?size=1&finished=true"),
//     ]).then(([p, t, h]) => setStats({
//       processes: p.status === "fulfilled" ? p.value.total ?? 0 : 0,
//       tasks: t.status === "fulfilled" ? t.value.total ?? 0 : 0,
//       completed: h.status === "fulfilled" ? h.value.total ?? 0 : 0,
//     }));
//   }, []);
//   return (
//     <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 32 }}>
//       {[{ label: "Deployed workflows", value: stats.processes, color: "#6366f1" },
//         { label: "Active tasks", value: stats.tasks, color: "#f97316" },
//         { label: "Completed instances", value: stats.completed, color: "#22c55e" }].map((c) => (
//         <div key={c.label} style={{ flex: "1 1 140px", padding: "16px 20px", borderRadius: 12, background: c.color + "12", border: `1.5px solid ${c.color}28` }}>
//           <div style={{ fontSize: 28, fontWeight: 800, color: c.color }}>{c.value}</div>
//           <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{c.label}</div>
//         </div>
//       ))}
//     </div>
//   );
// }

// // ─── Main App ─────────────────────────────────────────────────────────────────
// export default function FlowableModuleBuilder() {
//   const [modules, setModules] = useState<Module[]>([]);
//   const [activeId, setActiveId] = useState<string | null>(null);
//   const [showModal, setShowModal] = useState(false);
//   const [connected, setConnected] = useState<boolean | null>(null);
//   const retryRef = useRef<ReturnType<typeof setInterval> | null>(null);

//   const checkConnection = useCallback(async () => {
//     try {
//       await apiFetch("/repository/process-definitions?size=1");
//       setConnected(true);
//       if (retryRef.current) { clearInterval(retryRef.current); retryRef.current = null; }
//     } catch {
//       setConnected(false);
//       if (!retryRef.current) retryRef.current = setInterval(checkConnection, 10_000);
//     }
//   }, []);

//   useEffect(() => {
//     checkConnection();
//     return () => { if (retryRef.current) clearInterval(retryRef.current); };
//   }, [checkConnection]);

//   const activeModule = modules.find((m) => m.id === activeId) ?? null;
//   const moduleName = (m: Module) => m.fields["moduleName"] || m.fields["name"] || m.processName;
//   const moduleIcon = (m: Module) => m.fields["moduleIcon"] || "📦";

//   return (
//     <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', system-ui, sans-serif", background: "#f8fafc", color: "#111827" }}>
//       {/* Sidebar */}
//       <div style={{ width: 240, background: "#fff", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column" }}>
//         <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid #f3f4f6" }}>
//           <div style={{ fontSize: 15, fontWeight: 800 }}>🔧 Module Builder</div>
//           <div style={{ marginTop: 5, fontSize: 11, fontWeight: 600, color: connected === true ? "#16a34a" : connected === false ? "#ef4444" : "#9ca3af" }}>
//             {connected === true ? "● Flowable connected" : connected === false ? "● Flowable offline" : "● Checking…"}
//           </div>
//         </div>
//         <div style={{ flex: 1, overflowY: "auto", padding: "10px 8px" }}>
//           {modules.length === 0 && <p style={{ fontSize: 12, color: "#9ca3af", padding: "4px 8px" }}>No modules yet.</p>}
//           {modules.map((m) => (
//             <button key={m.id} onClick={() => setActiveId(m.id)} style={{
//               display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "9px 10px",
//               borderRadius: 8, border: "none", background: activeId === m.id ? "#eef2ff" : "transparent",
//               cursor: "pointer", textAlign: "left", fontSize: 13,
//               fontWeight: activeId === m.id ? 700 : 400, color: activeId === m.id ? "#6366f1" : "#374151",
//             }}>
//               <span style={{ fontSize: 18 }}>{moduleIcon(m)}</span>
//               <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{moduleName(m)}</span>
//             </button>
//           ))}
//         </div>
//         <div style={{ padding: "10px 8px", borderTop: "1px solid #f3f4f6" }}>
//           <button onClick={() => setShowModal(true)} disabled={connected === false}
//             style={{ width: "100%", padding: "9px", borderRadius: 8, border: "none",
//               background: connected === false ? "#e5e7eb" : "#6366f1",
//               color: connected === false ? "#9ca3af" : "#fff",
//               cursor: connected === false ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700 }}>
//             + Add Module
//           </button>
//         </div>
//       </div>

//       {/* Main */}
//       <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
//         {activeModule ? (
//           <>
//             <div style={{ padding: "16px 24px", borderBottom: "1px solid #e5e7eb", background: "#fff", display: "flex", alignItems: "center", gap: 12 }}>
//               <span style={{ fontSize: 26 }}>{moduleIcon(activeModule)}</span>
//               <div>
//                 <div style={{ fontWeight: 700, fontSize: 17 }}>{moduleName(activeModule)}</div>
//                 <div style={{ fontSize: 12, color: "#9ca3af" }}>
//                   {activeModule.processName} · {activeModule.fields["moduleType"] || "module"}
//                 </div>
//               </div>
//             </div>
//             <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
//               <ModuleView module={activeModule} />
//             </div>
//           </>
//         ) : (
//           <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
//             <div style={{ marginBottom: 28 }}>
//               <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>Flowable App</h1>
//               <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>Build modules dynamically from your Flowable workflows — no hardcoding required.</p>
//             </div>
//             <DashboardStats />
//             <div style={{ padding: 28, borderRadius: 12, border: "2px dashed #d1d5db", textAlign: "center", color: "#9ca3af" }}>
//               <div style={{ fontSize: 40, marginBottom: 10 }}>🧩</div>
//               <div style={{ fontWeight: 600, fontSize: 15, color: "#6b7280" }}>No module selected</div>
//               <div style={{ fontSize: 13, marginTop: 6 }}>Pick one from the sidebar or click <strong>+ Add Module</strong>.</div>
//             </div>
//           </div>
//         )}
//       </div>

//       {showModal && (
//         <AddModuleModal onClose={() => setShowModal(false)}
//           onAdded={(m) => { setModules((ms) => [...ms, m]); setActiveId(m.id); }} />
//       )}
//     </div>
//   );
// }