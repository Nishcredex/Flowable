// ============================================================
//  MyTasks.tsx
//  Updated with Flowable integration + Jira-style multi-status
//
//  CHANGE IN THIS VERSION: observation/ATR tasks (auditeeSubmitAction,
//  auditorReviewEvidence, commercialHeadApprovalTask,
//  functionalHeadApprovalTask) never write the generic `taskStatus`
//  process variable — only the manual Jira-style status dropdown does.
//  So enrichTask() was always defaulting these rows to 'Open', no
//  matter what the workflow's real `status` variable said (RETURNED,
//  CLOSED, PENDING_EXTENSION_APPROVAL, etc). Fix: for observation rows,
//  read the `status` process variable directly and render it as a
//  read-only badge (via the same STATUS_LABELS/statusBadgeClass used on
//  the task detail page) instead of the editable Jira-style dropdown —
//  ATR status is workflow-driven, not something you hand-set here.
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../pages/AuthContext';
import {
  SearchIcon,
  FilterIcon,
  ClipboardListIcon,
  ListIcon,
  FileTextIcon,
  CalendarIcon,
  UserIcon,
  BuildingIcon,
  DownloadIcon,
  ChevronDownIcon,
  MessageSquareIcon,
  Loader2Icon,
  AlertCircleIcon,
  RefreshCwIcon,
  CheckCircle2Icon,
  CircleIcon,
  PlayCircleIcon,
  PauseCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  BanIcon,
} from 'lucide-react';
import {
  getTasksByAssignee,
  getTasksByCandidateGroups,
  getProcessVariables,
  completeTask,
  saveProcessVariable,
  FlowableTask,
  ProcessVariable,
  getVariableValue,
  isObservationTask,
  isAtrTask,
  getAtrCaseTasksByAssignee,
} from './services/flowableApi';
import { STATUS_LABELS, statusBadgeClass as atrStatusBadgeClass } from '../constants/auditStatus';

// ─────────────────────────────────────────────────────────────
// STATUS DEFINITIONS — Jira-style (used for NON-observation tasks only)
// ─────────────────────────────────────────────────────────────

type TaskStatus =
  | 'Open'
  | 'In Progress'
  | 'Blocked'
  | 'On Hold'
  | 'Invalid'
  | 'Needs Review'
  | 'Completed';

interface StatusConfig {
  label:      TaskStatus;
  color:      string;   // badge bg + text
  dotColor:   string;   // dot color
  icon:       React.ReactNode;
  menuClass:  string;   // hover bg in dropdown
}

const STATUS_CONFIG: StatusConfig[] = [
  {
    label:     'Open',
    color:     'bg-orange-100 text-orange-700',
    dotColor:  'bg-orange-500',
    icon:      <CircleIcon className="w-3.5 h-3.5" />,
    menuClass: 'hover:bg-orange-50 text-orange-700',
  },
  {
    label:     'In Progress',
    color:     'bg-blue-100 text-blue-700',
    dotColor:  'bg-blue-500',
    icon:      <PlayCircleIcon className="w-3.5 h-3.5" />,
    menuClass: 'hover:bg-blue-50 text-blue-700',
  },
  {
    label:     'Needs Review',
    color:     'bg-purple-100 text-purple-700',
    dotColor:  'bg-purple-500',
    icon:      <AlertCircleIcon className="w-3.5 h-3.5" />,
    menuClass: 'hover:bg-purple-50 text-purple-700',
  },
  {
    label:     'On Hold',
    color:     'bg-yellow-100 text-yellow-700',
    dotColor:  'bg-yellow-500',
    icon:      <PauseCircleIcon className="w-3.5 h-3.5" />,
    menuClass: 'hover:bg-yellow-50 text-yellow-700',
  },
  {
    label:     'Blocked',
    color:     'bg-red-100 text-red-700',
    dotColor:  'bg-red-500',
    icon:      <BanIcon className="w-3.5 h-3.5" />,
    menuClass: 'hover:bg-red-50 text-red-700',
  },
  {
    label:     'Invalid',
    color:     'bg-gray-100 text-gray-500',
    dotColor:  'bg-gray-400',
    icon:      <XCircleIcon className="w-3.5 h-3.5" />,
    menuClass: 'hover:bg-gray-100 text-gray-600',
  },
  {
    label:     'Completed',
    color:     'bg-green-100 text-green-700',
    dotColor:  'bg-green-500',
    icon:      <CheckCircle2Icon className="w-3.5 h-3.5" />,
    menuClass: 'hover:bg-green-50 text-green-700',
  },
];

function getStatusConfig(status: string): StatusConfig {
  return STATUS_CONFIG.find((s) => s.label === status) ?? STATUS_CONFIG[0];
}

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface EnrichedTask {
  task:         FlowableTask;
  auditName:    string;
  projectName:  string;
  stepName:     string;
  evidenceFile: string;
  comments:     string;
  priority:     string;
  daysLeft:     string;
  status:       TaskStatus;
  isObservation: boolean;
  isGroupTask:  boolean;
  /** Raw ATR workflow status (e.g. IN_PROGRESS, RETURNED, CLOSED,
   *  PENDING_EXTENSION_APPROVAL) — only set when isObservation is true.
   *  This is what actually drives the status badge for observation rows,
   *  NOT the generic `status` field above (which observation workflows
   *  never write to). */
  atrStatus?:      string;
  atrStatusLabel?: string;
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return iso; }
}

function getDaysLeft(iso: string | null): string {
  if (!iso) return '';
  const diff = Math.ceil(
    (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (diff < 0)   return `${Math.abs(diff)} day${Math.abs(diff) !== 1 ? 's' : ''} overdue`;
  if (diff === 0) return 'Due today';
  return `${diff} day${diff !== 1 ? 's' : ''} left`;
}

function dueDateColor(iso: string | null): string {
  if (!iso) return 'text-gray-600';
  const diff = Math.ceil(
    (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (diff < 0)  return 'text-red-600 font-medium';
  if (diff <= 2) return 'text-red-600 font-medium';
  if (diff <= 5) return 'text-amber-600 font-medium';
  return 'text-gray-900 font-medium';
}

function priorityFromNumber(p: number): string {
  if (p >= 75) return 'High';
  if (p >= 50) return 'Medium';
  return 'Low';
}

function priorityBadgeClass(priority: string): string {
  if (priority === 'High')   return 'bg-red-100 text-red-700';
  if (priority === 'Medium') return 'bg-amber-100 text-amber-700';
  return 'bg-green-100 text-green-700';
}

// Enrich a single Flowable task with process variables
async function enrichTask(task: FlowableTask, opts?: { isGroupTask?: boolean }): Promise<EnrichedTask> {
  let vars: ProcessVariable[] = [];
  try {
    vars = await getProcessVariables(task.processInstanceId);
  } catch { /* skip if unavailable */ }

  const priorityVar = getVariableValue(vars, 'priority');

  const effectiveDueDate =
    task.dueDate || getVariableValue(vars, 'dueDate') || getVariableValue(vars, 'targetDate') || null;

  const savedStatus = getVariableValue(vars, 'taskStatus') as TaskStatus | null;

  const observation = isObservationTask(task) || isAtrTask(task);

  const auditName = observation
    ? `Observation ${getVariableValue(vars, 'observationId') || ''}`.trim()
    : getVariableValue(vars, 'auditName') || task.processDefinitionId || 'Audit';

  const stepName = observation
    ? getVariableValue(vars, 'observationDescription') || task.name || '—'
    : getVariableValue(vars, 'stepName') || task.name || '—';

  // ATR/observation workflows track their own business status in the
  // `status` process variable (set by CreateAtrObservation / the
  // auditee-action and auditor-review endpoints). Read it directly
  // rather than relying on the Jira-style `taskStatus` variable, which
  // these workflows never write.
  const atrStatus = observation ? getVariableValue(vars, 'status') : undefined;
  const atrStatusLabel = atrStatus ? STATUS_LABELS[atrStatus] || atrStatus : undefined;

  return {
    task: { ...task, dueDate: effectiveDueDate },
    auditName,
    projectName:  getVariableValue(vars, 'projectName')  || '—',
    stepName,
    evidenceFile: getVariableValue(vars, 'evidenceFile') || '',
    comments:     getVariableValue(vars, 'comments')     || '',
    priority:     priorityVar || priorityFromNumber(task.priority || 0),
    daysLeft:     getDaysLeft(effectiveDueDate),
    status:       savedStatus || 'Open',
    isObservation: observation,
    isGroupTask:  opts?.isGroupTask ?? false,
    atrStatus,
    atrStatusLabel,
  };
}

// ─────────────────────────────────────────────────────────────
// STATUS BADGE — standalone pill used in the card header
// ─────────────────────────────────────────────────────────────

function statusBadgeClass(status: TaskStatus): string {
  switch (status) {
    case 'Open':         return 'badge-warn';
    case 'In Progress':  return 'badge-primary';
    case 'Needs Review': return 'badge-info';
    case 'On Hold':      return 'badge-warn';
    case 'Blocked':      return 'badge-danger';
    case 'Invalid':      return 'badge-neutral';
    case 'Completed':    return 'badge-success';
    default:              return 'badge-neutral';
  }
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const cfg = getStatusConfig(status);
  return (
    <span className={`badge ${statusBadgeClass(status)}`}>
      <span className={`${cfg.dotColor}`} style={{ width: 6, height: 6, borderRadius: '50%', display: 'inline-block' }} />
      {status}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// STATUS DROPDOWN — click the status pill to change it
// (only used for non-observation tasks — see ObservationStatusBadge
// below for observation/ATR rows, which are read-only here)
// ─────────────────────────────────────────────────────────────

interface StatusDropdownProps {
  current:   TaskStatus;
  onChange:  (s: TaskStatus) => void;
  loading:   boolean;
}

function StatusDropdown({ current, onChange, loading }: StatusDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className="row gap-8"
        style={{
          border: '1px solid var(--border-strong)',
          borderRadius: 6,
          padding: '4px 8px',
          background: '#fff',
          cursor: loading ? 'default' : 'pointer',
        }}
      >
        {loading
          ? <Loader2Icon className="animate-spin" style={{ width: 14, height: 14, color: 'var(--text-soft)' }} />
          : <StatusBadge status={current} />
        }
        <ChevronDownIcon style={{ width: 12, height: 12, color: 'var(--text-soft)' }} />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute', right: 0, top: '100%', marginTop: 4, width: 200,
            background: '#fff', border: '1px solid var(--border)', borderRadius: 8,
            boxShadow: 'var(--shadow)', zIndex: 30, padding: '4px 0',
          }}
        >
          <p className="small text-soft" style={{ padding: '6px 12px 4px' }}>Change status</p>
          {STATUS_CONFIG.map((s) => (
            <button
              key={s.label}
              onClick={() => { onChange(s.label); setOpen(false); }}
              disabled={current === s.label}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', fontSize: 13, textAlign: 'left', background: 'none', border: 'none',
                opacity: current === s.label ? 0.45 : 1,
                cursor: current === s.label ? 'default' : 'pointer',
              }}
              className="hover:bg-gray-50"
            >
              {s.icon}
              {s.label}
              {current === s.label && <span className="small text-soft" style={{ marginLeft: 'auto' }}>current</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Read-only status pill for observation/ATR rows — status here is
// workflow-driven (moves when someone submits/reviews/approves the
// task), so it isn't editable from the inbox the way the generic
// Jira-style status is.
function ObservationStatusBadge({ enriched }: { enriched: EnrichedTask }) {
  return (
    <span
      className={`badge ${atrStatusBadgeClass(enriched.atrStatus || '')}`}
      title="Set by the workflow — open the task to change it"
    >
      {enriched.atrStatusLabel || 'Open'}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// TASK ROW — one action per row in the inbox table
// ─────────────────────────────────────────────────────────────

interface TaskRowProps {
  enriched:         EnrichedTask;
  onViewTask:       (t: EnrichedTask) => void;
  onCompleteTask:   (t: EnrichedTask) => void;
  onStatusChange:   (t: EnrichedTask, s: TaskStatus) => void;
  completing:       boolean;
  statusUpdating:   boolean;
}

function TaskRow({
  enriched,
  onViewTask,
  onCompleteTask,
  onStatusChange,
  completing,
  statusUpdating,
}: TaskRowProps) {
  const { task, auditName, projectName, stepName, evidenceFile, comments, priority, daysLeft, status } = enriched;

  const priorityClass =
    priority === 'High' ? 'priority-high' : priority === 'Medium' ? 'priority-med' : 'priority-low';

  return (
    <tr onClick={() => onViewTask(enriched)}>
      <td>
        <span className="checkbox" onClick={(e) => e.stopPropagation()}></span>
      </td>
      <td>
        <div className="fw-600" style={{ color: 'var(--primary)' }}>
          {task.name}
          {enriched.isObservation && (
            <span
              className="badge badge-info"
              style={{ marginLeft: 8, fontSize: 10, verticalAlign: 'middle' }}
              title="Part of the audit observation & corrective action workflow"
            >
              Observation
            </span>
          )}
          {enriched.isGroupTask && (
            <span
              className="badge badge-warn"
              style={{ marginLeft: 8, fontSize: 10, verticalAlign: 'middle' }}
              title="Visible to your group — opening it will claim it for you"
            >
              Unclaimed
            </span>
          )}
        </div>
        <div className="small text-soft font-mono">{task.id.slice(0, 10)}…</div>
      </td>
      <td>
        <div>{stepName}</div>
        {comments && (
          <div className="small text-soft" style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {comments}
          </div>
        )}
      </td>
      <td>{auditName}</td>
      <td className={priorityClass}>{priority}</td>
      <td onClick={(e) => e.stopPropagation()}>
        {enriched.isObservation ? (
          <ObservationStatusBadge enriched={enriched} />
        ) : (
          <StatusDropdown
            current={status}
            loading={statusUpdating}
            onChange={(newStatus) => onStatusChange(enriched, newStatus)}
          />
        )}
      </td>
      <td>{task.assignee || '—'}</td>
      <td className={task.dueDate && dueDateColor(task.dueDate).includes('red') ? 'priority-high' : task.dueDate && dueDateColor(task.dueDate).includes('amber') ? 'priority-med' : ''}>
        {formatDate(task.dueDate)}
        {daysLeft && <div className="small text-soft">{daysLeft}</div>}
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export function MyTasks() {
  const navigate = useNavigate();

  const { user }    = useAuth();
  const currentUser = user?.id || 'admin';
  const [activeTab,       setActiveTab]       = useState<'my' | 'group' | 'completed'>('my');
  const [searchQuery,     setSearchQuery]     = useState('');
  const [statusFilter,    setStatusFilter]    = useState<TaskStatus | 'All'>('All');
  const [tasks,           setTasks]           = useState<EnrichedTask[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState('');
  const [completingId,    setCompletingId]    = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  // ── Fetch tasks from Flowable ──────────────────────────────
  const userGroups = user?.groups || [];
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [assigneeTasks, groupTasks, atrCaseTasks] = await Promise.all([
        getTasksByAssignee(currentUser, user?.name),
        getTasksByCandidateGroups(userGroups),
        getAtrCaseTasksByAssignee(currentUser),
      ]);

      const seenAssigneeIds = new Set<string>();
      const allAssigneeTasks: typeof assigneeTasks = [];
      for (const t of [...assigneeTasks, ...atrCaseTasks]) {
        if (!seenAssigneeIds.has(t.id)) {
          seenAssigneeIds.add(t.id);
          allAssigneeTasks.push(t);
        }
      }

      const assigneeIds = new Set(allAssigneeTasks.map((t) => t.id));
      const unclaimedGroupTasks = groupTasks.filter((t) => !assigneeIds.has(t.id));

      const enrichedAssignee = await Promise.all(allAssigneeTasks.map((t) => enrichTask(t)));
      const enrichedGroup = await Promise.all(
        unclaimedGroupTasks.map((t) => enrichTask(t, { isGroupTask: true }))
      );

      setTasks([...enrichedAssignee, ...enrichedGroup]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load tasks from Flowable. Make sure it is running on port 8080.'
      );
    } finally {
      setLoading(false);
    }
  }, [currentUser, user?.name, JSON.stringify(userGroups)]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // ── View Task ──────────────────────────────────────────────
  const handleViewTask = (enriched: EnrichedTask) => {
    if (enriched.isObservation) {
      navigate(`/observations/tasks/${enriched.task.id}`);
      return;
    }
    localStorage.setItem('currentTaskId',            enriched.task.id);
    localStorage.setItem('currentProcessInstanceId', enriched.task.processInstanceId);
    localStorage.setItem('currentAuditName',         enriched.auditName);
    navigate(`/tasks/${enriched.task.id}`);
  };

  // ── Complete task in Flowable ──────────────────────────────
  const handleCompleteTask = async (enriched: EnrichedTask) => {
    if (enriched.isObservation) {
      navigate(`/observations/tasks/${enriched.task.id}`);
      return;
    }
    if (!window.confirm(`Mark "${enriched.task.name}" as completed?`)) return;
    setCompletingId(enriched.task.id);
    try {
      await completeTask(enriched.task.id, {
        approvalDecision: 'Approved',
        managerComments:  'Approved via My Tasks',
      });
      setTasks((prev) => prev.filter((t) => t.task.id !== enriched.task.id));
    } catch (err) {
      alert('Failed to complete task: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setCompletingId(null);
    }
  };

  // ── Update status — saves to Flowable process variable ─────
  // Not used for observation/ATR tasks — see ObservationStatusBadge,
  // those rows don't render the editable StatusDropdown at all.
  const handleStatusChange = async (enriched: EnrichedTask, newStatus: TaskStatus) => {
    if (enriched.isObservation && newStatus === 'Completed') {
      navigate(`/observations/tasks/${enriched.task.id}`);
      return;
    }
    setStatusUpdatingId(enriched.task.id);
    try {
      await saveProcessVariable(enriched.task.processInstanceId, 'taskStatus', newStatus);

      if (newStatus === 'Completed') {
        await completeTask(enriched.task.id, {
          approvalDecision: 'Approved',
          managerComments:  'Marked completed via status update',
        });
        setTasks((prev) => prev.filter((t) => t.task.id !== enriched.task.id));
        return;
      }

      setTasks((prev) =>
        prev.map((t) =>
          t.task.id === enriched.task.id ? { ...t, status: newStatus } : t
        )
      );
    } catch (err) {
      alert('Failed to update status: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // ── Filter by search + status tab ─────────────────────────
  // NOTE: the status filter pills below are still driven off the
  // Jira-style TaskStatus enum (`e.status`), so they won't yet bucket
  // observation rows by their real RETURNED/CLOSED/etc status — only
  // the inbox table's Status column reflects that (via atrStatusLabel).
  // Happy to wire the filter pills to atrStatus too if you want that;
  // just say the word.
  const filtered = tasks.filter((e) => {
    const matchesSearch =
      e.task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.auditName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.stepName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.task.assignee || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || e.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Count per status for filter pills
  const statusCounts = tasks.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <div className="page-head">
        <div>
          <h1>My Inbox</h1>
          <div className="subtitle">
            {tasks.length} action{tasks.length !== 1 ? 's' : ''} assigned to you
            {statusCounts['Blocked'] ? ` · ${statusCounts['Blocked']} blocked` : ''}
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={fetchTasks} disabled={loading}>
            <RefreshCwIcon className={loading ? 'animate-spin' : ''} style={{ width: 14, height: 14 }} />
            Refresh
          </button>
        </div>
      </div>

      <div className="tab-bar">
        {(['my', 'group', 'completed'] as const).map((tab) => (
          <div
            key={tab}
            className={`seg-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'my' ? 'My Tasks' : tab === 'group' ? 'Group Tasks' : 'Completed Tasks'}
          </div>
        ))}
      </div>

      <div className="filter-bar">
        <span className={`chip ${statusFilter === 'All' ? 'active' : ''}`} onClick={() => setStatusFilter('All')}>
          All <span className="text-soft">{tasks.length}</span>
        </span>
        {STATUS_CONFIG.map((s) => {
          const count = statusCounts[s.label] || 0;
          if (count === 0) return null;
          return (
            <span
              key={s.label}
              className={`chip ${statusFilter === s.label ? 'active' : ''}`}
              onClick={() => setStatusFilter(s.label)}
            >
              {s.label} <span className="text-soft">{count}</span>
            </span>
          );
        })}
        <span style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }}></span>
        <div className="search" style={{ maxWidth: 260 }}>
          <span className="search-ico"><SearchIcon style={{ width: 14, height: 14 }} /></span>
          <input
            type="text"
            placeholder="Search tasks…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading && (
        <div className="card">
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '48px 18px' }}>
            <Loader2Icon className="animate-spin" style={{ width: 28, height: 28, color: 'var(--primary)' }} />
            <p className="text-muted small">Loading tasks from Flowable…</p>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="card" style={{ borderColor: 'var(--danger)', marginBottom: 14 }}>
          <div className="card-body" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <AlertCircleIcon style={{ width: 18, height: 18, color: 'var(--danger)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <p className="fw-600" style={{ color: 'var(--danger)' }}>Failed to load tasks</p>
              <p className="small" style={{ color: 'var(--danger)' }}>{error}</p>
              <button onClick={fetchTasks} className="small" style={{ marginTop: 6, color: 'var(--danger)', textDecoration: 'underline' }}>
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="card">
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '48px 18px', textAlign: 'center' }}>
            <CheckCircle2Icon style={{ width: 28, height: 28, color: 'var(--text-soft)' }} />
            <p className="fw-600">
              {searchQuery || statusFilter !== 'All'
                ? 'No tasks match your filters'
                : `No tasks assigned to "${user?.name || currentUser}"`}
            </p>
            <p className="small text-muted">
              {searchQuery || statusFilter !== 'All'
                ? 'Try clearing the search or status filter'
                : 'Tasks assigned to you in Flowable will appear here'}
            </p>
          </div>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 36 }}><span className="checkbox"></span></th>
                <th>Reference</th>
                <th>Audit Step</th>
                <th>Audit</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned</th>
                <th>Due</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((enriched) => (
                <TaskRow
                  key={enriched.task.id}
                  enriched={enriched}
                  onViewTask={handleViewTask}
                  onCompleteTask={handleCompleteTask}
                  onStatusChange={handleStatusChange}
                  completing={completingId === enriched.task.id}
                  statusUpdating={statusUpdatingId === enriched.task.id}
                />
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <div>Showing {filtered.length} of {tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned to "{currentUser}"</div>
          </div>
        </div>
      )}
    </>
  );
}