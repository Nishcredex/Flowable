// // // ============================================================
// // //  TaskDetails.tsx
// // //  Full detail view for a single Flowable task.
// // //
// // //  Context read from localStorage (set by MyTasks.tsx):
// // //    currentTaskId             → Flowable task ID
// // //    currentProcessInstanceId  → to fetch process variables
// // //    currentAuditName          → shown in breadcrumb
// // //
// // //  Flowable calls:
// // //    getTaskById(taskId)                   → task meta
// // //    getProcessVariables(processInstanceId) → audit/step vars
// // //    completeTask(taskId, payload)          → manager approves
// // // ============================================================

// // import React, { useState, useEffect, useCallback } from 'react';
// // import { useNavigate, useParams } from 'react-router-dom';
// // import {
// //   ArrowLeftIcon,
// //   CalendarIcon,
// //   UserIcon,
// //   BuildingIcon,
// //   ClipboardListIcon,
// //   ListIcon,
// //   FileTextIcon,
// //   CheckCircle2Icon,
// //   XCircleIcon,
// //   Loader2Icon,
// //   AlertCircleIcon,
// //   RefreshCwIcon,
// //   DownloadIcon,
// //   MessageSquareIcon,
// // } from 'lucide-react';
// // import {
// //   getTaskById,
// //   getProcessVariables,
// //   completeTask,
// //   getVariableValue,
// //   FlowableTask,
// //   ProcessVariable,
// // } from './services/flowableApi';

// // // ─────────────────────────────────────────────────────────────
// // // HELPERS
// // // ─────────────────────────────────────────────────────────────

// // function formatDate(iso: string | null): string {
// //   if (!iso) return '—';
// //   try {
// //     return new Date(iso).toLocaleDateString('en-GB', {
// //       day: '2-digit', month: 'short', year: 'numeric',
// //     });
// //   } catch { return iso; }
// // }

// // function getDaysLeft(iso: string | null): string {
// //   if (!iso) return '';
// //   const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
// //   if (diff < 0)  return `${Math.abs(diff)} day${Math.abs(diff) !== 1 ? 's' : ''} overdue`;
// //   if (diff === 0) return 'Due today';
// //   return `${diff} day${diff !== 1 ? 's' : ''} left`;
// // }

// // function dueDateColor(iso: string | null): string {
// //   if (!iso) return 'text-gray-900';
// //   const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
// //   if (diff < 0 || diff <= 2) return 'text-red-600 font-medium';
// //   if (diff <= 5)              return 'text-amber-600 font-medium';
// //   return 'text-gray-900 font-medium';
// // }

// // function priorityLabel(p: number): string {
// //   if (p >= 75) return 'High';
// //   if (p >= 50) return 'Medium';
// //   return 'Low';
// // }

// // function priorityBadgeClass(label: string): string {
// //   if (label === 'High')   return 'bg-red-100 text-red-700';
// //   if (label === 'Medium') return 'bg-amber-100 text-amber-700';
// //   return 'bg-green-100 text-green-700';
// // }

// // // ─────────────────────────────────────────────────────────────
// // // DETAIL ROW — label + value pair
// // // ─────────────────────────────────────────────────────────────

// // function DetailRow({
// //   icon,
// //   label,
// //   value,
// //   valueClass = 'text-gray-900 font-medium',
// // }: {
// //   icon:        React.ReactNode;
// //   label:       string;
// //   value:       React.ReactNode;
// //   valueClass?: string;
// // }) {
// //   return (
// //     <div className="flex items-center gap-3 text-sm">
// //       <span className="text-gray-400 flex-shrink-0">{icon}</span>
// //       <span className="text-gray-500 w-28 flex-shrink-0">{label}</span>
// //       <span className={valueClass}>{value}</span>
// //     </div>
// //   );
// // }

// // // ─────────────────────────────────────────────────────────────
// // // MAIN COMPONENT
// // // ─────────────────────────────────────────────────────────────

// // export function TaskDetails() {
// //   const navigate = useNavigate();
// //   const { taskId: paramTaskId } = useParams<{ taskId: string }>();

// //   // Prefer URL param, fall back to localStorage
// //   const taskId            = paramTaskId || localStorage.getItem('currentTaskId')            || '';
// //   const processInstanceId = localStorage.getItem('currentProcessInstanceId') || '';
// //   const auditNameFallback = localStorage.getItem('currentAuditName')         || 'Audit';

// //   const [task,       setTask]       = useState<FlowableTask | null>(null);
// //   const [vars,       setVars]       = useState<ProcessVariable[]>([]);
// //   const [loading,    setLoading]    = useState(true);
// //   const [error,      setError]      = useState('');

// //   // Manager review form state
// //   const [decision,        setDecision]        = useState<'Approved' | 'Rejected' | ''>('');
// //   const [managerComments, setManagerComments] = useState('');
// //   const [submitting,      setSubmitting]      = useState(false);
// //   const [submitError,     setSubmitError]     = useState('');
// //   const [completed,       setCompleted]       = useState(false);

// //   // ── Fetch task + variables ──────────────────────────────────
// //   const fetchTask = useCallback(async () => {
// //     if (!taskId) {
// //       setError('No task ID found. Please open a task from My Tasks.');
// //       setLoading(false);
// //       return;
// //     }
// //     setLoading(true);
// //     setError('');
// //     try {
// //       const [t, v] = await Promise.all([
// //         getTaskById(taskId),
// //         processInstanceId
// //           ? getProcessVariables(processInstanceId)
// //           : Promise.resolve([] as ProcessVariable[]),
// //       ]);
// //       setTask(t);
// //       setVars(v);
// //     } catch (err) {
// //       setError(
// //         err instanceof Error
// //           ? err.message
// //           : 'Failed to load task from Flowable.'
// //       );
// //     } finally {
// //       setLoading(false);
// //     }
// //   }, [taskId, processInstanceId]);

// //   useEffect(() => { fetchTask(); }, [fetchTask]);

// //   // ── Complete / Reject task ──────────────────────────────────
// //   const handleComplete = async () => {
// //     if (!decision) {
// //       setSubmitError('Please select Approved or Rejected before submitting.');
// //       return;
// //     }
// //     if (!taskId) return;

// //     setSubmitting(true);
// //     setSubmitError('');
// //     try {
// //       await completeTask(taskId, {
// //         approvalDecision: decision,
// //         managerComments:  managerComments || `${decision} via Task Details`,
// //       });
// //       setCompleted(true);
// //     } catch (err) {
// //       setSubmitError(
// //         err instanceof Error
// //           ? err.message
// //           : 'Failed to complete task in Flowable.'
// //       );
// //     } finally {
// //       setSubmitting(false);
// //     }
// //   };

// //   // ── Derive display values from variables ────────────────────
// //   const auditName       = getVariableValue(vars, 'auditName')    || auditNameFallback;
// //   const projectName     = getVariableValue(vars, 'projectName')  || '—';
// //   const stepName        = getVariableValue(vars, 'stepName')     || task?.name || '—';
// //   const evidenceFile    = getVariableValue(vars, 'evidenceFile') || '';
// //   const comments        = getVariableValue(vars, 'comments')     || '';
// //   const priorityVar     = getVariableValue(vars, 'priority')     || priorityLabel(task?.priority || 0);

// //   // FIX: task.dueDate is null when not set directly on the Flowable task.
// //   // Fall back to the process-level dueDate variable saved during CreateAudit.
// //   const effectiveDueDate = task?.dueDate || getVariableValue(vars, 'dueDate') || null;
// //   const daysLeft         = getDaysLeft(effectiveDueDate);

// //   // ── Success screen ──────────────────────────────────────────
// //   if (completed) {
// //     return (
// //       <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center">
// //         <div className={`w-20 h-20 rounded-full flex items-center justify-center ${decision === 'Approved' ? 'bg-green-100' : 'bg-red-100'}`}>
// //           {decision === 'Approved'
// //             ? <CheckCircle2Icon className="w-10 h-10 text-green-600" />
// //             : <XCircleIcon className="w-10 h-10 text-red-600" />
// //           }
// //         </div>
// //         <h2 className="text-2xl font-semibold text-gray-900">
// //           Task {decision}
// //         </h2>
// //         <p className="text-sm text-gray-500 max-w-sm">
// //           <strong>{task?.name}</strong> has been marked as <strong>{decision}</strong> in Flowable.
// //           The workflow will continue to the next step.
// //         </p>
// //         <div className="flex gap-3 mt-2">
// //           <button
// //             onClick={() => navigate('/tasks')}
// //             className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
// //             Back to My Tasks
// //           </button>
// //           <button
// //             onClick={() => navigate('/audits/manufacturing-unit-1/checklist')}
// //             className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
// //             View Checklist
// //           </button>
// //         </div>
// //       </div>
// //     );
// //   }

// //   // ── Loading ──────────────────────────────────────────────────
// //   if (loading) {
// //     return (
// //       <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] gap-3">
// //         <Loader2Icon className="w-8 h-8 text-blue-600 animate-spin" />
// //         <p className="text-sm text-gray-500">Loading task from Flowable…</p>
// //       </div>
// //     );
// //   }

// //   // ── Error ────────────────────────────────────────────────────
// //   if (error) {
// //     return (
// //       <div className="p-8">
// //         <button onClick={() => navigate('/tasks')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
// //           <ArrowLeftIcon className="w-4 h-4" /> Back to Tasks
// //         </button>
// //         <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
// //           <AlertCircleIcon className="w-5 h-5 text-red-600 mt-0.5" />
// //           <div>
// //             <p className="text-sm font-semibold text-red-700">Failed to load task</p>
// //             <p className="text-sm text-red-600 mt-0.5">{error}</p>
// //             <button onClick={fetchTask} className="mt-2 text-sm text-red-700 underline">Try again</button>
// //           </div>
// //         </div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="p-8 max-w-4xl mx-auto">

// //       {/* ── Back + breadcrumb ── */}
// //       <button
// //         onClick={() => navigate('/tasks')}
// //         className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
// //         <ArrowLeftIcon className="w-4 h-4" />
// //         Back to My Tasks
// //       </button>

// //       {/* ── Header ── */}
// //       <div className="flex items-start justify-between mb-6">
// //         <div className="flex-1">
// //           <div className="flex items-center gap-3 mb-2">
// //             <h1 className="text-2xl font-semibold text-gray-900">{task?.name}</h1>
// //             <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
// //               <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
// //                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
// //               </svg>
// //               Open
// //             </span>
// //           </div>
// //           <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium ${priorityBadgeClass(priorityVar)}`}>
// //             {priorityVar} Priority
// //           </span>
// //         </div>
// //         <button
// //           onClick={fetchTask}
// //           className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
// //           <RefreshCwIcon className="w-4 h-4" />
// //           Refresh
// //         </button>
// //       </div>

// //       <div className="grid grid-cols-3 gap-6">

// //         {/* ── LEFT: Task Details (2/3) ── */}
// //         <div className="col-span-2 space-y-5">

// //           {/* Task Info Card */}
// //           <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
// //             <h2 className="text-base font-semibold text-gray-800 mb-5">Task Information</h2>
// //             <div className="space-y-4">
// //               <DetailRow icon={<ClipboardListIcon className="w-4 h-4" />} label="Audit"       value={auditName} />
// //               <DetailRow icon={<ListIcon className="w-4 h-4" />}          label="Audit Step"  value={stepName} />
// //               <DetailRow icon={<UserIcon className="w-4 h-4" />}          label="Assigned To" value={task?.assignee || '—'} />
// //               <DetailRow icon={<BuildingIcon className="w-4 h-4" />}      label="Project"     value={projectName} />
// //               <DetailRow
// //                 icon={<CalendarIcon className="w-4 h-4" />}
// //                 label="Due Date"
// //                 value={
// //                   <>
// //                     <span className={dueDateColor(effectiveDueDate)}>
// //                       {formatDate(effectiveDueDate)}
// //                     </span>
// //                     {daysLeft && (
// //                       <span className={`ml-1.5 text-xs ${dueDateColor(effectiveDueDate)}`}>
// //                         ({daysLeft})
// //                       </span>
// //                     )}
// //                   </>
// //                 }
// //               />
// //               <DetailRow icon={<FileTextIcon className="w-4 h-4" />} label="Task Form" value="managerReviewForm" />
// //             </div>

// //             {/* Auditor comments */}
// //             {comments && (
// //               <div className="mt-5 pt-5 border-t border-gray-100">
// //                 <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
// //                   <MessageSquareIcon className="w-4 h-4 text-gray-400" />
// //                   Auditor Comments
// //                 </p>
// //                 <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">{comments}</div>
// //               </div>
// //             )}
// //           </div>

// //           {/* Evidence Attachment */}
// //           {evidenceFile && (
// //             <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
// //               <h2 className="text-base font-semibold text-gray-800 mb-4">Attachments</h2>
// //               <div className="border border-gray-200 rounded-lg p-4 inline-flex items-center gap-4">
// //                 <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
// //                   <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
// //                     <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
// //                   </svg>
// //                 </div>
// //                 <div>
// //                   <p className="text-sm font-medium text-gray-900">{evidenceFile}</p>
// //                   <p className="text-xs text-gray-400">Evidence file</p>
// //                 </div>
// //                 <button className="ml-4 p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
// //                   <DownloadIcon className="w-4 h-4" />
// //                 </button>
// //               </div>
// //             </div>
// //           )}

// //           {/* Flowable meta */}
// //           <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
// //             <p className="text-xs text-gray-400 font-mono">
// //               Task ID: {task?.id} · Process: {task?.processInstanceId?.slice(0, 12)}…
// //             </p>
// //           </div>
// //         </div>

// //         {/* ── RIGHT: Manager Review Form (1/3) ── */}
// //         <div className="space-y-5">
// //           <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
// //             <h2 className="text-base font-semibold text-gray-800 mb-5">Review & Approve</h2>

// //             {submitError && (
// //               <div className="flex items-start gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
// //                 <AlertCircleIcon className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
// //                 <p className="text-xs text-red-600">{submitError}</p>
// //               </div>
// //             )}

// //             <div className="space-y-4">
// //               {/* Approval decision */}
// //               <div>
// //                 <label className="block text-sm font-medium text-gray-700 mb-2">
// //                   Decision <span className="text-red-500">*</span>
// //                 </label>
// //                 <div className="flex gap-2">
// //                   <button
// //                     onClick={() => setDecision('Approved')}
// //                     className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium border transition-colors
// //                       ${decision === 'Approved'
// //                         ? 'bg-green-600 text-white border-green-600'
// //                         : 'border-gray-300 text-gray-700 hover:bg-gray-50'
// //                       }`}>
// //                     <CheckCircle2Icon className="w-4 h-4" />
// //                     Approve
// //                   </button>
// //                   <button
// //                     onClick={() => setDecision('Rejected')}
// //                     className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium border transition-colors
// //                       ${decision === 'Rejected'
// //                         ? 'bg-red-600 text-white border-red-600'
// //                         : 'border-gray-300 text-gray-700 hover:bg-gray-50'
// //                       }`}>
// //                     <XCircleIcon className="w-4 h-4" />
// //                     Reject
// //                   </button>
// //                 </div>
// //               </div>

// //               {/* Manager comments */}
// //               <div>
// //                 <label className="block text-sm font-medium text-gray-700 mb-1">
// //                   Manager Comments
// //                 </label>
// //                 <textarea
// //                   rows={4}
// //                   value={managerComments}
// //                   onChange={(e) => setManagerComments(e.target.value)}
// //                   placeholder="Add review notes or reason for rejection..."
// //                   className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
// //                 />
// //               </div>

// //               {/* Submit button */}
// //               <button
// //                 onClick={handleComplete}
// //                 disabled={submitting || !decision}
// //                 className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors
// //                   ${!decision
// //                     ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
// //                     : decision === 'Approved'
// //                       ? 'bg-green-600 text-white hover:bg-green-700'
// //                       : 'bg-red-600 text-white hover:bg-red-700'
// //                   } disabled:opacity-60`}>
// //                 {submitting
// //                   ? <><Loader2Icon className="w-4 h-4 animate-spin" /> Submitting…</>
// //                   : decision
// //                     ? `Submit ${decision} Decision`
// //                     : 'Select a decision above'
// //                 }
// //               </button>
// //             </div>
// //           </div>

// //           {/* Priority display */}
// //           <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
// //             <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Task Priority</p>
// //             <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${priorityBadgeClass(priorityVar)}`}>
// //               {priorityVar} Priority
// //             </span>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// // // // ============================================================
// // // //  TaskDetails.tsx
// // // //  Full detail view for a single Flowable task.
// // // //
// // // //  Context read from localStorage (set by MyTasks.tsx):
// // // //    currentTaskId             → Flowable task ID
// // // //    currentProcessInstanceId  → to fetch process variables
// // // //    currentAuditName          → shown in breadcrumb
// // // //
// // // //  Flowable calls:
// // // //    getTaskById(taskId)                   → task meta
// // // //    getProcessVariables(processInstanceId) → audit/step vars
// // // //    completeTask(taskId, payload)          → manager approves
// // // // ============================================================

// // // import React, { useState, useEffect, useCallback } from 'react';
// // // import { useNavigate, useParams } from 'react-router-dom';
// // // import {
// // //   ArrowLeftIcon,
// // //   CalendarIcon,
// // //   UserIcon,
// // //   BuildingIcon,
// // //   ClipboardListIcon,
// // //   ListIcon,
// // //   FileTextIcon,
// // //   CheckCircle2Icon,
// // //   XCircleIcon,
// // //   Loader2Icon,
// // //   AlertCircleIcon,
// // //   RefreshCwIcon,
// // //   DownloadIcon,
// // //   MessageSquareIcon,
// // // } from 'lucide-react';
// // // import {
// // //   getTaskById,
// // //   getProcessVariables,
// // //   completeTask,
// // //   getVariableValue,
// // //   FlowableTask,
// // //   ProcessVariable,
// // // } from './services/flowableApi';

// // // // ─────────────────────────────────────────────────────────────
// // // // HELPERS
// // // // ─────────────────────────────────────────────────────────────

// // // function formatDate(iso: string | null): string {
// // //   if (!iso) return '—';
// // //   try {
// // //     return new Date(iso).toLocaleDateString('en-GB', {
// // //       day: '2-digit', month: 'short', year: 'numeric',
// // //     });
// // //   } catch { return iso; }
// // // }

// // // function getDaysLeft(iso: string | null): string {
// // //   if (!iso) return '';
// // //   const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
// // //   if (diff < 0)  return `${Math.abs(diff)} day${Math.abs(diff) !== 1 ? 's' : ''} overdue`;
// // //   if (diff === 0) return 'Due today';
// // //   return `${diff} day${diff !== 1 ? 's' : ''} left`;
// // // }

// // // function dueDateColor(iso: string | null): string {
// // //   if (!iso) return 'text-gray-900';
// // //   const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
// // //   if (diff < 0 || diff <= 2) return 'text-red-600 font-medium';
// // //   if (diff <= 5)              return 'text-amber-600 font-medium';
// // //   return 'text-gray-900 font-medium';
// // // }

// // // function priorityLabel(p: number): string {
// // //   if (p >= 75) return 'High';
// // //   if (p >= 50) return 'Medium';
// // //   return 'Low';
// // // }

// // // function priorityBadgeClass(label: string): string {
// // //   if (label === 'High')   return 'bg-red-100 text-red-700';
// // //   if (label === 'Medium') return 'bg-amber-100 text-amber-700';
// // //   return 'bg-green-100 text-green-700';
// // // }

// // // // ─────────────────────────────────────────────────────────────
// // // // DETAIL ROW — label + value pair
// // // // ─────────────────────────────────────────────────────────────

// // // function DetailRow({
// // //   icon,
// // //   label,
// // //   value,
// // //   valueClass = 'text-gray-900 font-medium',
// // // }: {
// // //   icon:        React.ReactNode;
// // //   label:       string;
// // //   value:       React.ReactNode;
// // //   valueClass?: string;
// // // }) {
// // //   return (
// // //     <div className="flex items-center gap-3 text-sm">
// // //       <span className="text-gray-400 flex-shrink-0">{icon}</span>
// // //       <span className="text-gray-500 w-28 flex-shrink-0">{label}</span>
// // //       <span className={valueClass}>{value}</span>
// // //     </div>
// // //   );
// // // }

// // // // ─────────────────────────────────────────────────────────────
// // // // MAIN COMPONENT
// // // // ─────────────────────────────────────────────────────────────

// // // export function TaskDetails() {
// // //   const navigate = useNavigate();
// // //   const { taskId: paramTaskId } = useParams<{ taskId: string }>();

// // //   // Prefer URL param, fall back to localStorage
// // //   const taskId           = paramTaskId || localStorage.getItem('currentTaskId')            || '';
// // //   const processInstanceId = localStorage.getItem('currentProcessInstanceId') || '';
// // //   const auditNameFallback = localStorage.getItem('currentAuditName')         || 'Audit';

// // //   const [task,       setTask]       = useState<FlowableTask | null>(null);
// // //   const [vars,       setVars]       = useState<ProcessVariable[]>([]);
// // //   const [loading,    setLoading]    = useState(true);
// // //   const [error,      setError]      = useState('');

// // //   // Manager review form state
// // //   const [decision,        setDecision]        = useState<'Approved' | 'Rejected' | ''>('');
// // //   const [managerComments, setManagerComments] = useState('');
// // //   const [submitting,      setSubmitting]      = useState(false);
// // //   const [submitError,     setSubmitError]     = useState('');
// // //   const [completed,       setCompleted]       = useState(false);

// // //   // ── Fetch task + variables ──────────────────────────────────
// // //   const fetchTask = useCallback(async () => {
// // //     if (!taskId) {
// // //       setError('No task ID found. Please open a task from My Tasks.');
// // //       setLoading(false);
// // //       return;
// // //     }
// // //     setLoading(true);
// // //     setError('');
// // //     try {
// // //       const [t, v] = await Promise.all([
// // //         getTaskById(taskId),
// // //         processInstanceId
// // //           ? getProcessVariables(processInstanceId)
// // //           : Promise.resolve([] as ProcessVariable[]),
// // //       ]);
// // //       setTask(t);
// // //       setVars(v);
// // //     } catch (err) {
// // //       setError(
// // //         err instanceof Error
// // //           ? err.message
// // //           : 'Failed to load task from Flowable.'
// // //       );
// // //     } finally {
// // //       setLoading(false);
// // //     }
// // //   }, [taskId, processInstanceId]);

// // //   useEffect(() => { fetchTask(); }, [fetchTask]);

// // //   // ── Complete / Reject task ──────────────────────────────────
// // //   const handleComplete = async () => {
// // //     if (!decision) {
// // //       setSubmitError('Please select Approved or Rejected before submitting.');
// // //       return;
// // //     }
// // //     if (!taskId) return;

// // //     setSubmitting(true);
// // //     setSubmitError('');
// // //     try {
// // //       await completeTask(taskId, {
// // //         approvalDecision: decision,
// // //         managerComments:  managerComments || `${decision} via Task Details`,
// // //       });
// // //       setCompleted(true);
// // //     } catch (err) {
// // //       setSubmitError(
// // //         err instanceof Error
// // //           ? err.message
// // //           : 'Failed to complete task in Flowable.'
// // //       );
// // //     } finally {
// // //       setSubmitting(false);
// // //     }
// // //   };

// // //   // ── Derive display values from variables ────────────────────
// // //   const auditName    = getVariableValue(vars, 'auditName')    || auditNameFallback;
// // //   const projectName  = getVariableValue(vars, 'projectName')  || '—';
// // //   const stepName     = getVariableValue(vars, 'stepName')     || task?.name || '—';
// // //   const evidenceFile = getVariableValue(vars, 'evidenceFile') || '';
// // //   const comments     = getVariableValue(vars, 'comments')     || '';
// // //   const priorityVar  = getVariableValue(vars, 'priority')     || priorityLabel(task?.priority || 0);
// // //   const daysLeft     = getDaysLeft(task?.dueDate ?? null);

// // //   // ── Success screen ──────────────────────────────────────────
// // //   if (completed) {
// // //     return (
// // //       <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center">
// // //         <div className={`w-20 h-20 rounded-full flex items-center justify-center ${decision === 'Approved' ? 'bg-green-100' : 'bg-red-100'}`}>
// // //           {decision === 'Approved'
// // //             ? <CheckCircle2Icon className="w-10 h-10 text-green-600" />
// // //             : <XCircleIcon className="w-10 h-10 text-red-600" />
// // //           }
// // //         </div>
// // //         <h2 className="text-2xl font-semibold text-gray-900">
// // //           Task {decision}
// // //         </h2>
// // //         <p className="text-sm text-gray-500 max-w-sm">
// // //           <strong>{task?.name}</strong> has been marked as <strong>{decision}</strong> in Flowable.
// // //           The workflow will continue to the next step.
// // //         </p>
// // //         <div className="flex gap-3 mt-2">
// // //           <button
// // //             onClick={() => navigate('/tasks')}
// // //             className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
// // //             Back to My Tasks
// // //           </button>
// // //           <button
// // //             onClick={() => navigate('/audits/manufacturing-unit-1/checklist')}
// // //             className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
// // //             View Checklist
// // //           </button>
// // //         </div>
// // //       </div>
// // //     );
// // //   }

// // //   // ── Loading ──────────────────────────────────────────────────
// // //   if (loading) {
// // //     return (
// // //       <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] gap-3">
// // //         <Loader2Icon className="w-8 h-8 text-blue-600 animate-spin" />
// // //         <p className="text-sm text-gray-500">Loading task from Flowable…</p>
// // //       </div>
// // //     );
// // //   }

// // //   // ── Error ────────────────────────────────────────────────────
// // //   if (error) {
// // //     return (
// // //       <div className="p-8">
// // //         <button onClick={() => navigate('/tasks')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
// // //           <ArrowLeftIcon className="w-4 h-4" /> Back to Tasks
// // //         </button>
// // //         <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
// // //           <AlertCircleIcon className="w-5 h-5 text-red-600 mt-0.5" />
// // //           <div>
// // //             <p className="text-sm font-semibold text-red-700">Failed to load task</p>
// // //             <p className="text-sm text-red-600 mt-0.5">{error}</p>
// // //             <button onClick={fetchTask} className="mt-2 text-sm text-red-700 underline">Try again</button>
// // //           </div>
// // //         </div>
// // //       </div>
// // //     );
// // //   }

// // //   return (
// // //     <div className="p-8 max-w-4xl mx-auto">

// // //       {/* ── Back + breadcrumb ── */}
// // //       <button
// // //         onClick={() => navigate('/tasks')}
// // //         className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
// // //         <ArrowLeftIcon className="w-4 h-4" />
// // //         Back to My Tasks
// // //       </button>

// // //       {/* ── Header ── */}
// // //       <div className="flex items-start justify-between mb-6">
// // //         <div className="flex-1">
// // //           <div className="flex items-center gap-3 mb-2">
// // //             <h1 className="text-2xl font-semibold text-gray-900">{task?.name}</h1>
// // //             <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
// // //               <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
// // //                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
// // //               </svg>
// // //               Open
// // //             </span>
// // //           </div>
// // //           <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium ${priorityBadgeClass(priorityVar)}`}>
// // //             {priorityVar} Priority
// // //           </span>
// // //         </div>
// // //         <button
// // //           onClick={fetchTask}
// // //           className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
// // //           <RefreshCwIcon className="w-4 h-4" />
// // //           Refresh
// // //         </button>
// // //       </div>

// // //       <div className="grid grid-cols-3 gap-6">

// // //         {/* ── LEFT: Task Details (2/3) ── */}
// // //         <div className="col-span-2 space-y-5">

// // //           {/* Task Info Card */}
// // //           <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
// // //             <h2 className="text-base font-semibold text-gray-800 mb-5">Task Information</h2>
// // //             <div className="space-y-4">
// // //               <DetailRow icon={<ClipboardListIcon className="w-4 h-4" />} label="Audit" value={auditName} />
// // //               <DetailRow icon={<ListIcon className="w-4 h-4" />}          label="Audit Step" value={stepName} />
// // //               <DetailRow icon={<UserIcon className="w-4 h-4" />}          label="Assigned To" value={task?.assignee || '—'} />
// // //               <DetailRow icon={<BuildingIcon className="w-4 h-4" />}      label="Project" value={projectName} />
// // //               <DetailRow
// // //                 icon={<CalendarIcon className="w-4 h-4" />}
// // //                 label="Due Date"
// // //                 value={
// // //                   <>
// // //                     {formatDate(task?.dueDate ?? null)}
// // //                     {daysLeft && (
// // //                       <span className={`ml-1.5 text-xs ${dueDateColor(task?.dueDate ?? null)}`}>
// // //                         ({daysLeft})
// // //                       </span>
// // //                     )}
// // //                   </>
// // //                 }
// // //               />
// // //               <DetailRow icon={<FileTextIcon className="w-4 h-4" />} label="Task Form" value="managerReviewForm" />
// // //             </div>

// // //             {/* Auditor comments */}
// // //             {comments && (
// // //               <div className="mt-5 pt-5 border-t border-gray-100">
// // //                 <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
// // //                   <MessageSquareIcon className="w-4 h-4 text-gray-400" />
// // //                   Auditor Comments
// // //                 </p>
// // //                 <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">{comments}</div>
// // //               </div>
// // //             )}
// // //           </div>

// // //           {/* Evidence Attachment */}
// // //           {evidenceFile && (
// // //             <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
// // //               <h2 className="text-base font-semibold text-gray-800 mb-4">Attachments</h2>
// // //               <div className="border border-gray-200 rounded-lg p-4 inline-flex items-center gap-4">
// // //                 <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
// // //                   <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
// // //                     <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
// // //                   </svg>
// // //                 </div>
// // //                 <div>
// // //                   <p className="text-sm font-medium text-gray-900">{evidenceFile}</p>
// // //                   <p className="text-xs text-gray-400">Evidence file</p>
// // //                 </div>
// // //                 <button className="ml-4 p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
// // //                   <DownloadIcon className="w-4 h-4" />
// // //                 </button>
// // //               </div>
// // //             </div>
// // //           )}

// // //           {/* Flowable meta */}
// // //           <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
// // //             <p className="text-xs text-gray-400 font-mono">
// // //               Task ID: {task?.id} · Process: {task?.processInstanceId?.slice(0, 12)}…
// // //             </p>
// // //           </div>
// // //         </div>

// // //         {/* ── RIGHT: Manager Review Form (1/3) ── */}
// // //         <div className="space-y-5">
// // //           <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
// // //             <h2 className="text-base font-semibold text-gray-800 mb-5">Review & Approve</h2>

// // //             {submitError && (
// // //               <div className="flex items-start gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
// // //                 <AlertCircleIcon className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
// // //                 <p className="text-xs text-red-600">{submitError}</p>
// // //               </div>
// // //             )}

// // //             <div className="space-y-4">
// // //               {/* Approval decision */}
// // //               <div>
// // //                 <label className="block text-sm font-medium text-gray-700 mb-2">
// // //                   Decision <span className="text-red-500">*</span>
// // //                 </label>
// // //                 <div className="flex gap-2">
// // //                   <button
// // //                     onClick={() => setDecision('Approved')}
// // //                     className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium border transition-colors
// // //                       ${decision === 'Approved'
// // //                         ? 'bg-green-600 text-white border-green-600'
// // //                         : 'border-gray-300 text-gray-700 hover:bg-gray-50'
// // //                       }`}>
// // //                     <CheckCircle2Icon className="w-4 h-4" />
// // //                     Approve
// // //                   </button>
// // //                   <button
// // //                     onClick={() => setDecision('Rejected')}
// // //                     className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium border transition-colors
// // //                       ${decision === 'Rejected'
// // //                         ? 'bg-red-600 text-white border-red-600'
// // //                         : 'border-gray-300 text-gray-700 hover:bg-gray-50'
// // //                       }`}>
// // //                     <XCircleIcon className="w-4 h-4" />
// // //                     Reject
// // //                   </button>
// // //                 </div>
// // //               </div>

// // //               {/* Manager comments */}
// // //               <div>
// // //                 <label className="block text-sm font-medium text-gray-700 mb-1">
// // //                   Manager Comments
// // //                 </label>
// // //                 <textarea
// // //                   rows={4}
// // //                   value={managerComments}
// // //                   onChange={(e) => setManagerComments(e.target.value)}
// // //                   placeholder="Add review notes or reason for rejection..."
// // //                   className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
// // //                 />
// // //               </div>

// // //               {/* Submit button */}
// // //               <button
// // //                 onClick={handleComplete}
// // //                 disabled={submitting || !decision}
// // //                 className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors
// // //                   ${!decision
// // //                     ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
// // //                     : decision === 'Approved'
// // //                       ? 'bg-green-600 text-white hover:bg-green-700'
// // //                       : 'bg-red-600 text-white hover:bg-red-700'
// // //                   } disabled:opacity-60`}>
// // //                 {submitting
// // //                   ? <><Loader2Icon className="w-4 h-4 animate-spin" /> Submitting…</>
// // //                   : decision
// // //                     ? `Submit ${decision} Decision`
// // //                     : 'Select a decision above'
// // //                 }
// // //               </button>
// // //             </div>
// // //           </div>

// // //           {/* Priority display */}
// // //           <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
// // //             <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Task Priority</p>
// // //             <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${priorityBadgeClass(priorityVar)}`}>
// // //               {priorityVar} Priority
// // //             </span>
// // //           </div>
// // //         </div>
// // //       </div>
// // //     </div>
// // //   );
// // // }
// // ============================================================
// //  TaskDetails.tsx
// //  Full detail view for a single Flowable task.
// //
// //  Context read from localStorage (set by MyTasks.tsx):
// //    currentTaskId             → Flowable task ID
// //    currentProcessInstanceId  → to fetch process variables
// //    currentAuditName          → shown in breadcrumb
// //
// //  Flowable calls:
// //    getTaskById(taskId)                   → task meta
// //    getProcessVariables(processInstanceId) → audit/step vars
// //    completeTask(taskId, payload)          → manager approves
// // ============================================================

// import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import {
//   ArrowLeftIcon,
//   CalendarIcon,
//   UserIcon,
//   BuildingIcon,
//   ClipboardListIcon,
//   ListIcon,
//   FileTextIcon,
//   CheckCircle2Icon,
//   XCircleIcon,
//   Loader2Icon,
//   AlertCircleIcon,
//   RefreshCwIcon,
//   DownloadIcon,
//   MessageSquareIcon,
// } from 'lucide-react';
// import {
//   getTaskById,
//   getProcessVariables,
//   completeTask,
//   getVariableValue,
//   FlowableTask,
//   ProcessVariable,
// } from './services/flowableApi';

// // ─────────────────────────────────────────────────────────────
// // HELPERS
// // ─────────────────────────────────────────────────────────────

// function formatDate(iso: string | null): string {
//   if (!iso) return '—';
//   try {
//     return new Date(iso).toLocaleDateString('en-GB', {
//       day: '2-digit', month: 'short', year: 'numeric',
//     });
//   } catch { return iso; }
// }

// function getDaysLeft(iso: string | null): string {
//   if (!iso) return '';
//   const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
//   if (diff < 0)  return `${Math.abs(diff)} day${Math.abs(diff) !== 1 ? 's' : ''} overdue`;
//   if (diff === 0) return 'Due today';
//   return `${diff} day${diff !== 1 ? 's' : ''} left`;
// }

// function dueDateColor(iso: string | null): string {
//   if (!iso) return 'text-gray-900';
//   const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
//   if (diff < 0 || diff <= 2) return 'text-red-600 font-medium';
//   if (diff <= 5)              return 'text-amber-600 font-medium';
//   return 'text-gray-900 font-medium';
// }

// function priorityLabel(p: number): string {
//   if (p >= 75) return 'High';
//   if (p >= 50) return 'Medium';
//   return 'Low';
// }

// function priorityBadgeClass(label: string): string {
//   if (label === 'High')   return 'bg-red-100 text-red-700';
//   if (label === 'Medium') return 'bg-amber-100 text-amber-700';
//   return 'bg-green-100 text-green-700';
// }

// function priorityBadgeMockupClass(label: string): string {
//   if (label === 'High')   return 'badge-danger';
//   if (label === 'Medium') return 'badge-warn';
//   return 'badge-success';
// }

// // ─────────────────────────────────────────────────────────────
// // DETAIL ROW — label + value pair
// // ─────────────────────────────────────────────────────────────

// function DetailRow({
//   icon,
//   label,
//   value,
//   valueClass = 'text-gray-900 font-medium',
// }: {
//   icon:        React.ReactNode;
//   label:       string;
//   value:       React.ReactNode;
//   valueClass?: string;
// }) {
//   return (
//     <div className="flex items-center gap-3 text-sm">
//       <span className="text-gray-400 flex-shrink-0">{icon}</span>
//       <span className="text-gray-500 w-28 flex-shrink-0">{label}</span>
//       <span className={valueClass}>{value}</span>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────
// // MAIN COMPONENT
// // ─────────────────────────────────────────────────────────────

// export function TaskDetails() {
//   const navigate = useNavigate();
//   const { taskId: paramTaskId } = useParams<{ taskId: string }>();

//   // Prefer URL param, fall back to localStorage
//   const taskId            = paramTaskId || localStorage.getItem('currentTaskId')            || '';
//   const processInstanceId = localStorage.getItem('currentProcessInstanceId') || '';
//   const auditNameFallback = localStorage.getItem('currentAuditName')         || 'Audit';

//   const [task,       setTask]       = useState<FlowableTask | null>(null);
//   const [vars,       setVars]       = useState<ProcessVariable[]>([]);
//   const [loading,    setLoading]    = useState(true);
//   const [error,      setError]      = useState('');

//   // Manager review form state
//   const [decision,        setDecision]        = useState<'Approved' | 'Rejected' | ''>('');
//   const [managerComments, setManagerComments] = useState('');
//   const [submitting,      setSubmitting]      = useState(false);
//   const [submitError,     setSubmitError]     = useState('');
//   const [completed,       setCompleted]       = useState(false);

//   // UI-only: which tab is showing in the Action Detail card
//   const [activeDetailTab, setActiveDetailTab] = useState<'action' | 'details' | 'attachments'>('action');

//   // ── Fetch task + variables ──────────────────────────────────
//   const fetchTask = useCallback(async () => {
//     if (!taskId) {
//       setError('No task ID found. Please open a task from My Tasks.');
//       setLoading(false);
//       return;
//     }
//     setLoading(true);
//     setError('');
//     try {
//       const [t, v] = await Promise.all([
//         getTaskById(taskId),
//         processInstanceId
//           ? getProcessVariables(processInstanceId)
//           : Promise.resolve([] as ProcessVariable[]),
//       ]);
//       setTask(t);
//       setVars(v);
//     } catch (err) {
//       setError(
//         err instanceof Error
//           ? err.message
//           : 'Failed to load task from Flowable.'
//       );
//     } finally {
//       setLoading(false);
//     }
//   }, [taskId, processInstanceId]);

//   useEffect(() => { fetchTask(); }, [fetchTask]);

//   // ── Complete / Reject task ──────────────────────────────────
//   const handleComplete = async () => {
//     if (!decision) {
//       setSubmitError('Please select Approved or Rejected before submitting.');
//       return;
//     }
//     if (!taskId) return;

//     setSubmitting(true);
//     setSubmitError('');
//     try {
//       await completeTask(taskId, {
//         approvalDecision: decision,
//         managerComments:  managerComments || `${decision} via Task Details`,
//       });
//       setCompleted(true);
//     } catch (err) {
//       setSubmitError(
//         err instanceof Error
//           ? err.message
//           : 'Failed to complete task in Flowable.'
//       );
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // ── Derive display values from variables ────────────────────
//   const auditName       = getVariableValue(vars, 'auditName')    || auditNameFallback;
//   const projectName     = getVariableValue(vars, 'projectName')  || '—';
//   const stepName        = getVariableValue(vars, 'stepName')     || task?.name || '—';
//   const evidenceFile    = getVariableValue(vars, 'evidenceFile') || '';
//   const comments        = getVariableValue(vars, 'comments')     || '';
//   const priorityVar     = getVariableValue(vars, 'priority')     || priorityLabel(task?.priority || 0);

//   // FIX: task.dueDate is null when not set directly on the Flowable task.
//   // Fall back to the process-level dueDate variable saved during CreateAudit.
//   const effectiveDueDate = task?.dueDate || getVariableValue(vars, 'dueDate') || null;
//   const daysLeft         = getDaysLeft(effectiveDueDate);

//   // ── Success screen ──────────────────────────────────────────
//   if (completed) {
//     return (
//       <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center">
//         <div className={`w-20 h-20 rounded-full flex items-center justify-center ${decision === 'Approved' ? 'bg-green-100' : 'bg-red-100'}`}>
//           {decision === 'Approved'
//             ? <CheckCircle2Icon className="w-10 h-10 text-green-600" />
//             : <XCircleIcon className="w-10 h-10 text-red-600" />
//           }
//         </div>
//         <h2 className="text-2xl font-semibold text-gray-900">
//           Task {decision}
//         </h2>
//         <p className="text-sm text-gray-500 max-w-sm">
//           <strong>{task?.name}</strong> has been marked as <strong>{decision}</strong> in Flowable.
//           The workflow will continue to the next step.
//         </p>
//         <div className="flex gap-3 mt-2">
//           <button
//             onClick={() => navigate('/tasks')}
//             className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
//             Back to My Tasks
//           </button>
//           <button
//             onClick={() => navigate('/audits/manufacturing-unit-1/checklist')}
//             className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
//             View Checklist
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // ── Loading ──────────────────────────────────────────────────
//   if (loading) {
//     return (
//       <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] gap-3">
//         <Loader2Icon className="w-8 h-8 text-blue-600 animate-spin" />
//         <p className="text-sm text-gray-500">Loading task from Flowable…</p>
//       </div>
//     );
//   }

//   // ── Error ────────────────────────────────────────────────────
//   if (error) {
//     return (
//       <div className="p-8">
//         <button onClick={() => navigate('/tasks')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
//           <ArrowLeftIcon className="w-4 h-4" /> Back to Tasks
//         </button>
//         <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
//           <AlertCircleIcon className="w-5 h-5 text-red-600 mt-0.5" />
//           <div>
//             <p className="text-sm font-semibold text-red-700">Failed to load task</p>
//             <p className="text-sm text-red-600 mt-0.5">{error}</p>
//             <button onClick={fetchTask} className="mt-2 text-sm text-red-700 underline">Try again</button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <>
//       <div className="page-head">
//         <div>
//           <div className="small text-soft" style={{ marginBottom: 4 }}>My Inbox &rsaquo; {task?.name}</div>
//           <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
//             {task?.name}
//             <span className="badge badge-warn">Open</span>
//             <span className={`badge ${priorityBadgeMockupClass(priorityVar)}`}>{priorityVar} Priority</span>
//           </h1>
//           <div className="subtitle">{stepName} · {auditName}</div>
//         </div>
//         <div className="page-actions">
//           <button className="btn btn-outline" onClick={fetchTask}>
//             <RefreshCwIcon style={{ width: 14, height: 14 }} />
//             Refresh
//           </button>
//         </div>
//       </div>

//       <div className="detail-grid">

//         {/* ── LEFT: tabbed action card ── */}
//         <div className="card" style={{ padding: 0 }}>
//           <div className="tabs">
//             <span
//               className={`tab ${activeDetailTab === 'action' ? 'active' : ''}`}
//               onClick={() => setActiveDetailTab('action')}
//             >
//               Action Taken
//             </span>
//             <span
//               className={`tab ${activeDetailTab === 'details' ? 'active' : ''}`}
//               onClick={() => setActiveDetailTab('details')}
//             >
//               Details
//             </span>
//             <span
//               className={`tab ${activeDetailTab === 'attachments' ? 'active' : ''}`}
//               onClick={() => setActiveDetailTab('attachments')}
//             >
//               Attachments{evidenceFile && <span className="badge badge-neutral" style={{ marginLeft: 6 }}>1</span>}
//             </span>
//           </div>

//           <div className="card-body">

//             {/* ── Tab: Action Taken (Review & Approve form) ── */}
//             {activeDetailTab === 'action' && (
//               <>
//                 {submitError && (
//                   <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'var(--danger-soft)', border: '1px solid #fecaca', borderRadius: 6, padding: '10px 12px', marginBottom: 16 }}>
//                     <AlertCircleIcon style={{ width: 16, height: 16, color: 'var(--danger)', flexShrink: 0, marginTop: 2 }} />
//                     <p className="small" style={{ color: 'var(--danger)' }}>{submitError}</p>
//                   </div>
//                 )}

//                 <div className="form-row">
//                   <label>Decision <span style={{ color: 'var(--danger)' }}>*</span></label>
//                   <div className="row gap-8">
//                     <button
//                       onClick={() => setDecision('Approved')}
//                       className="btn"
//                       style={{
//                         flex: 1, justifyContent: 'center',
//                         background: decision === 'Approved' ? 'var(--success)' : '#fff',
//                         color: decision === 'Approved' ? '#fff' : 'var(--text)',
//                         border: `1px solid ${decision === 'Approved' ? 'var(--success)' : 'var(--border-strong)'}`,
//                       }}
//                     >
//                       <CheckCircle2Icon style={{ width: 14, height: 14 }} />
//                       Approve
//                     </button>
//                     <button
//                       onClick={() => setDecision('Rejected')}
//                       className="btn"
//                       style={{
//                         flex: 1, justifyContent: 'center',
//                         background: decision === 'Rejected' ? 'var(--danger)' : '#fff',
//                         color: decision === 'Rejected' ? '#fff' : 'var(--text)',
//                         border: `1px solid ${decision === 'Rejected' ? 'var(--danger)' : 'var(--border-strong)'}`,
//                       }}
//                     >
//                       <XCircleIcon style={{ width: 14, height: 14 }} />
//                       Reject
//                     </button>
//                   </div>
//                 </div>

//                 <div className="form-row">
//                   <label>Manager comments</label>
//                   <textarea
//                     rows={5}
//                     value={managerComments}
//                     onChange={(e) => setManagerComments(e.target.value)}
//                     placeholder="Add review notes or reason for rejection…"
//                   />
//                 </div>

//                 <div style={{ background: 'var(--info-soft)', border: '1px solid #bae6fd', borderRadius: 6, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 16 }}>
//                   <FileTextIcon style={{ width: 16, height: 16, color: '#075985', flexShrink: 0, marginTop: 2 }} />
//                   <div className="small" style={{ color: '#075985' }}>
//                     Submitting a decision here completes this step in Flowable and moves the workflow forward.
//                   </div>
//                 </div>

//                 <button
//                   onClick={handleComplete}
//                   disabled={submitting || !decision}
//                   className="btn btn-primary"
//                   style={{
//                     width: '100%', justifyContent: 'center',
//                     background: !decision ? 'var(--neutral-soft)' : decision === 'Approved' ? 'var(--success)' : 'var(--danger)',
//                     color: !decision ? 'var(--text-soft)' : '#fff',
//                     cursor: !decision || submitting ? 'default' : 'pointer',
//                   }}
//                 >
//                   {submitting
//                     ? <><Loader2Icon className="animate-spin" style={{ width: 14, height: 14 }} /> Submitting…</>
//                     : decision
//                       ? `Submit ${decision} Decision`
//                       : 'Select a decision above'
//                   }
//                 </button>
//               </>
//             )}

//             {/* ── Tab: Details ── */}
//             {activeDetailTab === 'details' && (
//               <>
//                 <div className="meta-row"><span className="k">Audit</span><span className="v">{auditName}</span></div>
//                 <div className="meta-row"><span className="k">Audit Step</span><span className="v">{stepName}</span></div>
//                 <div className="meta-row"><span className="k">Assigned To</span><span className="v">{task?.assignee || '—'}</span></div>
//                 <div className="meta-row"><span className="k">Project</span><span className="v">{projectName}</span></div>
//                 <div className="meta-row">
//                   <span className="k">Due Date</span>
//                   <span className={`v ${dueDateColor(effectiveDueDate)}`}>
//                     {formatDate(effectiveDueDate)}{daysLeft && ` (${daysLeft})`}
//                   </span>
//                 </div>
//                 <div className="meta-row"><span className="k">Task Form</span><span className="v">managerReviewForm</span></div>

//                 {comments && (
//                   <div className="mt-18">
//                     <p className="small fw-600 text-muted" style={{ marginBottom: 6 }}>Auditor comments</p>
//                     <div style={{ background: 'var(--neutral-soft)', borderRadius: 6, padding: 12, fontSize: 13 }}>{comments}</div>
//                   </div>
//                 )}
//               </>
//             )}

//             {/* ── Tab: Attachments ── */}
//             {activeDetailTab === 'attachments' && (
//               evidenceFile ? (
//                 <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
//                   <div style={{ width: 36, height: 36, background: 'var(--danger-soft)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//                     <FileTextIcon style={{ width: 18, height: 18, color: 'var(--danger)' }} />
//                   </div>
//                   <div style={{ flex: 1 }}>
//                     <div className="fw-600 small">{evidenceFile}</div>
//                     <div className="small text-soft">Evidence file</div>
//                   </div>
//                   <button className="icon-btn">
//                     <DownloadIcon style={{ width: 16, height: 16 }} />
//                   </button>
//                 </div>
//               ) : (
//                 <p className="small text-muted">No attachments on this action yet.</p>
//               )
//             )}
//           </div>
//         </div>

//         {/* ── RIGHT: Action metadata ── */}
//         <div className="card">
//           <div className="card-head"><h3>Action metadata</h3></div>
//           <div className="card-body">
//             <div className="meta-row"><span className="k">Reference</span><span className="v small font-mono">{task?.id}</span></div>
//             <div className="meta-row"><span className="k">Audit</span><span className="v">{auditName}</span></div>
//             <div className="meta-row"><span className="k">Priority</span><span className={`v ${priorityBadgeMockupClass(priorityVar) === 'badge-danger' ? 'priority-high' : priorityBadgeMockupClass(priorityVar) === 'badge-warn' ? 'priority-med' : 'priority-low'}`}>{priorityVar}</span></div>
//             <div className="meta-row"><span className="k">Assigned To</span><span className="v">{task?.assignee || '—'}</span></div>
//             <div className="meta-row"><span className="k">Project</span><span className="v">{projectName}</span></div>
//             <div className="meta-row">
//               <span className="k">Due Date</span>
//               <span className={`v ${dueDateColor(effectiveDueDate)}`}>
//                 {formatDate(effectiveDueDate)}{daysLeft && ` (${daysLeft})`}
//               </span>
//             </div>
//             <div className="meta-row"><span className="k">Process</span><span className="v small font-mono">{task?.processInstanceId?.slice(0, 12)}…</span></div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

// // // ============================================================
// // //  TaskDetails.tsx
// // //  Full detail view for a single Flowable task.
// // //
// // //  Context read from localStorage (set by MyTasks.tsx):
// // //    currentTaskId             → Flowable task ID
// // //    currentProcessInstanceId  → to fetch process variables
// // //    currentAuditName          → shown in breadcrumb
// // //
// // //  Flowable calls:
// // //    getTaskById(taskId)                   → task meta
// // //    getProcessVariables(processInstanceId) → audit/step vars
// // //    completeTask(taskId, payload)          → manager approves
// // // ============================================================

// // import React, { useState, useEffect, useCallback } from 'react';
// // import { useNavigate, useParams } from 'react-router-dom';
// // import {
// //   ArrowLeftIcon,
// //   CalendarIcon,
// //   UserIcon,
// //   BuildingIcon,
// //   ClipboardListIcon,
// //   ListIcon,
// //   FileTextIcon,
// //   CheckCircle2Icon,
// //   XCircleIcon,
// //   Loader2Icon,
// //   AlertCircleIcon,
// //   RefreshCwIcon,
// //   DownloadIcon,
// //   MessageSquareIcon,
// // } from 'lucide-react';
// // import {
// //   getTaskById,
// //   getProcessVariables,
// //   completeTask,
// //   getVariableValue,
// //   FlowableTask,
// //   ProcessVariable,
// // } from './services/flowableApi';

// // // ─────────────────────────────────────────────────────────────
// // // HELPERS
// // // ─────────────────────────────────────────────────────────────

// // function formatDate(iso: string | null): string {
// //   if (!iso) return '—';
// //   try {
// //     return new Date(iso).toLocaleDateString('en-GB', {
// //       day: '2-digit', month: 'short', year: 'numeric',
// //     });
// //   } catch { return iso; }
// // }

// // function getDaysLeft(iso: string | null): string {
// //   if (!iso) return '';
// //   const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
// //   if (diff < 0)  return `${Math.abs(diff)} day${Math.abs(diff) !== 1 ? 's' : ''} overdue`;
// //   if (diff === 0) return 'Due today';
// //   return `${diff} day${diff !== 1 ? 's' : ''} left`;
// // }

// // function dueDateColor(iso: string | null): string {
// //   if (!iso) return 'text-gray-900';
// //   const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
// //   if (diff < 0 || diff <= 2) return 'text-red-600 font-medium';
// //   if (diff <= 5)              return 'text-amber-600 font-medium';
// //   return 'text-gray-900 font-medium';
// // }

// // function priorityLabel(p: number): string {
// //   if (p >= 75) return 'High';
// //   if (p >= 50) return 'Medium';
// //   return 'Low';
// // }

// // function priorityBadgeClass(label: string): string {
// //   if (label === 'High')   return 'bg-red-100 text-red-700';
// //   if (label === 'Medium') return 'bg-amber-100 text-amber-700';
// //   return 'bg-green-100 text-green-700';
// // }

// // // ─────────────────────────────────────────────────────────────
// // // DETAIL ROW — label + value pair
// // // ─────────────────────────────────────────────────────────────

// // function DetailRow({
// //   icon,
// //   label,
// //   value,
// //   valueClass = 'text-gray-900 font-medium',
// // }: {
// //   icon:        React.ReactNode;
// //   label:       string;
// //   value:       React.ReactNode;
// //   valueClass?: string;
// // }) {
// //   return (
// //     <div className="flex items-center gap-3 text-sm">
// //       <span className="text-gray-400 flex-shrink-0">{icon}</span>
// //       <span className="text-gray-500 w-28 flex-shrink-0">{label}</span>
// //       <span className={valueClass}>{value}</span>
// //     </div>
// //   );
// // }

// // // ─────────────────────────────────────────────────────────────
// // // MAIN COMPONENT
// // // ─────────────────────────────────────────────────────────────

// // export function TaskDetails() {
// //   const navigate = useNavigate();
// //   const { taskId: paramTaskId } = useParams<{ taskId: string }>();

// //   // Prefer URL param, fall back to localStorage
// //   const taskId           = paramTaskId || localStorage.getItem('currentTaskId')            || '';
// //   const processInstanceId = localStorage.getItem('currentProcessInstanceId') || '';
// //   const auditNameFallback = localStorage.getItem('currentAuditName')         || 'Audit';

// //   const [task,       setTask]       = useState<FlowableTask | null>(null);
// //   const [vars,       setVars]       = useState<ProcessVariable[]>([]);
// //   const [loading,    setLoading]    = useState(true);
// //   const [error,      setError]      = useState('');

// //   // Manager review form state
// //   const [decision,        setDecision]        = useState<'Approved' | 'Rejected' | ''>('');
// //   const [managerComments, setManagerComments] = useState('');
// //   const [submitting,      setSubmitting]      = useState(false);
// //   const [submitError,     setSubmitError]     = useState('');
// //   const [completed,       setCompleted]       = useState(false);

// //   // ── Fetch task + variables ──────────────────────────────────
// //   const fetchTask = useCallback(async () => {
// //     if (!taskId) {
// //       setError('No task ID found. Please open a task from My Tasks.');
// //       setLoading(false);
// //       return;
// //     }
// //     setLoading(true);
// //     setError('');
// //     try {
// //       const [t, v] = await Promise.all([
// //         getTaskById(taskId),
// //         processInstanceId
// //           ? getProcessVariables(processInstanceId)
// //           : Promise.resolve([] as ProcessVariable[]),
// //       ]);
// //       setTask(t);
// //       setVars(v);
// //     } catch (err) {
// //       setError(
// //         err instanceof Error
// //           ? err.message
// //           : 'Failed to load task from Flowable.'
// //       );
// //     } finally {
// //       setLoading(false);
// //     }
// //   }, [taskId, processInstanceId]);

// //   useEffect(() => { fetchTask(); }, [fetchTask]);

// //   // ── Complete / Reject task ──────────────────────────────────
// //   const handleComplete = async () => {
// //     if (!decision) {
// //       setSubmitError('Please select Approved or Rejected before submitting.');
// //       return;
// //     }
// //     if (!taskId) return;

// //     setSubmitting(true);
// //     setSubmitError('');
// //     try {
// //       await completeTask(taskId, {
// //         approvalDecision: decision,
// //         managerComments:  managerComments || `${decision} via Task Details`,
// //       });
// //       setCompleted(true);
// //     } catch (err) {
// //       setSubmitError(
// //         err instanceof Error
// //           ? err.message
// //           : 'Failed to complete task in Flowable.'
// //       );
// //     } finally {
// //       setSubmitting(false);
// //     }
// //   };

// //   // ── Derive display values from variables ────────────────────
// //   const auditName    = getVariableValue(vars, 'auditName')    || auditNameFallback;
// //   const projectName  = getVariableValue(vars, 'projectName')  || '—';
// //   const stepName     = getVariableValue(vars, 'stepName')     || task?.name || '—';
// //   const evidenceFile = getVariableValue(vars, 'evidenceFile') || '';
// //   const comments     = getVariableValue(vars, 'comments')     || '';
// //   const priorityVar  = getVariableValue(vars, 'priority')     || priorityLabel(task?.priority || 0);
// //   const daysLeft     = getDaysLeft(task?.dueDate ?? null);

// //   // ── Success screen ──────────────────────────────────────────
// //   if (completed) {
// //     return (
// //       <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center">
// //         <div className={`w-20 h-20 rounded-full flex items-center justify-center ${decision === 'Approved' ? 'bg-green-100' : 'bg-red-100'}`}>
// //           {decision === 'Approved'
// //             ? <CheckCircle2Icon className="w-10 h-10 text-green-600" />
// //             : <XCircleIcon className="w-10 h-10 text-red-600" />
// //           }
// //         </div>
// //         <h2 className="text-2xl font-semibold text-gray-900">
// //           Task {decision}
// //         </h2>
// //         <p className="text-sm text-gray-500 max-w-sm">
// //           <strong>{task?.name}</strong> has been marked as <strong>{decision}</strong> in Flowable.
// //           The workflow will continue to the next step.
// //         </p>
// //         <div className="flex gap-3 mt-2">
// //           <button
// //             onClick={() => navigate('/tasks')}
// //             className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
// //             Back to My Tasks
// //           </button>
// //           <button
// //             onClick={() => navigate('/audits/manufacturing-unit-1/checklist')}
// //             className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
// //             View Checklist
// //           </button>
// //         </div>
// //       </div>
// //     );
// //   }

// //   // ── Loading ──────────────────────────────────────────────────
// //   if (loading) {
// //     return (
// //       <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] gap-3">
// //         <Loader2Icon className="w-8 h-8 text-blue-600 animate-spin" />
// //         <p className="text-sm text-gray-500">Loading task from Flowable…</p>
// //       </div>
// //     );
// //   }

// //   // ── Error ────────────────────────────────────────────────────
// //   if (error) {
// //     return (
// //       <div className="p-8">
// //         <button onClick={() => navigate('/tasks')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
// //           <ArrowLeftIcon className="w-4 h-4" /> Back to Tasks
// //         </button>
// //         <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
// //           <AlertCircleIcon className="w-5 h-5 text-red-600 mt-0.5" />
// //           <div>
// //             <p className="text-sm font-semibold text-red-700">Failed to load task</p>
// //             <p className="text-sm text-red-600 mt-0.5">{error}</p>
// //             <button onClick={fetchTask} className="mt-2 text-sm text-red-700 underline">Try again</button>
// //           </div>
// //         </div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="p-8 max-w-4xl mx-auto">

// //       {/* ── Back + breadcrumb ── */}
// //       <button
// //         onClick={() => navigate('/tasks')}
// //         className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
// //         <ArrowLeftIcon className="w-4 h-4" />
// //         Back to My Tasks
// //       </button>

// //       {/* ── Header ── */}
// //       <div className="flex items-start justify-between mb-6">
// //         <div className="flex-1">
// //           <div className="flex items-center gap-3 mb-2">
// //             <h1 className="text-2xl font-semibold text-gray-900">{task?.name}</h1>
// //             <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
// //               <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
// //                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
// //               </svg>
// //               Open
// //             </span>
// //           </div>
// //           <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium ${priorityBadgeClass(priorityVar)}`}>
// //             {priorityVar} Priority
// //           </span>
// //         </div>
// //         <button
// //           onClick={fetchTask}
// //           className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
// //           <RefreshCwIcon className="w-4 h-4" />
// //           Refresh
// //         </button>
// //       </div>

// //       <div className="grid grid-cols-3 gap-6">

// //         {/* ── LEFT: Task Details (2/3) ── */}
// //         <div className="col-span-2 space-y-5">

// //           {/* Task Info Card */}
// //           <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
// //             <h2 className="text-base font-semibold text-gray-800 mb-5">Task Information</h2>
// //             <div className="space-y-4">
// //               <DetailRow icon={<ClipboardListIcon className="w-4 h-4" />} label="Audit" value={auditName} />
// //               <DetailRow icon={<ListIcon className="w-4 h-4" />}          label="Audit Step" value={stepName} />
// //               <DetailRow icon={<UserIcon className="w-4 h-4" />}          label="Assigned To" value={task?.assignee || '—'} />
// //               <DetailRow icon={<BuildingIcon className="w-4 h-4" />}      label="Project" value={projectName} />
// //               <DetailRow
// //                 icon={<CalendarIcon className="w-4 h-4" />}
// //                 label="Due Date"
// //                 value={
// //                   <>
// //                     {formatDate(task?.dueDate ?? null)}
// //                     {daysLeft && (
// //                       <span className={`ml-1.5 text-xs ${dueDateColor(task?.dueDate ?? null)}`}>
// //                         ({daysLeft})
// //                       </span>
// //                     )}
// //                   </>
// //                 }
// //               />
// //               <DetailRow icon={<FileTextIcon className="w-4 h-4" />} label="Task Form" value="managerReviewForm" />
// //             </div>

// //             {/* Auditor comments */}
// //             {comments && (
// //               <div className="mt-5 pt-5 border-t border-gray-100">
// //                 <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
// //                   <MessageSquareIcon className="w-4 h-4 text-gray-400" />
// //                   Auditor Comments
// //                 </p>
// //                 <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">{comments}</div>
// //               </div>
// //             )}
// //           </div>

// //           {/* Evidence Attachment */}
// //           {evidenceFile && (
// //             <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
// //               <h2 className="text-base font-semibold text-gray-800 mb-4">Attachments</h2>
// //               <div className="border border-gray-200 rounded-lg p-4 inline-flex items-center gap-4">
// //                 <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
// //                   <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
// //                     <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
// //                   </svg>
// //                 </div>
// //                 <div>
// //                   <p className="text-sm font-medium text-gray-900">{evidenceFile}</p>
// //                   <p className="text-xs text-gray-400">Evidence file</p>
// //                 </div>
// //                 <button className="ml-4 p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
// //                   <DownloadIcon className="w-4 h-4" />
// //                 </button>
// //               </div>
// //             </div>
// //           )}

// //           {/* Flowable meta */}
// //           <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
// //             <p className="text-xs text-gray-400 font-mono">
// //               Task ID: {task?.id} · Process: {task?.processInstanceId?.slice(0, 12)}…
// //             </p>
// //           </div>
// //         </div>

// //         {/* ── RIGHT: Manager Review Form (1/3) ── */}
// //         <div className="space-y-5">
// //           <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
// //             <h2 className="text-base font-semibold text-gray-800 mb-5">Review & Approve</h2>

// //             {submitError && (
// //               <div className="flex items-start gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
// //                 <AlertCircleIcon className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
// //                 <p className="text-xs text-red-600">{submitError}</p>
// //               </div>
// //             )}

// //             <div className="space-y-4">
// //               {/* Approval decision */}
// //               <div>
// //                 <label className="block text-sm font-medium text-gray-700 mb-2">
// //                   Decision <span className="text-red-500">*</span>
// //                 </label>
// //                 <div className="flex gap-2">
// //                   <button
// //                     onClick={() => setDecision('Approved')}
// //                     className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium border transition-colors
// //                       ${decision === 'Approved'
// //                         ? 'bg-green-600 text-white border-green-600'
// //                         : 'border-gray-300 text-gray-700 hover:bg-gray-50'
// //                       }`}>
// //                     <CheckCircle2Icon className="w-4 h-4" />
// //                     Approve
// //                   </button>
// //                   <button
// //                     onClick={() => setDecision('Rejected')}
// //                     className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium border transition-colors
// //                       ${decision === 'Rejected'
// //                         ? 'bg-red-600 text-white border-red-600'
// //                         : 'border-gray-300 text-gray-700 hover:bg-gray-50'
// //                       }`}>
// //                     <XCircleIcon className="w-4 h-4" />
// //                     Reject
// //                   </button>
// //                 </div>
// //               </div>

// //               {/* Manager comments */}
// //               <div>
// //                 <label className="block text-sm font-medium text-gray-700 mb-1">
// //                   Manager Comments
// //                 </label>
// //                 <textarea
// //                   rows={4}
// //                   value={managerComments}
// //                   onChange={(e) => setManagerComments(e.target.value)}
// //                   placeholder="Add review notes or reason for rejection..."
// //                   className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
// //                 />
// //               </div>

// //               {/* Submit button */}
// //               <button
// //                 onClick={handleComplete}
// //                 disabled={submitting || !decision}
// //                 className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors
// //                   ${!decision
// //                     ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
// //                     : decision === 'Approved'
// //                       ? 'bg-green-600 text-white hover:bg-green-700'
// //                       : 'bg-red-600 text-white hover:bg-red-700'
// //                   } disabled:opacity-60`}>
// //                 {submitting
// //                   ? <><Loader2Icon className="w-4 h-4 animate-spin" /> Submitting…</>
// //                   : decision
// //                     ? `Submit ${decision} Decision`
// //                     : 'Select a decision above'
// //                 }
// //               </button>
// //             </div>
// //           </div>

// //           {/* Priority display */}
// //           <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
// //             <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Task Priority</p>
// //             <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${priorityBadgeClass(priorityVar)}`}>
// //               {priorityVar} Priority
// //             </span>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }
// ============================================================
//  TaskDetails.tsx
//  Full detail view for a single Flowable task.
//
//  Context read from localStorage (set by MyTasks.tsx):
//    currentTaskId             → Flowable task ID
//    currentProcessInstanceId  → to fetch process variables
//    currentAuditName          → shown in breadcrumb
//
//  Flowable calls:
//    getTaskById(taskId)                   → task meta
//    getProcessVariables(processInstanceId) → audit/step vars
//    completeTask(taskId, payload)          → manager approves
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CalendarIcon,
  UserIcon,
  BuildingIcon,
  ClipboardListIcon,
  ListIcon,
  FileTextIcon,
  CheckCircle2Icon,
  XCircleIcon,
  Loader2Icon,
  AlertCircleIcon,
  RefreshCwIcon,
  DownloadIcon,
  MessageSquareIcon,
} from 'lucide-react';
import {
  getTaskById,
  getProcessVariables,
  completeTask,
  getVariableValue,
  FlowableTask,
  ProcessVariable,
} from './services/flowableApi';

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
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0)  return `${Math.abs(diff)} day${Math.abs(diff) !== 1 ? 's' : ''} overdue`;
  if (diff === 0) return 'Due today';
  return `${diff} day${diff !== 1 ? 's' : ''} left`;
}

function dueDateColor(iso: string | null): string {
  if (!iso) return 'text-gray-900';
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0 || diff <= 2) return 'text-red-600 font-medium';
  if (diff <= 5)              return 'text-amber-600 font-medium';
  return 'text-gray-900 font-medium';
}

function priorityLabel(p: number): string {
  if (p >= 75) return 'High';
  if (p >= 50) return 'Medium';
  return 'Low';
}

function priorityBadgeClass(label: string): string {
  if (label === 'High')   return 'bg-red-100 text-red-700';
  if (label === 'Medium') return 'bg-amber-100 text-amber-700';
  return 'bg-green-100 text-green-700';
}

function priorityBadgeMockupClass(label: string): string {
  if (label === 'High')   return 'badge-danger';
  if (label === 'Medium') return 'badge-warn';
  return 'badge-success';
}

// ─────────────────────────────────────────────────────────────
// DETAIL ROW — label + value pair
// ─────────────────────────────────────────────────────────────

function DetailRow({
  icon,
  label,
  value,
  valueClass = 'text-gray-900 font-medium',
}: {
  icon:        React.ReactNode;
  label:       string;
  value:       React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-gray-400 flex-shrink-0">{icon}</span>
      <span className="text-gray-500 w-28 flex-shrink-0">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export function TaskDetails() {
  const navigate = useNavigate();
  const { taskId: paramTaskId } = useParams<{ taskId: string }>();

  // Prefer URL param, fall back to localStorage
  const taskId            = paramTaskId || localStorage.getItem('currentTaskId')            || '';
  const processInstanceId = localStorage.getItem('currentProcessInstanceId') || '';
  const auditNameFallback = localStorage.getItem('currentAuditName')         || 'Audit';

  const [task,       setTask]       = useState<FlowableTask | null>(null);
  const [vars,       setVars]       = useState<ProcessVariable[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  // Manager review form state
  const [decision,        setDecision]        = useState<'Approved' | 'Rejected' | ''>('');
  const [managerComments, setManagerComments] = useState('');
  const [submitting,      setSubmitting]      = useState(false);
  const [submitError,     setSubmitError]     = useState('');
  const [completed,       setCompleted]       = useState(false);

  // UI-only: which tab is showing in the Action Detail card
  const [activeDetailTab, setActiveDetailTab] = useState<'action' | 'details' | 'history' | 'attachments' | 'workflow'>('action');

  // ── Fetch task + variables ──────────────────────────────────
  const fetchTask = useCallback(async () => {
    if (!taskId) {
      setError('No task ID found. Please open a task from My Tasks.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [t, v] = await Promise.all([
        getTaskById(taskId),
        processInstanceId
          ? getProcessVariables(processInstanceId)
          : Promise.resolve([] as ProcessVariable[]),
      ]);
      setTask(t);
      setVars(v);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load task from Flowable.'
      );
    } finally {
      setLoading(false);
    }
  }, [taskId, processInstanceId]);

  useEffect(() => { fetchTask(); }, [fetchTask]);

  // ── Complete / Reject task ──────────────────────────────────
  const handleComplete = async () => {
    if (!decision) {
      setSubmitError('Please select Approved or Rejected before submitting.');
      return;
    }
    if (!taskId) return;

    setSubmitting(true);
    setSubmitError('');
    try {
      await completeTask(taskId, {
        approvalDecision: decision,
        managerComments:  managerComments || `${decision} via Task Details`,
      });
      setCompleted(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Failed to complete task in Flowable.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Derive display values from variables ────────────────────
  const auditName       = getVariableValue(vars, 'auditName')    || auditNameFallback;
  const projectName     = getVariableValue(vars, 'projectName')  || '—';
  const stepName        = getVariableValue(vars, 'stepName')     || task?.name || '—';
  const evidenceFile    = getVariableValue(vars, 'evidenceFile') || '';
  const comments        = getVariableValue(vars, 'comments')     || '';
  const priorityVar     = getVariableValue(vars, 'priority')     || priorityLabel(task?.priority || 0);

  // FIX: task.dueDate is null when not set directly on the Flowable task.
  // Fall back to the process-level dueDate variable saved during CreateAudit.
  const effectiveDueDate = task?.dueDate || getVariableValue(vars, 'dueDate') || null;
  const daysLeft         = getDaysLeft(effectiveDueDate);

  // ── Success screen ──────────────────────────────────────────
  if (completed) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center ${decision === 'Approved' ? 'bg-green-100' : 'bg-red-100'}`}>
          {decision === 'Approved'
            ? <CheckCircle2Icon className="w-10 h-10 text-green-600" />
            : <XCircleIcon className="w-10 h-10 text-red-600" />
          }
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">
          Task {decision}
        </h2>
        <p className="text-sm text-gray-500 max-w-sm">
          <strong>{task?.name}</strong> has been marked as <strong>{decision}</strong> in Flowable.
          The workflow will continue to the next step.
        </p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => navigate('/tasks')}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Back to My Tasks
          </button>
          <button
            onClick={() => navigate('/audits/manufacturing-unit-1/checklist')}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            View Checklist
          </button>
        </div>
      </div>
    );
  }

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2Icon className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm text-gray-500">Loading task from Flowable…</p>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="p-8">
        <button onClick={() => navigate('/tasks')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeftIcon className="w-4 h-4" /> Back to Tasks
        </button>
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircleIcon className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Failed to load task</p>
            <p className="text-sm text-red-600 mt-0.5">{error}</p>
            <button onClick={fetchTask} className="mt-2 text-sm text-red-700 underline">Try again</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="small text-soft" style={{ marginBottom: 4 }}>My Inbox &middot; {task?.name}</div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {task?.name}
            <span className="badge badge-warn">Open</span>
            {effectiveDueDate && dueDateColor(effectiveDueDate).includes('red') && (
              <span className="badge badge-danger">Overdue{daysLeft ? ` · ${daysLeft.replace(' overdue', '')}` : ''}</span>
            )}
          </h1>
          <div className="subtitle">
            {stepName} &mdash; {auditName} &middot; Assigned to {task?.assignee || '—'}
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" type="button">Escalate</button>
          <button className="btn btn-outline" type="button">Reassign</button>
          <button
            className="btn btn-primary"
            onClick={handleComplete}
            disabled={submitting}
          >
            {submitting ? <><Loader2Icon className="animate-spin" style={{ width: 14, height: 14 }} /> Submitting…</> : 'Submit action'}
          </button>
        </div>
      </div>

      <div className="detail-grid">

        {/* ── LEFT: tabbed action card ── */}
        <div className="card" style={{ padding: 0 }}>
          <div className="tabs">
            <span
              className={`tab ${activeDetailTab === 'action' ? 'active' : ''}`}
              onClick={() => setActiveDetailTab('action')}
            >
              Action Taken
            </span>
            <span
              className={`tab ${activeDetailTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveDetailTab('details')}
            >
              Details
            </span>
            <span
              className={`tab ${activeDetailTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveDetailTab('history')}
            >
              History
            </span>
            <span
              className={`tab ${activeDetailTab === 'attachments' ? 'active' : ''}`}
              onClick={() => setActiveDetailTab('attachments')}
            >
              Attachments{evidenceFile && <span className="badge badge-neutral" style={{ marginLeft: 6 }}>1</span>}
            </span>
            <span
              className={`tab ${activeDetailTab === 'workflow' ? 'active' : ''}`}
              onClick={() => setActiveDetailTab('workflow')}
            >
              Workflow
            </span>
          </div>

          <div className="card-body">

            {/* ── Tab: Action Taken ── */}
            {activeDetailTab === 'action' && (
              <>
                {submitError && (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'var(--danger-soft)', border: '1px solid #fecaca', borderRadius: 6, padding: '10px 12px', marginBottom: 16 }}>
                    <AlertCircleIcon style={{ width: 16, height: 16, color: 'var(--danger)', flexShrink: 0, marginTop: 2 }} />
                    <p className="small" style={{ color: 'var(--danger)' }}>{submitError}</p>
                  </div>
                )}

                {/* Decision — the field that actually drives handleComplete()/completeTask() */}
                <div className="form-row">
                  <label>Decision <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <div className="row gap-8">
                    <button
                      type="button"
                      onClick={() => setDecision('Approved')}
                      className="btn"
                      style={{
                        flex: 1, justifyContent: 'center',
                        background: decision === 'Approved' ? 'var(--success)' : '#fff',
                        color: decision === 'Approved' ? '#fff' : 'var(--text)',
                        border: `1px solid ${decision === 'Approved' ? 'var(--success)' : 'var(--border-strong)'}`,
                      }}
                    >
                      <CheckCircle2Icon style={{ width: 14, height: 14 }} />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => setDecision('Rejected')}
                      className="btn"
                      style={{
                        flex: 1, justifyContent: 'center',
                        background: decision === 'Rejected' ? 'var(--danger)' : '#fff',
                        color: decision === 'Rejected' ? '#fff' : 'var(--text)',
                        border: `1px solid ${decision === 'Rejected' ? 'var(--danger)' : 'var(--border-strong)'}`,
                      }}
                    >
                      <XCircleIcon style={{ width: 14, height: 14 }} />
                      Reject
                    </button>
                  </div>
                </div>

                {/* Action description — this textarea IS managerComments; relabelled
                    to match the client mockup, still the same field submitted by handleComplete() */}
                <div className="form-row">
                  <label>Action description <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <textarea
                    rows={5}
                    value={managerComments}
                    onChange={(e) => setManagerComments(e.target.value)}
                    placeholder="Describe the action taken, root cause analysis, and remediation steps…"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-row">
                    <label>Effective date</label>
                    <input type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
                  </div>
                  <div className="form-row">
                    <label>Recurrence prevention review</label>
                    <select defaultValue="30">
                      <option value="30">30 days from effective date</option>
                      <option value="60">60 days</option>
                      <option value="90">90 days</option>
                      <option value="none">None required</option>
                    </select>
                  </div>
                </div>

                {/* Supporting evidence — display-only; the real evidence file (if any)
                    is already surfaced under the Attachments tab */}
                <div className="form-row">
                  <label>Supporting evidence</label>
                  <div style={{ border: '1.5px dashed var(--border-strong)', borderRadius: 6, padding: 18, textAlign: 'center', color: 'var(--text-muted)', background: '#fafbfd' }}>
                    <div className="small">
                      {evidenceFile ? `Attached: ${evidenceFile}` : <>Drag &amp; drop files or <span style={{ color: 'var(--primary)', fontWeight: 500 }}>browse</span></>}
                    </div>
                    <div className="small text-soft mt-12">PDF, DOCX, XLSX, PNG up to 25 MB</div>
                  </div>
                </div>

                <div className="form-row">
                  <label>Route to (next approver)</label>
                  <select defaultValue={task?.assignee || ''}>
                    <option value={task?.assignee || ''}>{task?.assignee || 'Unassigned'}</option>
                  </select>
                </div>

                <div style={{ background: 'var(--info-soft)', border: '1px solid #bae6fd', borderRadius: 6, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <FileTextIcon style={{ width: 16, height: 16, color: '#075985', flexShrink: 0, marginTop: 2 }} />
                  <div className="small" style={{ color: '#075985' }}>
                    Submitting this action completes the current step in Flowable
                    {daysLeft && <> &middot; <strong>{daysLeft}</strong></>}.
                  </div>
                </div>
              </>
            )}

            {/* ── Tab: Details ── */}
            {activeDetailTab === 'details' && (
              <>
                <div className="meta-row"><span className="k">Audit</span><span className="v">{auditName}</span></div>
                <div className="meta-row"><span className="k">Audit Step</span><span className="v">{stepName}</span></div>
                <div className="meta-row"><span className="k">Assigned To</span><span className="v">{task?.assignee || '—'}</span></div>
                <div className="meta-row"><span className="k">Project</span><span className="v">{projectName}</span></div>
                <div className="meta-row">
                  <span className="k">Due Date</span>
                  <span className={`v ${dueDateColor(effectiveDueDate)}`}>
                    {formatDate(effectiveDueDate)}{daysLeft && ` (${daysLeft})`}
                  </span>
                </div>
                <div className="meta-row"><span className="k">Task Form</span><span className="v">managerReviewForm</span></div>

                {comments && (
                  <div className="mt-18">
                    <p className="small fw-600 text-muted" style={{ marginBottom: 6 }}>Auditor comments</p>
                    <div style={{ background: 'var(--neutral-soft)', borderRadius: 6, padding: 12, fontSize: 13 }}>{comments}</div>
                  </div>
                )}
              </>
            )}

            {/* ── Tab: History — no history/audit-log endpoint wired up yet,
                so this points to the always-visible activity feed below rather
                than fabricating entries ── */}
            {activeDetailTab === 'history' && (
              <p className="small text-muted">
                Full history isn't available from a dedicated endpoint yet — see
                "Recent activity on this action" below for what we do have from Flowable.
              </p>
            )}

            {/* ── Tab: Attachments ── */}
            {activeDetailTab === 'attachments' && (
              evidenceFile ? (
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, background: 'var(--danger-soft)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileTextIcon style={{ width: 18, height: 18, color: 'var(--danger)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="fw-600 small">{evidenceFile}</div>
                    <div className="small text-soft">Evidence file</div>
                  </div>
                  <button className="icon-btn">
                    <DownloadIcon style={{ width: 16, height: 16 }} />
                  </button>
                </div>
              ) : (
                <p className="small text-muted">No attachments on this action yet.</p>
              )
            )}

            {/* ── Tab: Workflow — no BPMN/process-diagram data wired up yet ── */}
            {activeDetailTab === 'workflow' && (
              <p className="small text-muted">
                Process: <span className="font-mono">{task?.processInstanceId || '—'}</span>. A live workflow
                diagram isn't wired up in this view yet.
              </p>
            )}
          </div>
        </div>

        {/* ── RIGHT: Action metadata ── */}
        <div className="card">
          <div className="card-head"><h3>Action metadata</h3></div>
          <div className="card-body">
            <div className="meta-row"><span className="k">Reference</span><span className="v small font-mono">{task?.id}</span></div>
            <div className="meta-row"><span className="k">Category</span><span className="v">{auditName}</span></div>
            <div className="meta-row">
              <span className="k">Priority</span>
              <span className={`v ${priorityVar === 'High' ? 'priority-high' : priorityVar === 'Medium' ? 'priority-med' : 'priority-low'}`}>{priorityVar}</span>
            </div>
            <div className="meta-row"><span className="k">Project / Unit</span><span className="v">{projectName}</span></div>
            <div className="meta-row"><span className="k">Owner</span><span className="v">{task?.assignee || '—'}</span></div>
            <div className="meta-row">
              <span className="k">Due date</span>
              <span className={`v ${dueDateColor(effectiveDueDate)}`}>
                {formatDate(effectiveDueDate)}{daysLeft && ` · ${daysLeft}`}
              </span>
            </div>
            <div className="meta-row"><span className="k">Workflow</span><span className="v small font-mono">{task?.processInstanceId?.slice(0, 12)}…</span></div>
          </div>
        </div>

        {/* ── FULL WIDTH: recent activity, built only from data this
              component actually has (no invented names/timestamps) ── */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-head"><h3>Recent activity on this action</h3></div>
          <div className="card-body">
            <div className="timeline">
              <div className="tl-item">
                <span className="tl-dot pending"></span>
                <div className="tl-title">Awaiting your action — submit response</div>
                <div className="tl-sub">
                  {daysLeft ? `${daysLeft} · ` : ''}You are the current owner
                </div>
              </div>

              {comments && (
                <div className="tl-item">
                  <span className="tl-dot warn"></span>
                  <div className="tl-title">{task?.assignee || 'Auditor'} submitted notes</div>
                  <div className="tl-sub">"{comments}"</div>
                </div>
              )}

              {evidenceFile && (
                <div className="tl-item">
                  <span className="tl-dot success"></span>
                  <div className="tl-title">Evidence attached</div>
                  <div className="tl-sub">{evidenceFile}</div>
                </div>
              )}

              <div className="tl-item">
                <span className="tl-dot success"></span>
                <div className="tl-title">Assigned to {task?.assignee || '—'}</div>
                <div className="tl-sub">Step: {stepName} &middot; {auditName}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// // ============================================================
// //  TaskDetails.tsx
// //  Full detail view for a single Flowable task.
// //
// //  Context read from localStorage (set by MyTasks.tsx):
// //    currentTaskId             → Flowable task ID
// //    currentProcessInstanceId  → to fetch process variables
// //    currentAuditName          → shown in breadcrumb
// //
// //  Flowable calls:
// //    getTaskById(taskId)                   → task meta
// //    getProcessVariables(processInstanceId) → audit/step vars
// //    completeTask(taskId, payload)          → manager approves
// // ============================================================

// import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import {
//   ArrowLeftIcon,
//   CalendarIcon,
//   UserIcon,
//   BuildingIcon,
//   ClipboardListIcon,
//   ListIcon,
//   FileTextIcon,
//   CheckCircle2Icon,
//   XCircleIcon,
//   Loader2Icon,
//   AlertCircleIcon,
//   RefreshCwIcon,
//   DownloadIcon,
//   MessageSquareIcon,
// } from 'lucide-react';
// import {
//   getTaskById,
//   getProcessVariables,
//   completeTask,
//   getVariableValue,
//   FlowableTask,
//   ProcessVariable,
// } from './services/flowableApi';

// // ─────────────────────────────────────────────────────────────
// // HELPERS
// // ─────────────────────────────────────────────────────────────

// function formatDate(iso: string | null): string {
//   if (!iso) return '—';
//   try {
//     return new Date(iso).toLocaleDateString('en-GB', {
//       day: '2-digit', month: 'short', year: 'numeric',
//     });
//   } catch { return iso; }
// }

// function getDaysLeft(iso: string | null): string {
//   if (!iso) return '';
//   const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
//   if (diff < 0)  return `${Math.abs(diff)} day${Math.abs(diff) !== 1 ? 's' : ''} overdue`;
//   if (diff === 0) return 'Due today';
//   return `${diff} day${diff !== 1 ? 's' : ''} left`;
// }

// function dueDateColor(iso: string | null): string {
//   if (!iso) return 'text-gray-900';
//   const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
//   if (diff < 0 || diff <= 2) return 'text-red-600 font-medium';
//   if (diff <= 5)              return 'text-amber-600 font-medium';
//   return 'text-gray-900 font-medium';
// }

// function priorityLabel(p: number): string {
//   if (p >= 75) return 'High';
//   if (p >= 50) return 'Medium';
//   return 'Low';
// }

// function priorityBadgeClass(label: string): string {
//   if (label === 'High')   return 'bg-red-100 text-red-700';
//   if (label === 'Medium') return 'bg-amber-100 text-amber-700';
//   return 'bg-green-100 text-green-700';
// }

// // ─────────────────────────────────────────────────────────────
// // DETAIL ROW — label + value pair
// // ─────────────────────────────────────────────────────────────

// function DetailRow({
//   icon,
//   label,
//   value,
//   valueClass = 'text-gray-900 font-medium',
// }: {
//   icon:        React.ReactNode;
//   label:       string;
//   value:       React.ReactNode;
//   valueClass?: string;
// }) {
//   return (
//     <div className="flex items-center gap-3 text-sm">
//       <span className="text-gray-400 flex-shrink-0">{icon}</span>
//       <span className="text-gray-500 w-28 flex-shrink-0">{label}</span>
//       <span className={valueClass}>{value}</span>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────
// // MAIN COMPONENT
// // ─────────────────────────────────────────────────────────────

// export function TaskDetails() {
//   const navigate = useNavigate();
//   const { taskId: paramTaskId } = useParams<{ taskId: string }>();

//   // Prefer URL param, fall back to localStorage
//   const taskId           = paramTaskId || localStorage.getItem('currentTaskId')            || '';
//   const processInstanceId = localStorage.getItem('currentProcessInstanceId') || '';
//   const auditNameFallback = localStorage.getItem('currentAuditName')         || 'Audit';

//   const [task,       setTask]       = useState<FlowableTask | null>(null);
//   const [vars,       setVars]       = useState<ProcessVariable[]>([]);
//   const [loading,    setLoading]    = useState(true);
//   const [error,      setError]      = useState('');

//   // Manager review form state
//   const [decision,        setDecision]        = useState<'Approved' | 'Rejected' | ''>('');
//   const [managerComments, setManagerComments] = useState('');
//   const [submitting,      setSubmitting]      = useState(false);
//   const [submitError,     setSubmitError]     = useState('');
//   const [completed,       setCompleted]       = useState(false);

//   // ── Fetch task + variables ──────────────────────────────────
//   const fetchTask = useCallback(async () => {
//     if (!taskId) {
//       setError('No task ID found. Please open a task from My Tasks.');
//       setLoading(false);
//       return;
//     }
//     setLoading(true);
//     setError('');
//     try {
//       const [t, v] = await Promise.all([
//         getTaskById(taskId),
//         processInstanceId
//           ? getProcessVariables(processInstanceId)
//           : Promise.resolve([] as ProcessVariable[]),
//       ]);
//       setTask(t);
//       setVars(v);
//     } catch (err) {
//       setError(
//         err instanceof Error
//           ? err.message
//           : 'Failed to load task from Flowable.'
//       );
//     } finally {
//       setLoading(false);
//     }
//   }, [taskId, processInstanceId]);

//   useEffect(() => { fetchTask(); }, [fetchTask]);

//   // ── Complete / Reject task ──────────────────────────────────
//   const handleComplete = async () => {
//     if (!decision) {
//       setSubmitError('Please select Approved or Rejected before submitting.');
//       return;
//     }
//     if (!taskId) return;

//     setSubmitting(true);
//     setSubmitError('');
//     try {
//       await completeTask(taskId, {
//         approvalDecision: decision,
//         managerComments:  managerComments || `${decision} via Task Details`,
//       });
//       setCompleted(true);
//     } catch (err) {
//       setSubmitError(
//         err instanceof Error
//           ? err.message
//           : 'Failed to complete task in Flowable.'
//       );
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // ── Derive display values from variables ────────────────────
//   const auditName    = getVariableValue(vars, 'auditName')    || auditNameFallback;
//   const projectName  = getVariableValue(vars, 'projectName')  || '—';
//   const stepName     = getVariableValue(vars, 'stepName')     || task?.name || '—';
//   const evidenceFile = getVariableValue(vars, 'evidenceFile') || '';
//   const comments     = getVariableValue(vars, 'comments')     || '';
//   const priorityVar  = getVariableValue(vars, 'priority')     || priorityLabel(task?.priority || 0);
//   const daysLeft     = getDaysLeft(task?.dueDate ?? null);

//   // ── Success screen ──────────────────────────────────────────
//   if (completed) {
//     return (
//       <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center">
//         <div className={`w-20 h-20 rounded-full flex items-center justify-center ${decision === 'Approved' ? 'bg-green-100' : 'bg-red-100'}`}>
//           {decision === 'Approved'
//             ? <CheckCircle2Icon className="w-10 h-10 text-green-600" />
//             : <XCircleIcon className="w-10 h-10 text-red-600" />
//           }
//         </div>
//         <h2 className="text-2xl font-semibold text-gray-900">
//           Task {decision}
//         </h2>
//         <p className="text-sm text-gray-500 max-w-sm">
//           <strong>{task?.name}</strong> has been marked as <strong>{decision}</strong> in Flowable.
//           The workflow will continue to the next step.
//         </p>
//         <div className="flex gap-3 mt-2">
//           <button
//             onClick={() => navigate('/tasks')}
//             className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
//             Back to My Tasks
//           </button>
//           <button
//             onClick={() => navigate('/audits/manufacturing-unit-1/checklist')}
//             className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
//             View Checklist
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // ── Loading ──────────────────────────────────────────────────
//   if (loading) {
//     return (
//       <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] gap-3">
//         <Loader2Icon className="w-8 h-8 text-blue-600 animate-spin" />
//         <p className="text-sm text-gray-500">Loading task from Flowable…</p>
//       </div>
//     );
//   }

//   // ── Error ────────────────────────────────────────────────────
//   if (error) {
//     return (
//       <div className="p-8">
//         <button onClick={() => navigate('/tasks')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
//           <ArrowLeftIcon className="w-4 h-4" /> Back to Tasks
//         </button>
//         <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
//           <AlertCircleIcon className="w-5 h-5 text-red-600 mt-0.5" />
//           <div>
//             <p className="text-sm font-semibold text-red-700">Failed to load task</p>
//             <p className="text-sm text-red-600 mt-0.5">{error}</p>
//             <button onClick={fetchTask} className="mt-2 text-sm text-red-700 underline">Try again</button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="p-8 max-w-4xl mx-auto">

//       {/* ── Back + breadcrumb ── */}
//       <button
//         onClick={() => navigate('/tasks')}
//         className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
//         <ArrowLeftIcon className="w-4 h-4" />
//         Back to My Tasks
//       </button>

//       {/* ── Header ── */}
//       <div className="flex items-start justify-between mb-6">
//         <div className="flex-1">
//           <div className="flex items-center gap-3 mb-2">
//             <h1 className="text-2xl font-semibold text-gray-900">{task?.name}</h1>
//             <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
//               <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
//                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
//               </svg>
//               Open
//             </span>
//           </div>
//           <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium ${priorityBadgeClass(priorityVar)}`}>
//             {priorityVar} Priority
//           </span>
//         </div>
//         <button
//           onClick={fetchTask}
//           className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
//           <RefreshCwIcon className="w-4 h-4" />
//           Refresh
//         </button>
//       </div>

//       <div className="grid grid-cols-3 gap-6">

//         {/* ── LEFT: Task Details (2/3) ── */}
//         <div className="col-span-2 space-y-5">

//           {/* Task Info Card */}
//           <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
//             <h2 className="text-base font-semibold text-gray-800 mb-5">Task Information</h2>
//             <div className="space-y-4">
//               <DetailRow icon={<ClipboardListIcon className="w-4 h-4" />} label="Audit" value={auditName} />
//               <DetailRow icon={<ListIcon className="w-4 h-4" />}          label="Audit Step" value={stepName} />
//               <DetailRow icon={<UserIcon className="w-4 h-4" />}          label="Assigned To" value={task?.assignee || '—'} />
//               <DetailRow icon={<BuildingIcon className="w-4 h-4" />}      label="Project" value={projectName} />
//               <DetailRow
//                 icon={<CalendarIcon className="w-4 h-4" />}
//                 label="Due Date"
//                 value={
//                   <>
//                     {formatDate(task?.dueDate ?? null)}
//                     {daysLeft && (
//                       <span className={`ml-1.5 text-xs ${dueDateColor(task?.dueDate ?? null)}`}>
//                         ({daysLeft})
//                       </span>
//                     )}
//                   </>
//                 }
//               />
//               <DetailRow icon={<FileTextIcon className="w-4 h-4" />} label="Task Form" value="managerReviewForm" />
//             </div>

//             {/* Auditor comments */}
//             {comments && (
//               <div className="mt-5 pt-5 border-t border-gray-100">
//                 <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
//                   <MessageSquareIcon className="w-4 h-4 text-gray-400" />
//                   Auditor Comments
//                 </p>
//                 <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">{comments}</div>
//               </div>
//             )}
//           </div>

//           {/* Evidence Attachment */}
//           {evidenceFile && (
//             <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
//               <h2 className="text-base font-semibold text-gray-800 mb-4">Attachments</h2>
//               <div className="border border-gray-200 rounded-lg p-4 inline-flex items-center gap-4">
//                 <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
//                   <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
//                     <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
//                   </svg>
//                 </div>
//                 <div>
//                   <p className="text-sm font-medium text-gray-900">{evidenceFile}</p>
//                   <p className="text-xs text-gray-400">Evidence file</p>
//                 </div>
//                 <button className="ml-4 p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
//                   <DownloadIcon className="w-4 h-4" />
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* Flowable meta */}
//           <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
//             <p className="text-xs text-gray-400 font-mono">
//               Task ID: {task?.id} · Process: {task?.processInstanceId?.slice(0, 12)}…
//             </p>
//           </div>
//         </div>

//         {/* ── RIGHT: Manager Review Form (1/3) ── */}
//         <div className="space-y-5">
//           <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
//             <h2 className="text-base font-semibold text-gray-800 mb-5">Review & Approve</h2>

//             {submitError && (
//               <div className="flex items-start gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
//                 <AlertCircleIcon className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
//                 <p className="text-xs text-red-600">{submitError}</p>
//               </div>
//             )}

//             <div className="space-y-4">
//               {/* Approval decision */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Decision <span className="text-red-500">*</span>
//                 </label>
//                 <div className="flex gap-2">
//                   <button
//                     onClick={() => setDecision('Approved')}
//                     className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium border transition-colors
//                       ${decision === 'Approved'
//                         ? 'bg-green-600 text-white border-green-600'
//                         : 'border-gray-300 text-gray-700 hover:bg-gray-50'
//                       }`}>
//                     <CheckCircle2Icon className="w-4 h-4" />
//                     Approve
//                   </button>
//                   <button
//                     onClick={() => setDecision('Rejected')}
//                     className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium border transition-colors
//                       ${decision === 'Rejected'
//                         ? 'bg-red-600 text-white border-red-600'
//                         : 'border-gray-300 text-gray-700 hover:bg-gray-50'
//                       }`}>
//                     <XCircleIcon className="w-4 h-4" />
//                     Reject
//                   </button>
//                 </div>
//               </div>

//               {/* Manager comments */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Manager Comments
//                 </label>
//                 <textarea
//                   rows={4}
//                   value={managerComments}
//                   onChange={(e) => setManagerComments(e.target.value)}
//                   placeholder="Add review notes or reason for rejection..."
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
//                 />
//               </div>

//               {/* Submit button */}
//               <button
//                 onClick={handleComplete}
//                 disabled={submitting || !decision}
//                 className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors
//                   ${!decision
//                     ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
//                     : decision === 'Approved'
//                       ? 'bg-green-600 text-white hover:bg-green-700'
//                       : 'bg-red-600 text-white hover:bg-red-700'
//                   } disabled:opacity-60`}>
//                 {submitting
//                   ? <><Loader2Icon className="w-4 h-4 animate-spin" /> Submitting…</>
//                   : decision
//                     ? `Submit ${decision} Decision`
//                     : 'Select a decision above'
//                 }
//               </button>
//             </div>
//           </div>

//           {/* Priority display */}
//           <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
//             <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Task Priority</p>
//             <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${priorityBadgeClass(priorityVar)}`}>
//               {priorityVar} Priority
//             </span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }