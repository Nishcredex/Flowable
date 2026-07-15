// const FLOWABLE_BASE = 'http://localhost:8080/flowable-ui/process-api';
const FLOWABLE_BASE = import.meta.env.VITE_FLOWABLE_API_BASE ?? 'http://localhost:3000/flowable-api';
// NOTE: shipping Basic Auth credentials in frontend code (even via env
// vars) means they end up readable in the built JS bundle. Fine for local
// dev against a sandboxed Flowable instance; for a real deployment, proxy
// these calls through your own backend (server.js) and keep the Flowable
// credentials server-side only.
const CREDENTIALS   = btoa(
  `${import.meta.env.VITE_FLOWABLE_USER ?? 'admin'}:${import.meta.env.VITE_FLOWABLE_PASSWORD ?? 'admin'}`
);

const HEADERS = {
  'Content-Type':  'application/json',
  'Authorization': `Basic ${CREDENTIALS}`,
};

// ─────────────────────────────────────────────────────────────
// TYPESCRIPT INTERFACES
// ─────────────────────────────────────────────────────────────

export interface FlowableVariable {
  name:  string;
  value: string | number | boolean;
  type:  'string' | 'integer' | 'boolean';
}

// Process Instance (one running audit workflow)
export interface ProcessInstance {
  id:                    string;
  name:                  string | null;
  processDefinitionId:   string;
  processDefinitionName: string;
  startTime:             string;
  startUserId:           string;
  ended:                 boolean;
  suspended:             boolean;
  variables:             FlowableVariable[];
  /** true when this row came from the historic endpoint (already completed) */
  _historic?:            boolean;
}

// Task (one step assigned to a user)
export interface FlowableTask {
  id:                string;
  name:              string;
  assignee:          string;
  created:           string;
  dueDate:           string | null;
  priority:          number;
  suspended:         boolean;
  formKey:           string | null;
  processInstanceId: string;
  processDefinitionId: string;
  taskDefinitionKey: string;
  description:       string | null;
  /** Only present on CMMN tasks (e.g. commercialHeadApprovalTask /
   *  functionalHeadApprovalTask) — the CMMN REST API returns
   *  caseInstanceId instead of processInstanceId. Confirmed against
   *  Flowable's CMMN REST docs ("Get a task" under cmmn-runtime/tasks). */
  caseInstanceId?:    string;
  caseDefinitionId?:  string;
}

// Process variable item returned by /variables endpoint
export interface ProcessVariable {
  name:  string;
  type:  string;
  value: string | number | boolean;
  scope: string;
}

// Start process request payload
export interface StartProcessPayload {
  auditName:    string;
  auditId:      string;
  projectName:  string;
  auditorName:  string;
  dueDate:      string;
  description:  string;
  checklistSteps: string; // JSON stringified array of step names
  /** Which deployed workflow to start. Defaults to 'auditManagementWorkflow'. */
  processDefinitionKey?: string;
}

// Complete task request payload
export interface CompleteTaskPayload {
  stepName?:        string;
  comments?:        string;
  evidenceFile?:    string;
  completedBy?:     string;
  assignedTo?:      string;
  priority?:        string;
  taskTitle?:       string;
  approvalDecision?: 'Approved' | 'Rejected';
  managerComments?: string;
}

// Dashboard stats derived from Flowable data
export interface AuditStats {
  total:      number;
  inProgress: number;
  completed:  number;
  overdue:    number;
}

// ─────────────────────────────────────────────────────────────
// HELPER — generic fetch wrapper with error handling
// ─────────────────────────────────────────────────────────────

async function flowableFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${FLOWABLE_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...HEADERS,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Flowable API error [${response.status}]: ${errorText}`
    );
  }

  // 204 No Content (e.g. complete task returns no body)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

// ─────────────────────────────────────────────────────────────
// 1. START PROCESS
//    Called from: CreateAudit.tsx on "Start Audit" click
// ─────────────────────────────────────────────────────────────

export async function startAuditProcess(
  payload: StartProcessPayload
): Promise<ProcessInstance> {
  const variables: FlowableVariable[] = [
    { name: 'auditName',       value: payload.auditName,       type: 'string' },
    { name: 'auditId',         value: payload.auditId,         type: 'string' },
    { name: 'projectName',     value: payload.projectName,     type: 'string' },
    { name: 'auditorName',     value: payload.auditorName,     type: 'string' },
    { name: 'dueDate',         value: payload.dueDate,         type: 'string' },
    { name: 'description',     value: payload.description,     type: 'string' },
    { name: 'checklistSteps',  value: payload.checklistSteps,  type: 'string' },
  ];

  const processDefinitionKey = payload.processDefinitionKey || 'auditManagementWorkflow';

  return flowableFetch<ProcessInstance>('/runtime/process-instances', {
    method: 'POST',
    body: JSON.stringify({
      processDefinitionKey,
      variables,
    }),
  });
}

// ─────────────────────────────────────────────────────────────
// 2. GET ALL PROCESS INSTANCES
//    Called from: AuditsList.tsx, Dashboard.tsx
// ─────────────────────────────────────────────────────────────

// Shape returned by historic-process-instances when includeProcessVariables=true
interface HistoricProcessInstance {
  id:                    string;
  name:                  string | null;
  processDefinitionId:   string;
  processDefinitionName: string;
  startTime:             string;
  startUserId:           string;
  endTime:               string | null;
  // Variables are inlined as an array when includeProcessVariables=true
  variables?: Array<{ variableName: string; value: string | number | boolean; variableTypeName: string }>;
}

export async function getAllProcessInstances(): Promise<ProcessInstance[]> {
  // Dynamically discover all deployed workflow keys, then query runtime + historic
  // instances for every audit workflow — no hardcoded processDefinitionKey.
  let auditKeys: string[] = [];
  try {
    const defs = await getAllProcessDefinitions();
    auditKeys = defs.map((d) => d.key);
  } catch {
    // Fallback to the legacy key if the definitions endpoint fails
    auditKeys = ['auditManagementWorkflow'];
  }

  // Build one runtime + one historic query per key, all in parallel
  const keyQueries = auditKeys.flatMap((key) => [
    flowableFetch<{ data: ProcessInstance[] }>(
      `/runtime/process-instances?processDefinitionKey=${encodeURIComponent(key)}&size=100`
    ).then((r) => ({ type: 'runtime' as const, data: r.data || [] })).catch(() => ({ type: 'runtime' as const, data: [] as ProcessInstance[] })),
    flowableFetch<{ data: HistoricProcessInstance[] }>(
      `/history/historic-process-instances?processDefinitionKey=${encodeURIComponent(key)}&size=100&finished=true&includeProcessVariables=true`
    ).then((r) => ({ type: 'historic' as const, data: r.data || [] })).catch(() => ({ type: 'historic' as const, data: [] as HistoricProcessInstance[] })),
  ]);

  const results = await Promise.all(keyQueries);

  const runtimeInstances: ProcessInstance[] = results
    .filter((r) => r.type === 'runtime')
    .flatMap((r) => r.data as ProcessInstance[]);

  const runtimeIds = new Set(runtimeInstances.map((i) => i.id));

  const historicInstances: ProcessInstance[] = results
    .filter((r) => r.type === 'historic')
    .flatMap((r) => r.data as HistoricProcessInstance[])
    .filter((i) => !runtimeIds.has(i.id))
    .map((i) => {
      // Map inline variables from variableName → name so getVariableValue works
      const mappedVars: FlowableVariable[] = (i.variables || []).map((v: any) => ({
        name:  v.variableName ?? v.name ?? '',
        value: v.value,
        type:  (v.variableTypeName ?? v.type ?? 'string') as 'string' | 'integer' | 'boolean',
      }));
      return {
        ...i,
        ended:     true,
        suspended: false,
        _historic: true,
        variables: mappedVars,
      } as ProcessInstance;
    });

  return [...runtimeInstances, ...historicInstances];
}

// ─────────────────────────────────────────────────────────────
// 3. GET PROCESS VARIABLES
//    For completed processes use the history endpoint directly —
//    never hit the runtime endpoint which 404s for ended processes.
// ─────────────────────────────────────────────────────────────

/** Variables for a COMPLETED process — uses history endpoint.
 *  Returns [] on 404 (safe fallback) so callers never crash. */
export async function getHistoricProcessVariables(
  processInstanceId: string
): Promise<ProcessVariable[]> {
  try {
    const data = await flowableFetch<{
      data: Array<{ variableName: string; value: string | number | boolean; variableTypeName: string }>;
    }>(`/history/historic-variable-instances?processInstanceId=${processInstanceId}&size=100`);

    return (data.data || []).map((v) => ({
      name:  v.variableName,
      type:  v.variableTypeName || 'string',
      value: v.value,
      scope: 'global',
    }));
  } catch (err) {
    console.warn(`getHistoricProcessVariables(${processInstanceId}) failed:`, err);
    return [];
  }
}

export async function getProcessVariables(
  processInstanceId: string
): Promise<ProcessVariable[]> {
  // Try runtime first; on 404 (process ended) fall back to history
  try {
    const data = await flowableFetch<ProcessVariable[] | { data: ProcessVariable[] }>(
      `/runtime/process-instances/${processInstanceId}/variables`
    );
    if (Array.isArray(data)) return data;
    return (data as any).data || [];
  } catch (err) {
    if (err instanceof Error && err.message.includes('[404]')) {
      return getHistoricProcessVariables(processInstanceId);
    }
    throw err;
  }
}

// Helper — get a single variable value by name
export function getVariableValue(
  variables: ProcessVariable[],
  name: string
): string {
  const found = variables.find((v) => v.name === name);
  return found ? String(found.value) : '';
}

// ─────────────────────────────────────────────────────────────
// 4. GET TASKS BY ASSIGNEE
//    Called from: MyTasks.tsx
// ─────────────────────────────────────────────────────────────

// getTasksByAssignee queries Flowable for tasks assigned to a user.
// Old audits may have stored the display name ("Anita Sharma") as the assignee
// while new audits store the login id ("anita.sharma").
// We query both and deduplicate so auditors always see their tasks.
export async function getTasksByAssignee(
  assignee: string,
  displayName?: string
): Promise<FlowableTask[]> {
  const queries: string[] = [assignee];
  if (displayName && displayName.toLowerCase() !== assignee.toLowerCase()) {
    queries.push(displayName);
  }

  const results = await Promise.allSettled(
    queries.map((a) =>
      flowableFetch<{ data: FlowableTask[] }>(
        `/runtime/tasks?assignee=${encodeURIComponent(a)}&size=100`
      ).then((d) => d.data || [])
    )
  );

  const seen = new Set<string>();
  const tasks: FlowableTask[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') {
      for (const t of r.value) {
        if (!seen.has(t.id)) {
          seen.add(t.id);
          tasks.push(t);
        }
      }
    }
  }
  return tasks;
}

export async function getHistoricProcessInstances(): Promise<ProcessInstance[]> {
  const data = await flowableFetch<{ data: ProcessInstance[] }>(
    '/history/historic-process-instances?size=100&finished=true'
  );
  return data.data || [];
}

// ─────────────────────────────────────────────────────────────
// GET A SINGLE PROCESS INSTANCE — used to check whether it has ended
//    Called from: AuditChecklist.tsx, to distinguish "no active task
//    because the process finished" from "no active task because the
//    checklist state is just stale/loading".
// ─────────────────────────────────────────────────────────────

/** Returns the live process instance, or null if it has ended.
 *  A 404 on /runtime/process-instances/{id} reliably means "ended" —
 *  Flowable deletes runtime rows once a process reaches its end event,
 *  moving everything to the history tables instead. */
export async function getProcessInstanceById(
  processInstanceId: string
): Promise<ProcessInstance | null> {
  try {
    return await flowableFetch<ProcessInstance>(
      `/runtime/process-instances/${processInstanceId}`
    );
  } catch (err) {
    if (err instanceof Error && err.message.includes('[404]')) {
      return null;
    }
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────
// 5. GET ALL TASKS (for a process instance)
//    Called from: AuditChecklist.tsx to get step statuses
// ─────────────────────────────────────────────────────────────

export async function getTasksByProcessInstance(
  processInstanceId: string
): Promise<FlowableTask[]> {
  try {
    const data = await flowableFetch<{ data: FlowableTask[] }>(
      `/runtime/tasks?processInstanceId=${processInstanceId}&size=100`
    );
    return data.data || [];
  } catch {
    // Process may have ended — active tasks no longer exist
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// 6. GET SINGLE TASK BY ID
//    Called from: TaskDetails.tsx
// ─────────────────────────────────────────────────────────────

export async function getTaskById(
  taskId: string
): Promise<FlowableTask> {
  return flowableFetch<FlowableTask>(`/runtime/tasks/${taskId}`);
}

// ─────────────────────────────────────────────────────────────
// 7. COMPLETE A TASK
//    Called from: CompleteStep.tsx, TaskDetails.tsx, MyTasks.tsx
// ─────────────────────────────────────────────────────────────

export async function completeTask(
  taskId:    string,
  payload?:  CompleteTaskPayload
): Promise<void> {
  const variables: FlowableVariable[] = payload
    ? Object.entries(payload)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([key, value]) => ({
          name:  key,
          value: value as string,
          type:  'string' as const,
        }))
    : [];

  await flowableFetch<void>(
    `/runtime/tasks/${taskId}`,
    {
      method: 'POST',
      body: JSON.stringify({
        action:    'complete',
        variables: variables.length > 0 ? variables : undefined,
      }),
    }
  );
}
// ─────────────────────────────────────────────────────────────
// COMMENTS — native Flowable comment resource (process-instance
// scoped). Replaces the old Node /api/audits/:id/comments route and
// the "comments" process variable — comments now live in Flowable's
// own comment tables. Node is a pure CORS passthrough here, nothing else.
//
// CAVEAT: every call in this file authenticates as the fixed
// admin:admin service account (see CREDENTIALS above), not the logged
// -in app user — so Flowable's own `author` field will always read
// "admin", not the real person. authorId/authorName/role are packed
// into the comment's `message` as JSON instead, and unpacked on read.
// `time` is NOT client-supplied — it's Flowable's own server timestamp.
// ─────────────────────────────────────────────────────────────

interface FlowableComment {
  id: string;
  author: string;
  message: string;
  taskId: string | null;
  processInstanceId: string | null;
  time: string;
}

export interface CommentEntry {
  authorId: string;
  authorName?: string;
  role?: string;
  text: string;
  timestamp: string;
}

function decodeComment(c: FlowableComment): CommentEntry {
  try {
    const parsed = JSON.parse(c.message);
    return {
      authorId: parsed.authorId ?? c.author,
      authorName: parsed.authorName,
      role: parsed.role,
      text: parsed.text ?? c.message,
      timestamp: c.time,
    };
  } catch {
    // Plain-text comment (e.g. added directly in Flowable) — show as-is
    return { authorId: c.author, text: c.message, timestamp: c.time };
  }
}

export async function getProcessInstanceComments(
  processInstanceId: string
): Promise<CommentEntry[]> {
  const comments = await flowableFetch<FlowableComment[]>(
    `/history/historic-process-instances/${processInstanceId}/comments`
  );
  return (comments || [])
    .map(decodeComment)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export async function addProcessInstanceComment(
  processInstanceId: string,
  entry: { authorId: string; authorName?: string; role?: string; text: string }
): Promise<CommentEntry[]> {
  await flowableFetch<FlowableComment>(
    `/history/historic-process-instances/${processInstanceId}/comments`,
    {
      method: 'POST',
      body: JSON.stringify({
        message: JSON.stringify({
          authorId: entry.authorId,
          authorName: entry.authorName,
          role: entry.role,
          text: entry.text,
        }),
      }),
    }
  );
  return getProcessInstanceComments(processInstanceId);
}
// ─────────────────────────────────────────────────────────────
// ATTACHMENTS — native Flowable attachment resource. Uploads are
// task-scoped (that's the only Flowable create-attachment endpoint),
// but Flowable links each attachment to the owning process instance
// automatically, so listing by processInstanceId still finds them —
// matches the old getAttachments(processInstanceId) behavior of
// showing everything uploaded across the audit's whole lifetime, not
// just the currently-open task.
// ─────────────────────────────────────────────────────────────

export interface FlowableAttachment {
  id: string;
  name: string;
  description: string | null;
  type: string | null;
  taskId: string | null;
  processInstanceId: string | null;
  url: string | null;        // only set for externalUrl attachments (not used here)
  contentUrl: string | null; // relative Flowable path for binary content
  time: string;
  userId: string | null;
}



/** Flowable's attachment endpoint takes exactly one file per multipart
 *  request, so multiple files means multiple sequential calls. */
async function uploadOneAttachment(
  taskId: string,
  file: File,
  uploadedBy: string
): Promise<FlowableAttachment> {
  const form = new FormData();
  form.append('name', file.name);
  form.append('type', file.type || 'application/octet-stream');
  // same author-attribution caveat as comments — Flowable stamps
  // userId from the shared service account, so the real uploader
  // goes in description instead.
  form.append('description', uploadedBy);
  form.append('file', file);

  const res = await fetch(`${FLOWABLE_BASE}/runtime/tasks/${taskId}/attachments`, {
    method: 'POST',
    headers: { Authorization: HEADERS.Authorization }, // no Content-Type — browser sets the multipart boundary
    body: form,
  });

  if (!res.ok) {
    throw new Error(`Flowable API error [${res.status}]: ${await res.text()}`);
  }
  return res.json();
}

export async function uploadAttachments(
  taskId: string,
  files: File[],
  uploadedBy: string
): Promise<FlowableAttachment[]> {
  const results: FlowableAttachment[] = [];
  for (const file of files) {
    results.push(await uploadOneAttachment(taskId, file, uploadedBy));
  }
  return results;
}

/** A plain <a href> won't work for attachment content: Flowable requires
 *  Basic Auth on every request and Node here is only a passthrough proxy
 *  (no cookie/session auth), so a bare link click reaches Flowable with
 *  no credentials and gets a 401. Fetch authenticated, then save the blob. */

// ─────────────────────────────────────────────────────────────
// 8. GET DASHBOARD STATS
//    Called from: Dashboard.tsx
// ─────────────────────────────────────────────────────────────

export async function getAuditStats(): Promise<AuditStats> {
  const instances = await getAllProcessInstances();

  const total      = instances.length;
  const completed  = instances.filter((i) => i.ended).length;
  const inProgress = instances.filter((i) => !i.ended && !i.suspended).length;

  // Count overdue by checking dueDate variable on active instances
  // (avoids the /runtime/tasks?dueBefore= query which Flowable rejects with 400)
  const now = new Date();
  let overdue = 0;
  for (const inst of instances) {
    if (inst.ended || inst.suspended) continue;
    const vars = Array.isArray(inst.variables) ? inst.variables as any[] : [];
    const dueDateVar = vars.find((v: any) => v.name === 'dueDate');
    if (dueDateVar?.value) {
      const due = new Date(String(dueDateVar.value));
      if (!isNaN(due.getTime()) && due < now) overdue++;
    }
  }

  return { total, inProgress, completed, overdue };
}

// ─────────────────────────────────────────────────────────────
// 9. GET PROCESS DEFINITION (for WorkflowView BPMN diagram)
//    Called from: WorkflowView.tsx
// ─────────────────────────────────────────────────────────────

export async function getProcessDefinition() {
  const data = await flowableFetch<{ data: unknown[] }>(
    '/repository/process-definitions?key=auditManagementWorkflow&size=1'
  );
  return data.data?.[0] || null;
}

// ─────────────────────────────────────────────────────────────
// 10. DELETE / CANCEL A PROCESS INSTANCE
//     Called from: AuditsList.tsx if user cancels an audit
// ─────────────────────────────────────────────────────────────

export async function cancelProcessInstance(
  processInstanceId: string
): Promise<void> {
  await flowableFetch<void>(
    `/runtime/process-instances/${processInstanceId}`,
    { method: 'DELETE' }
  );
}

// ─────────────────────────────────────────────────────────────
// OBSERVATION WORKFLOW  (processDefinitionKey: auditObservationWorkflow)
//    Called from: CreateObservation.tsx, ObservationTask.tsx,
//                 ObservationsList.tsx, MyTasks.tsx
// ─────────────────────────────────────────────────────────────

/** Task keys that belong to auditObservationWorkflow. MyTasks.tsx uses
 *  this to route a task to /observations/tasks/:id instead of /tasks/:id. */
export const OBSERVATION_TASK_KEYS = [
  'submitCorrectiveAction',
  'reviewCorrectiveAction',
  'approveExtensionCommercial',
  'approveExtensionFunctional',
] as const;

export function isObservationTask(
  task: Pick<FlowableTask, 'taskDefinitionKey'>
): boolean {
  return (OBSERVATION_TASK_KEYS as readonly string[]).includes(task.taskDefinitionKey);
}

// ─────────────────────────────────────────────────────────────
// CANDIDATE-GROUP TASKS (Option B — commercialHead / functionalHead)
//    approveExtensionCommercial / approveExtensionFunctional have no
//    direct assignee in the BPMN — only flowable:candidateGroups — so
//    getTasksByAssignee() never surfaces them to anyone. These helpers
//    let MyTasks.tsx query by group instead, and let ObservationTask.tsx
//    claim a task before completing it.
//    Called from: MyTasks.tsx, ObservationTask.tsx
// ─────────────────────────────────────────────────────────────

/** Maps an observation-workflow taskDefinitionKey to the Flowable
 *  candidate group that can claim it. Only the two approval tasks go
 *  through group claiming — everything else is assigned directly. */
export const OBSERVATION_CANDIDATE_GROUPS: Record<string, string> = {
  approveExtensionCommercial: 'commercialHead',
  approveExtensionFunctional: 'functionalHead',
};

/** Fetch unclaimed tasks visible to one or more candidate groups.
 *  Dedupes across groups, same pattern as getTasksByAssignee's
 *  assignee/displayName dedupe. Returns [] for an empty group list so
 *  callers with no group membership don't need to branch. */
export async function getTasksByCandidateGroups(
  groups: string[]
): Promise<FlowableTask[]> {
  if (!groups.length) return [];

  const results = await Promise.allSettled(
    groups.map((g) =>
      flowableFetch<{ data: FlowableTask[] }>(
        `/runtime/tasks?candidateGroup=${encodeURIComponent(g)}&size=100`
      ).then((d) => d.data || [])
    )
  );

  const seen = new Set<string>();
  const tasks: FlowableTask[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') {
      for (const t of r.value) {
        if (!seen.has(t.id)) {
          seen.add(t.id);
          tasks.push(t);
        }
      }
    }
  }
  return tasks;
}

/** Claim an unassigned candidate-group task for the given user so it can
 *  then be completed. Flowable expects a task to be claimed (assignee
 *  set) before a specific user completes it — completing a merely
 *  candidate-visible task can otherwise leave the audit trail showing no
 *  owner. Safe to call when already assigned to this same user. */
export async function claimTask(taskId: string, userId: string): Promise<void> {
  await flowableFetch<void>(`/runtime/tasks/${taskId}`, {
    method: 'POST',
    body: JSON.stringify({ action: 'claim', assignee: userId }),
  });
}

// Fields per Annexure-1 (FR-01). auditeeId, observationDescription and
// dueDate are required; everything else is optional context. auditorId is
// filled in by the caller from the logged-in user, not the form itself.
export interface ObservationStartPayload {
  auditeeId:              string;
  auditorId:              string;
  auditId?:               string;
  auditName?:             string;
  projectName?:           string;
  department?:            string;
  observationDate?:       string;
  observationCategory?:   string;
  areaOfObservation?:     string;
  observationDescription: string;
  rootCause?:             string;
  riskRating?:            string;
  referenceClause?:       string;
  evidenceOfObservation?: string;
  dueDate:                string;
}

export async function startObservationProcess(
  payload: ObservationStartPayload
): Promise<ProcessInstance> {
  const variables: FlowableVariable[] = Object.entries(payload)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([name, value]) => ({ name, value: value as string, type: 'string' as const }));

  return flowableFetch<ProcessInstance>('/runtime/process-instances', {
    method: 'POST',
    body: JSON.stringify({
      processDefinitionKey: 'auditObservationWorkflow',
      variables,
    }),
  });
}

// Flattened view of one observation's own process variables — used by
// ObservationTask.tsx's header and any future detail/summary screen.
export interface ObservationSummary {
  observationId:          string;
  auditorId:              string;
  auditeeId:              string;
  observationDescription: string;
  dueDate:                string;
  status:                 string;
}

export async function getObservationSummary(
  processInstanceId: string
): Promise<ObservationSummary> {
  const vars = await getProcessVariables(processInstanceId);
  return {
    observationId:          getVariableValue(vars, 'observationId'),
    auditorId:              getVariableValue(vars, 'auditorId'),
    auditeeId:              getVariableValue(vars, 'auditeeId'),
    observationDescription: getVariableValue(vars, 'observationDescription'),
    dueDate:                getVariableValue(vars, 'dueDate'),
    status:                 getVariableValue(vars, 'status'),
  };
}

// One row for ObservationsList.tsx — same runtime+historic merge pattern
// as getAllProcessInstances/getAllProjects, scoped to this workflow.
export interface ObservationInstance {
  id:                      string; // processInstanceId
  observationId:           string;
  auditorId:               string;
  auditeeId:               string;
  observationDescription:  string;
  dueDate:                 string;
  status:                  string;
  startTime:               string;
  ended:                   boolean;
}

export async function getAllObservations(): Promise<ObservationInstance[]> {
  const [runtime, historic] = await Promise.all([
    flowableFetch<{ data: ProcessInstance[] }>(
      '/runtime/process-instances?processDefinitionKey=auditObservationWorkflow&size=100'
    ).then((r) => r.data || []).catch(() => [] as ProcessInstance[]),
    flowableFetch<{ data: any[] }>(
      '/history/historic-process-instances?processDefinitionKey=auditObservationWorkflow&size=100&finished=true&includeProcessVariables=true'
    ).then((r) => r.data || []).catch(() => [] as any[]),
  ]);

  const runtimeIds = new Set(runtime.map((i) => i.id));

  const runtimeObs: ObservationInstance[] = await Promise.all(
    runtime.map(async (inst) => {
      const vars = await getProcessVariables(inst.id);
      return {
        id:                     inst.id,
        observationId:          getVariableValue(vars, 'observationId'),
        auditorId:              getVariableValue(vars, 'auditorId'),
        auditeeId:              getVariableValue(vars, 'auditeeId'),
        observationDescription: getVariableValue(vars, 'observationDescription'),
        dueDate:                getVariableValue(vars, 'dueDate'),
        status:                 getVariableValue(vars, 'status') || 'Open',
        startTime:              inst.startTime,
        ended:                  inst.ended,
      };
    })
  );

  const historicObs: ObservationInstance[] = historic
    .filter((i) => !runtimeIds.has(i.id))
    .map((i) => {
      const vars: ProcessVariable[] = (i.variables || []).map((v: any) => ({
        name:  v.variableName ?? v.name ?? '',
        value: v.value,
        type:  v.variableTypeName ?? v.type ?? 'string',
        scope: 'global',
      }));
      return {
        id:                     i.id,
        observationId:          getVariableValue(vars, 'observationId'),
        auditorId:              getVariableValue(vars, 'auditorId'),
        auditeeId:              getVariableValue(vars, 'auditeeId'),
        observationDescription: getVariableValue(vars, 'observationDescription'),
        dueDate:                getVariableValue(vars, 'dueDate'),
        status:                 getVariableValue(vars, 'status') || 'Closed',
        startTime:              i.startTime,
        ended:                  true,
      };
    });

  return [...runtimeObs, ...historicObs];
}

// ─────────────────────────────────────────────────────────────
// ATR OBSERVATION LIFECYCLE  (processDefinitionKey: ATR_OBSERVATION_LIFECYCLE)
// + ATR EXTENSION APPROVAL   (CMMN case key: ATR_EXTENSION_APPROVAL)
//
// This is the NEW workflow defined by ATR_OBSERVATION_LIFECYCLE_bpmn20.xml
// and ATR_EXTENSION_APPROVAL_cmmn.xml. It is intentionally separate from
// the OBSERVATION WORKFLOW block above (auditObservationWorkflow), which
// stays untouched. Task keys, variable names and process/case keys below
// come straight from the XML — nothing here is hardcoded business logic,
// it only reflects what the workflow definitions declare.
//
// Called from: ObservationTask.tsx, MyTasks.tsx, CreateAtrObservation.tsx
// ─────────────────────────────────────────────────────────────

export const ATR_PROCESS_KEY = 'ATR_OBSERVATION_LIFECYCLE';
export const ATR_CASE_KEY = 'ATR_EXTENSION_APPROVAL';

/** userTask ids from the BPMN — assigned directly to auditeeId / auditorId. */
export const ATR_OBSERVATION_TASK_KEYS = [
  'auditeeSubmitAction',
  'auditorReviewEvidence',
] as const;

/** humanTask ids from the CMMN case — assigned directly to
 *  commercialHeadId / functionalHeadId (no candidate-group claiming
 *  needed, unlike the old approveExtensionCommercial/Functional tasks). */
export const ATR_CASE_TASK_KEYS = [
  'commercialHeadApprovalTask',
  'functionalHeadApprovalTask',
] as const;

export function isAtrObservationTask(
  task: Pick<FlowableTask, 'taskDefinitionKey'>
): boolean {
  return (ATR_OBSERVATION_TASK_KEYS as readonly string[]).includes(task.taskDefinitionKey);
}

export function isAtrCaseTask(
  task: Pick<FlowableTask, 'taskDefinitionKey'>
): boolean {
  return (ATR_CASE_TASK_KEYS as readonly string[]).includes(task.taskDefinitionKey);
}

/** True for any task belonging to the new ATR workflow (BPMN or CMMN side).
 *  MyTasks.tsx uses this to route to /observations/tasks/:id, same pattern
 *  as isObservationTask() for the old workflow. */
export function isAtrTask(task: Pick<FlowableTask, 'taskDefinitionKey'>): boolean {
  return isAtrObservationTask(task) || isAtrCaseTask(task);
}

// ── CMMN fetch helper ───────────────────────────────────────────
// Mirrors flowableFetch() but goes through the /cmmn-flowable-api proxy
// (see server.js), which points at Flowable's CMMN REST app rather than
// the BPMN process-api app. Needed because commercialHeadApprovalTask /
// functionalHeadApprovalTask live in the CMMN engine.
const FLOWABLE_CMMN_BASE = import.meta.env.VITE_FLOWABLE_CMMN_API_BASE ?? 'http://localhost:3000/cmmn-flowable-api';

async function cmmnFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${FLOWABLE_CMMN_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: { ...HEADERS, ...(options.headers || {}) },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Flowable CMMN API error [${response.status}]: ${errorText}`);
  }
  if (response.status === 204) return {} as T;
  return response.json() as Promise<T>;
}

export interface AtrObservationStartPayload {
  observationId:    string;
  auditorId:        string;
  auditeeId:         string;
  targetDate:        string;
  department?:       string;
  category?:         string;
  priority?:         string;
  /** Needed up-front because the CMMN case tasks use direct
   *  flowable:assignee="${commercialHeadId}" / "${functionalHeadId}" —
   *  there's no candidate-group fallback in this workflow, so these must
   *  be resolved before the extension branch can ever be reached. */
  commercialHeadId:  string;
  functionalHeadId:  string;
  observationDescription?: string;
  auditName?:        string;
  projectName?:      string;
}

export async function startAtrObservationProcess(
  payload: AtrObservationStartPayload
): Promise<ProcessInstance> {
  const variables: FlowableVariable[] = Object.entries(payload)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([name, value]) => ({ name, value: value as string, type: 'string' as const }));

  return flowableFetch<ProcessInstance>('/runtime/process-instances', {
    method: 'POST',
    body: JSON.stringify({
      processDefinitionKey: ATR_PROCESS_KEY,
      // observationId doubles as the business key so the CMMN case
      // (started later, on the extension branch) can correlate back to
      // this same process instance, per the XML documentation.
      businessKey: payload.observationId,
      variables,
    }),
  });
}

export interface AtrObservationSummary {
  observationId:            string;
  auditorId:                string;
  auditeeId:                string;
  observationDescription:   string;
  targetDate:                string;
  status:                    string;
  commercialHeadId:          string;
  functionalHeadId:          string;
}

export async function getAtrObservationSummary(
  processInstanceId: string
): Promise<AtrObservationSummary> {
  const vars = await getProcessVariables(processInstanceId);
  return {
    observationId:          getVariableValue(vars, 'observationId'),
    auditorId:              getVariableValue(vars, 'auditorId'),
    auditeeId:              getVariableValue(vars, 'auditeeId'),
    observationDescription: getVariableValue(vars, 'observationDescription'),
    targetDate:             getVariableValue(vars, 'targetDate'),
    status:                 getVariableValue(vars, 'status'),
    commercialHeadId:       getVariableValue(vars, 'commercialHeadId'),
    functionalHeadId:       getVariableValue(vars, 'functionalHeadId'),
  };
}

export interface AtrObservationInstance {
  id:                      string; // processInstanceId
  observationId:           string;
  auditorId:               string;
  auditeeId:               string;
  observationDescription:  string;
  targetDate:              string;
  status:                  string;
  startTime:               string;
  ended:                   boolean;
}

export async function getAllAtrObservations(): Promise<AtrObservationInstance[]> {
  const [runtime, historic] = await Promise.all([
    flowableFetch<{ data: ProcessInstance[] }>(
      `/runtime/process-instances?processDefinitionKey=${ATR_PROCESS_KEY}&size=100`
    ).then((r) => r.data || []).catch(() => [] as ProcessInstance[]),
    flowableFetch<{ data: any[] }>(
      `/history/historic-process-instances?processDefinitionKey=${ATR_PROCESS_KEY}&size=100&finished=true&includeProcessVariables=true`
    ).then((r) => r.data || []).catch(() => [] as any[]),
  ]);

  const runtimeIds = new Set(runtime.map((i) => i.id));

  const runtimeObs: AtrObservationInstance[] = await Promise.all(
    runtime.map(async (inst) => {
      const vars = await getProcessVariables(inst.id);
      return {
        id:                     inst.id,
        observationId:          getVariableValue(vars, 'observationId'),
        auditorId:              getVariableValue(vars, 'auditorId'),
        auditeeId:              getVariableValue(vars, 'auditeeId'),
        observationDescription: getVariableValue(vars, 'observationDescription'),
        targetDate:             getVariableValue(vars, 'targetDate'),
        status:                 getVariableValue(vars, 'status') || 'OPEN',
        startTime:              inst.startTime,
        ended:                  inst.ended,
      };
    })
  );

  const historicObs: AtrObservationInstance[] = historic
    .filter((i) => !runtimeIds.has(i.id))
    .map((i) => {
      const vars: ProcessVariable[] = (i.variables || []).map((v: any) => ({
        name:  v.variableName ?? v.name ?? '',
        value: v.value,
        type:  v.variableTypeName ?? v.type ?? 'string',
        scope: 'global',
      }));
      return {
        id:                     i.id,
        observationId:          getVariableValue(vars, 'observationId'),
        auditorId:              getVariableValue(vars, 'auditorId'),
        auditeeId:              getVariableValue(vars, 'auditeeId'),
        observationDescription: getVariableValue(vars, 'observationDescription'),
        targetDate:             getVariableValue(vars, 'targetDate'),
        status:                 getVariableValue(vars, 'status') || 'CLOSED',
        startTime:              i.startTime,
        ended:                  true,
      };
    });

  return [...runtimeObs, ...historicObs];
}

/** CMMN-side equivalent of getTasksByAssignee — queries case tasks
 *  (commercialHeadApprovalTask / functionalHeadApprovalTask) directly
 *  assigned to this user. Endpoint path follows Flowable's standard CMMN
 *  REST convention (/cmmn-runtime/tasks); confirm against your Flowable
 *  deployment if it 404s. */
export async function getAtrCaseTasksByAssignee(userId: string): Promise<FlowableTask[]> {
  if (!userId) return [];
  try {
    const data = await cmmnFetch<{ data: FlowableTask[] }>(
      `/cmmn-runtime/tasks?assignee=${encodeURIComponent(userId)}&size=100`
    );
    return data.data || [];
  } catch {
    return [];
  }
}

export async function getAtrCaseTaskById(taskId: string): Promise<FlowableTask> {
  return cmmnFetch<FlowableTask>(`/cmmn-runtime/tasks/${taskId}`);
}

export async function getAtrCaseVariables(caseInstanceId: string): Promise<ProcessVariable[]> {
  const data = await cmmnFetch<ProcessVariable[]>(
    `/cmmn-runtime/case-instances/${caseInstanceId}/variables`
  );
  return Array.isArray(data) ? data : [];
}

/** One ATR_EXTENSION_APPROVAL case instance, from the Commercial/Functional
 *  Head's point of view, merged with a bit of context (auditeeId,
 *  observationDescription) pulled from the paired BPMN observation
 *  instance sharing the same businessKey/observationId. */
export interface AtrExtensionCaseRecord {
  id:                       string; // caseInstanceId
  observationId:            string;
  auditeeId:                string;
  observationDescription:   string;
  targetDate:                string;
  requestedExtensionDate:   string;
  /** Derived from commercialDecision/functionalDecision — NOT the same as
   *  the old workflow's EXTENSION_REQUESTED/COMMERCIAL_APPROVAL/etc.
   *  strings, which were never actually set anywhere in this CMMN/BPMN
   *  pair. This is the real state of the sentry this head cares about. */
  bucket:                   'pending' | 'approved' | 'rejected';
  ended:                    boolean;
}

/** Direct-to-Flowable replacement for the old getMyAudits(role, ...) call
 *  HeadDashboards.tsx used to make against `/api/audits/my` — that route
 *  is never actually registered in server.js (only /flowable-api,
 *  /cmmn-flowable-api, /start-process, /health are), so it always 404s.
 *  This instead queries the CMMN engine directly, the same way
 *  getAllAtrObservations() already does for the BPMN side: fetch running
 *  + historic case instances for ATR_EXTENSION_APPROVAL in bulk, filter to
 *  the ones where commercialHeadId/functionalHeadId equals this user, then
 *  bucket each by the *actual* decision variable rather than a status
 *  string that's never set. */
export async function getAtrExtensionCasesForHead(
  role:'commercialHead' | 'functionalHead' | 'auditee',
  userId: string
): Promise<AtrExtensionCaseRecord[]> {
  if (!userId) return [];
  const idField = role === 'commercialHead' ? 'commercialHeadId' : 'functionalHeadId';
  const decisionField = role === 'commercialHead' ? 'commercialDecision' : 'functionalDecision';

  const [runtime, historic, observations] = await Promise.all([
    cmmnFetch<{ data: { id: string }[] }>(
      `/cmmn-runtime/case-instances?caseDefinitionKey=${ATR_CASE_KEY}&size=100`
    ).then((r) => r.data || []).catch(() => [] as { id: string }[]),
    cmmnFetch<{ data: any[] }>(
      `/cmmn-history/historic-case-instances?caseDefinitionKey=${ATR_CASE_KEY}&size=100&includeCaseVariables=true`
    ).then((r) => r.data || []).catch(() => [] as any[]),
    getAllAtrObservations().catch(() => [] as AtrObservationInstance[]),
  ]);

  const observationsById = new Map(observations.map((o) => [o.observationId, o]));
  const runtimeIds = new Set(runtime.map((c) => c.id));

  const runtimeCases = await Promise.all(
    runtime.map(async (c) => ({
      id: c.id,
      vars: await getAtrCaseVariables(c.id).catch(() => [] as ProcessVariable[]),
      ended: false,
    }))
  );

  const historicCases = historic
    .filter((c) => !runtimeIds.has(c.id))
    .map((c) => {
      const vars: ProcessVariable[] = (c.caseVariables || []).map((v: any) => ({
        name:  v.variableName ?? v.name ?? '',
        value: v.value,
        type:  v.variableTypeName ?? v.type ?? 'string',
        scope: 'global',
      }));
      return { id: c.id, vars, ended: true };
    });

  return [...runtimeCases, ...historicCases]
    .filter((c) => getVariableValue(c.vars, idField) === userId)
    .map((c) => {
      const observationId = getVariableValue(c.vars, 'observationId');
      const decision = getVariableValue(c.vars, decisionField);
      const obs = observationsById.get(observationId);

      const bucket: AtrExtensionCaseRecord['bucket'] =
        decision === 'REJECT'  ? 'rejected' :
        decision === 'APPROVE' ? 'approved' :
        'pending';

      return {
        id: c.id,
        observationId,
        auditeeId:              getVariableValue(c.vars, 'auditeeId') || obs?.auditeeId || '',
        observationDescription: obs?.observationDescription || '',
        targetDate:              getVariableValue(c.vars, 'targetDate'),
        requestedExtensionDate:  getVariableValue(c.vars, 'requestedExtensionDate'),
        bucket,
        ended: c.ended,
      };
    });
}

/** Completes a commercialHeadApprovalTask / functionalHeadApprovalTask,
 *  setting commercialDecision / functionalDecision per the CMMN sentries. */
export async function completeAtrCaseTask(
  taskId: string,
  variables: Record<string, string>
): Promise<void> {
  await cmmnFetch<void>(`/cmmn-runtime/tasks/${taskId}`, {
    method: 'POST',
    body: JSON.stringify({
      action: 'complete',
      variables: Object.entries(variables).map(([name, value]) => ({
        name, value, type: 'string' as const,
      })),
    }),
  });
}

/** Resolves the users configured for a given role so CreateAtrObservation
 *  can default commercialHeadId / functionalHeadId instead of the auditor
 *  having to know Flowable user ids. Reuses the existing profile/group
 *  data (getAllUsers + getAllUserProfiles / getUserGroups) rather than
 *  hardcoding anything — if nobody is configured with that role yet, the
 *  caller falls back to a manual picker. */
export async function getUsersByRole(
  role: 'commercialHead' | 'functionalHead' | 'auditee'
): Promise<FlowableUser[]> {
  const roleLabel =
    role === 'commercialHead' ? 'Commercial Head' :
    role === 'functionalHead' ? 'Functional Head' :
    'Auditee';
  const [users, profiles] = await Promise.all([getAllUsers(), getAllUserProfiles()]);
  const byProfile = users.filter((u) => profiles.get(u.id)?.role === roleLabel);
  if (byProfile.length) return byProfile;

  // Fall back to Flowable identity group membership. Group ids in this
  // Flowable instance are free-text/admin-created (e.g. "Auditee",
  // "Commercial head Group", "Functional head group" — see Users >
  // Groups in the Flowable UI), not the camelCase role key itself, so an
  // exact groups.includes(role) check never matches. Use the same
  // normalizeGroupToken() comparison loginWithFlowable()/mapRole() below
  // already rely on for this exact mismatch.
  const needle = normalizeGroupToken(role);
  const groupChecks = await Promise.allSettled(
    users.map(async (u) => ({ u, groups: await getUserGroups(u.id) }))
  );
  return groupChecks
    .filter((r): r is PromiseFulfilledResult<{ u: FlowableUser; groups: string[] }> => r.status === 'fulfilled')
    .filter((r) => r.value.groups.some((g) => normalizeGroupToken(g).includes(needle)))
    .map((r) => r.value.u);
}
// ─────────────────────────────────────────────────────────────
// PROJECT INTERFACES
// ─────────────────────────────────────────────────────────────

export interface ProjectInstance {
  id:          string;   // processInstanceId
  name:        string;
  location:    string;
  managerName: string;
  description: string;
  status:      string;
  startTime:   string;
  ended:       boolean;
}

export interface CreateProjectPayload {
  projectName:  string;
  location:     string;
  managerName:  string;
  description:  string;
  status:       string;
}

// ─────────────────────────────────────────────────────────────
// START PROJECT PROCESS
// ─────────────────────────────────────────────────────────────

export async function createProjectProcess(
  payload: CreateProjectPayload
): Promise<ProcessInstance> {
  const variables: FlowableVariable[] = [
    { name: "projectName",  value: payload.projectName,  type: "string" },
    { name: "location",     value: payload.location,     type: "string" },
    { name: "managerName",  value: payload.managerName,  type: "string" },
    { name: "description",  value: payload.description,  type: "string" },
    { name: "status",       value: payload.status,       type: "string" },
  ];

  return flowableFetch<ProcessInstance>("/runtime/process-instances", {
    method: "POST",
    body: JSON.stringify({
      processDefinitionKey: "projectManagementWorkflow",
      variables,
    }),
  });
}

// ─────────────────────────────────────────────────────────────
// GET ALL PROJECTS
// ─────────────────────────────────────────────────────────────

export async function getAllProjects(): Promise<ProjectInstance[]> {
  const data = await flowableFetch<{ data: ProcessInstance[] }>(
    "/runtime/process-instances?processDefinitionKey=projectManagementWorkflow&size=100"
  );

  const instances = data.data || [];

  const projects = await Promise.all(
    instances.map(async (inst) => {
      const vars = await getProcessVariables(inst.id);
      return {
        id:          inst.id,
        name:        getVariableValue(vars, "projectName"),
        location:    getVariableValue(vars, "location"),
        managerName: getVariableValue(vars, "managerName"),
        description: getVariableValue(vars, "description"),
        status:      getVariableValue(vars, "status") || "Active",
        startTime:   inst.startTime,
        ended:       inst.ended,
      } as ProjectInstance;
    })
  );

  return projects;
}

// ─────────────────────────────────────────────────────────────
// UPDATE PROJECT (update variables on the process instance)
// ─────────────────────────────────────────────────────────────

export async function updateProjectVariable(
  processInstanceId: string,
  name: string,
  value: string
): Promise<void> {
  await flowableFetch<void>(
    `/runtime/process-instances/${processInstanceId}/variables/${name}`,
    {
      method: "PUT",
      body: JSON.stringify({ name, value, type: "string" }),
    }
  );
}

// ─────────────────────────────────────────────────────────────
// DELETE PROJECT (cancel the process instance)
// ─────────────────────────────────────────────────────────────

export async function deleteProject(processInstanceId: string): Promise<void> {
  await flowableFetch<void>(
    `/runtime/process-instances/${processInstanceId}`,
    { method: "DELETE" }
  );
}

// ─────────────────────────────────────────────────────────────
// USER MANAGEMENT
// ─────────────────────────────────────────────────────────────

export interface FlowableUser {
  id:        string;
  firstName: string;
  lastName:  string;
  email:     string;
}

export interface CreateUserPayload {
  id:         string;
  firstName:  string;
  lastName:   string;
  email:      string;
  password:   string;
  role:       string;
  department: string;
}

// GET /identity/users
export async function getAllUsers(): Promise<FlowableUser[]> {
  const data = await flowableFetch<{ data: FlowableUser[] }>(
    '/identity/users?size=100'
  );
  return data.data || [];
}

// GET /identity/users/{id}
export async function getUserById(userId: string): Promise<FlowableUser> {
  return flowableFetch<FlowableUser>(`/identity/users/${userId}`);
}

// GET /identity/users/{id}/groups
// Used by loginWithFlowable() to populate AuthUser.groups, so that
// candidate-group tasks (e.g. approveExtensionCommercial /
// approveExtensionFunctional) actually surface for the right people in
// MyTasks.tsx instead of never appearing because groups was always [].
//
// Returns plain group-id strings (e.g. "commercialHead") so callers like
// getUsersByRole() can safely do `.includes(role)`. The Flowable endpoint
// itself returns an envelope object ({ data: [...], total, ... }), NOT a
// bare array — returning that envelope directly previously broke
// getUsersByRole's `.groups.includes(role)` check with a TypeError
// ("includes is not a function"), which silently fell through to the
// "No user with role ... found" empty state even when a match existed.
export async function getUserGroups(userId: string): Promise<string[]> {
  try {
    const data = await flowableFetch<{ data: { id: string }[] }>(
      `/identity/groups?member=${encodeURIComponent(userId)}`
    );
    return (data.data || []).map((g) => g.id);
  } catch {
    // Non-fatal — user just won't see group-visible tasks until this
    // resolves (e.g. Flowable identity groups endpoint unreachable).
    return [];
  }
}

export interface FlowableGroup {
  id:   string;
  name: string;
  type: string;
}

// GET /identity/groups
// Lists every group (Auditee, Auditor, Commercial head Group, Functional
// head group, ...) so the admin "Manage Users" screen can render the
// group list on the left without it being hardcoded in the component.
export async function getAllGroups(): Promise<FlowableGroup[]> {
  const data = await flowableFetch<{ data: FlowableGroup[] }>(
    '/identity/groups?sort=name'
  );
  return data.data || [];
}

// GET /identity/users?memberOfGroup={groupId}
// Used when a group is selected in the admin UI: fetches only the users
// that belong to that group directly from Flowable's identity API,
// rather than calling getAllUsers() and filtering in the browser (which
// silently produced wrong/empty lists whenever a user's group membership
// wasn't already known on the client, e.g. right after a group is
// created or a member is added elsewhere).
export async function getUsersInGroup(groupId: string): Promise<FlowableUser[]> {
  const data = await flowableFetch<{ data: FlowableUser[] }>(
    `/identity/users?memberOfGroup=${encodeURIComponent(groupId)}&size=100`
  );
  return data.data || [];
}

// POST /identity/groups
export async function createGroup(payload: { id: string; name: string; type: string }): Promise<FlowableGroup> {
  return flowableFetch<FlowableGroup>('/identity/groups', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// DELETE /identity/groups/{groupId}
export async function deleteGroup(groupId: string): Promise<void> {
  await flowableFetch<void>(`/identity/groups/${encodeURIComponent(groupId)}`, {
    method: 'DELETE',
  });
}

// POST /identity/groups/{groupId}/members  — add an existing user to a group
export async function addUserToGroup(groupId: string, userId: string): Promise<void> {
  await flowableFetch<void>(`/identity/groups/${encodeURIComponent(groupId)}/members`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

// DELETE /identity/groups/{groupId}/members/{userId}  — remove a user from a group
// (not the same as deleteUser — this only revokes membership in this one group)
export async function removeUserFromGroup(groupId: string, userId: string): Promise<void> {
  await flowableFetch<void>(
    `/identity/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}`,
    { method: 'DELETE' }
  );
}

// POST /identity/users
export async function createUser(
  payload: CreateUserPayload
): Promise<FlowableUser> {
  return flowableFetch<FlowableUser>('/identity/users', {
    method: 'POST',
    body: JSON.stringify({
      id:        payload.id,
      firstName: payload.firstName,
      lastName:  payload.lastName,
      email:     payload.email,
      password:  payload.password,
    }),
  });
}

// PUT /identity/users/{id}  — update profile fields
export async function updateUser(
  userId: string,
  payload: { firstName: string; lastName: string; email: string }
): Promise<FlowableUser> {
  return flowableFetch<FlowableUser>(`/identity/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({
      id:        userId,
      firstName: payload.firstName,
      lastName:  payload.lastName,
      email:     payload.email,
    }),
  });
}

// PUT /identity/users/{id}  — change password
// Flowable uses the same PUT /identity/users/{id} endpoint with a password field
export async function changeUserPassword(
  userId: string,
  newPassword: string
): Promise<void> {
  await flowableFetch<void>(`/identity/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({
      id:       userId,
      password: newPassword,
    }),
  });
}

// DELETE /identity/users/{id}
export async function deleteUser(userId: string): Promise<void> {
  await flowableFetch<void>(`/identity/users/${userId}`, {
    method: 'DELETE',
  });
}

// ─────────────────────────────────────────────────────────────
// CHECKLIST TEMPLATE MANAGEMENT
// ─────────────────────────────────────────────────────────────

export interface ChecklistTemplate {
  id:           string;
  templateName: string;
  category:     string;
  steps:        string;
  author:       string;
  createdDate:  string;
}

export interface ChecklistTemplatePayload {
  templateName: string;
  category:     string;
  steps:        string;
  author:       string;
  createdDate:  string;
}

export async function getAllTemplates(): Promise<ChecklistTemplate[]> {
  const data = await flowableFetch<{ data: ProcessInstance[] }>(
    '/runtime/process-instances?processDefinitionKey=checklistTemplateWorkflow&size=100'
  );
  const instances = data.data || [];

  const templates = await Promise.all(
    instances.map(async (inst) => {
      const vars = await getProcessVariables(inst.id);
      return {
        id:           inst.id,
        templateName: getVariableValue(vars, 'templateName'),
        category:     getVariableValue(vars, 'category'),
        steps:        getVariableValue(vars, 'steps') || '[]',
        author:       getVariableValue(vars, 'author'),
        createdDate:  getVariableValue(vars, 'createdDate'),
      } as ChecklistTemplate;
    })
  );
  return templates;
}

export async function createChecklistTemplate(
  payload: ChecklistTemplatePayload
): Promise<ProcessInstance> {
  const variables: FlowableVariable[] = [
    { name: 'templateName', value: payload.templateName, type: 'string' },
    { name: 'category',     value: payload.category,     type: 'string' },
    { name: 'steps',        value: payload.steps,        type: 'string' },
    { name: 'author',       value: payload.author,       type: 'string' },
    { name: 'createdDate',  value: payload.createdDate,  type: 'string' },
  ];

  return flowableFetch<ProcessInstance>('/runtime/process-instances', {
    method: 'POST',
    body: JSON.stringify({
      processDefinitionKey: 'checklistTemplateWorkflow',
      variables,
    }),
  });
}

export async function updateChecklistTemplate(
  processInstanceId: string,
  payload: ChecklistTemplatePayload
): Promise<void> {
  const fields = ['templateName', 'category', 'steps', 'author', 'createdDate'] as const;
  await Promise.all(
    fields.map(field =>
      flowableFetch<void>(
        `/runtime/process-instances/${processInstanceId}/variables/${field}`,
        {
          method: 'PUT',
          body: JSON.stringify({ name: field, value: payload[field], type: 'string' }),
        }
      )
    )
  );
}

export async function deleteChecklistTemplate(
  processInstanceId: string
): Promise<void> {
  await flowableFetch<void>(
    `/runtime/process-instances/${processInstanceId}`,
    { method: 'DELETE' }
  );
}

// ─────────────────────────────────────────────────────────────
// ORGANIZATION SETTINGS
// Stored as variables on a single long-running process instance
// processDefinitionKey: orgSettingsWorkflow
//
// Fields: companyName, industry, address, gstin, cin,
//         fiscalYear, timezone
//
// On first use: createOrgSettings() starts the process
// On subsequent uses: updateOrgSetting() updates individual vars
// ─────────────────────────────────────────────────────────────

export interface OrgSettings {
  processInstanceId: string;
  companyName:  string;
  industry:     string;
  address:      string;
  gstin:        string;
  cin:          string;
  fiscalYear:   string;
  timezone:     string;
}

export interface OrgSettingsPayload {
  companyName:  string;
  industry:     string;
  address:      string;
  gstin:        string;
  cin:          string;
  fiscalYear:   string;
  timezone:     string;
}

// GET the single org settings process instance (returns null if not created yet)
export async function getOrgSettings(): Promise<OrgSettings | null> {
  const data = await flowableFetch<{ data: ProcessInstance[] }>(
    '/runtime/process-instances?processDefinitionKey=orgSettingsWorkflow&size=1'
  );
  const instances = data.data || [];
  if (instances.length === 0) return null;

  const inst = instances[0];
  const vars = await getProcessVariables(inst.id);
  return {
    processInstanceId: inst.id,
    companyName:  getVariableValue(vars, 'companyName'),
    industry:     getVariableValue(vars, 'industry'),
    address:      getVariableValue(vars, 'address'),
    gstin:        getVariableValue(vars, 'gstin'),
    cin:          getVariableValue(vars, 'cin'),
    fiscalYear:   getVariableValue(vars, 'fiscalYear'),
    timezone:     getVariableValue(vars, 'timezone'),
  };
}

// CREATE org settings process for the very first time
export async function createOrgSettings(
  payload: OrgSettingsPayload
): Promise<ProcessInstance> {
  const variables: FlowableVariable[] = [
    { name: 'companyName', value: payload.companyName, type: 'string' },
    { name: 'industry',    value: payload.industry,    type: 'string' },
    { name: 'address',     value: payload.address,     type: 'string' },
    { name: 'gstin',       value: payload.gstin,       type: 'string' },
    { name: 'cin',         value: payload.cin,         type: 'string' },
    { name: 'fiscalYear',  value: payload.fiscalYear,  type: 'string' },
    { name: 'timezone',    value: payload.timezone,    type: 'string' },
  ];
  return flowableFetch<ProcessInstance>('/runtime/process-instances', {
    method: 'POST',
    body: JSON.stringify({
      processDefinitionKey: 'orgSettingsWorkflow',
      variables,
    }),
  });
}

export async function updateOrgSettings(
  processInstanceId: string,
  payload: OrgSettingsPayload
): Promise<void> {
  const fields = ['companyName', 'industry', 'address', 'gstin', 'cin', 'fiscalYear', 'timezone'] as const;
  
  for (const field of fields) {
    await flowableFetch<void>(
      `/runtime/process-instances/${processInstanceId}/variables/${field}`,
      {
        method: 'PUT',
        body: JSON.stringify({ name: field, value: payload[field], type: 'string' }),
      }
    );
  }
}

// ─────────────────────────────────────────────────────────────
// SAVE A SINGLE PROCESS VARIABLE (without completing the task)
// Called from CompleteStep.tsx to track step-by-step progress
// ─────────────────────────────────────────────────────────────
// export async function saveProcessVariable(
//   processInstanceId: string,
//   name: string,
//   value: string
// ): Promise<void> {
//   const variableBody = { name, value, type: 'string' };

//   try {
//     // Try PUT first — updates an existing variable
//     await flowableFetch<void>(
//       `/runtime/process-instances/${processInstanceId}/variables/${name}`,
//       {
//         method: 'PUT',
//         body: JSON.stringify(variableBody),
//       }
//     );
//   } catch (err) {
//     // Variable doesn't exist yet → create it via POST (expects an array)
//     if (err instanceof Error && err.message.includes('[404]')) {
//       await flowableFetch<void>(
//         `/runtime/process-instances/${processInstanceId}/variables`,
//         {
//           method: 'POST',
//           body: JSON.stringify([variableBody]),  // ← wrap in array
//         }
//       );
//     } else {
//       throw err;
//     }
//   }
// }


export async function saveProcessVariable(
  processInstanceId: string,
  name: string,
  value: string
): Promise<void> {
  const variableBody = { name, value, type: 'string' };
  try {
    await flowableFetch<void>(
      `/runtime/process-instances/${processInstanceId}/variables/${name}`,
      { method: 'PUT', body: JSON.stringify(variableBody) }
    );
  } catch (err) {
    if (err instanceof Error && err.message.includes('[404]')) {
      await flowableFetch<void>(
        `/runtime/process-instances/${processInstanceId}/variables`,
        { method: 'POST', body: JSON.stringify([variableBody]) }  // ← creates it
      );
    } else {
      throw err;
    }
  }
}
// ─────────────────────────────────────────────────────────────
// USER PREFERENCES (Notifications + Regional + Appearance)
// Stored as variables on a per-user process instance
// processDefinitionKey: userPreferencesWorkflow
//
// Fields: userId, emailNotif, pushNotif, reminderNotif,
//         language, currency, dateFormat, theme
//
// One process instance per user (keyed by userId variable)
// ─────────────────────────────────────────────────────────────

export interface UserPreferences {
  processInstanceId: string;
  userId:        string;
  emailNotif:    boolean;
  pushNotif:     boolean;
  reminderNotif: boolean;
  language:      string;
  currency:      string;
  dateFormat:    string;
  theme:         string;
}

// ─────────────────────────────────────────────────────────────
// INBOX NOTIFICATIONS
// Add this block to flowableApi.tsx, near USER PREFERENCES.
// Same pattern as userPreferencesWorkflow: one long-running process
// instance per user, this time storing a JSON array of notifications
// as a single variable. No new backend needed — Flowable IS the store.
// ─────────────────────────────────────────────────────────────

export interface InboxNotification {
  id:        string;
  kind:      string;            // 'observation-closed' | 'observation-returned' | 'auditee-assigned' | ...
  message:   string;
  observationId?: string;
  read:      boolean;
  createdAt: string;
}

/** GET all notifications for a user (newest first). Creates nothing —
 *  returns [] if the user has no notificationsWorkflow instance yet. */
async function getUserInfoKeys(userId: string): Promise<string[]> {
  try {
    const keys = await flowableFetch<{ data?: { key: string }[] } | { key: string }[]>(
      `/identity/users/${encodeURIComponent(userId)}/info`
    );
    const list = Array.isArray(keys) ? keys : keys.data || [];
    return list.map((k) => k.key);
  } catch {
    return [];
  }
}

export async function getInboxNotifications(userId: string): Promise<InboxNotification[]> {
  try {
    const keys = await getUserInfoKeys(userId);
    if (!keys.includes('notifications')) return [];
    const res = await flowableFetch<{ key: string; value: string }>(
      `/identity/users/${encodeURIComponent(userId)}/info/notifications`
    );
    const items: InboxNotification[] = res.value ? JSON.parse(res.value) : [];
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

export default async function pushInboxNotification(
  userId: string,
  entry: Omit<InboxNotification, 'id' | 'read' | 'createdAt'>
): Promise<void> {
  const existing = await getInboxNotifications(userId).catch(() => []);
  const notification: InboxNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    read: false,
    createdAt: new Date().toISOString(),
    ...entry,
  };
  const value = JSON.stringify([...existing, notification]);
  const uid = encodeURIComponent(userId);
  try {
    await flowableFetch<void>(`/identity/users/${uid}/info/notifications`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  } catch {
    await flowableFetch<void>(`/identity/users/${uid}/info`, {
      method: 'POST',
      body: JSON.stringify({ key: 'notifications', value }),
    });
  }
}

export async function markInboxNotificationRead(userId: string, notificationId: string): Promise<void> {
  const items = await getInboxNotifications(userId).catch(() => []);
  const updated = items.map((n) => (n.id === notificationId ? { ...n, read: true } : n));
  await flowableFetch<void>(`/identity/users/${encodeURIComponent(userId)}/info/notifications`, {
    method: 'PUT',
    body: JSON.stringify({ value: JSON.stringify(updated) }),
  }).catch(() => {});
}
async function sendNotification(kind: string, payload: Record<string, string>): Promise<void> {
  console.info(`[notification:${kind}]`, payload);

  const recipientId = payload.auditeeId || payload.auditorId || payload.userId;
  if (!recipientId) return;

  // existing in-app inbox notification — keep this
const messages: Record<string, string> = {
  'auditee-assigned':      `A new observation ${payload.observationId} has been assigned to you.`,
  'observation-closed':    `Observation ${payload.observationId} has been approved and closed.`,
  'observation-returned':  `Observation ${payload.observationId} was returned by the auditor for revision.`,
  'extension-approved':    `Your extension request for ${payload.observationId} was approved.`,
  'extension-rejected':    `Your extension request for ${payload.observationId} was rejected.`,
};
  await pushInboxNotification(recipientId, {
    kind, message: messages[kind] || `Update on observation ${payload.observationId}.`,
    observationId: payload.observationId,
  }).catch(() => {});

  // NEW — real email via the mail module you just merged in
  const templateMap: Record<string, string> = {
    'auditee-assigned':   'observation-assigned',
    'observation-closed': 'observation-closed',
    'extension-approved': 'generic-notification',
    'extension-rejected': 'generic-notification',
  };
  const template = templateMap[kind];
  if (!template) return;

  try {
    const user = await getUserById(recipientId);
    if (!user?.email) return;
    await fetch(`${API_BASE}/api/mail/send-template`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: user.email,
        subject: `Observation ${payload.observationId} — update`,
        template,
        context: {
          employeeName: `${user.firstName} ${user.lastName}`,
          observationId: payload.observationId,
          remarks: messages[kind],
        },
      }),
    });
  } catch (err) {
    console.error('[email] send failed:', err);
  }
}
export interface UserPreferencesPayload {
  userId:        string;
  emailNotif:    boolean;
  pushNotif:     boolean;
  reminderNotif: boolean;
  language:      string;
  currency:      string;
  dateFormat:    string;
  theme:         string;
}

// GET preferences for a specific user
// Searches all userPreferencesWorkflow instances and finds the one with matching userId variable
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  const data = await flowableFetch<{ data: ProcessInstance[] }>(
    '/runtime/process-instances?processDefinitionKey=userPreferencesWorkflow&size=100'
  );
  const instances = data.data || [];

  // Find the instance belonging to this user
  for (const inst of instances) {
    const vars = await getProcessVariables(inst.id);
    const storedUserId = getVariableValue(vars, 'userId');
    if (storedUserId === userId) {
      return {
        processInstanceId: inst.id,
        userId,
        emailNotif:    getVariableValue(vars, 'emailNotif') === 'true',
        pushNotif:     getVariableValue(vars, 'pushNotif') === 'true',
        reminderNotif: getVariableValue(vars, 'reminderNotif') === 'true',
        language:      getVariableValue(vars, 'language') || 'English (India)',
        currency:      getVariableValue(vars, 'currency') || 'INR (₹)',
        dateFormat:    getVariableValue(vars, 'dateFormat') || 'DD-MMM-YYYY',
        theme:         getVariableValue(vars, 'theme') || 'light',
      };
    }
  }
  return null;
}

// CREATE a preferences instance for a new user
export async function createUserPreferences(
  payload: UserPreferencesPayload
): Promise<ProcessInstance> {
  const variables: FlowableVariable[] = [
    { name: 'userId',        value: payload.userId,                    type: 'string' },
    { name: 'emailNotif',    value: String(payload.emailNotif),        type: 'string' },
    { name: 'pushNotif',     value: String(payload.pushNotif),         type: 'string' },
    { name: 'reminderNotif', value: String(payload.reminderNotif),     type: 'string' },
    { name: 'language',      value: payload.language,                  type: 'string' },
    { name: 'currency',      value: payload.currency,                  type: 'string' },
    { name: 'dateFormat',    value: payload.dateFormat,                type: 'string' },
    { name: 'theme',         value: payload.theme,                     type: 'string' },
  ];
  return flowableFetch<ProcessInstance>('/runtime/process-instances', {
    method: 'POST',
    body: JSON.stringify({
      processDefinitionKey: 'userPreferencesWorkflow',
      variables,
    }),
  });
}

// AFTER — runs PUTs one at a time
export async function updateUserPreferences(
  processInstanceId: string,
  payload: UserPreferencesPayload
): Promise<void> {
  const entries: Array<[string, string]> = [
    ['userId',        payload.userId],
    ['emailNotif',    String(payload.emailNotif)],
    ['pushNotif',     String(payload.pushNotif)],
    ['reminderNotif', String(payload.reminderNotif)],
    ['language',      payload.language],
    ['currency',      payload.currency],
    ['dateFormat',    payload.dateFormat],
    ['theme',         payload.theme],
  ];
  for (const [name, value] of entries) {   // ✅ sequential
    await flowableFetch<void>(
      `/runtime/process-instances/${processInstanceId}/variables/${name}`,
      {
        method: 'PUT',
        body: JSON.stringify({ name, value, type: 'string' }),
      }
    );
  }
}
// ─────────────────────────────────────────────────────────────
// SAVE PREFERENCES — convenience wrapper used by Settings.tsx
// Creates if not exists, updates if exists
// ─────────────────────────────────────────────────────────────
export async function saveUserPreferences(
  payload: UserPreferencesPayload
): Promise<void> {
  const existing = await getUserPreferences(payload.userId);
  if (existing) {
    await updateUserPreferences(existing.processInstanceId, payload);
  } else {
    await createUserPreferences(payload);
  }
}

// ─────────────────────────────────────────────────────────────
// SAVE ORG SETTINGS — convenience wrapper used by Settings.tsx
// Creates if not exists, updates if exists
// ─────────────────────────────────────────────────────────────
export async function saveOrgSettings(payload: OrgSettingsPayload): Promise<void> {
  const existing = await getOrgSettings();
  if (existing) {
    await updateOrgSettings(existing.processInstanceId, payload);
  } else {
    await createOrgSettings(payload);
  }
}
// ─────────────────────────────────────────────────────────────
// GET ALL DEPLOYED PROCESS DEFINITIONS (dynamic workflow list)
// ─────────────────────────────────────────────────────────────
export interface ProcessDefinition {
  id:      string;
  key:     string;
  name:    string;
  version: number;
}

export async function getAllProcessDefinitions(): Promise<ProcessDefinition[]> {
  const data = await flowableFetch<{ data: ProcessDefinition[] }>(
    '/repository/process-definitions?size=100&sort=name'
  );
  // Return only the latest version of each unique key
  const latest: Record<string, ProcessDefinition> = {};
  for (const def of data.data || []) {
    if (!latest[def.key] || def.version > latest[def.key].version) {
      latest[def.key] = def;
    }
  }
  return Object.values(latest);
}// ─────────────────────────────────────────────────────────────
// USER PROFILE (role, department, status, 2FA)
// Stored as a companion "info" entry on the Flowable identity user,
// under the key 'profile', because the identity endpoint itself
// has no fields for role/department/status/2FA.
// ─────────────────────────────────────────────────────────────

export interface UserProfile {
  userId:           string;
  role:             string;
  department:       string;
  status:           string;
  twoFactorEnabled: boolean;
}

export interface UserProfilePayload {
  userId:           string;
  role:             string;
  department:       string;
  status:           string;
  twoFactorEnabled: boolean;
}

/**
 * GET a single user's profile info entry.
 * Returns null if the user has no profile yet.
 *
 * We first check the key-list endpoint (`/info`, no key), which Flowable
 * returns as 200 + [] when the user has no info entries at all. Only if
 * a 'profile' key is actually listed do we fetch `/info/profile` for the
 * value. This avoids firing a 404 at `/info/profile` for every user who
 * simply hasn't been assigned a profile yet (the common case), which was
 * previously spamming the console on every getAllUserProfiles() call.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const keys = await flowableFetch<{ data?: { key: string }[] } | { key: string }[]>(
      `/identity/users/${encodeURIComponent(userId)}/info`
    );
    const list = Array.isArray(keys) ? keys : keys.data || [];
    if (!list.some((k) => k.key === 'profile')) {
      // No 'profile' info entry exists for this user — nothing to fetch.
      return null;
    }

    const res = await flowableFetch<{ key: string; value: string }>(
      `/identity/users/${encodeURIComponent(userId)}/info/profile`
    );
    const parsed = JSON.parse(res.value);
    return { userId, ...parsed } as UserProfile;
  } catch {
    // Info-list call itself failed (network/user missing) — treat as "no profile"
    return null;
  }
}

/**
 * GET profiles for ALL users in one go (used by the Users & Roles table).
 * Returns a Map keyed by userId — users with no profile entry simply
 * won't have one.
 */
export async function getAllUserProfiles(): Promise<Map<string, UserProfile>> {
  const users = await getAllUsers();
  // allSettled instead of all: one user's info lookup failing (e.g. bad
  // id, transient network error) shouldn't blank out every other profile.
  const results = await Promise.allSettled(
    users.map(async (u): Promise<[string, UserProfile] | null> => {
      const profile = await getUserProfile(u.id);
      return profile ? [u.id, profile] : null;
    })
  );
  const entries = results
    .filter((r): r is PromiseFulfilledResult<[string, UserProfile] | null> => r.status === 'fulfilled')
    .map((r) => r.value);
  return new Map(
    entries.filter((e): e is [string, UserProfile] => e !== null)
  );
}

/**
 * SAVE a user's profile. Tries PUT (update existing info key) first;
 * if the key doesn't exist yet, falls back to POST (create), same
 * fallback pattern as saveProcessVariable.
 */
export async function saveUserProfile(payload: UserProfilePayload): Promise<void> {
  const value = JSON.stringify({
    role:             payload.role,
    department:       payload.department,
    status:           payload.status,
    twoFactorEnabled: payload.twoFactorEnabled,
  });
  const userId = encodeURIComponent(payload.userId);

  try {
    await flowableFetch<void>(`/identity/users/${userId}/info/profile`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  } catch {
    // Info key doesn't exist yet on this user → create it
    await flowableFetch<void>(`/identity/users/${userId}/info`, {
      method: 'POST',
      body: JSON.stringify({ key: 'profile', value }),
    });
  }
}

/**
 * DELETE a user's profile info entry (call alongside deleteUser)
 */
export async function deleteUserProfile(userId: string): Promise<void> {
  try {
    await flowableFetch<void>(
      `/identity/users/${encodeURIComponent(userId)}/info/profile`,
      { method: 'DELETE' }
    );
  } catch {
    // Already gone / never existed — nothing to do
  }
}

// ─────────────────────────────────────────────────────────────
// GET TASK LOCAL VARIABLES
//    Called from: AuditChecklist.tsx
//    Needed to read "stepIndex" — the 0-based position Flowable
//    assigns to the current instance of the sequential multi-instance
//    checklist task (see auditManagementWorkflow.bpmn20.xml). Reading
//    this instead of matching on task name/count is what makes step
//    completion state exact, even with duplicate step names.
// ─────────────────────────────────────────────────────────────
 
export async function getTaskVariables(
  taskId: string
): Promise<ProcessVariable[]> {
  try {
    const data = await flowableFetch<ProcessVariable[] | { data: ProcessVariable[] }>(
      `/runtime/tasks/${taskId}/variables`
    );
    if (Array.isArray(data)) return data;
    return (data as any).data || [];
  } catch {
    // Task may have just been completed / process may have moved on
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// LOGIN
//    Called from: LoginPage.tsx
// ─────────────────────────────────────────────────────────────

export class FlowableLoginError extends Error {}

export interface LoginResult {
  id:         string;
  name:       string;
  email:      string;
  role:       'admin' | 'auditor' | 'auditee' | 'commercialHead' | 'functionalHead';
  department?: string;
  groups:     string[];
}

/** Re-authenticates as `userId` using the password the user typed.
 *  Throws FlowableLoginError if it's wrong. */
async function verifyPassword(userId: string, password: string): Promise<void> {
  const res = await fetch(`${FLOWABLE_BASE}/identity/users/${encodeURIComponent(userId)}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${btoa(`${userId}:${password}`)}`,
    },
  });

  if (res.status === 401 || res.status === 403) {
    throw new FlowableLoginError('Invalid email or password.');
  }
  if (!res.ok) {
    throw new FlowableLoginError('Could not reach the identity service.');
  }
}

function normalizeGroupToken(s: string): string {
  return s.toLowerCase().replace(/[^a-z]/g, '');
}

function mapRole(
  profileRole: string | undefined,
  userId: string,
  groups: string[]
): LoginResult['role'] {
  if (profileRole === 'Administrator' || userId === 'admin') return 'admin';

  const normGroups = groups.map(normalizeGroupToken);
  const inGroup = (needle: string) =>
    normGroups.some((g) => g.includes(needle));

  if (inGroup('commercialhead') || profileRole === 'Commercial Head') return 'commercialHead';
  if (inGroup('functionalhead') || profileRole === 'Functional Head') return 'functionalHead';
  if (inGroup('auditee') || profileRole === 'Auditee') return 'auditee';
  if (inGroup('auditor') || profileRole === 'Lead Auditor' || profileRole === 'Auditor') return 'auditor';

  throw new FlowableLoginError(
    'Your account is not assigned to a recognized role group in Flowable (Auditee, Auditor, Commercial head Group, or Functional head group). Contact your administrator.'
  );
}

/**
 * Authenticate against Flowable and return the details LoginPage.tsx
 * needs to call AuthContext's login(). Throws FlowableLoginError
 * (safe to show directly to the user) on bad credentials.
 */
export async function loginWithFlowable(email: string, password: string): Promise<LoginResult> {
  const users = await getAllUsers();
  const match = users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase()
  );

  if (!match) {
    throw new FlowableLoginError('Invalid email or password.');
  }

  await verifyPassword(match.id, password);

  const [profile, groups] = await Promise.all([
    getUserProfile(match.id),
    getUserGroups(match.id),
  ]);

  const role = mapRole(profile?.role, match.id, groups);

  if (role === 'admin' && profile?.role !== 'Administrator') {
    try {
      await saveUserProfile({
        userId:           match.id,
        role:             'Administrator',
        department:       profile?.department || '',
        status:           profile?.status || 'Active',
        twoFactorEnabled: profile?.twoFactorEnabled || false,
      });
    } catch {
      // Non-fatal — they'll still get admin access this session via the
      // bootstrap fallback above even if the write didn't stick.
    }
  }

  return {
    id:         match.id,
    name:       `${match.firstName} ${match.lastName}`.trim(),
    email:      match.email,
    role,
    department: profile?.department,
    groups,
  };
}

// ═════════════════════════════════════════════════════════════
// ATR WORKFLOW AUTOMATION
// ═════════════════════════════════════════════════════════════

export async function completeAuditeeNotificationJob(
  _processInstanceId: string,
  observationId: string,
  auditeeId: string
): Promise<boolean> {
  await sendNotification('auditee-assigned', { observationId, auditeeId });
  return true;
}

export async function completeClosureNotificationJob(
  _processInstanceId: string,
  observationId: string,
  auditeeId: string
): Promise<boolean> {
  await sendNotification('observation-closed', { observationId, auditeeId });
  return true;
}

export interface AtrExtensionCaseStartPayload {
  observationId:           string;
  auditeeId:                string;
  commercialHeadId:         string;
  functionalHeadId:         string;
  targetDate:               string;
  requestedExtensionDate:   string;
}

export async function startAtrExtensionCase(
  payload: AtrExtensionCaseStartPayload
): Promise<{ id: string }> {
  const variables: FlowableVariable[] = Object.entries(payload)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([name, value]) => ({ name, value: value as string, type: 'string' as const }));

  variables.push(
    { name: 'commercialDecision', value: null as unknown as string, type: 'string' },
    { name: 'functionalDecision', value: null as unknown as string, type: 'string' },
  );

  return cmmnFetch<{ id: string }>('/cmmn-runtime/case-instances', {
    method: 'POST',
    body: JSON.stringify({
      caseDefinitionKey: 'ATR_EXTENSION_APPROVAL',
      businessKey: payload.observationId,
      variables,
    }),
  });
}

async function findExecutionByActivity(
  processInstanceId: string,
  activityId: string
): Promise<string | null> {
  const res = await flowableFetch<{ data: { id: string }[] }>(
    `/runtime/executions?processInstanceId=${processInstanceId}&activityId=${activityId}`
  );
  return res.data?.[0]?.id ?? null;
}

async function findAtrProcessInstanceIdByObservationId(observationId: string): Promise<string | null> {
  const res = await flowableFetch<{ data: { id: string }[] }>(
    `/runtime/process-instances?processDefinitionKey=${ATR_PROCESS_KEY}&businessKey=${encodeURIComponent(observationId)}`
  );
  return res.data?.[0]?.id ?? null;
}

export async function signalExtensionCompleted(
  observationId: string,
  approved: boolean
): Promise<void> {
  const processInstanceId = await findAtrProcessInstanceIdByObservationId(observationId);
  if (!processInstanceId) {
    throw new Error(
      `signalExtensionCompleted: no running ATR_OBSERVATION_LIFECYCLE instance found for observation ${observationId}`
    );
  }
  const executionId = await findExecutionByActivity(processInstanceId, 'waitForExtensionResult');
  if (!executionId) {
    throw new Error(
      `signalExtensionCompleted: process ${processInstanceId} isn't currently waiting at waitForExtensionResult`
    );
  }
  await flowableFetch<void>(`/runtime/executions/${executionId}/signal`, {
    method: 'POST',
    body: JSON.stringify({
      signalName: 'EXTENSION_COMPLETED',
      variables: [{ name: 'extensionApproved', value: approved, type: 'boolean' as const }],
    }),
  });
}

export async function unblockAtrObservation(observationId: string): Promise<void> {
  const processInstanceId = await findAtrProcessInstanceIdByObservationId(observationId);
  if (!processInstanceId) {
    throw new Error(`unblockAtrObservation: no running instance found for observation ${observationId}`);
  }
  const executionId = await findExecutionByActivity(processInstanceId, 'waitUntilUnblocked');
  if (!executionId) {
    throw new Error(`unblockAtrObservation: process ${processInstanceId} isn't currently waiting at waitUntilUnblocked`);
  }
  await flowableFetch<void>(`/runtime/executions/${executionId}/trigger`, { method: 'POST' });
}

const ATR_CASE_AUTOMATION_HANDLERS: Record<
  string,
  (caseInstanceId: string, observationId: string) => Promise<Record<string, string> | void>
> = {
  updateTargetDateTask: async (caseInstanceId) => {
    const vars = await cmmnFetch<{ data: FlowableVariable[] } | FlowableVariable[]>(
      `/cmmn-runtime/case-instances/${caseInstanceId}/variables`
    );
    const list = Array.isArray(vars) ? vars : vars.data || [];
    const requestedExtensionDate = String(
      list.find((v) => v.name === 'requestedExtensionDate')?.value ?? ''
    );
    return { targetDate: requestedExtensionDate };
  },
  sendNotificationsTask: async (_caseInstanceId, observationId) => {
    await sendNotification('extension-approved', { observationId });
  },
  signalBpmnApprovedTask: async (_caseInstanceId, observationId) => {
    await signalExtensionCompleted(observationId, true);
  },
  signalBpmnRejectedTask: async (_caseInstanceId, observationId) => {
    await signalExtensionCompleted(observationId, false);
  },
};

export async function advanceExtensionCase(
  caseInstanceId: string,
  observationId: string
): Promise<void> {
  for (let i = 0; i < 10; i++) {
    const res = await cmmnFetch<{ data: FlowableTask[] }>(
      `/cmmn-runtime/tasks?caseInstanceId=${caseInstanceId}&size=100`
    );
    const tasks = res.data || [];
    const nextTask = tasks.find((t) => ATR_CASE_AUTOMATION_HANDLERS[t.taskDefinitionKey]);
    if (!nextTask) return; // blocked on a human decision, or case has exited

    const handler = ATR_CASE_AUTOMATION_HANDLERS[nextTask.taskDefinitionKey];
    const resultVars = (await handler(caseInstanceId, observationId)) || {};
    await completeAtrCaseTask(nextTask.id, resultVars);
  }
}

// ─────────────────────────────────────────────────────────────
// CHECKLIST ITEMS (auditor-authored sub-observations)
// ─────────────────────────────────────────────────────────────

export interface ChecklistItem {
  id:   string;
  text: string;
  done: boolean;
}

export function parseChecklistItems(vars: ProcessVariable[]): ChecklistItem[] {
  const raw = getVariableValue(vars, 'checklistItems');
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveChecklistItems(
  processInstanceId: string,
  items: ChecklistItem[]
): Promise<void> {
  await saveProcessVariable(processInstanceId, 'checklistItems', JSON.stringify(items));
}

// ─────────────────────────────────────────────────────────────
// ATTACHMENT VISIBILITY
// ─────────────────────────────────────────────────────────────

export function filterAttachmentsForViewer(
  attachments: FlowableAttachment[],
  viewerRole: string
): FlowableAttachment[] {
  if (viewerRole === 'admin') return attachments;
  if (viewerRole === 'auditee') return attachments; // creation + their own evidence
  // auditor / commercialHead / functionalHead — evidence only
  return attachments.filter((a) => a.type !== 'creation');
}

async function uploadOneAttachmentTyped(
  taskId: string,
  file: File,
  uploadedBy: string,
  kind: 'creation' | 'evidence'
): Promise<FlowableAttachment> {
  const form = new FormData();
  form.append('name', file.name);
  form.append('type', kind);
  form.append('description', uploadedBy);
  form.append('file', file);

  const res = await fetch(`${FLOWABLE_BASE}/runtime/tasks/${taskId}/attachments`, {
    method: 'POST',
    headers: { Authorization: HEADERS.Authorization },
    body: form,
  });

  if (!res.ok) {
    throw new Error(`Flowable API error [${res.status}]: ${await res.text()}`);
  }
  return res.json();
}

export async function uploadAttachmentsTyped(
  taskId: string,
  files: File[],
  uploadedBy: string,
  kind: 'creation' | 'evidence'
): Promise<FlowableAttachment[]> {
  const results: FlowableAttachment[] = [];
  for (const file of files) {
    results.push(await uploadOneAttachmentTyped(taskId, file, uploadedBy, kind));
  }
  return results;
}

export async function uploadCreationAttachments(
  processInstanceId: string,
  files: File[],
  uploadedBy: string
): Promise<FlowableAttachment[]> {
  if (!files.length) return [];
  const tasks = await getTasksByProcessInstance(processInstanceId);
  const firstTask = tasks.find((t) => t.taskDefinitionKey === 'auditeeSubmitAction');
  if (!firstTask) {
    throw new Error(
      'uploadCreationAttachments: could not find the auditeeSubmitAction task on the newly started process — creation files were not uploaded.'
    );
  }
  return uploadAttachmentsTyped(firstTask.id, files, uploadedBy, 'creation');
}


// ─────────────────────────────────────────────────────────────
// OBSERVATION LIFECYCLE HISTORY
// ─────────────────────────────────────────────────────────────

export interface ObservationHistoryEvent {
  id: string;
  taskDefinitionKey: string;
  label: string;              // human label, e.g. "Submitted for review"
  actor: string | null;       // assignee who completed the step
  timestamp: string;          // endTime of the historic task
  outcome?: string;           // action / reviewDecision / commercialDecision / functionalDecision
  comment?: string;           // correctiveActionDetails / reviewComments / extensionReason / decision comment
  category: 'submit' | 'review' | 'extension' | 'system';
}

/** Reads the historic-detail audit trail (type=VariableUpdate) for one
 *  finished task.
 *
 *  PRIMARY: query by taskId. This works when Flowable stamps TASK_ID_ on
 *  the ACT_HI_DETAIL rows created by completeTask(taskId, { action, ... }).
 *
 *  FALLBACK: on some Flowable deployments, variables set via
 *  completeTask()'s payload are recorded as process/case-scoped variable
 *  updates rather than task-scoped ones — the historic-detail rows never
 *  get TASK_ID_ stamped, so the taskId-scoped query legitimately returns
 *  nothing even though the data exists. When that happens (and a
 *  `correlate` context was passed in), fall back to querying variable
 *  updates for the whole process/case instance and keep only the ones
 *  whose timestamp lands within a few seconds of this task's endTime —
 *  completeTask() writes its variables at the moment the task finishes,
 *  so this window reliably isolates just this task's own update without
 *  picking up updates from a different task instance earlier/later in
 *  the same process. */
async function getHistoricDetailForTask(
  taskId: string,
  cmmn: boolean,
  correlate?: { instanceId: string; endTime: string }
): Promise<Record<string, string>> {
  // Primary: task-scoped lookup
  try {
    const data = cmmn
      ? await cmmnFetch<{ data: any[] } | any[]>(`/cmmn-history/historic-detail?taskId=${taskId}&size=100`)
      : await flowableFetch<{ data: any[] } | any[]>(`/history/historic-detail?taskId=${taskId}&size=100`);
    const list = Array.isArray(data) ? data : (data as any).data || [];
    const out: Record<string, string> = {};
    for (const d of list) {
      if (d.variableName) out[d.variableName] = String(d.value ?? '');
    }
    if (Object.keys(out).length > 0) return out;
  } catch {
    // fall through to the correlate-based fallback below
  }

  // Fallback: some deployments don't stamp taskId on task-completion
  // variable updates (they're process/case-scoped, not task-local).
  // Correlate by matching update timestamps to this task's endTime.
  if (!correlate) return {};
  try {
    const data = cmmn
      ? await cmmnFetch<{ data: any[] } | any[]>(
          `/cmmn-history/historic-detail?caseInstanceId=${correlate.instanceId}&size=200`
        )
      : await flowableFetch<{ data: any[] } | any[]>(
          `/history/historic-detail?processInstanceId=${correlate.instanceId}&size=200`
        );
    const list = Array.isArray(data) ? data : (data as any).data || [];
    const endMs = new Date(correlate.endTime).getTime();
    const out: Record<string, string> = {};
    for (const d of list) {
      if (!d.variableName || !d.time) continue;
      const t = new Date(d.time).getTime();
      // completeTask's variables are written right at task completion —
      // keep updates within a few seconds of this task's endTime.
      if (t <= endMs + 2000 && t >= endMs - 5000) out[d.variableName] = String(d.value ?? '');
    }
    return out;
  } catch {
    return {};
  }
}

async function findAtrProcessInstanceIdAnyState(observationId: string): Promise<string | null> {
  const runtime = await flowableFetch<{ data: { id: string }[] }>(
    `/runtime/process-instances?processDefinitionKey=${ATR_PROCESS_KEY}&businessKey=${encodeURIComponent(observationId)}`
  ).then((r) => r.data || []).catch(() => [] as { id: string }[]);
  if (runtime[0]) return runtime[0].id;

  const historic = await flowableFetch<{ data: { id: string }[] }>(
    `/history/historic-process-instances?processDefinitionKey=${ATR_PROCESS_KEY}&businessKey=${encodeURIComponent(observationId)}&size=1`
  ).then((r) => r.data || []).catch(() => [] as { id: string }[]);
  return historic[0]?.id ?? null;
}

/** Builds the full chronological event list for one observation, given
 *  only its observationId (the businessKey shared by the BPMN process
 *  and every extension-approval case it ever spawned). Safe to call for
 *  either a BPMN or CMMN task view — observationId is a variable on
 *  both. Never throws: any sub-fetch failing just means fewer events,
 *  not a broken History tab. */
export async function getAtrObservationHistoryEvents(
  observationId: string
): Promise<ObservationHistoryEvent[]> {
  if (!observationId) return [];
  const events: ObservationHistoryEvent[] = [];

  // ── BPMN side ──
  const processInstanceId = await findAtrProcessInstanceIdAnyState(observationId).catch(() => null);
  if (processInstanceId) {
    try {
      const bpmnTasks = await flowableFetch<{ data: any[] }>(
        `/history/historic-task-instances?processInstanceId=${processInstanceId}&finished=true&size=100&sort=endTime`
      );
      for (const t of bpmnTasks.data || []) {
        const details = await getHistoricDetailForTask(t.id, false, {
          instanceId: processInstanceId,
          endTime: t.endTime,
        });

        if (t.taskDefinitionKey === 'auditeeSubmitAction') {
          const action = details.action || '';
          events.push({
            id: t.id,
            taskDefinitionKey: t.taskDefinitionKey,
            label:
              action === 'SUBMIT' ? 'Submitted for review' :
              action === 'EXTENSION' ? 'Requested extension' :
              action === 'CANCEL' ? 'Cancelled observation' :
              'Auditee action',
            actor: t.assignee,
            timestamp: t.endTime,
            outcome: action || undefined,
            comment: details.correctiveActionDetails || details.extensionReason || undefined,
            category: action === 'EXTENSION' ? 'extension' : 'submit',
          });
        } else if (t.taskDefinitionKey === 'auditorReviewEvidence') {
          const decision = details.reviewDecision || '';
          events.push({
            id: t.id,
            taskDefinitionKey: t.taskDefinitionKey,
            label:
              decision === 'APPROVE' ? 'Approved & closed' :
              decision === 'REJECT' ? 'Returned to auditee' :
              decision === 'INVALID' ? 'Marked invalid' :
              decision === 'BLOCKED' ? 'Marked blocked' :
              'Auditor review',
            actor: t.assignee,
            timestamp: t.endTime,
            outcome: decision || undefined,
            comment: details.reviewComments || undefined,
            category: 'review',
          });
        }
      }
    } catch {
      // history endpoint unreachable — fall through, still try CMMN events
    }
  }

  // ── CMMN side — every extension case ever started for this
  //    observation (there can be more than one across repeat cycles) ──
  try {
    const cases = await cmmnFetch<{ data: any[] }>(
      `/cmmn-history/historic-case-instances?caseDefinitionKey=${ATR_CASE_KEY}&businessKey=${encodeURIComponent(observationId)}&size=100`
    );
    for (const c of cases.data || []) {
      const caseTasks = await cmmnFetch<{ data: any[] }>(
        `/cmmn-history/historic-task-instances?caseInstanceId=${c.id}&finished=true&size=100&sort=endTime`
      ).catch(() => ({ data: [] as any[] }));

      for (const t of caseTasks.data || []) {
        const details = await getHistoricDetailForTask(t.id, true, {
          instanceId: c.id,
          endTime: t.endTime,
        });

        if (t.taskDefinitionKey === 'commercialHeadApprovalTask') {
          const decision = details.commercialDecision || '';
          events.push({
            id: t.id,
            taskDefinitionKey: t.taskDefinitionKey,
            label:
              decision === 'APPROVE' ? 'Commercial Head approved extension' :
              decision === 'REJECT' ? 'Commercial Head rejected extension' :
              'Commercial Head decision',
            actor: t.assignee,
            timestamp: t.endTime,
            outcome: decision || undefined,
            comment: details.commercialComment || undefined,
            category: 'extension',
          });
        } else if (t.taskDefinitionKey === 'functionalHeadApprovalTask') {
          const decision = details.functionalDecision || '';
          events.push({
            id: t.id,
            taskDefinitionKey: t.taskDefinitionKey,
            label:
              decision === 'APPROVE' ? 'Functional Head approved extension' :
              decision === 'REJECT' ? 'Functional Head rejected extension' :
              'Functional Head decision',
            actor: t.assignee,
            timestamp: t.endTime,
            outcome: decision || undefined,
            comment: details.functionalComment || undefined,
            category: 'extension',
          });
        }
      }
    }
  } catch {
    // no extension ever requested, or CMMN history unreachable — fine
  }

  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export interface ObservationHistorySummary {
  submittedCount: number;
  returnedCount: number;
  extensionRequestedCount: number;
  extensionApprovedCount: number;
  extensionRejectedCount: number;
  isClosed: boolean;
}

/** Quick counts for the summary chips above the timeline — "Returned
 *  3×" is the number the user actually asked to see at a glance. */
export function summarizeObservationHistory(
  events: ObservationHistoryEvent[]
): ObservationHistorySummary {
  const isHeadTask = (k: string) =>
    k === 'commercialHeadApprovalTask' || k === 'functionalHeadApprovalTask';

  return {
    submittedCount: events.filter(
      (e) => e.taskDefinitionKey === 'auditeeSubmitAction' && e.outcome === 'SUBMIT'
    ).length,
    returnedCount: events.filter(
      (e) => e.taskDefinitionKey === 'auditorReviewEvidence' && e.outcome === 'REJECT'
    ).length,
    extensionRequestedCount: events.filter((e) => e.outcome === 'EXTENSION').length,
    extensionApprovedCount: events.filter((e) => isHeadTask(e.taskDefinitionKey) && e.outcome === 'APPROVE').length,
    extensionRejectedCount: events.filter((e) => isHeadTask(e.taskDefinitionKey) && e.outcome === 'REJECT').length,
    isClosed: events.some(
      (e) => e.taskDefinitionKey === 'auditorReviewEvidence' && e.outcome === 'APPROVE'
    ),
  };
}


async function getAllTaskIdsForProcessInstance(processInstanceId: string): Promise<string[]> {
  const [active, historic] = await Promise.all([
    flowableFetch<{ data: { id: string }[] }>(
      `/runtime/tasks?processInstanceId=${processInstanceId}&size=100`
    ).then((r) => r.data || []).catch(() => [] as { id: string }[]),
    flowableFetch<{ data: { id: string }[] }>(
      `/history/historic-task-instances?processInstanceId=${processInstanceId}&size=100`
    ).then((r) => r.data || []).catch(() => [] as { id: string }[]),
  ]);
  const ids = new Set<string>();
  [...active, ...historic].forEach((t) => ids.add(t.id));
  return [...ids];
}

export async function getProcessInstanceAttachments(
  processInstanceId: string
): Promise<FlowableAttachment[]> {
  const taskIds = await getAllTaskIdsForProcessInstance(processInstanceId);
  const results = await Promise.allSettled(
    taskIds.map((taskId) =>
      flowableFetch<FlowableAttachment[]>(`/runtime/tasks/${taskId}/attachments`).then(
        (attachments) =>
          // Flowable's attachment REST response has no taskId field (only
          // taskUrl) — stamp it here from the fetch we already know it
          // came from, instead of trusting a.taskId, which is always
          // null/undefined and silently produces /tasks//attachments/...
          // (double-slash → 500) if used directly for download.
          (attachments || []).map((a) => ({ ...a, taskId }))
      )
    )
  );
  const seen = new Set<string>();
  const out: FlowableAttachment[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') {
      for (const a of r.value) {
        if (!seen.has(a.id)) {
          seen.add(a.id);
          out.push(a);
        }
      }
    }
  }
  return out;
}

/** Attachment content is task-scoped too — needs the owning taskId, not the processInstanceId. */
export async function downloadAttachment(
  taskId: string,
  attachmentId: string,
  fileName: string
): Promise<void> {
  const res = await fetch(
    `${FLOWABLE_BASE}/runtime/tasks/${taskId}/attachments/${attachmentId}/content`,
    { headers: { Authorization: HEADERS.Authorization } }
  );
  if (!res.ok) throw new Error(`Failed to download attachment [${res.status}]`);

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}