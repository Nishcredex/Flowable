import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2Icon, AlertCircleIcon, CheckCircle2Icon, ArrowLeftIcon } from 'lucide-react';
import {
  getTaskById,
  getProcessVariables,
  getVariableValue,
  saveProcessVariable,
  claimTask,
  OBSERVATION_CANDIDATE_GROUPS,
  getAtrCaseTaskById,
  getAtrCaseVariables,
  getProcessInstanceComments,
  addProcessInstanceComment,
  getProcessInstanceAttachments,
  downloadAttachment,
  getAtrObservationHistoryEvents,
  summarizeObservationHistory,
  FlowableTask,
  ProcessVariable,
  CommentEntry,
  FlowableAttachment,
  ObservationHistoryEvent,
  parseChecklistItems,
  saveChecklistItems,
  filterAttachmentsForViewer,
  uploadAttachmentsTyped,
  ChecklistItem,
} from './services/flowableApi';
import {
  submitAtrAuditeeAction,
  submitAtrAuditorReview,
  decideAtrCommercialExtension,
  decideAtrFunctionalExtension,
} from './services/auditApi';
import { useAuth, getDashboardPath } from '../pages/AuthContext';
import { FileUpload } from '../components/FileUpload';
import { CommentThread } from '../components/CommentThread';
import { STATUS_LABELS, statusBadgeClass } from '../constants/auditStatus';

// ── Toast type shared by ObservationTask and every action form below ──
type ToastState = { type: 'success' | 'error'; message: string } | null;
type SetToast = (t: ToastState) => void;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent';

// Which role is allowed to act on each ATR task, independent of whatever
// the raw Flowable `assignee` string happens to contain.
const TASK_ROLE_MAP: Record<string, string> = {
  auditeeSubmitAction: 'auditee',
  auditorReviewEvidence: 'auditor',
  commercialHeadApprovalTask: 'commercialHead',
  functionalHeadApprovalTask: 'functionalHead',
};

// Short labels for the step-badge shown next to each history entry.
const ATR_TASK_STEP_LABELS: Record<string, string> = {
  auditeeSubmitAction: 'Auditee',
  auditorReviewEvidence: 'Auditor',
  commercialHeadApprovalTask: 'Commercial Head',
  functionalHeadApprovalTask: 'Functional Head',
};

const TAB_LABELS = ['Action Taken', 'Details', 'History', 'Attachments', 'Workflow'] as const;
type TabLabel = (typeof TAB_LABELS)[number];

function Tabs({
  active,
  onChange,
  attachmentCount,
}: {
  active: TabLabel;
  onChange: (t: TabLabel) => void;
  attachmentCount: number;
}) {
  return (
    <div className="flex gap-6 border-b border-gray-200 mb-6">
      {TAB_LABELS.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
            active === t
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {t}
          {t === 'Attachments' && attachmentCount > 0 && (
            <span className="ml-1.5 text-xs text-gray-400">({attachmentCount})</span>
          )}
        </button>
      ))}
    </div>
  );
}

function MetaRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="mb-4">
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className={`text-sm text-gray-800 ${mono ? 'font-mono break-all' : ''}`}>{value ?? '—'}</p>
    </div>
  );
}

// ── Toast — small fixed-position success/error banner used across
// every submit / reject / extension action in this file. Rendered from
// ObservationTask() itself (both the main view and the "done" screen),
// with setToast passed down into each action form.
function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null;
  return (
    <div
      className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
        toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
      }`}
      role="status"
    >
      {toast.message}
    </div>
  );
}

// ── Workflow history timeline — shown at the top of the History tab.
// Combines finished BPMN tasks (auditeeSubmitAction / auditorReviewEvidence)
// with finished CMMN tasks from every extension case tied to this
// observation, reconstructed from Flowable's own history tables (see
// getAtrObservationHistoryEvents in flowableApi.tsx). Comments (the
// user-typed notes below it) are a separate, complementary thing —
// this timeline is about what the workflow itself actually did.
function formatHistoryTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function historyDotClass(outcome?: string): string {
  if (outcome === 'REJECT') return 'bg-red-500';
  if (outcome === 'APPROVE') return 'bg-green-500';
  if (outcome === 'CANCEL') return 'bg-gray-400';
  return 'bg-blue-500';
}

function historyBadgeClass(category: ObservationHistoryEvent['category'], outcome?: string): string {
  if (outcome === 'REJECT') return 'bg-red-100 text-red-700';
  if (outcome === 'APPROVE') return 'bg-green-100 text-green-700';
  if (outcome === 'CANCEL') return 'bg-gray-100 text-gray-500';
  if (category === 'extension') return 'bg-purple-100 text-purple-700';
  if (category === 'submit') return 'bg-blue-100 text-blue-700';
  return 'bg-gray-100 text-gray-600';
}

function ObservationHistoryTimeline({
  events,
  loading,
}: {
  events: ObservationHistoryEvent[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-3 mb-2">
        <Loader2Icon className="w-4 h-4 animate-spin" /> Loading workflow history…
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <p className="text-sm text-gray-500 mb-6">
        No completed steps yet — this observation hasn't moved past its first action.
      </p>
    );
  }

  const summary = summarizeObservationHistory(events);

  return (
    <div className="mb-8">
      <div className="flex flex-wrap gap-2 mb-5">
        <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
          Submitted {summary.submittedCount}×
        </span>
        {summary.returnedCount > 0 && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-700">
            Returned {summary.returnedCount}×
          </span>
        )}
        {summary.extensionRequestedCount > 0 && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-700">
            Extension requested {summary.extensionRequestedCount}×
          </span>
        )}
        {summary.extensionApprovedCount > 0 && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700">
            Extension approved {summary.extensionApprovedCount}×
          </span>
        )}
        {summary.extensionRejectedCount > 0 && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-700">
            Extension rejected {summary.extensionRejectedCount}×
          </span>
        )}
        {summary.isClosed && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-800 font-medium">
            Closed
          </span>
        )}
      </div>

      <ol className="relative border-l border-gray-200 ml-2">
        {events.map((e) => (
          <li key={e.id} className="mb-6 ml-5 last:mb-0">
            <span
              className={`absolute -left-[7px] w-3.5 h-3.5 rounded-full ring-4 ring-white ${historyDotClass(e.outcome)}`}
            />
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-gray-800">{e.label}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${historyBadgeClass(e.category, e.outcome)}`}>
                {ATR_TASK_STEP_LABELS[e.taskDefinitionKey] || e.taskDefinitionKey}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {formatHistoryTimestamp(e.timestamp)}
              {e.actor ? ` · ${e.actor}` : ''}
            </p>
            {e.comment && (
              <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{e.comment}</p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function ObservationTask() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [task, setTask] = useState<FlowableTask | null>(null);
  const [vars, setVars] = useState<ProcessVariable[]>([]);
  const [comments, setComments] = useState<CommentEntry[]>([]);
  const [attachments, setAttachments] = useState<FlowableAttachment[]>([]);
  const [historyEvents, setHistoryEvents] = useState<ObservationHistoryEvent[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<TabLabel>('Action Taken');

  // Success/failure toast shown for every submit / reject / extension
  // action. Lives here (not in the individual forms) so it survives the
  // switch to the "Task Completed" screen after onSuccess() fires.
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const load = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    setError('');
    setUnauthorized(false);
    try {
      // commercialHeadApprovalTask / functionalHeadApprovalTask live in
      // Flowable's CMMN engine, not the BPMN process engine, so a plain
      // getTaskById() 404s for them. Try BPMN first, fall back to CMMN.
      let t: FlowableTask;
      let isCase = false;
      try {
        t = await getTaskById(taskId);
      } catch {
        t = await getAtrCaseTaskById(taskId);
        isCase = true;
      }

      const candidateGroup = OBSERVATION_CANDIDATE_GROUPS[t.taskDefinitionKey];
      if (!isCase && candidateGroup && !t.assignee && user?.id) {
        try {
          await claimTask(t.id, user.id);
          t = await getTaskById(taskId);
        } catch (claimErr) {
          setError(
            claimErr instanceof Error
              ? `Could not claim this task: ${claimErr.message}`
              : 'Could not claim this task.'
          );
        }
      }

      // Ownership check: assignee match + role match (role is the real
      // authorization boundary — assignee alone can be blank or stale).
      const requiredRole = TASK_ROLE_MAP[t.taskDefinitionKey];
      const assigneeMismatch = !!(t.assignee && user?.id && t.assignee !== user.id);
      const roleMismatch = !!(
        requiredRole &&
        user?.role &&
        user.role !== 'admin' &&
        user.role !== requiredRole
      );
      if (assigneeMismatch || roleMismatch) {
        setUnauthorized(true);
        setTask(t);
        setLoading(false);
        return;
      }

      setTask(t);
      const v = isCase
        ? await getAtrCaseVariables(t.caseInstanceId || '')
        : await getProcessVariables(t.processInstanceId);
      setVars(v);

      if (!isCase) {
        try {
          setComments(await getProcessInstanceComments(t.processInstanceId));
        } catch {
          // A 404 here just means comments have nothing to return yet —
          // it does NOT mean the task is complete. Never infer completion
          // from this.
          setComments([]);
        }
        try {
          setAttachments(await getProcessInstanceAttachments(t.processInstanceId));
        } catch {
          setAttachments([]);
        }
      } else {
        setComments([]);
        setAttachments([]);
      }

      // Workflow history timeline — resolved from observationId alone
      // (works for both BPMN and CMMN task views, since observationId
      // is a variable on both). Fired off after the main load rather
      // than awaited, so a slow history fetch never blocks the rest of
      // the page from rendering.
      const observationId = getVariableValue(v, 'observationId');
      if (observationId) {
        setHistoryLoading(true);
        getAtrObservationHistoryEvents(observationId)
          .then(setHistoryEvents)
          .catch(() => setHistoryEvents([]))
          .finally(() => setHistoryLoading(false));
      } else {
        setHistoryEvents([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load task');
    } finally {
      setLoading(false);
    }
  }, [taskId, user?.id, user?.role]);

  useEffect(() => {
    load();
  }, [load]);

  const gv = (name: string) => getVariableValue(vars, name);

  // Keeps `vars` (the source of truth for gv()/parseChecklistItems())
  // in sync the instant a checkbox is ticked, without a full reload —
  // same optimistic-update pattern the checklist form itself uses
  // locally, just lifted here so a re-render of Details/Workflow tabs
  // (which also read off `vars`) never shows stale checklist state.
  const handleChecklistUpdated = (items: ChecklistItem[]) => {
    setVars((prev) => {
      const next = prev.filter((v) => v.name !== 'checklistItems');
      return [...next, { name: 'checklistItems', type: 'string', value: JSON.stringify(items), scope: 'global' }];
    });
  };

  // Same lift-up pattern as handleChecklistUpdated — keeps `vars` in
  // sync the instant a draft is saved, so the Details tab (or a re-mount
  // of the Action Taken form) never shows a stale draft value.
  const handleDraftSaved = (text: string) => {
    setVars((prev) => {
      const next = prev.filter((v) => v.name !== 'correctiveActionDraft');
      return [...next, { name: 'correctiveActionDraft', type: 'string', value: text, scope: 'global' }];
    });
  };

  const handleAddComment = async (text: string) => {
    if (!task || !user) return;
    try {
      const updated = await addProcessInstanceComment(task.processInstanceId, {
        authorId: user.id,
        authorName: user.name,
        role: user.role,
        text,
      });
      setComments(updated);
    } catch (err) {
      setError(
        'This task has already been closed by someone else. Refresh to see the latest status — your comment could not be added.'
      );
      load();
    }
  };

  const homePath = user ? getDashboardPath(user.role) : '/tasks';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2Icon className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="p-8 max-w-xl mx-auto">
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircleIcon className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">This task isn't assigned to you</p>
            <p className="text-sm text-amber-700 mt-0.5">
              {task?.name ? `"${task.name}" ` : 'This task '}belongs to someone else and can't be opened here.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate(homePath)}
          className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="p-8 max-w-xl mx-auto">
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircleIcon className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">Failed to load task</p>
            <p className="text-sm text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-8">
        <Toast toast={toast} />
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2Icon className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Task Completed</h2>
        <button
          onClick={() => navigate(homePath)}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!task) return null;

  const isCaseTask = task.taskDefinitionKey === 'commercialHeadApprovalTask' || task.taskDefinitionKey === 'functionalHeadApprovalTask';
  const workflowRef = task.caseInstanceId || task.processInstanceId;

  return (
    <div className="max-w-6xl mx-auto p-8">
      <Toast toast={toast} />
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-3"
      >
        <ArrowLeftIcon className="w-4 h-4" /> Back
      </button>
      <p className="text-xs text-gray-400 mb-1">My Inbox · {task.name}</p>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">{task.name}</h1>
            <span className={`badge ${statusBadgeClass(gv('status'))}`}>
              {STATUS_LABELS[gv('status')] || gv('status') || '—'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {task.name} — {task.taskDefinitionKey}:{workflowRef} · Assigned to {task.assignee || '—'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            disabled
            title="Escalation isn't wired up yet — needs an API endpoint"
            className="px-4 py-2 border border-gray-300 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed"
          >
            Escalate
          </button>
          <button
            disabled
            title="Reassignment isn't wired up yet — needs an API endpoint"
            className="px-4 py-2 border border-gray-300 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed"
          >
            Reassign
          </button>
          <button
            onClick={() => setActiveTab('Action Taken')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Submit action
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircleIcon className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* Main column */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <Tabs active={activeTab} onChange={setActiveTab} attachmentCount={attachments.length} />

            {activeTab === 'Action Taken' && (
              <>
                {task.taskDefinitionKey === 'auditeeSubmitAction' && (
                  <AtrAuditeeSubmitForm
                    taskId={taskId!}
                    processInstanceId={task.processInstanceId}
                    userId={user?.id || ''}
                    observationDescription={gv('observationDescription')}
                    targetDate={gv('targetDate')}
                    status={gv('status')}
                    reviewComments={gv('reviewComments')}
                    checklistItems={parseChecklistItems(vars)}
                    onChecklistUpdated={handleChecklistUpdated}
                    draftCorrectiveActionDetails={gv('correctiveActionDraft')}
                    onDraftSaved={handleDraftSaved}
                    submitting={submitting}
                    setSubmitting={setSubmitting}
                    setError={setError}
                    setToast={setToast}
                    onSuccess={() => setDone(true)}
                  />
                )}

                {task.taskDefinitionKey === 'auditorReviewEvidence' && (
                  <AtrAuditorReviewForm
                    taskId={taskId!}
                    processInstanceId={task.processInstanceId}
                    submitting={submitting}
                    setSubmitting={setSubmitting}
                    setError={setError}
                    setToast={setToast}
                    onSuccess={() => setDone(true)}
                  />
                )}

                {task.taskDefinitionKey === 'commercialHeadApprovalTask' && (
                  <AtrExtensionDecisionForm
                    taskId={taskId!}
                    caseInstanceId={task.caseInstanceId || ''}
                    observationId={gv('observationId')}
                    title="Commercial Head Decision"
                    extensionReason={gv('extensionReason') || gv('requestedExtensionDate')}
                    requestedExtensionDate={gv('requestedExtensionDate')}
                    submitting={submitting}
                    setSubmitting={setSubmitting}
                    setError={setError}
                    setToast={setToast}
                    onSuccess={() => setDone(true)}
                    decide={decideAtrCommercialExtension}
                  />
                )}

                {task.taskDefinitionKey === 'functionalHeadApprovalTask' && (
                  <AtrExtensionDecisionForm
                    taskId={taskId!}
                    caseInstanceId={task.caseInstanceId || ''}
                    observationId={gv('observationId')}
                    title="Functional Head Decision"
                    extensionReason={gv('extensionReason')}
                    requestedExtensionDate={gv('requestedExtensionDate')}
                    submitting={submitting}
                    setSubmitting={setSubmitting}
                    setError={setError}
                    setToast={setToast}
                    onSuccess={() => setDone(true)}
                    decide={decideAtrFunctionalExtension}
                  />
                )}

                {![
                  'auditeeSubmitAction',
                  'auditorReviewEvidence',
                  'commercialHeadApprovalTask',
                  'functionalHeadApprovalTask',
                ].includes(task.taskDefinitionKey) && (
                  <p className="text-sm text-gray-500">
                    Unrecognized task type: <code>{task.taskDefinitionKey}</code>
                  </p>
                )}
              </>
            )}

            {activeTab === 'Details' && (
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 mb-1">Observation description</p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {gv('observationDescription') || '—'}
                  </p>
                </div>
                <MetaRow label="Observation ID" value={gv('observationId')} />
                <MetaRow label="Status" value={STATUS_LABELS[gv('status')] || gv('status')} />
                <MetaRow label="Audit name" value={gv('auditName')} />
                <MetaRow label="Project / Plant" value={gv('projectName')} />
                <MetaRow label="Department" value={gv('department')} />
                <MetaRow label="Category" value={gv('category')} />
                <MetaRow label="Priority" value={gv('priority')} />
                <MetaRow label="Target date" value={gv('targetDate')} />
                {gv('requestedExtensionDate') && (
                  <MetaRow label="Requested extension date" value={gv('requestedExtensionDate')} />
                )}
                {gv('extensionReason') && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400 mb-1">Extension reason</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{gv('extensionReason')}</p>
                  </div>
                )}
                {parseChecklistItems(vars).length > 0 && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400 mb-1">Checklist / sub-observations</p>
                    <ul className="space-y-1">
                      {parseChecklistItems(vars).map((item) => (
                        <li key={item.id} className="text-sm flex items-center gap-2">
                          <span className={item.done ? 'text-green-600' : 'text-gray-300'}>●</span>
                          <span className={item.done ? 'text-gray-500 line-through' : 'text-gray-800'}>
                            {item.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'History' && (
              <>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Workflow history</h3>
                <ObservationHistoryTimeline events={historyEvents} loading={historyLoading} />

                <div className="border-t border-gray-100 pt-5">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">Comments</h3>
                  <CommentThread comments={comments} onAdd={handleAddComment} disabled={submitting} />
                </div>
              </>
            )}

            {activeTab === 'Attachments' && (() => {
              const visible = filterAttachmentsForViewer(attachments, user?.role || '');
              return visible.length === 0 ? (
                <p className="text-sm text-gray-500">No attachments visible to you on this observation.</p>
              ) : (
                <ul className="space-y-2">
                  {visible.map((a) => (
                    <li key={a.id} className="flex items-center gap-2">
                  <button
  onClick={() => downloadAttachment(a.taskId || '', a.id, a.name)}
  className="text-sm text-blue-600 hover:underline"
>
  {a.name}
</button>
                      {a.type === 'creation' && (
                        <span className="text-xs text-gray-400">(from auditor)</span>
                      )}
                    </li>
                  ))}
                </ul>
              );
            })()}

            {activeTab === 'Workflow' && (
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <MetaRow label="Task definition key" value={task.taskDefinitionKey} mono />
                <MetaRow label="Engine" value={isCaseTask ? 'CMMN (case)' : 'BPMN (process)'} />
                <MetaRow label="Process instance ID" value={task.processInstanceId} mono />
                {task.caseInstanceId && <MetaRow label="Case instance ID" value={task.caseInstanceId} mono />}
                <MetaRow label="Task ID" value={task.id} mono />
              </div>
            )}
          </div>

          {/* Recent activity */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mt-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Recent activity on this action</h3>
            <div className="space-y-4">
              {!done && (
                <div className="flex gap-3">
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-700">Awaiting your action — submit response</p>
                    <p className="text-xs text-gray-400">You are the current owner</p>
                  </div>
                </div>
              )}
              {[...comments].reverse().map((c: any) => (
                <div key={c.id} className="flex gap-3">
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-700">{c.authorName || c.authorId || 'Someone'} commented</p>
                    <p className="text-xs text-gray-400">{c.text}</p>
                  </div>
                </div>
              ))}
              <div className="flex gap-3">
                <span className="mt-1.5 w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-700">Assigned to {task.assignee || '—'}</p>
                  <p className="text-xs text-gray-400">Step: {task.name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 h-fit">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Action metadata</h3>
          <MetaRow label="Reference" value={task.id} mono />
          <MetaRow label="Category" value={task.taskDefinitionKey} mono />
          <MetaRow label="Priority" value={gv('priority') || '—'} />
          <MetaRow label="Project / Unit" value={gv('projectName') || gv('department') || '—'} />
          <MetaRow label="Owner" value={task.assignee || '—'} />
          <MetaRow label="Due date" value={gv('targetDate') || '—'} />
          <MetaRow label="Workflow" value={workflowRef} mono />
        </div>
      </div>
    </div>
  );
}

// ── auditeeSubmitAction: SUBMIT / EXTENSION / CANCEL ──
function AtrAuditeeSubmitForm({
  taskId, processInstanceId, userId,
  observationDescription, targetDate, status, reviewComments,
  checklistItems, onChecklistUpdated,
  draftCorrectiveActionDetails, onDraftSaved,
  submitting, setSubmitting, setError, setToast, onSuccess,
}: {
  taskId: string;
  processInstanceId: string;
  userId: string;
  observationDescription: string;
  targetDate: string;
  status: string;
  reviewComments?: string;
  checklistItems: ChecklistItem[];
  onChecklistUpdated: (items: ChecklistItem[]) => void;
  /** Last-saved draft text for the Corrective Action Details textarea,
   *  read off the `correctiveActionDraft` process variable — pre-fills
   *  the field so the auditee's write-up survives navigating away or
   *  coming back in a later session, even before they formally submit. */
  draftCorrectiveActionDetails?: string;
  /** Called after a successful draft save so the parent's `vars` copy
   *  stays in sync (same lift-up pattern as onChecklistUpdated). */
  onDraftSaved: (text: string) => void;
  submitting: boolean;
  setSubmitting: (v: boolean) => void;
  setError: (v: string) => void;
  setToast: SetToast;
  onSuccess: () => void;
}) {
  const [correctiveActionDetails, setCorrectiveActionDetails] = useState(
    draftCorrectiveActionDetails || ''
  );
  const [files, setFiles] = useState<File[]>([]);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [extensionReason, setExtensionReason] = useState('');
  const [requestedExtensionDate, setRequestedExtensionDate] = useState('');

  // Local optimistic copy so ticking a box feels instant; persisted to
  // the process variable on every toggle (not batched with the final
  // submit) so partial progress survives a refresh or a later session.
  const [localChecklist, setLocalChecklist] = useState<ChecklistItem[]>(checklistItems);
  const [savingChecklist, setSavingChecklist] = useState(false);

  // Draft-save state for the Corrective Action Details text. Unlike the
  // checklist (which autosaves on every toggle), the textarea is saved
  // explicitly via a "Save Draft" button — autosaving on every keystroke
  // would hammer the Flowable API, so this stays opt-in.
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    setLocalChecklist(checklistItems);
  }, [checklistItems]);

  const toggleChecklistItem = async (id: string) => {
    const previous = localChecklist;
    const updated = localChecklist.map((i) => (i.id === id ? { ...i, done: !i.done } : i));
    setLocalChecklist(updated);
    setSavingChecklist(true);
    try {
      await saveChecklistItems(processInstanceId, updated);
      onChecklistUpdated(updated);
    } catch (err) {
      // Roll back on failure so the checkbox doesn't lie about saved state.
      setLocalChecklist(previous);
      setError(err instanceof Error ? `Could not save checklist: ${err.message}` : 'Could not save checklist.');
    } finally {
      setSavingChecklist(false);
    }
  };

  const isReturned = status === 'IN_PROGRESS' && !!reviewComments;

  const isPastDue = (() => {
    if (!targetDate) return false;
    const due = new Date(targetDate);
    if (isNaN(due.getTime())) return false;
    const today = new Date();
    due.setHours(23, 59, 59, 999);
    return today > due;
  })();

  // Persists the current Corrective Action Details text as a process
  // variable (`correctiveActionDraft`) so it's there next time this
  // task is opened — by this session or a later one. Deliberately NOT
  // gated on isPastDue: a past-due auditee can't submit, but they
  // shouldn't lose their write-up either.
  const saveDraft = async () => {
    setSavingDraft(true);
    setError('');
    try {
      await saveProcessVariable(processInstanceId, 'correctiveActionDraft', correctiveActionDetails);
      onDraftSaved(correctiveActionDetails);
      setDraftSavedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? `Could not save draft: ${err.message}` : 'Could not save draft.');
    } finally {
      setSavingDraft(false);
    }
  };

  const submitForReview = async () => {
    setSubmitting(true);
    setError('');
    try {
      if (files.length) {
        // Tagged 'evidence' so filterAttachmentsForViewer() shows these
        // to the auditor + commercial head + functional head, distinct
        // from the auditor's 'creation' files which stay auditee-only.
        await uploadAttachmentsTyped(taskId, files, userId, 'evidence');
      }
      await submitAtrAuditeeAction(taskId, {
        action: 'SUBMIT',
        correctiveActionDetails,
      });
      // Clear the draft now that it's been formally submitted, so a
      // stale draft doesn't linger if this observation ever loops back
      // to auditeeSubmitAction (e.g. after a REJECT).
      await saveProcessVariable(processInstanceId, 'correctiveActionDraft', '').catch(() => {});
      setToast({ type: 'success', message: 'Submitted for review successfully.' });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
      setToast({ type: 'error', message: 'Submit failed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const cancelObservation = async () => {
    if (!window.confirm('Cancel this observation? This ends the workflow.')) return;
    setSubmitting(true);
    setError('');
    try {
      await submitAtrAuditeeAction(taskId, { action: 'CANCEL' });
      setToast({ type: 'success', message: 'Observation cancelled.' });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancel failed');
      setToast({ type: 'error', message: 'Cancel failed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const submitExtensionRequest = async () => {
    setSubmitting(true);
    setError('');
    try {
      await submitAtrAuditeeAction(taskId, {
        action: 'EXTENSION',
        extensionReason,
        requestedExtensionDate,
      }, processInstanceId);
      setShowExtensionModal(false);
      setToast({ type: 'success', message: 'Extension request submitted successfully.' });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extension request failed');
      setToast({ type: 'error', message: 'Extension request failed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {isReturned && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <p className="font-medium">Returned by the auditor for revision</p>
          <p className="mt-0.5">{reviewComments}</p>
        </div>
      )}

      {isPastDue && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          The target date has passed. You can no longer submit for review — please request an extension instead.
        </div>
      )}

      {localChecklist.length > 0 && (
        <div className="mb-5">
          <p className="text-sm font-medium text-gray-700 mb-1.5">
            Checklist {savingChecklist && <span className="text-xs text-gray-400">(saving…)</span>}
          </p>
          <ul className="space-y-1.5 border border-gray-200 rounded-lg p-3">
            {localChecklist.map((item) => (
              <li key={item.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => toggleChecklistItem(item.id)}
                  disabled={submitting || isPastDue}
                  className="w-4 h-4"
                />
                <span className={`text-sm ${item.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Field label="Corrective Action Details *">
        <textarea rows={5} className={inputCls} value={correctiveActionDetails}
          onChange={(e) => setCorrectiveActionDetails(e.target.value)}
          placeholder="Describe the corrective action taken..." disabled={isPastDue} />
        <p className="text-xs text-gray-400 mt-1">
          {savingDraft
            ? 'Saving draft…'
            : draftSavedAt
              ? `Draft saved at ${draftSavedAt.toLocaleTimeString()} — visible next time you open this task.`
              : draftCorrectiveActionDetails
                ? 'Showing your last saved draft.'
                : "Uploaded files aren't saved in drafts — only text and checklist progress."}
        </p>
      </Field>

      <div className="mb-5">
        <FileUpload files={files} onChange={setFiles} disabled={submitting || isPastDue} />
      </div>

      <div className="flex gap-3 mt-4">
        <button
          onClick={submitForReview}
          disabled={!correctiveActionDetails.trim() || submitting || isPastDue}
          className="flex-1 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit for Review'}
        </button>
        <button
          type="button"
          onClick={saveDraft}
          disabled={savingDraft || submitting || !correctiveActionDetails.trim()}
          className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          {savingDraft ? 'Saving…' : 'Save Draft'}
        </button>
        <button
          type="button"
          onClick={() => setShowExtensionModal(true)}
          disabled={submitting}
          className="flex-1 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
        >
          Request Extension
        </button>
        <button
          type="button"
          onClick={cancelObservation}
          disabled={submitting}
          className="px-5 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50"
        >
          Cancel
        </button>
      </div>

      {showExtensionModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Request Extension</h3>
            <Field label="Extension Reason *">
              <textarea rows={3} className={inputCls} value={extensionReason}
                onChange={(e) => setExtensionReason(e.target.value)} />
            </Field>
            <Field label="Requested Target Date *">
              <input type="date" className={inputCls} value={requestedExtensionDate}
                onChange={(e) => setRequestedExtensionDate(e.target.value)} />
            </Field>
            <p className="text-xs text-gray-400 mb-3">
              Goes to Commercial Head, then Functional Head for approval.
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={submitExtensionRequest}
                disabled={!extensionReason.trim() || !requestedExtensionDate || submitting}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
              >
                Submit Request
              </button>
              <button
                onClick={() => setShowExtensionModal(false)}
                className="flex-1 py-2 border rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── auditorReviewEvidence: APPROVE / REJECT / INVALID / BLOCKED ──
function AtrAuditorReviewForm({
  taskId, processInstanceId, submitting, setSubmitting, setError, setToast, onSuccess,
}: {
  taskId: string;
  processInstanceId: string;
  submitting: boolean;
  setSubmitting: (v: boolean) => void;
  setError: (v: string) => void;
  setToast: SetToast;
  onSuccess: () => void;
}) {
  const [reviewComments, setReviewComments] = useState('');

  const decide = async (reviewDecision: 'APPROVE' | 'REJECT' | 'INVALID' | 'BLOCKED') => {
    if ((reviewDecision === 'REJECT' || reviewDecision === 'BLOCKED') && !reviewComments.trim()) {
      setError('Comment is required for this decision.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await submitAtrAuditorReview(taskId, { reviewDecision, reviewComments }, processInstanceId);
      setToast({
        type: 'success',
        message: reviewDecision === 'APPROVE' ? 'Approved and closed successfully.' : 'Returned to auditee successfully.',
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review failed');
      setToast({ type: 'error', message: 'Review submission failed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Field label="Review Comments">
        <textarea rows={4} className={inputCls} value={reviewComments}
          onChange={(e) => setReviewComments(e.target.value)}
          placeholder="Notes for the auditee (required on Reject / Blocked)..." />
      </Field>
      <div className="grid grid-cols-2 gap-2 mt-4">
        <button onClick={() => decide('APPROVE')} disabled={submitting}
          className="py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
          Approve
        </button>
        <button onClick={() => decide('REJECT')} disabled={submitting}
          className="py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
          Reject
        </button>
        {/* <button onClick={() => decide('INVALID')} disabled={submitting}
          className="py-2.5 bg-gray-500 text-white rounded-lg text-sm font-medium disabled:opacity-50">
          Invalid
        </button>
        <button onClick={() => decide('BLOCKED')} disabled={submitting}
          className="py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium disabled:opacity-50">
          Blocked
        </button> */}
      </div>
    </div>
  );
}

// ── commercialHeadApprovalTask / functionalHeadApprovalTask (CMMN) ──
function AtrExtensionDecisionForm({
  taskId, caseInstanceId, observationId, title, extensionReason, requestedExtensionDate,
  submitting, setSubmitting, setError, setToast, onSuccess, decide,
}: {
  taskId: string;
  caseInstanceId: string;
  observationId: string;
  title: string;
  extensionReason: string;
  requestedExtensionDate: string;
  submitting: boolean;
  setSubmitting: (v: boolean) => void;
  setError: (v: string) => void;
  setToast: SetToast;
  onSuccess: () => void;
  decide: (
    taskId: string,
    decision: 'APPROVE' | 'REJECT',
    caseInstanceId: string,
    observationId: string,
    comment?: string
  ) => Promise<void>;
}) {
  const [comment, setComment] = useState('');

  const act = async (decision: 'APPROVE' | 'REJECT') => {
    if (decision === 'REJECT' && !comment.trim()) {
      setError('Comment is required when rejecting.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await decide(taskId, decision, caseInstanceId, observationId, comment);
      setToast({
        type: 'success',
        message: decision === 'APPROVE' ? 'Extension approved successfully.' : 'Extension rejected successfully.',
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Decision failed');
      setToast({ type: 'error', message: 'Decision failed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-5 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
        <p><span className="text-gray-400">Reason:</span> {extensionReason || '—'}</p>
        <p><span className="text-gray-400">Requested target date:</span> {requestedExtensionDate || '—'}</p>
      </div>
      <Field label={title}>
        <div className="flex gap-2 mt-2">
          <button onClick={() => act('APPROVE')} disabled={submitting}
            className="flex-1 py-2 text-sm font-medium rounded-lg bg-green-600 text-white disabled:opacity-50">
            Approve
          </button>
          <button onClick={() => act('REJECT')} disabled={submitting}
            className="flex-1 py-2 text-sm font-medium rounded-lg bg-red-600 text-white disabled:opacity-50">
            Reject
          </button>
        </div>
      </Field>
      <Field label="Comment">
        <textarea rows={3} className={inputCls} value={comment} onChange={(e) => setComment(e.target.value)} />
      </Field>
    </div>
  );
}