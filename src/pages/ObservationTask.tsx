// // import React, { useState, useEffect, useCallback } from 'react';
// // import { useParams, useNavigate } from 'react-router-dom';
// // import { Loader2Icon, AlertCircleIcon, CheckCircle2Icon, ArrowLeftIcon } from 'lucide-react';
// // import {
// //   getTaskById,
// //   getProcessVariables,
// //   getVariableValue,
// //   claimTask,
// //   OBSERVATION_CANDIDATE_GROUPS,
// //   isAtrCaseTask,
// //   getAtrCaseTaskById,
// //   getAtrCaseVariables,
// //   getProcessInstanceComments,
// //   addProcessInstanceComment,
// //   getProcessInstanceAttachments,
// //   uploadAttachments,
// //   downloadAttachment,
// //   FlowableTask,
// //   ProcessVariable,
// //   CommentEntry,
// //   FlowableAttachment,
// // } from './services/flowableApi';
// // import {
// //   submitAtrAuditeeAction,
// //   submitAtrAuditorReview,
// //   decideAtrCommercialExtension,
// //   decideAtrFunctionalExtension,
// // } from './services/auditApi';
// // import { useAuth, getDashboardPath } from '../pages/AuthContext';
// // import { FileUpload } from '../components/FileUpload';
// // import { CommentThread } from '../components/CommentThread';
// // import { STATUS_LABELS, statusBadgeClass } from '../constants/auditStatus';

// // function Field({ label, children }: { label: string; children: React.ReactNode }) {
// //   return (
// //     <div className="mb-4">
// //       <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
// //       {children}
// //     </div>
// //   );
// // }

// // const inputCls =
// //   'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent';

// // export function ObservationTask() {
// //   const { taskId } = useParams<{ taskId: string }>();
// //   const navigate = useNavigate();
// //   const { user } = useAuth();

// //   const [task, setTask] = useState<FlowableTask | null>(null);
// //   const [vars, setVars] = useState<ProcessVariable[]>([]);
// //   const [comments, setComments] = useState<CommentEntry[]>([]);
// //   const [attachments, setAttachments] = useState<FlowableAttachment[]>([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState('');
// //   const [submitting, setSubmitting] = useState(false);
// //   const [done, setDone] = useState(false);

// //   // const load = useCallback(async () => {
// //   //   if (!taskId) return;
// //   //   setLoading(true);
// //   //   setError('');
// //   //   try {
// //   //     // commercialHeadApprovalTask / functionalHeadApprovalTask live in
// //   //     // Flowable's CMMN engine, not the BPMN process engine, so a plain
// //   //     // getTaskById() 404s for them. Try BPMN first (the common case),
// //   //     // fall back to the CMMN task lookup.
// //   //     let t: FlowableTask;
// //   //     let isCase = false;
// //   //     try {
// //   //       t = await getTaskById(taskId);
// //   //     } catch {
// //   //       t = await getAtrCaseTaskById(taskId);
// //   //       isCase = true;
// //   //     }

// //   //     const candidateGroup = OBSERVATION_CANDIDATE_GROUPS[t.taskDefinitionKey];
// //   //     if (!isCase && candidateGroup && !t.assignee && user?.id) {
// //   //       try {
// //   //         await claimTask(t.id, user.id);
// //   //         t = await getTaskById(taskId);
// //   //       } catch (claimErr) {
// //   //         setError(
// //   //           claimErr instanceof Error
// //   //             ? `Could not claim this task: ${claimErr.message}`
// //   //             : 'Could not claim this task.'
// //   //         );
// //   //       }
// //   //     }
// //   //     // ATR case tasks (commercialHeadApprovalTask / functionalHeadApprovalTask)
// //   //     // are assigned directly to commercialHeadId/functionalHeadId per the
// //   //     // CMMN XML — no candidate-group claiming step needed.

// //   //     setTask(t);
// //   //     const v = isCase
// //   //       ? await getAtrCaseVariables(t.caseInstanceId || '')
// //   //       : await getProcessVariables(t.processInstanceId);
// //   //     setVars(v);

// //   //     // Comments/attachments are native Flowable resources scoped to a
// //   //     // BPMN process instance. CMMN case tasks don't have one (they have
// //   //     // a caseInstanceId instead), so skip both for case tasks rather
// //   //     // than fetching against an id Flowable doesn't recognize.
// //   //     if (!isCase) {
// //   //       try {
// //   //         setComments(await getProcessInstanceComments(t.processInstanceId));
// //   //       } catch {
// //   //         setComments([]);
// //   //       }
// //   //       try {
// //   //         setAttachments(await getProcessInstanceAttachments(t.processInstanceId));
// //   //       } catch {
// //   //         setAttachments([]);
// //   //       }
// //   //     } else {
// //   //       setComments([]);
// //   //       setAttachments([]);
// //   //     }
// //   //   } catch (err) {
// //   //     setError(err instanceof Error ? err.message : 'Failed to load task');
// //   //   } finally {
// //   //     setLoading(false);
// //   //   }
// //   // }, [taskId, user?.id]);

// //   const load = useCallback(async () => {
// //   if (!taskId) return;
// //   setLoading(true);
// //   setError('');
// //   try {
// //     // commercialHeadApprovalTask / functionalHeadApprovalTask live in
// //     // Flowable's CMMN engine, not the BPMN process engine, so a plain
// //     // getTaskById() 404s for them. Try BPMN first (the common case),
// //     // fall back to the CMMN task lookup.
// //     let t: FlowableTask;
// //     let isCase = false;
// //     try {
// //       t = await getTaskById(taskId);
// //     } catch {
// //       t = await getAtrCaseTaskById(taskId);
// //       isCase = true;
// //     }

// //     const candidateGroup = OBSERVATION_CANDIDATE_GROUPS[t.taskDefinitionKey];
// //     if (!isCase && candidateGroup && !t.assignee && user?.id) {
// //       try {
// //         await claimTask(t.id, user.id);
// //         t = await getTaskById(taskId);
// //       } catch (claimErr) {
// //         setError(
// //           claimErr instanceof Error
// //             ? `Could not claim this task: ${claimErr.message}`
// //             : 'Could not claim this task.'
// //         );
// //       }
// //     }
// //     // ATR case tasks (commercialHeadApprovalTask / functionalHeadApprovalTask)
// //     // are assigned directly to commercialHeadId/functionalHeadId per the
// //     // CMMN XML — no candidate-group claiming step needed.

// //     setTask(t);
// //     const v = isCase
// //       ? await getAtrCaseVariables(t.caseInstanceId || '')
// //       : await getProcessVariables(t.processInstanceId);
// //     setVars(v);

// //     // Comments/attachments are native Flowable resources scoped to a
// //     // BPMN process instance. CMMN case tasks don't have one (they have
// //     // a caseInstanceId instead), so skip both for case tasks rather
// //     // than fetching against an id Flowable doesn't recognize.
// //     if (!isCase) {
// //       try {
// //         setComments(await getProcessInstanceComments(t.processInstanceId));
// //       } catch {
// //         // NOTE: getTaskById(taskId) above already succeeded, which is the
// //         // real signal that this task/process is still open — Flowable's
// //         // runtime/* endpoints only 404 once a process instance has
// //         // actually completed and moved to history. A 404 here just means
// //         // the comments sub-resource has nothing to return yet (or hit a
// //         // transient issue); it says nothing about whether the *task* is
// //         // done, so it must never be used to infer completion. Previously
// //         // this incorrectly called setDone(true) on any 404, which made
// //         // freshly-created, still-open tasks show "Task Completed" the
// //         // moment someone opened them. Just show an empty comment list.
// //         setComments([]);
// //       }
// //       try {
// //         setAttachments(await getProcessInstanceAttachments(t.processInstanceId));
// //       } catch {
// //         setAttachments([]);
// //       }
// //     } else {
// //       setComments([]);
// //       setAttachments([]);
// //     }
// //   } catch (err) {
// //     setError(err instanceof Error ? err.message : 'Failed to load task');
// //   } finally {
// //     setLoading(false);
// //   }
// // }, [taskId, user?.id]);
// //   useEffect(() => { load(); }, [load]);

// //   const gv = (name: string) => getVariableValue(vars, name);

// //   const handleAddComment = async (text: string) => {
// //   if (!task || !user) return;
// //   try {
// //     const updated = await addProcessInstanceComment(task.processInstanceId, {
// //       authorId: user.id,
// //       authorName: user.name,
// //       role: user.role,
// //       text,
// //     });
// //     setComments(updated);
// //   } catch (err) {
// //     // Flowable's runtime/* endpoints 404 once the process instance has
// //     // completed — it's moved to history, so new comments can't be added.
// //     setError('This task has already been closed by someone else. Refresh to see the latest status — your comment could not be added.');
// //     // Optional: re-run load() here so `done` gets set and the page
// //     // stops showing an editable comment box.
// //     load();
// //   }
// // };
// //   const homePath = user ? getDashboardPath(user.role) : '/tasks';

// //   if (loading) {
// //     return (
// //       <div className="flex items-center justify-center min-h-[50vh]">
// //         <Loader2Icon className="w-6 h-6 animate-spin text-blue-600" />
// //       </div>
// //     );
// //   }

// //   if (error && !task) {
// //     return (
// //       <div className="p-8 max-w-xl mx-auto">
// //         <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
// //           <AlertCircleIcon className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
// //           <div>
// //             <p className="text-sm font-semibold text-red-700">Failed to load task</p>
// //             <p className="text-sm text-red-600 mt-0.5">{error}</p>
// //           </div>
// //         </div>
// //       </div>
// //     );
// //   }

// //   if (done) {
// //     return (
// //       <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-8">
// //         <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
// //           <CheckCircle2Icon className="w-8 h-8 text-green-600" />
// //         </div>
// //         <h2 className="text-xl font-semibold text-gray-900">Task Completed</h2>
// //         <button
// //           onClick={() => navigate(homePath)}
// //           className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
// //         >
// //           Back to Dashboard
// //         </button>
// //       </div>
// //     );
// //   }

// //   if (!task) return null;

// //   return (
// //     <div className="max-w-2xl mx-auto p-8">
// //       <button
// //         onClick={() => navigate(-1)}
// //         className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4"
// //       >
// //         <ArrowLeftIcon className="w-4 h-4" /> Back
// //       </button>

// //       {error && (
// //         <div className="mb-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
// //           <AlertCircleIcon className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
// //           <p className="text-sm text-red-600">{error}</p>
// //         </div>
// //       )}

// //       <div className="mb-6">
// //         <p className="text-xs text-gray-400 mb-1">Observation {gv('observationId') || '—'}</p>
// //         <div className="flex items-center gap-3">
// //           <h1 className="text-xl font-semibold text-gray-900">{task.name}</h1>
// //           <span className={`badge ${statusBadgeClass(gv('status'))}`}>
// //             {STATUS_LABELS[gv('status')] || gv('status') || '—'}
// //           </span>
// //         </div>
// //         {task.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
// //       </div>

// //       <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4">
// //         <CommentThread comments={comments} onAdd={handleAddComment} disabled={submitting} />
// //       </div>

// //       {attachments.length > 0 && (
// //         <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4">
// //           <h3 className="text-sm font-semibold text-gray-800 mb-3">Attachments</h3>
// //           <ul className="space-y-2">
// //             {attachments.map((a) => (
// //               <li key={a.id}>
// //                 <button
// //                   onClick={() => downloadAttachment(task.processInstanceId, a.id, a.name)}
// //                   className="text-sm text-blue-600 hover:underline"
// //                 >
// //                   {a.name}
// //                 </button>
// //               </li>
// //             ))}
// //           </ul>
// //         </div>
// //       )}

// //       <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
// //         {task.taskDefinitionKey === 'auditeeSubmitAction' && (
// //           <AtrAuditeeSubmitForm
// //             taskId={taskId!}
// //             processInstanceId={task.processInstanceId}
// //             userId={user?.id || ''}
// //             observationDescription={gv('observationDescription')}
// //             targetDate={gv('targetDate')}
// //             status={gv('status')}
// //             submitting={submitting}
// //             setSubmitting={setSubmitting}
// //             setError={setError}
// //             onSuccess={() => setDone(true)}
// //           />
// //         )}

// //         {task.taskDefinitionKey === 'auditorReviewEvidence' && (
// //           <AtrAuditorReviewForm
// //             taskId={taskId!}
// //             processInstanceId={task.processInstanceId}
// //             submitting={submitting}
// //             setSubmitting={setSubmitting}
// //             setError={setError}
// //             onSuccess={() => setDone(true)}
// //           />
// //         )}

// //         {task.taskDefinitionKey === 'commercialHeadApprovalTask' && (
// //           <AtrExtensionDecisionForm
// //             taskId={taskId!}
// //             caseInstanceId={task.caseInstanceId || ''}
// //             observationId={gv('observationId')}
// //             title="Commercial Head Decision"
// //             extensionReason={gv('extensionReason') || gv('requestedExtensionDate')}
// //             requestedExtensionDate={gv('requestedExtensionDate')}
// //             submitting={submitting}
// //             setSubmitting={setSubmitting}
// //             setError={setError}
// //             onSuccess={() => setDone(true)}
// //             decide={decideAtrCommercialExtension}
// //           />
// //         )}

// //         {task.taskDefinitionKey === 'functionalHeadApprovalTask' && (
// //           <AtrExtensionDecisionForm
// //             taskId={taskId!}
// //             caseInstanceId={task.caseInstanceId || ''}
// //             observationId={gv('observationId')}
// //             title="Functional Head Decision"
// //             extensionReason={gv('extensionReason')}
// //             requestedExtensionDate={gv('requestedExtensionDate')}
// //             submitting={submitting}
// //             setSubmitting={setSubmitting}
// //             setError={setError}
// //             onSuccess={() => setDone(true)}
// //             decide={decideAtrFunctionalExtension}
// //           />
// //         )}

// //         {![
// //           'auditeeSubmitAction',
// //           'auditorReviewEvidence',
// //           'commercialHeadApprovalTask',
// //           'functionalHeadApprovalTask',
// //         ].includes(task.taskDefinitionKey) && (
// //           <p className="text-sm text-gray-500">
// //             Unrecognized task type: <code>{task.taskDefinitionKey}</code>
// //           </p>
// //         )}
// //       </div>
// //     </div>
// //   );
// // }

// // // ============================================================
// // //  ATR_OBSERVATION_LIFECYCLE / ATR_EXTENSION_APPROVAL forms
// // //
// // //  These are the only task-completion forms in this file. The
// // //  earlier submitCorrectiveAction / reviewCorrectiveAction /
// // //  approveExtensionCommercial / approveExtensionFunctional forms
// // //  were removed — those taskDefinitionKeys don't exist in either
// // //  deployed definition (ATR_OBSERVATION_LIFECYCLE_bpmn20.xml only
// // //  has auditeeSubmitAction/auditorReviewEvidence;
// // //  ATR_EXTENSION_APPROVAL_cmmn.xml only has
// // //  commercialHeadApprovalTask/functionalHeadApprovalTask), so those
// // //  branches and their Node-route calls were unreachable dead code.
// // // ============================================================

// // // ── auditeeSubmitAction: SUBMIT / EXTENSION / CANCEL ──
// // // ─────────────────────────────────────────────────────────────
// // // PATCH for ObservationTask.tsx
// // //
// // // Two changes to AtrAuditeeSubmitForm:
// // //   1. Pass observationStatus through so a rejected/returned observation
// // //      shows a clear banner (not just the generic status badge above).
// // //   2. Block "Submit for Review" once targetDate has passed, with a
// // //      clear message — matches your "before the due date" requirement.
// // //      (Extension request stays enabled past the due date, since that's
// // //      the whole point of that button.)
// // // ─────────────────────────────────────────────────────────────

// // // 1) Where AtrAuditeeSubmitForm is rendered in ObservationTask(), add targetDate:
// // //
// // //   <AtrAuditeeSubmitForm
// // //     taskId={taskId!}
// // //     processInstanceId={task.processInstanceId}
// // //     userId={user?.id || ''}
// // //     observationDescription={gv('observationDescription')}
// // //     targetDate={gv('targetDate')}
// // //     status={gv('status')}
// // //     reviewComments={gv('reviewComments')}   // ← NEW: auditor's last rejection comment, if any
// // //     submitting={submitting}
// // //     setSubmitting={setSubmitting}
// // //     setError={setError}
// // //     onSuccess={() => setDone(true)}
// // //   />
// // //
// // // (reviewComments assumes the BPMN/your app persists the auditor's last
// // // comment as a process variable when auditorReviewEvidence completes —
// // // completeTask() already sends `comments` in the payload, so this just
// // // needs it readable back via getVariableValue. If it isn't currently
// // // stored as a variable, drop this piece and rely on the comment thread
// // // instead, which already shows it.)

// // // 2) Inside AtrAuditeeSubmitForm — updated signature and body:

// // function AtrAuditeeSubmitForm({
// //   taskId, processInstanceId, userId,
// //   observationDescription, targetDate, status, reviewComments,
// //   submitting, setSubmitting, setError, onSuccess,
// // }: {
// //   taskId: string;
// //   processInstanceId: string;
// //   userId: string;
// //   observationDescription: string;
// //   targetDate: string;
// //   status: string;
// //   reviewComments?: string;
// //   submitting: boolean;
// //   setSubmitting: (v: boolean) => void;
// //   setError: (v: string) => void;
// //   onSuccess: () => void;
// // }) {
// //   const [correctiveActionDetails, setCorrectiveActionDetails] = useState('');
// //   const [files, setFiles] = useState<File[]>([]);
// //   const [showExtensionModal, setShowExtensionModal] = useState(false);
// //   const [extensionReason, setExtensionReason] = useState('');
// //   const [requestedExtensionDate, setRequestedExtensionDate] = useState('');

// //   const isReturned = status === 'IN_PROGRESS' && !!reviewComments;

// //   // Compare by calendar date, not timestamp, so "due today" still counts
// //   // as on-time even if it's evening.
// //   const isPastDue = (() => {
// //     if (!targetDate) return false;
// //     const due = new Date(targetDate);
// //     if (isNaN(due.getTime())) return false;
// //     const today = new Date();
// //     due.setHours(23, 59, 59, 999);
// //     return today > due;
// //   })();

// //   const submitForReview = async () => {
// //     setSubmitting(true);
// //     setError('');
// //     try {
// //       if (files.length) {
// //         await uploadAttachments(taskId, files, userId);
// //       }
// //       await submitAtrAuditeeAction(taskId, {
// //         action: 'SUBMIT',
// //         correctiveActionDetails,
// //       });
// //       onSuccess();
// //     } catch (err) {
// //       setError(err instanceof Error ? err.message : 'Submit failed');
// //     } finally {
// //       setSubmitting(false);
// //     }
// //   };

// //   const cancelObservation = async () => {
// //     if (!window.confirm('Cancel this observation? This ends the workflow.')) return;
// //     setSubmitting(true);
// //     setError('');
// //     try {
// //       await submitAtrAuditeeAction(taskId, { action: 'CANCEL' });
// //       onSuccess();
// //     } catch (err) {
// //       setError(err instanceof Error ? err.message : 'Cancel failed');
// //     } finally {
// //       setSubmitting(false);
// //     }
// //   };

// //   const submitExtensionRequest = async () => {
// //     setSubmitting(true);
// //     setError('');
// //     try {
// //       await submitAtrAuditeeAction(taskId, {
// //         action: 'EXTENSION',
// //         extensionReason,
// //         requestedExtensionDate,
// //       }, processInstanceId);
// //       setShowExtensionModal(false);
// //       onSuccess();
// //     } catch (err) {
// //       setError(err instanceof Error ? err.message : 'Extension request failed');
// //     } finally {
// //       setSubmitting(false);
// //     }
// //   };

// //   return (
// //     <div>
// //       {isReturned && (
// //         <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
// //           <p className="font-medium">Returned by the auditor for revision</p>
// //           <p className="mt-0.5">{reviewComments}</p>
// //         </div>
// //       )}

// //       <div className="mb-5 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
// //         <p><span className="text-gray-400">Observation:</span> {observationDescription || '—'}</p>
// //         <p><span className="text-gray-400">Target date:</span> {targetDate || '—'} · <span className="text-gray-400">Status:</span> {status || '—'}</p>
// //       </div>

// //       {isPastDue && (
// //         <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
// //           The target date has passed. You can no longer submit for review — please request an extension instead.
// //         </div>
// //       )}

// //       <Field label="Corrective Action Details *">
// //         <textarea rows={5} className={inputCls} value={correctiveActionDetails}
// //           onChange={(e) => setCorrectiveActionDetails(e.target.value)}
// //           placeholder="Describe the corrective action taken..." disabled={isPastDue} />
// //       </Field>

// //       <div className="mb-5">
// //         <FileUpload files={files} onChange={setFiles} disabled={submitting || isPastDue} />
// //       </div>

// //       <div className="flex gap-3 mt-4">
// //         <button
// //           onClick={submitForReview}
// //           disabled={!correctiveActionDetails.trim() || submitting || isPastDue}
// //           className="flex-1 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
// //         >
// //           {submitting ? 'Submitting…' : 'Submit for Review'}
// //         </button>
// //         <button
// //           type="button"
// //           onClick={() => setShowExtensionModal(true)}
// //           disabled={submitting}
// //           className="flex-1 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
// //         >
// //           Request Extension
// //         </button>
// //         <button
// //           type="button"
// //           onClick={cancelObservation}
// //           disabled={submitting}
// //           className="px-5 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50"
// //         >
// //           Cancel
// //         </button>
// //       </div>

// //       {showExtensionModal && (
// //         <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
// //           <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
// //             <h3 className="text-lg font-semibold mb-4">Request Extension</h3>
// //             <Field label="Extension Reason *">
// //               <textarea rows={3} className={inputCls} value={extensionReason}
// //                 onChange={(e) => setExtensionReason(e.target.value)} />
// //             </Field>
// //             <Field label="Requested Target Date *">
// //               <input type="date" className={inputCls} value={requestedExtensionDate}
// //                 onChange={(e) => setRequestedExtensionDate(e.target.value)} />
// //             </Field>
// //             <p className="text-xs text-gray-400 mb-3">
// //               Goes to Commercial Head, then Functional Head for approval.
// //             </p>
// //             <div className="flex gap-2 mt-4">
// //               <button
// //                 onClick={submitExtensionRequest}
// //                 disabled={!extensionReason.trim() || !requestedExtensionDate || submitting}
// //                 className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
// //               >
// //                 Submit Request
// //               </button>
// //               <button
// //                 onClick={() => setShowExtensionModal(false)}
// //                 className="flex-1 py-2 border rounded-lg text-sm"
// //               >
// //                 Cancel
// //               </button>
// //             </div>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }
// // // ── auditorReviewEvidence: APPROVE / REJECT / INVALID / BLOCKED ──
// // function AtrAuditorReviewForm({
// //   taskId, processInstanceId, submitting, setSubmitting, setError, onSuccess,
// // }: {
// //   taskId: string;
// //   processInstanceId: string;
// //   submitting: boolean;
// //   setSubmitting: (v: boolean) => void;
// //   setError: (v: string) => void;
// //   onSuccess: () => void;
// // }) {
// //   const [reviewComments, setReviewComments] = useState('');

// //   const decide = async (reviewDecision: 'APPROVE' | 'REJECT' | 'INVALID' | 'BLOCKED') => {
// //     if ((reviewDecision === 'REJECT' || reviewDecision === 'BLOCKED') && !reviewComments.trim()) {
// //       setError('Comment is required for this decision.');
// //       return;
// //     }
// //     setSubmitting(true);
// //     setError('');
// //     try {
// //       // On APPROVE, this also drives the sendClosureNotification
// //       // external-worker job the process parks at right after — see
// //       // submitAtrAuditorReview in auditApi.ts.
// //       await submitAtrAuditorReview(taskId, { reviewDecision, reviewComments }, processInstanceId);
// //       onSuccess();
// //     } catch (err) {
// //       setError(err instanceof Error ? err.message : 'Review failed');
// //     } finally {
// //       setSubmitting(false);
// //     }
// //   };

// //   return (
// //     <div>
// //       <Field label="Review Comments">
// //         <textarea rows={4} className={inputCls} value={reviewComments}
// //           onChange={(e) => setReviewComments(e.target.value)}
// //           placeholder="Notes for the auditee (required on Reject / Blocked)..." />
// //       </Field>
// //       <div className="grid grid-cols-2 gap-2 mt-4">
// //         <button onClick={() => decide('APPROVE')} disabled={submitting}
// //           className="py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
// //           Approve
// //         </button>
// //         <button onClick={() => decide('REJECT')} disabled={submitting}
// //           className="py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
// //           Reject
// //         </button>
// //         <button onClick={() => decide('INVALID')} disabled={submitting}
// //           className="py-2.5 bg-gray-500 text-white rounded-lg text-sm font-medium disabled:opacity-50">
// //           Invalid
// //         </button>
// //         <button onClick={() => decide('BLOCKED')} disabled={submitting}
// //           className="py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium disabled:opacity-50">
// //           Blocked
// //         </button>
// //       </div>
// //     </div>
// //   );
// // }

// // // ── commercialHeadApprovalTask / functionalHeadApprovalTask (CMMN) ──
// // function AtrExtensionDecisionForm({
// //   taskId, caseInstanceId, observationId, title, extensionReason, requestedExtensionDate,
// //   submitting, setSubmitting, setError, onSuccess, decide,
// // }: {
// //   taskId: string;
// //   caseInstanceId: string;
// //   observationId: string;
// //   title: string;
// //   extensionReason: string;
// //   requestedExtensionDate: string;
// //   submitting: boolean;
// //   setSubmitting: (v: boolean) => void;
// //   setError: (v: string) => void;
// //   onSuccess: () => void;
// //   decide: (
// //     taskId: string,
// //     decision: 'APPROVE' | 'REJECT',
// //     caseInstanceId: string,
// //     observationId: string,
// //     comment?: string
// //   ) => Promise<void>;
// // }) {
// //   const [comment, setComment] = useState('');

// //   const act = async (decision: 'APPROVE' | 'REJECT') => {
// //     if (decision === 'REJECT' && !comment.trim()) {
// //       setError('Comment is required when rejecting.');
// //       return;
// //     }
// //     setSubmitting(true);
// //     setError('');
// //     try {
// //       await decide(taskId, decision, caseInstanceId, observationId, comment);
// //       onSuccess();
// //     } catch (err) {
// //       setError(err instanceof Error ? err.message : 'Decision failed');
// //     } finally {
// //       setSubmitting(false);
// //     }
// //   };

// //   return (
// //     <div>
// //       <div className="mb-5 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
// //         <p><span className="text-gray-400">Reason:</span> {extensionReason || '—'}</p>
// //         <p><span className="text-gray-400">Requested target date:</span> {requestedExtensionDate || '—'}</p>
// //       </div>
// //       <Field label={title}>
// //         <div className="flex gap-2 mt-2">
// //           <button onClick={() => act('APPROVE')} disabled={submitting}
// //             className="flex-1 py-2 text-sm font-medium rounded-lg bg-green-600 text-white disabled:opacity-50">
// //             Approve
// //           </button>
// //           <button onClick={() => act('REJECT')} disabled={submitting}
// //             className="flex-1 py-2 text-sm font-medium rounded-lg bg-red-600 text-white disabled:opacity-50">
// //             Reject
// //           </button>
// //         </div>
// //       </Field>
// //       <Field label="Comment">
// //         <textarea rows={3} className={inputCls} value={comment} onChange={(e) => setComment(e.target.value)} />
// //       </Field>
// //     </div>
// //   );
// // }

// import React, { useState, useEffect, useCallback } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { Loader2Icon, AlertCircleIcon, CheckCircle2Icon, ArrowLeftIcon } from 'lucide-react';
// import {
//   getTaskById,
//   getProcessVariables,
//   getVariableValue,
//   claimTask,
//   OBSERVATION_CANDIDATE_GROUPS,
//   isAtrCaseTask,
//   getAtrCaseTaskById,
//   getAtrCaseVariables,
//   getProcessInstanceComments,
//   addProcessInstanceComment,
//   getProcessInstanceAttachments,
//   uploadAttachments,
//   downloadAttachment,
//   FlowableTask,
//   ProcessVariable,
//   CommentEntry,
//   FlowableAttachment,
// } from './services/flowableApi';
// import {
//   submitAtrAuditeeAction,
//   submitAtrAuditorReview,
//   decideAtrCommercialExtension,
//   decideAtrFunctionalExtension,
// } from './services/auditApi';
// import { useAuth, getDashboardPath } from '../pages/AuthContext';
// import { FileUpload } from '../components/FileUpload';
// import { CommentThread } from '../components/CommentThread';
// import { STATUS_LABELS, statusBadgeClass } from '../constants/auditStatus';

// function Field({ label, children }: { label: string; children: React.ReactNode }) {
//   return (
//     <div className="mb-4">
//       <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
//       {children}
//     </div>
//   );
// }

// const inputCls =
//   'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent';

// export function ObservationTask() {
//   const { taskId } = useParams<{ taskId: string }>();
//   const navigate = useNavigate();
//   const { user } = useAuth();

//   const [task, setTask] = useState<FlowableTask | null>(null);
//   const [vars, setVars] = useState<ProcessVariable[]>([]);
//   const [comments, setComments] = useState<CommentEntry[]>([]);
//   const [attachments, setAttachments] = useState<FlowableAttachment[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [submitting, setSubmitting] = useState(false);
//   const [done, setDone] = useState(false);
//   // True when the logged-in user isn't this task's assignee — every ATR
//   // task (auditeeSubmitAction / auditorReviewEvidence /
//   // commercialHeadApprovalTask / functionalHeadApprovalTask) is assigned
//   // directly via flowable:assignee, so this is a straight equality check,
//   // not a candidate-group membership check.
//   const [unauthorized, setUnauthorized] = useState(false);

//   // const load = useCallback(async () => {
//   //   if (!taskId) return;
//   //   setLoading(true);
//   //   setError('');
//   //   try {
//   //     // commercialHeadApprovalTask / functionalHeadApprovalTask live in
//   //     // Flowable's CMMN engine, not the BPMN process engine, so a plain
//   //     // getTaskById() 404s for them. Try BPMN first (the common case),
//   //     // fall back to the CMMN task lookup.
//   //     let t: FlowableTask;
//   //     let isCase = false;
//   //     try {
//   //       t = await getTaskById(taskId);
//   //     } catch {
//   //       t = await getAtrCaseTaskById(taskId);
//   //       isCase = true;
//   //     }

//   //     const candidateGroup = OBSERVATION_CANDIDATE_GROUPS[t.taskDefinitionKey];
//   //     if (!isCase && candidateGroup && !t.assignee && user?.id) {
//   //       try {
//   //         await claimTask(t.id, user.id);
//   //         t = await getTaskById(taskId);
//   //       } catch (claimErr) {
//   //         setError(
//   //           claimErr instanceof Error
//   //             ? `Could not claim this task: ${claimErr.message}`
//   //             : 'Could not claim this task.'
//   //         );
//   //       }
//   //     }
//   //     // ATR case tasks (commercialHeadApprovalTask / functionalHeadApprovalTask)
//   //     // are assigned directly to commercialHeadId/functionalHeadId per the
//   //     // CMMN XML — no candidate-group claiming step needed.

//   //     setTask(t);
//   //     const v = isCase
//   //       ? await getAtrCaseVariables(t.caseInstanceId || '')
//   //       : await getProcessVariables(t.processInstanceId);
//   //     setVars(v);

//   //     // Comments/attachments are native Flowable resources scoped to a
//   //     // BPMN process instance. CMMN case tasks don't have one (they have
//   //     // a caseInstanceId instead), so skip both for case tasks rather
//   //     // than fetching against an id Flowable doesn't recognize.
//   //     if (!isCase) {
//   //       try {
//   //         setComments(await getProcessInstanceComments(t.processInstanceId));
//   //       } catch {
//   //         setComments([]);
//   //       }
//   //       try {
//   //         setAttachments(await getProcessInstanceAttachments(t.processInstanceId));
//   //       } catch {
//   //         setAttachments([]);
//   //       }
//   //     } else {
//   //       setComments([]);
//   //       setAttachments([]);
//   //     }
//   //   } catch (err) {
//   //     setError(err instanceof Error ? err.message : 'Failed to load task');
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // }, [taskId, user?.id]);

//   const load = useCallback(async () => {
//   if (!taskId) return;
//   setLoading(true);
//   setError('');
//   setUnauthorized(false);
//   try {
//     // commercialHeadApprovalTask / functionalHeadApprovalTask live in
//     // Flowable's CMMN engine, not the BPMN process engine, so a plain
//     // getTaskById() 404s for them. Try BPMN first (the common case),
//     // fall back to the CMMN task lookup.
//     let t: FlowableTask;
//     let isCase = false;
//     try {
//       t = await getTaskById(taskId);
//     } catch {
//       t = await getAtrCaseTaskById(taskId);
//       isCase = true;
//     }

//     const candidateGroup = OBSERVATION_CANDIDATE_GROUPS[t.taskDefinitionKey];
//     if (!isCase && candidateGroup && !t.assignee && user?.id) {
//       try {
//         await claimTask(t.id, user.id);
//         t = await getTaskById(taskId);
//       } catch (claimErr) {
//         setError(
//           claimErr instanceof Error
//             ? `Could not claim this task: ${claimErr.message}`
//             : 'Could not claim this task.'
//         );
//       }
//     }
//     // ATR case tasks (commercialHeadApprovalTask / functionalHeadApprovalTask)
//     // are assigned directly to commercialHeadId/functionalHeadId per the
//     // CMMN XML — no candidate-group claiming step needed.

//     // Ownership check: this route previously rendered whatever task the
//     // URL pointed at for ANY logged-in user, with no check that they were
//     // actually the assignee. That let e.g. an auditee land on the
//     // auditor's "Review Evidence" task (browser Back button, a stale
//     // link, etc.) and see/act on someone else's task. Every ATR task is
//     // assigned directly (flowable:assignee="${...}"), so a straight
//     // equality check is enough — no candidate-group logic needed here.
//     if (t.assignee && user?.id && t.assignee !== user.id) {
//       setUnauthorized(true);
//       setTask(t);
//       setLoading(false);
//       return;
//     }

//     setTask(t);
//     const v = isCase
//       ? await getAtrCaseVariables(t.caseInstanceId || '')
//       : await getProcessVariables(t.processInstanceId);
//     setVars(v);

//     // Comments/attachments are native Flowable resources scoped to a
//     // BPMN process instance. CMMN case tasks don't have one (they have
//     // a caseInstanceId instead), so skip both for case tasks rather
//     // than fetching against an id Flowable doesn't recognize.
//     if (!isCase) {
//       try {
//         setComments(await getProcessInstanceComments(t.processInstanceId));
//       } catch {
//         // NOTE: getTaskById(taskId) above already succeeded, which is the
//         // real signal that this task/process is still open — Flowable's
//         // runtime/* endpoints only 404 once a process instance has
//         // actually completed and moved to history. A 404 here just means
//         // the comments sub-resource has nothing to return yet (or hit a
//         // transient issue); it says nothing about whether the *task* is
//         // done, so it must never be used to infer completion. Previously
//         // this incorrectly called setDone(true) on any 404, which made
//         // freshly-created, still-open tasks show "Task Completed" the
//         // moment someone opened them. Just show an empty comment list.
//         setComments([]);
//       }
//       try {
//         setAttachments(await getProcessInstanceAttachments(t.processInstanceId));
//       } catch {
//         setAttachments([]);
//       }
//     } else {
//       setComments([]);
//       setAttachments([]);
//     }
//   } catch (err) {
//     setError(err instanceof Error ? err.message : 'Failed to load task');
//   } finally {
//     setLoading(false);
//   }
// }, [taskId, user?.id]);
//   useEffect(() => { load(); }, [load]);

//   const gv = (name: string) => getVariableValue(vars, name);

//   const handleAddComment = async (text: string) => {
//   if (!task || !user) return;
//   try {
//     const updated = await addProcessInstanceComment(task.processInstanceId, {
//       authorId: user.id,
//       authorName: user.name,
//       role: user.role,
//       text,
//     });
//     setComments(updated);
//   } catch (err) {
//     // Flowable's runtime/* endpoints 404 once the process instance has
//     // completed — it's moved to history, so new comments can't be added.
//     setError('This task has already been closed by someone else. Refresh to see the latest status — your comment could not be added.');
//     // Optional: re-run load() here so `done` gets set and the page
//     // stops showing an editable comment box.
//     load();
//   }
// };
//   const homePath = user ? getDashboardPath(user.role) : '/tasks';

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-[50vh]">
//         <Loader2Icon className="w-6 h-6 animate-spin text-blue-600" />
//       </div>
//     );
//   }

//   if (unauthorized) {
//     return (
//       <div className="p-8 max-w-xl mx-auto">
//         <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
//           <AlertCircleIcon className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
//           <div>
//             <p className="text-sm font-semibold text-amber-800">This task isn't assigned to you</p>
//             <p className="text-sm text-amber-700 mt-0.5">
//               {task?.name ? `"${task.name}" ` : 'This task '}belongs to someone else and can't be opened here.
//             </p>
//           </div>
//         </div>
//         <button
//           onClick={() => navigate(homePath)}
//           className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
//         >
//           Back to Dashboard
//         </button>
//       </div>
//     );
//   }

//   if (error && !task) {
//     return (
//       <div className="p-8 max-w-xl mx-auto">
//         <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
//           <AlertCircleIcon className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
//           <div>
//             <p className="text-sm font-semibold text-red-700">Failed to load task</p>
//             <p className="text-sm text-red-600 mt-0.5">{error}</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (done) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-8">
//         <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
//           <CheckCircle2Icon className="w-8 h-8 text-green-600" />
//         </div>
//         <h2 className="text-xl font-semibold text-gray-900">Task Completed</h2>
//         <button
//           onClick={() => navigate(homePath)}
//           className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
//         >
//           Back to Dashboard
//         </button>
//       </div>
//     );
//   }

//   if (!task) return null;

//   return (
//     <div className="max-w-2xl mx-auto p-8">
//       <button
//         onClick={() => navigate(-1)}
//         className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4"
//       >
//         <ArrowLeftIcon className="w-4 h-4" /> Back
//       </button>

//       {error && (
//         <div className="mb-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
//           <AlertCircleIcon className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
//           <p className="text-sm text-red-600">{error}</p>
//         </div>
//       )}

//       <div className="mb-6">
//         <p className="text-xs text-gray-400 mb-1">Observation {gv('observationId') || '—'}</p>
//         <div className="flex items-center gap-3">
//           <h1 className="text-xl font-semibold text-gray-900">{task.name}</h1>
//           <span className={`badge ${statusBadgeClass(gv('status'))}`}>
//             {STATUS_LABELS[gv('status')] || gv('status') || '—'}
//           </span>
//         </div>
//         {task.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
//       </div>

//       <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4">
//         <CommentThread comments={comments} onAdd={handleAddComment} disabled={submitting} />
//       </div>

//       {attachments.length > 0 && (
//         <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4">
//           <h3 className="text-sm font-semibold text-gray-800 mb-3">Attachments</h3>
//           <ul className="space-y-2">
//             {attachments.map((a) => (
//               <li key={a.id}>
//                 <button
//                   onClick={() => downloadAttachment(task.processInstanceId, a.id, a.name)}
//                   className="text-sm text-blue-600 hover:underline"
//                 >
//                   {a.name}
//                 </button>
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
//         {task.taskDefinitionKey === 'auditeeSubmitAction' && (
//           <AtrAuditeeSubmitForm
//             taskId={taskId!}
//             processInstanceId={task.processInstanceId}
//             userId={user?.id || ''}
//             observationDescription={gv('observationDescription')}
//             targetDate={gv('targetDate')}
//             status={gv('status')}
//             submitting={submitting}
//             setSubmitting={setSubmitting}
//             setError={setError}
//             onSuccess={() => setDone(true)}
//           />
//         )}

//         {task.taskDefinitionKey === 'auditorReviewEvidence' && (
//           <AtrAuditorReviewForm
//             taskId={taskId!}
//             processInstanceId={task.processInstanceId}
//             submitting={submitting}
//             setSubmitting={setSubmitting}
//             setError={setError}
//             onSuccess={() => setDone(true)}
//           />
//         )}

//         {task.taskDefinitionKey === 'commercialHeadApprovalTask' && (
//           <AtrExtensionDecisionForm
//             taskId={taskId!}
//             caseInstanceId={task.caseInstanceId || ''}
//             observationId={gv('observationId')}
//             title="Commercial Head Decision"
//             extensionReason={gv('extensionReason') || gv('requestedExtensionDate')}
//             requestedExtensionDate={gv('requestedExtensionDate')}
//             submitting={submitting}
//             setSubmitting={setSubmitting}
//             setError={setError}
//             onSuccess={() => setDone(true)}
//             decide={decideAtrCommercialExtension}
//           />
//         )}

//         {task.taskDefinitionKey === 'functionalHeadApprovalTask' && (
//           <AtrExtensionDecisionForm
//             taskId={taskId!}
//             caseInstanceId={task.caseInstanceId || ''}
//             observationId={gv('observationId')}
//             title="Functional Head Decision"
//             extensionReason={gv('extensionReason')}
//             requestedExtensionDate={gv('requestedExtensionDate')}
//             submitting={submitting}
//             setSubmitting={setSubmitting}
//             setError={setError}
//             onSuccess={() => setDone(true)}
//             decide={decideAtrFunctionalExtension}
//           />
//         )}

//         {![
//           'auditeeSubmitAction',
//           'auditorReviewEvidence',
//           'commercialHeadApprovalTask',
//           'functionalHeadApprovalTask',
//         ].includes(task.taskDefinitionKey) && (
//           <p className="text-sm text-gray-500">
//             Unrecognized task type: <code>{task.taskDefinitionKey}</code>
//           </p>
//         )}
//       </div>
//     </div>
//   );
// }

// // ============================================================
// //  ATR_OBSERVATION_LIFECYCLE / ATR_EXTENSION_APPROVAL forms
// //
// //  These are the only task-completion forms in this file. The
// //  earlier submitCorrectiveAction / reviewCorrectiveAction /
// //  approveExtensionCommercial / approveExtensionFunctional forms
// //  were removed — those taskDefinitionKeys don't exist in either
// //  deployed definition (ATR_OBSERVATION_LIFECYCLE_bpmn20.xml only
// //  has auditeeSubmitAction/auditorReviewEvidence;
// //  ATR_EXTENSION_APPROVAL_cmmn.xml only has
// //  commercialHeadApprovalTask/functionalHeadApprovalTask), so those
// //  branches and their Node-route calls were unreachable dead code.
// // ============================================================

// // ── auditeeSubmitAction: SUBMIT / EXTENSION / CANCEL ──
// // ─────────────────────────────────────────────────────────────
// // PATCH for ObservationTask.tsx
// //
// // Two changes to AtrAuditeeSubmitForm:
// //   1. Pass observationStatus through so a rejected/returned observation
// //      shows a clear banner (not just the generic status badge above).
// //   2. Block "Submit for Review" once targetDate has passed, with a
// //      clear message — matches your "before the due date" requirement.
// //      (Extension request stays enabled past the due date, since that's
// //      the whole point of that button.)
// // ─────────────────────────────────────────────────────────────

// // 1) Where AtrAuditeeSubmitForm is rendered in ObservationTask(), add targetDate:
// //
// //   <AtrAuditeeSubmitForm
// //     taskId={taskId!}
// //     processInstanceId={task.processInstanceId}
// //     userId={user?.id || ''}
// //     observationDescription={gv('observationDescription')}
// //     targetDate={gv('targetDate')}
// //     status={gv('status')}
// //     reviewComments={gv('reviewComments')}   // ← NEW: auditor's last rejection comment, if any
// //     submitting={submitting}
// //     setSubmitting={setSubmitting}
// //     setError={setError}
// //     onSuccess={() => setDone(true)}
// //   />
// //
// // (reviewComments assumes the BPMN/your app persists the auditor's last
// // comment as a process variable when auditorReviewEvidence completes —
// // completeTask() already sends `comments` in the payload, so this just
// // needs it readable back via getVariableValue. If it isn't currently
// // stored as a variable, drop this piece and rely on the comment thread
// // instead, which already shows it.)

// // 2) Inside AtrAuditeeSubmitForm — updated signature and body:

// function AtrAuditeeSubmitForm({
//   taskId, processInstanceId, userId,
//   observationDescription, targetDate, status, reviewComments,
//   submitting, setSubmitting, setError, onSuccess,
// }: {
//   taskId: string;
//   processInstanceId: string;
//   userId: string;
//   observationDescription: string;
//   targetDate: string;
//   status: string;
//   reviewComments?: string;
//   submitting: boolean;
//   setSubmitting: (v: boolean) => void;
//   setError: (v: string) => void;
//   onSuccess: () => void;
// }) {
//   const [correctiveActionDetails, setCorrectiveActionDetails] = useState('');
//   const [files, setFiles] = useState<File[]>([]);
//   const [showExtensionModal, setShowExtensionModal] = useState(false);
//   const [extensionReason, setExtensionReason] = useState('');
//   const [requestedExtensionDate, setRequestedExtensionDate] = useState('');

//   const isReturned = status === 'IN_PROGRESS' && !!reviewComments;

//   // Compare by calendar date, not timestamp, so "due today" still counts
//   // as on-time even if it's evening.
//   const isPastDue = (() => {
//     if (!targetDate) return false;
//     const due = new Date(targetDate);
//     if (isNaN(due.getTime())) return false;
//     const today = new Date();
//     due.setHours(23, 59, 59, 999);
//     return today > due;
//   })();

//   const submitForReview = async () => {
//     setSubmitting(true);
//     setError('');
//     try {
//       if (files.length) {
//         await uploadAttachments(taskId, files, userId);
//       }
//       await submitAtrAuditeeAction(taskId, {
//         action: 'SUBMIT',
//         correctiveActionDetails,
//       });
//       onSuccess();
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Submit failed');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const cancelObservation = async () => {
//     if (!window.confirm('Cancel this observation? This ends the workflow.')) return;
//     setSubmitting(true);
//     setError('');
//     try {
//       await submitAtrAuditeeAction(taskId, { action: 'CANCEL' });
//       onSuccess();
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Cancel failed');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const submitExtensionRequest = async () => {
//     setSubmitting(true);
//     setError('');
//     try {
//       await submitAtrAuditeeAction(taskId, {
//         action: 'EXTENSION',
//         extensionReason,
//         requestedExtensionDate,
//       }, processInstanceId);
//       setShowExtensionModal(false);
//       onSuccess();
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Extension request failed');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <div>
//       {isReturned && (
//         <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
//           <p className="font-medium">Returned by the auditor for revision</p>
//           <p className="mt-0.5">{reviewComments}</p>
//         </div>
//       )}

//       <div className="mb-5 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
//         <p><span className="text-gray-400">Observation:</span> {observationDescription || '—'}</p>
//         <p><span className="text-gray-400">Target date:</span> {targetDate || '—'} · <span className="text-gray-400">Status:</span> {status || '—'}</p>
//       </div>

//       {isPastDue && (
//         <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
//           The target date has passed. You can no longer submit for review — please request an extension instead.
//         </div>
//       )}

//       <Field label="Corrective Action Details *">
//         <textarea rows={5} className={inputCls} value={correctiveActionDetails}
//           onChange={(e) => setCorrectiveActionDetails(e.target.value)}
//           placeholder="Describe the corrective action taken..." disabled={isPastDue} />
//       </Field>

//       <div className="mb-5">
//         <FileUpload files={files} onChange={setFiles} disabled={submitting || isPastDue} />
//       </div>

//       <div className="flex gap-3 mt-4">
//         <button
//           onClick={submitForReview}
//           disabled={!correctiveActionDetails.trim() || submitting || isPastDue}
//           className="flex-1 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
//         >
//           {submitting ? 'Submitting…' : 'Submit for Review'}
//         </button>
//         <button
//           type="button"
//           onClick={() => setShowExtensionModal(true)}
//           disabled={submitting}
//           className="flex-1 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
//         >
//           Request Extension
//         </button>
//         <button
//           type="button"
//           onClick={cancelObservation}
//           disabled={submitting}
//           className="px-5 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50"
//         >
//           Cancel
//         </button>
//       </div>

//       {showExtensionModal && (
//         <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
//             <h3 className="text-lg font-semibold mb-4">Request Extension</h3>
//             <Field label="Extension Reason *">
//               <textarea rows={3} className={inputCls} value={extensionReason}
//                 onChange={(e) => setExtensionReason(e.target.value)} />
//             </Field>
//             <Field label="Requested Target Date *">
//               <input type="date" className={inputCls} value={requestedExtensionDate}
//                 onChange={(e) => setRequestedExtensionDate(e.target.value)} />
//             </Field>
//             <p className="text-xs text-gray-400 mb-3">
//               Goes to Commercial Head, then Functional Head for approval.
//             </p>
//             <div className="flex gap-2 mt-4">
//               <button
//                 onClick={submitExtensionRequest}
//                 disabled={!extensionReason.trim() || !requestedExtensionDate || submitting}
//                 className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
//               >
//                 Submit Request
//               </button>
//               <button
//                 onClick={() => setShowExtensionModal(false)}
//                 className="flex-1 py-2 border rounded-lg text-sm"
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
// // ── auditorReviewEvidence: APPROVE / REJECT / INVALID / BLOCKED ──
// function AtrAuditorReviewForm({
//   taskId, processInstanceId, submitting, setSubmitting, setError, onSuccess,
// }: {
//   taskId: string;
//   processInstanceId: string;
//   submitting: boolean;
//   setSubmitting: (v: boolean) => void;
//   setError: (v: string) => void;
//   onSuccess: () => void;
// }) {
//   const [reviewComments, setReviewComments] = useState('');

//   const decide = async (reviewDecision: 'APPROVE' | 'REJECT' | 'INVALID' | 'BLOCKED') => {
//     if ((reviewDecision === 'REJECT' || reviewDecision === 'BLOCKED') && !reviewComments.trim()) {
//       setError('Comment is required for this decision.');
//       return;
//     }
//     setSubmitting(true);
//     setError('');
//     try {
//       // On APPROVE, this also drives the sendClosureNotification
//       // external-worker job the process parks at right after — see
//       // submitAtrAuditorReview in auditApi.ts.
//       await submitAtrAuditorReview(taskId, { reviewDecision, reviewComments }, processInstanceId);
//       onSuccess();
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Review failed');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <div>
//       <Field label="Review Comments">
//         <textarea rows={4} className={inputCls} value={reviewComments}
//           onChange={(e) => setReviewComments(e.target.value)}
//           placeholder="Notes for the auditee (required on Reject / Blocked)..." />
//       </Field>
//       <div className="grid grid-cols-2 gap-2 mt-4">
//         <button onClick={() => decide('APPROVE')} disabled={submitting}
//           className="py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
//           Approve
//         </button>
//         <button onClick={() => decide('REJECT')} disabled={submitting}
//           className="py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
//           Reject
//         </button>
//         <button onClick={() => decide('INVALID')} disabled={submitting}
//           className="py-2.5 bg-gray-500 text-white rounded-lg text-sm font-medium disabled:opacity-50">
//           Invalid
//         </button>
//         <button onClick={() => decide('BLOCKED')} disabled={submitting}
//           className="py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium disabled:opacity-50">
//           Blocked
//         </button>
//       </div>
//     </div>
//   );
// }

// // ── commercialHeadApprovalTask / functionalHeadApprovalTask (CMMN) ──
// function AtrExtensionDecisionForm({
//   taskId, caseInstanceId, observationId, title, extensionReason, requestedExtensionDate,
//   submitting, setSubmitting, setError, onSuccess, decide,
// }: {
//   taskId: string;
//   caseInstanceId: string;
//   observationId: string;
//   title: string;
//   extensionReason: string;
//   requestedExtensionDate: string;
//   submitting: boolean;
//   setSubmitting: (v: boolean) => void;
//   setError: (v: string) => void;
//   onSuccess: () => void;
//   decide: (
//     taskId: string,
//     decision: 'APPROVE' | 'REJECT',
//     caseInstanceId: string,
//     observationId: string,
//     comment?: string
//   ) => Promise<void>;
// }) {
//   const [comment, setComment] = useState('');

//   const act = async (decision: 'APPROVE' | 'REJECT') => {
//     if (decision === 'REJECT' && !comment.trim()) {
//       setError('Comment is required when rejecting.');
//       return;
//     }
//     setSubmitting(true);
//     setError('');
//     try {
//       await decide(taskId, decision, caseInstanceId, observationId, comment);
//       onSuccess();
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Decision failed');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <div>
//       <div className="mb-5 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
//         <p><span className="text-gray-400">Reason:</span> {extensionReason || '—'}</p>
//         <p><span className="text-gray-400">Requested target date:</span> {requestedExtensionDate || '—'}</p>
//       </div>
//       <Field label={title}>
//         <div className="flex gap-2 mt-2">
//           <button onClick={() => act('APPROVE')} disabled={submitting}
//             className="flex-1 py-2 text-sm font-medium rounded-lg bg-green-600 text-white disabled:opacity-50">
//             Approve
//           </button>
//           <button onClick={() => act('REJECT')} disabled={submitting}
//             className="flex-1 py-2 text-sm font-medium rounded-lg bg-red-600 text-white disabled:opacity-50">
//             Reject
//           </button>
//         </div>
//       </Field>
//       <Field label="Comment">
//         <textarea rows={3} className={inputCls} value={comment} onChange={(e) => setComment(e.target.value)} />
//       </Field>
//     </div>
//   );
// }

// import React, { useState, useEffect, useCallback } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { Loader2Icon, AlertCircleIcon, CheckCircle2Icon, ArrowLeftIcon } from 'lucide-react';
// import {
//   getTaskById,
//   getProcessVariables,
//   getVariableValue,
//   claimTask,
//   OBSERVATION_CANDIDATE_GROUPS,
//   isAtrCaseTask,
//   getAtrCaseTaskById,
//   getAtrCaseVariables,
//   getProcessInstanceComments,
//   addProcessInstanceComment,
//   getProcessInstanceAttachments,
//   uploadAttachments,
//   downloadAttachment,
//   FlowableTask,
//   ProcessVariable,
//   CommentEntry,
//   FlowableAttachment,
// } from './services/flowableApi';
// import {
//   submitAtrAuditeeAction,
//   submitAtrAuditorReview,
//   decideAtrCommercialExtension,
//   decideAtrFunctionalExtension,
// } from './services/auditApi';
// import { useAuth, getDashboardPath } from '../pages/AuthContext';
// import { FileUpload } from '../components/FileUpload';
// import { CommentThread } from '../components/CommentThread';
// import { STATUS_LABELS, statusBadgeClass } from '../constants/auditStatus';

// function Field({ label, children }: { label: string; children: React.ReactNode }) {
//   return (
//     <div className="mb-4">
//       <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
//       {children}
//     </div>
//   );
// }

// const inputCls =
//   'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent';

// export function ObservationTask() {
//   const { taskId } = useParams<{ taskId: string }>();
//   const navigate = useNavigate();
//   const { user } = useAuth();

//   const [task, setTask] = useState<FlowableTask | null>(null);
//   const [vars, setVars] = useState<ProcessVariable[]>([]);
//   const [comments, setComments] = useState<CommentEntry[]>([]);
//   const [attachments, setAttachments] = useState<FlowableAttachment[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [submitting, setSubmitting] = useState(false);
//   const [done, setDone] = useState(false);

//   // const load = useCallback(async () => {
//   //   if (!taskId) return;
//   //   setLoading(true);
//   //   setError('');
//   //   try {
//   //     // commercialHeadApprovalTask / functionalHeadApprovalTask live in
//   //     // Flowable's CMMN engine, not the BPMN process engine, so a plain
//   //     // getTaskById() 404s for them. Try BPMN first (the common case),
//   //     // fall back to the CMMN task lookup.
//   //     let t: FlowableTask;
//   //     let isCase = false;
//   //     try {
//   //       t = await getTaskById(taskId);
//   //     } catch {
//   //       t = await getAtrCaseTaskById(taskId);
//   //       isCase = true;
//   //     }

//   //     const candidateGroup = OBSERVATION_CANDIDATE_GROUPS[t.taskDefinitionKey];
//   //     if (!isCase && candidateGroup && !t.assignee && user?.id) {
//   //       try {
//   //         await claimTask(t.id, user.id);
//   //         t = await getTaskById(taskId);
//   //       } catch (claimErr) {
//   //         setError(
//   //           claimErr instanceof Error
//   //             ? `Could not claim this task: ${claimErr.message}`
//   //             : 'Could not claim this task.'
//   //         );
//   //       }
//   //     }
//   //     // ATR case tasks (commercialHeadApprovalTask / functionalHeadApprovalTask)
//   //     // are assigned directly to commercialHeadId/functionalHeadId per the
//   //     // CMMN XML — no candidate-group claiming step needed.

//   //     setTask(t);
//   //     const v = isCase
//   //       ? await getAtrCaseVariables(t.caseInstanceId || '')
//   //       : await getProcessVariables(t.processInstanceId);
//   //     setVars(v);

//   //     // Comments/attachments are native Flowable resources scoped to a
//   //     // BPMN process instance. CMMN case tasks don't have one (they have
//   //     // a caseInstanceId instead), so skip both for case tasks rather
//   //     // than fetching against an id Flowable doesn't recognize.
//   //     if (!isCase) {
//   //       try {
//   //         setComments(await getProcessInstanceComments(t.processInstanceId));
//   //       } catch {
//   //         setComments([]);
//   //       }
//   //       try {
//   //         setAttachments(await getProcessInstanceAttachments(t.processInstanceId));
//   //       } catch {
//   //         setAttachments([]);
//   //       }
//   //     } else {
//   //       setComments([]);
//   //       setAttachments([]);
//   //     }
//   //   } catch (err) {
//   //     setError(err instanceof Error ? err.message : 'Failed to load task');
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // }, [taskId, user?.id]);

//   const load = useCallback(async () => {
//   if (!taskId) return;
//   setLoading(true);
//   setError('');
//   try {
//     // commercialHeadApprovalTask / functionalHeadApprovalTask live in
//     // Flowable's CMMN engine, not the BPMN process engine, so a plain
//     // getTaskById() 404s for them. Try BPMN first (the common case),
//     // fall back to the CMMN task lookup.
//     let t: FlowableTask;
//     let isCase = false;
//     try {
//       t = await getTaskById(taskId);
//     } catch {
//       t = await getAtrCaseTaskById(taskId);
//       isCase = true;
//     }

//     const candidateGroup = OBSERVATION_CANDIDATE_GROUPS[t.taskDefinitionKey];
//     if (!isCase && candidateGroup && !t.assignee && user?.id) {
//       try {
//         await claimTask(t.id, user.id);
//         t = await getTaskById(taskId);
//       } catch (claimErr) {
//         setError(
//           claimErr instanceof Error
//             ? `Could not claim this task: ${claimErr.message}`
//             : 'Could not claim this task.'
//         );
//       }
//     }
//     // ATR case tasks (commercialHeadApprovalTask / functionalHeadApprovalTask)
//     // are assigned directly to commercialHeadId/functionalHeadId per the
//     // CMMN XML — no candidate-group claiming step needed.

//     setTask(t);
//     const v = isCase
//       ? await getAtrCaseVariables(t.caseInstanceId || '')
//       : await getProcessVariables(t.processInstanceId);
//     setVars(v);

//     // Comments/attachments are native Flowable resources scoped to a
//     // BPMN process instance. CMMN case tasks don't have one (they have
//     // a caseInstanceId instead), so skip both for case tasks rather
//     // than fetching against an id Flowable doesn't recognize.
//     if (!isCase) {
//       try {
//         setComments(await getProcessInstanceComments(t.processInstanceId));
//       } catch {
//         // NOTE: getTaskById(taskId) above already succeeded, which is the
//         // real signal that this task/process is still open — Flowable's
//         // runtime/* endpoints only 404 once a process instance has
//         // actually completed and moved to history. A 404 here just means
//         // the comments sub-resource has nothing to return yet (or hit a
//         // transient issue); it says nothing about whether the *task* is
//         // done, so it must never be used to infer completion. Previously
//         // this incorrectly called setDone(true) on any 404, which made
//         // freshly-created, still-open tasks show "Task Completed" the
//         // moment someone opened them. Just show an empty comment list.
//         setComments([]);
//       }
//       try {
//         setAttachments(await getProcessInstanceAttachments(t.processInstanceId));
//       } catch {
//         setAttachments([]);
//       }
//     } else {
//       setComments([]);
//       setAttachments([]);
//     }
//   } catch (err) {
//     setError(err instanceof Error ? err.message : 'Failed to load task');
//   } finally {
//     setLoading(false);
//   }
// }, [taskId, user?.id]);
//   useEffect(() => { load(); }, [load]);

//   const gv = (name: string) => getVariableValue(vars, name);

//   const handleAddComment = async (text: string) => {
//   if (!task || !user) return;
//   try {
//     const updated = await addProcessInstanceComment(task.processInstanceId, {
//       authorId: user.id,
//       authorName: user.name,
//       role: user.role,
//       text,
//     });
//     setComments(updated);
//   } catch (err) {
//     // Flowable's runtime/* endpoints 404 once the process instance has
//     // completed — it's moved to history, so new comments can't be added.
//     setError('This task has already been closed by someone else. Refresh to see the latest status — your comment could not be added.');
//     // Optional: re-run load() here so `done` gets set and the page
//     // stops showing an editable comment box.
//     load();
//   }
// };
//   const homePath = user ? getDashboardPath(user.role) : '/tasks';

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-[50vh]">
//         <Loader2Icon className="w-6 h-6 animate-spin text-blue-600" />
//       </div>
//     );
//   }

//   if (error && !task) {
//     return (
//       <div className="p-8 max-w-xl mx-auto">
//         <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
//           <AlertCircleIcon className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
//           <div>
//             <p className="text-sm font-semibold text-red-700">Failed to load task</p>
//             <p className="text-sm text-red-600 mt-0.5">{error}</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (done) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-8">
//         <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
//           <CheckCircle2Icon className="w-8 h-8 text-green-600" />
//         </div>
//         <h2 className="text-xl font-semibold text-gray-900">Task Completed</h2>
//         <button
//           onClick={() => navigate(homePath)}
//           className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
//         >
//           Back to Dashboard
//         </button>
//       </div>
//     );
//   }

//   if (!task) return null;

//   return (
//     <div className="max-w-2xl mx-auto p-8">
//       <button
//         onClick={() => navigate(-1)}
//         className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4"
//       >
//         <ArrowLeftIcon className="w-4 h-4" /> Back
//       </button>

//       {error && (
//         <div className="mb-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
//           <AlertCircleIcon className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
//           <p className="text-sm text-red-600">{error}</p>
//         </div>
//       )}

//       <div className="mb-6">
//         <p className="text-xs text-gray-400 mb-1">Observation {gv('observationId') || '—'}</p>
//         <div className="flex items-center gap-3">
//           <h1 className="text-xl font-semibold text-gray-900">{task.name}</h1>
//           <span className={`badge ${statusBadgeClass(gv('status'))}`}>
//             {STATUS_LABELS[gv('status')] || gv('status') || '—'}
//           </span>
//         </div>
//         {task.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
//       </div>

//       <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4">
//         <CommentThread comments={comments} onAdd={handleAddComment} disabled={submitting} />
//       </div>

//       {attachments.length > 0 && (
//         <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4">
//           <h3 className="text-sm font-semibold text-gray-800 mb-3">Attachments</h3>
//           <ul className="space-y-2">
//             {attachments.map((a) => (
//               <li key={a.id}>
//                 <button
//                   onClick={() => downloadAttachment(task.processInstanceId, a.id, a.name)}
//                   className="text-sm text-blue-600 hover:underline"
//                 >
//                   {a.name}
//                 </button>
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
//         {task.taskDefinitionKey === 'auditeeSubmitAction' && (
//           <AtrAuditeeSubmitForm
//             taskId={taskId!}
//             processInstanceId={task.processInstanceId}
//             userId={user?.id || ''}
//             observationDescription={gv('observationDescription')}
//             targetDate={gv('targetDate')}
//             status={gv('status')}
//             submitting={submitting}
//             setSubmitting={setSubmitting}
//             setError={setError}
//             onSuccess={() => setDone(true)}
//           />
//         )}

//         {task.taskDefinitionKey === 'auditorReviewEvidence' && (
//           <AtrAuditorReviewForm
//             taskId={taskId!}
//             processInstanceId={task.processInstanceId}
//             submitting={submitting}
//             setSubmitting={setSubmitting}
//             setError={setError}
//             onSuccess={() => setDone(true)}
//           />
//         )}

//         {task.taskDefinitionKey === 'commercialHeadApprovalTask' && (
//           <AtrExtensionDecisionForm
//             taskId={taskId!}
//             caseInstanceId={task.caseInstanceId || ''}
//             observationId={gv('observationId')}
//             title="Commercial Head Decision"
//             extensionReason={gv('extensionReason') || gv('requestedExtensionDate')}
//             requestedExtensionDate={gv('requestedExtensionDate')}
//             submitting={submitting}
//             setSubmitting={setSubmitting}
//             setError={setError}
//             onSuccess={() => setDone(true)}
//             decide={decideAtrCommercialExtension}
//           />
//         )}

//         {task.taskDefinitionKey === 'functionalHeadApprovalTask' && (
//           <AtrExtensionDecisionForm
//             taskId={taskId!}
//             caseInstanceId={task.caseInstanceId || ''}
//             observationId={gv('observationId')}
//             title="Functional Head Decision"
//             extensionReason={gv('extensionReason')}
//             requestedExtensionDate={gv('requestedExtensionDate')}
//             submitting={submitting}
//             setSubmitting={setSubmitting}
//             setError={setError}
//             onSuccess={() => setDone(true)}
//             decide={decideAtrFunctionalExtension}
//           />
//         )}

//         {![
//           'auditeeSubmitAction',
//           'auditorReviewEvidence',
//           'commercialHeadApprovalTask',
//           'functionalHeadApprovalTask',
//         ].includes(task.taskDefinitionKey) && (
//           <p className="text-sm text-gray-500">
//             Unrecognized task type: <code>{task.taskDefinitionKey}</code>
//           </p>
//         )}
//       </div>
//     </div>
//   );
// }

// // ============================================================
// //  ATR_OBSERVATION_LIFECYCLE / ATR_EXTENSION_APPROVAL forms
// //
// //  These are the only task-completion forms in this file. The
// //  earlier submitCorrectiveAction / reviewCorrectiveAction /
// //  approveExtensionCommercial / approveExtensionFunctional forms
// //  were removed — those taskDefinitionKeys don't exist in either
// //  deployed definition (ATR_OBSERVATION_LIFECYCLE_bpmn20.xml only
// //  has auditeeSubmitAction/auditorReviewEvidence;
// //  ATR_EXTENSION_APPROVAL_cmmn.xml only has
// //  commercialHeadApprovalTask/functionalHeadApprovalTask), so those
// //  branches and their Node-route calls were unreachable dead code.
// // ============================================================

// // ── auditeeSubmitAction: SUBMIT / EXTENSION / CANCEL ──
// // ─────────────────────────────────────────────────────────────
// // PATCH for ObservationTask.tsx
// //
// // Two changes to AtrAuditeeSubmitForm:
// //   1. Pass observationStatus through so a rejected/returned observation
// //      shows a clear banner (not just the generic status badge above).
// //   2. Block "Submit for Review" once targetDate has passed, with a
// //      clear message — matches your "before the due date" requirement.
// //      (Extension request stays enabled past the due date, since that's
// //      the whole point of that button.)
// // ─────────────────────────────────────────────────────────────

// // 1) Where AtrAuditeeSubmitForm is rendered in ObservationTask(), add targetDate:
// //
// //   <AtrAuditeeSubmitForm
// //     taskId={taskId!}
// //     processInstanceId={task.processInstanceId}
// //     userId={user?.id || ''}
// //     observationDescription={gv('observationDescription')}
// //     targetDate={gv('targetDate')}
// //     status={gv('status')}
// //     reviewComments={gv('reviewComments')}   // ← NEW: auditor's last rejection comment, if any
// //     submitting={submitting}
// //     setSubmitting={setSubmitting}
// //     setError={setError}
// //     onSuccess={() => setDone(true)}
// //   />
// //
// // (reviewComments assumes the BPMN/your app persists the auditor's last
// // comment as a process variable when auditorReviewEvidence completes —
// // completeTask() already sends `comments` in the payload, so this just
// // needs it readable back via getVariableValue. If it isn't currently
// // stored as a variable, drop this piece and rely on the comment thread
// // instead, which already shows it.)

// // 2) Inside AtrAuditeeSubmitForm — updated signature and body:

// function AtrAuditeeSubmitForm({
//   taskId, processInstanceId, userId,
//   observationDescription, targetDate, status, reviewComments,
//   submitting, setSubmitting, setError, onSuccess,
// }: {
//   taskId: string;
//   processInstanceId: string;
//   userId: string;
//   observationDescription: string;
//   targetDate: string;
//   status: string;
//   reviewComments?: string;
//   submitting: boolean;
//   setSubmitting: (v: boolean) => void;
//   setError: (v: string) => void;
//   onSuccess: () => void;
// }) {
//   const [correctiveActionDetails, setCorrectiveActionDetails] = useState('');
//   const [files, setFiles] = useState<File[]>([]);
//   const [showExtensionModal, setShowExtensionModal] = useState(false);
//   const [extensionReason, setExtensionReason] = useState('');
//   const [requestedExtensionDate, setRequestedExtensionDate] = useState('');

//   const isReturned = status === 'IN_PROGRESS' && !!reviewComments;

//   // Compare by calendar date, not timestamp, so "due today" still counts
//   // as on-time even if it's evening.
//   const isPastDue = (() => {
//     if (!targetDate) return false;
//     const due = new Date(targetDate);
//     if (isNaN(due.getTime())) return false;
//     const today = new Date();
//     due.setHours(23, 59, 59, 999);
//     return today > due;
//   })();

//   const submitForReview = async () => {
//     setSubmitting(true);
//     setError('');
//     try {
//       if (files.length) {
//         await uploadAttachments(taskId, files, userId);
//       }
//       await submitAtrAuditeeAction(taskId, {
//         action: 'SUBMIT',
//         correctiveActionDetails,
//       });
//       onSuccess();
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Submit failed');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const cancelObservation = async () => {
//     if (!window.confirm('Cancel this observation? This ends the workflow.')) return;
//     setSubmitting(true);
//     setError('');
//     try {
//       await submitAtrAuditeeAction(taskId, { action: 'CANCEL' });
//       onSuccess();
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Cancel failed');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const submitExtensionRequest = async () => {
//     setSubmitting(true);
//     setError('');
//     try {
//       await submitAtrAuditeeAction(taskId, {
//         action: 'EXTENSION',
//         extensionReason,
//         requestedExtensionDate,
//       }, processInstanceId);
//       setShowExtensionModal(false);
//       onSuccess();
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Extension request failed');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <div>
//       {isReturned && (
//         <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
//           <p className="font-medium">Returned by the auditor for revision</p>
//           <p className="mt-0.5">{reviewComments}</p>
//         </div>
//       )}

//       <div className="mb-5 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
//         <p><span className="text-gray-400">Observation:</span> {observationDescription || '—'}</p>
//         <p><span className="text-gray-400">Target date:</span> {targetDate || '—'} · <span className="text-gray-400">Status:</span> {status || '—'}</p>
//       </div>

//       {isPastDue && (
//         <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
//           The target date has passed. You can no longer submit for review — please request an extension instead.
//         </div>
//       )}

//       <Field label="Corrective Action Details *">
//         <textarea rows={5} className={inputCls} value={correctiveActionDetails}
//           onChange={(e) => setCorrectiveActionDetails(e.target.value)}
//           placeholder="Describe the corrective action taken..." disabled={isPastDue} />
//       </Field>

//       <div className="mb-5">
//         <FileUpload files={files} onChange={setFiles} disabled={submitting || isPastDue} />
//       </div>

//       <div className="flex gap-3 mt-4">
//         <button
//           onClick={submitForReview}
//           disabled={!correctiveActionDetails.trim() || submitting || isPastDue}
//           className="flex-1 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
//         >
//           {submitting ? 'Submitting…' : 'Submit for Review'}
//         </button>
//         <button
//           type="button"
//           onClick={() => setShowExtensionModal(true)}
//           disabled={submitting}
//           className="flex-1 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
//         >
//           Request Extension
//         </button>
//         <button
//           type="button"
//           onClick={cancelObservation}
//           disabled={submitting}
//           className="px-5 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50"
//         >
//           Cancel
//         </button>
//       </div>

//       {showExtensionModal && (
//         <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
//             <h3 className="text-lg font-semibold mb-4">Request Extension</h3>
//             <Field label="Extension Reason *">
//               <textarea rows={3} className={inputCls} value={extensionReason}
//                 onChange={(e) => setExtensionReason(e.target.value)} />
//             </Field>
//             <Field label="Requested Target Date *">
//               <input type="date" className={inputCls} value={requestedExtensionDate}
//                 onChange={(e) => setRequestedExtensionDate(e.target.value)} />
//             </Field>
//             <p className="text-xs text-gray-400 mb-3">
//               Goes to Commercial Head, then Functional Head for approval.
//             </p>
//             <div className="flex gap-2 mt-4">
//               <button
//                 onClick={submitExtensionRequest}
//                 disabled={!extensionReason.trim() || !requestedExtensionDate || submitting}
//                 className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
//               >
//                 Submit Request
//               </button>
//               <button
//                 onClick={() => setShowExtensionModal(false)}
//                 className="flex-1 py-2 border rounded-lg text-sm"
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
// // ── auditorReviewEvidence: APPROVE / REJECT / INVALID / BLOCKED ──
// function AtrAuditorReviewForm({
//   taskId, processInstanceId, submitting, setSubmitting, setError, onSuccess,
// }: {
//   taskId: string;
//   processInstanceId: string;
//   submitting: boolean;
//   setSubmitting: (v: boolean) => void;
//   setError: (v: string) => void;
//   onSuccess: () => void;
// }) {
//   const [reviewComments, setReviewComments] = useState('');

//   const decide = async (reviewDecision: 'APPROVE' | 'REJECT' | 'INVALID' | 'BLOCKED') => {
//     if ((reviewDecision === 'REJECT' || reviewDecision === 'BLOCKED') && !reviewComments.trim()) {
//       setError('Comment is required for this decision.');
//       return;
//     }
//     setSubmitting(true);
//     setError('');
//     try {
//       // On APPROVE, this also drives the sendClosureNotification
//       // external-worker job the process parks at right after — see
//       // submitAtrAuditorReview in auditApi.ts.
//       await submitAtrAuditorReview(taskId, { reviewDecision, reviewComments }, processInstanceId);
//       onSuccess();
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Review failed');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <div>
//       <Field label="Review Comments">
//         <textarea rows={4} className={inputCls} value={reviewComments}
//           onChange={(e) => setReviewComments(e.target.value)}
//           placeholder="Notes for the auditee (required on Reject / Blocked)..." />
//       </Field>
//       <div className="grid grid-cols-2 gap-2 mt-4">
//         <button onClick={() => decide('APPROVE')} disabled={submitting}
//           className="py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
//           Approve
//         </button>
//         <button onClick={() => decide('REJECT')} disabled={submitting}
//           className="py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
//           Reject
//         </button>
//         <button onClick={() => decide('INVALID')} disabled={submitting}
//           className="py-2.5 bg-gray-500 text-white rounded-lg text-sm font-medium disabled:opacity-50">
//           Invalid
//         </button>
//         <button onClick={() => decide('BLOCKED')} disabled={submitting}
//           className="py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium disabled:opacity-50">
//           Blocked
//         </button>
//       </div>
//     </div>
//   );
// }

// // ── commercialHeadApprovalTask / functionalHeadApprovalTask (CMMN) ──
// function AtrExtensionDecisionForm({
//   taskId, caseInstanceId, observationId, title, extensionReason, requestedExtensionDate,
//   submitting, setSubmitting, setError, onSuccess, decide,
// }: {
//   taskId: string;
//   caseInstanceId: string;
//   observationId: string;
//   title: string;
//   extensionReason: string;
//   requestedExtensionDate: string;
//   submitting: boolean;
//   setSubmitting: (v: boolean) => void;
//   setError: (v: string) => void;
//   onSuccess: () => void;
//   decide: (
//     taskId: string,
//     decision: 'APPROVE' | 'REJECT',
//     caseInstanceId: string,
//     observationId: string,
//     comment?: string
//   ) => Promise<void>;
// }) {
//   const [comment, setComment] = useState('');

//   const act = async (decision: 'APPROVE' | 'REJECT') => {
//     if (decision === 'REJECT' && !comment.trim()) {
//       setError('Comment is required when rejecting.');
//       return;
//     }
//     setSubmitting(true);
//     setError('');
//     try {
//       await decide(taskId, decision, caseInstanceId, observationId, comment);
//       onSuccess();
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Decision failed');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <div>
//       <div className="mb-5 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
//         <p><span className="text-gray-400">Reason:</span> {extensionReason || '—'}</p>
//         <p><span className="text-gray-400">Requested target date:</span> {requestedExtensionDate || '—'}</p>
//       </div>
//       <Field label={title}>
//         <div className="flex gap-2 mt-2">
//           <button onClick={() => act('APPROVE')} disabled={submitting}
//             className="flex-1 py-2 text-sm font-medium rounded-lg bg-green-600 text-white disabled:opacity-50">
//             Approve
//           </button>
//           <button onClick={() => act('REJECT')} disabled={submitting}
//             className="flex-1 py-2 text-sm font-medium rounded-lg bg-red-600 text-white disabled:opacity-50">
//             Reject
//           </button>
//         </div>
//       </Field>
//       <Field label="Comment">
//         <textarea rows={3} className={inputCls} value={comment} onChange={(e) => setComment(e.target.value)} />
//       </Field>
//     </div>
//   );
// }

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2Icon, AlertCircleIcon, CheckCircle2Icon, ArrowLeftIcon } from 'lucide-react';
import {
  getTaskById,
  getProcessVariables,
  getVariableValue,
  claimTask,
  OBSERVATION_CANDIDATE_GROUPS,
  isAtrCaseTask,
  getAtrCaseTaskById,
  getAtrCaseVariables,
  getProcessInstanceComments,
  addProcessInstanceComment,
  getProcessInstanceAttachments,
  uploadAttachments,
  downloadAttachment,
  FlowableTask,
  ProcessVariable,
  CommentEntry,
  FlowableAttachment,
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
// the raw Flowable `assignee` string happens to contain. Assignee-string
// equality alone isn't a strong enough guard here: assignee can be blank,
// or (in shared/test accounts) can coincidentally equal a user id that's
// currently logged in under a *different* role than the task actually
// requires. Role is the real authorization boundary — e.g. "only an
// auditor may act on auditorReviewEvidence" — so it's checked in
// addition to, not instead of, the assignee match below. Admins can
// always act, mirroring their access everywhere else in this app.
const TASK_ROLE_MAP: Record<string, string> = {
  auditeeSubmitAction:         'auditee',
  auditorReviewEvidence:       'auditor',
  commercialHeadApprovalTask:  'commercialHead',
  functionalHeadApprovalTask:  'functionalHead',
};

export function ObservationTask() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [task, setTask] = useState<FlowableTask | null>(null);
  const [vars, setVars] = useState<ProcessVariable[]>([]);
  const [comments, setComments] = useState<CommentEntry[]>([]);
  const [attachments, setAttachments] = useState<FlowableAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  // True when the logged-in user isn't this task's assignee — every ATR
  // task (auditeeSubmitAction / auditorReviewEvidence /
  // commercialHeadApprovalTask / functionalHeadApprovalTask) is assigned
  // directly via flowable:assignee, so this is a straight equality check,
  // not a candidate-group membership check.
  const [unauthorized, setUnauthorized] = useState(false);

  // const load = useCallback(async () => {
  //   if (!taskId) return;
  //   setLoading(true);
  //   setError('');
  //   try {
  //     // commercialHeadApprovalTask / functionalHeadApprovalTask live in
  //     // Flowable's CMMN engine, not the BPMN process engine, so a plain
  //     // getTaskById() 404s for them. Try BPMN first (the common case),
  //     // fall back to the CMMN task lookup.
  //     let t: FlowableTask;
  //     let isCase = false;
  //     try {
  //       t = await getTaskById(taskId);
  //     } catch {
  //       t = await getAtrCaseTaskById(taskId);
  //       isCase = true;
  //     }

  //     const candidateGroup = OBSERVATION_CANDIDATE_GROUPS[t.taskDefinitionKey];
  //     if (!isCase && candidateGroup && !t.assignee && user?.id) {
  //       try {
  //         await claimTask(t.id, user.id);
  //         t = await getTaskById(taskId);
  //       } catch (claimErr) {
  //         setError(
  //           claimErr instanceof Error
  //             ? `Could not claim this task: ${claimErr.message}`
  //             : 'Could not claim this task.'
  //         );
  //       }
  //     }
  //     // ATR case tasks (commercialHeadApprovalTask / functionalHeadApprovalTask)
  //     // are assigned directly to commercialHeadId/functionalHeadId per the
  //     // CMMN XML — no candidate-group claiming step needed.

  //     setTask(t);
  //     const v = isCase
  //       ? await getAtrCaseVariables(t.caseInstanceId || '')
  //       : await getProcessVariables(t.processInstanceId);
  //     setVars(v);

  //     // Comments/attachments are native Flowable resources scoped to a
  //     // BPMN process instance. CMMN case tasks don't have one (they have
  //     // a caseInstanceId instead), so skip both for case tasks rather
  //     // than fetching against an id Flowable doesn't recognize.
  //     if (!isCase) {
  //       try {
  //         setComments(await getProcessInstanceComments(t.processInstanceId));
  //       } catch {
  //         setComments([]);
  //       }
  //       try {
  //         setAttachments(await getProcessInstanceAttachments(t.processInstanceId));
  //       } catch {
  //         setAttachments([]);
  //       }
  //     } else {
  //       setComments([]);
  //       setAttachments([]);
  //     }
  //   } catch (err) {
  //     setError(err instanceof Error ? err.message : 'Failed to load task');
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [taskId, user?.id]);

  const load = useCallback(async () => {
  if (!taskId) return;
  setLoading(true);
  setError('');
  setUnauthorized(false);
  try {
    // commercialHeadApprovalTask / functionalHeadApprovalTask live in
    // Flowable's CMMN engine, not the BPMN process engine, so a plain
    // getTaskById() 404s for them. Try BPMN first (the common case),
    // fall back to the CMMN task lookup.
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
    // ATR case tasks (commercialHeadApprovalTask / functionalHeadApprovalTask)
    // are assigned directly to commercialHeadId/functionalHeadId per the
    // CMMN XML — no candidate-group claiming step needed.

    // Ownership check, two layers:
    //  1) Assignee match — catches the common case (someone else's task
    //     entirely, e.g. via browser Back button to a stale URL).
    //  2) Role match — catches the case assignee-equality alone can't:
    //     assignee blank/unset, or (in shared/test accounts) this same
    //     Flowable user id coincidentally set as auditorId on the process
    //     while the person is currently logged in under a *different*
    //     role (e.g. auditee). Role is the actual authorization boundary
    //     the business cares about ("only an auditor may review
    //     evidence"), so it's enforced regardless of what the raw
    //     assignee string says. Admins bypass both, same as elsewhere.
    const requiredRole = TASK_ROLE_MAP[t.taskDefinitionKey];
    const assigneeMismatch = !!(t.assignee && user?.id && t.assignee !== user.id);
    const roleMismatch = !!(requiredRole && user?.role && user.role !== 'admin' && user.role !== requiredRole);
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

    // Comments/attachments are native Flowable resources scoped to a
    // BPMN process instance. CMMN case tasks don't have one (they have
    // a caseInstanceId instead), so skip both for case tasks rather
    // than fetching against an id Flowable doesn't recognize.
    if (!isCase) {
      try {
        setComments(await getProcessInstanceComments(t.processInstanceId));
      } catch {
        // NOTE: getTaskById(taskId) above already succeeded, which is the
        // real signal that this task/process is still open — Flowable's
        // runtime/* endpoints only 404 once a process instance has
        // actually completed and moved to history. A 404 here just means
        // the comments sub-resource has nothing to return yet (or hit a
        // transient issue); it says nothing about whether the *task* is
        // done, so it must never be used to infer completion. Previously
        // this incorrectly called setDone(true) on any 404, which made
        // freshly-created, still-open tasks show "Task Completed" the
        // moment someone opened them. Just show an empty comment list.
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
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to load task');
  } finally {
    setLoading(false);
  }
}, [taskId, user?.id]);
  useEffect(() => { load(); }, [load]);

  const gv = (name: string) => getVariableValue(vars, name);

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
    // Flowable's runtime/* endpoints 404 once the process instance has
    // completed — it's moved to history, so new comments can't be added.
    setError('This task has already been closed by someone else. Refresh to see the latest status — your comment could not be added.');
    // Optional: re-run load() here so `done` gets set and the page
    // stops showing an editable comment box.
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

  return (
    <div className="max-w-2xl mx-auto p-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4" /> Back
      </button>

      {error && (
        <div className="mb-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircleIcon className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="mb-6">
        <p className="text-xs text-gray-400 mb-1">Observation {gv('observationId') || '—'}</p>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-900">{task.name}</h1>
          <span className={`badge ${statusBadgeClass(gv('status'))}`}>
            {STATUS_LABELS[gv('status')] || gv('status') || '—'}
          </span>
        </div>
        {task.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4">
        <CommentThread comments={comments} onAdd={handleAddComment} disabled={submitting} />
      </div>

      {attachments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Attachments</h3>
          <ul className="space-y-2">
            {attachments.map((a) => (
              <li key={a.id}>
                <button
                  onClick={() => downloadAttachment(task.processInstanceId, a.id, a.name)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {a.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        {task.taskDefinitionKey === 'auditeeSubmitAction' && (
          <AtrAuditeeSubmitForm
            taskId={taskId!}
            processInstanceId={task.processInstanceId}
            userId={user?.id || ''}
            observationDescription={gv('observationDescription')}
            targetDate={gv('targetDate')}
            status={gv('status')}
            submitting={submitting}
            setSubmitting={setSubmitting}
            setError={setError}
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
      </div>
    </div>
  );
}

// ============================================================
//  ATR_OBSERVATION_LIFECYCLE / ATR_EXTENSION_APPROVAL forms
//
//  These are the only task-completion forms in this file. The
//  earlier submitCorrectiveAction / reviewCorrectiveAction /
//  approveExtensionCommercial / approveExtensionFunctional forms
//  were removed — those taskDefinitionKeys don't exist in either
//  deployed definition (ATR_OBSERVATION_LIFECYCLE_bpmn20.xml only
//  has auditeeSubmitAction/auditorReviewEvidence;
//  ATR_EXTENSION_APPROVAL_cmmn.xml only has
//  commercialHeadApprovalTask/functionalHeadApprovalTask), so those
//  branches and their Node-route calls were unreachable dead code.
// ============================================================

// ── auditeeSubmitAction: SUBMIT / EXTENSION / CANCEL ──
// ─────────────────────────────────────────────────────────────
// PATCH for ObservationTask.tsx
//
// Two changes to AtrAuditeeSubmitForm:
//   1. Pass observationStatus through so a rejected/returned observation
//      shows a clear banner (not just the generic status badge above).
//   2. Block "Submit for Review" once targetDate has passed, with a
//      clear message — matches your "before the due date" requirement.
//      (Extension request stays enabled past the due date, since that's
//      the whole point of that button.)
// ─────────────────────────────────────────────────────────────

// 1) Where AtrAuditeeSubmitForm is rendered in ObservationTask(), add targetDate:
//
//   <AtrAuditeeSubmitForm
//     taskId={taskId!}
//     processInstanceId={task.processInstanceId}
//     userId={user?.id || ''}
//     observationDescription={gv('observationDescription')}
//     targetDate={gv('targetDate')}
//     status={gv('status')}
//     reviewComments={gv('reviewComments')}   // ← NEW: auditor's last rejection comment, if any
//     submitting={submitting}
//     setSubmitting={setSubmitting}
//     setError={setError}
//     onSuccess={() => setDone(true)}
//   />
//
// (reviewComments assumes the BPMN/your app persists the auditor's last
// comment as a process variable when auditorReviewEvidence completes —
// completeTask() already sends `comments` in the payload, so this just
// needs it readable back via getVariableValue. If it isn't currently
// stored as a variable, drop this piece and rely on the comment thread
// instead, which already shows it.)

// 2) Inside AtrAuditeeSubmitForm — updated signature and body:

function AtrAuditeeSubmitForm({
  taskId, processInstanceId, userId,
  observationDescription, targetDate, status, reviewComments,
  submitting, setSubmitting, setError, onSuccess,
}: {
  taskId: string;
  processInstanceId: string;
  userId: string;
  observationDescription: string;
  targetDate: string;
  status: string;
  reviewComments?: string;
  submitting: boolean;
  setSubmitting: (v: boolean) => void;
  setError: (v: string) => void;
  onSuccess: () => void;
}) {
  const [correctiveActionDetails, setCorrectiveActionDetails] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [extensionReason, setExtensionReason] = useState('');
  const [requestedExtensionDate, setRequestedExtensionDate] = useState('');

  const isReturned = status === 'IN_PROGRESS' && !!reviewComments;

  // Compare by calendar date, not timestamp, so "due today" still counts
  // as on-time even if it's evening.
  const isPastDue = (() => {
    if (!targetDate) return false;
    const due = new Date(targetDate);
    if (isNaN(due.getTime())) return false;
    const today = new Date();
    due.setHours(23, 59, 59, 999);
    return today > due;
  })();

  const submitForReview = async () => {
    setSubmitting(true);
    setError('');
    try {
      if (files.length) {
        await uploadAttachments(taskId, files, userId);
      }
      await submitAtrAuditeeAction(taskId, {
        action: 'SUBMIT',
        correctiveActionDetails,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
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
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancel failed');
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
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extension request failed');
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

      <div className="mb-5 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
        <p><span className="text-gray-400">Observation:</span> {observationDescription || '—'}</p>
        <p><span className="text-gray-400">Target date:</span> {targetDate || '—'} · <span className="text-gray-400">Status:</span> {status || '—'}</p>
      </div>

      {isPastDue && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          The target date has passed. You can no longer submit for review — please request an extension instead.
        </div>
      )}

      <Field label="Corrective Action Details *">
        <textarea rows={5} className={inputCls} value={correctiveActionDetails}
          onChange={(e) => setCorrectiveActionDetails(e.target.value)}
          placeholder="Describe the corrective action taken..." disabled={isPastDue} />
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
  taskId, processInstanceId, submitting, setSubmitting, setError, onSuccess,
}: {
  taskId: string;
  processInstanceId: string;
  submitting: boolean;
  setSubmitting: (v: boolean) => void;
  setError: (v: string) => void;
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
      // On APPROVE, this also drives the sendClosureNotification
      // external-worker job the process parks at right after — see
      // submitAtrAuditorReview in auditApi.ts.
      await submitAtrAuditorReview(taskId, { reviewDecision, reviewComments }, processInstanceId);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review failed');
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
        <button onClick={() => decide('INVALID')} disabled={submitting}
          className="py-2.5 bg-gray-500 text-white rounded-lg text-sm font-medium disabled:opacity-50">
          Invalid
        </button>
        <button onClick={() => decide('BLOCKED')} disabled={submitting}
          className="py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium disabled:opacity-50">
          Blocked
        </button>
      </div>
    </div>
  );
}

// ── commercialHeadApprovalTask / functionalHeadApprovalTask (CMMN) ──
function AtrExtensionDecisionForm({
  taskId, caseInstanceId, observationId, title, extensionReason, requestedExtensionDate,
  submitting, setSubmitting, setError, onSuccess, decide,
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
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Decision failed');
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