const API_BASE = import.meta.env.VITE_API_BASE ?? '';

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error?.message || err.error || `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface AuditRecord {
  id: string;
  observationId: string;
  auditId: string;
  auditName: string;
  auditType: string;
  checklistId: string;
  auditorId: string;
  auditeeId: string;
  observationDescription: string;
  dueDate: string;
  priority: string;
  status: string;
  comments: string;
  attachments: string;
  startTime: string;
  ended: boolean;
}



export async function getMyAudits(userId: string, role: string, groups: string[] = []): Promise<AuditRecord[]> {
  const q = new URLSearchParams({ userId, role, groups: groups.join(',') });
  const data = await apiFetch<{ audits: AuditRecord[] }>(`/api/audits/my?${q}`);
  return data.audits;
}

export async function createAuditObservation(body: Record<string, string>): Promise<{ id: string }> {
  const data = await apiFetch<{ success: boolean; data: { id: string } }>('/api/audits', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return data.data;
}



export async function getAuditHistory(processInstanceId: string) {
  return apiFetch<{ variables: unknown[]; tasks: unknown[]; comments: string; attachments: string }>(
    `/api/audits/${processInstanceId}/history`
  );
}

// ─────────────────────────────────────────────────────────────
// ATR_OBSERVATION_LIFECYCLE / ATR_EXTENSION_APPROVAL task actions
//
// These complete Flowable tasks directly through flowableApi's proxy
// (same mechanism as completeTask/completeAtrCaseTask) rather than a
// domain-specific backend route, since the BPMN/CMMN XML is the source
// of truth for which variables each task sets — no business logic to
// duplicate on the Node side. Kept in this file (not flowableApi.tsx) so
// ObservationTask.tsx has one place for "things a user does to a task",
// matching the existing submitObservationTask/approveExtension pattern.
// ─────────────────────────────────────────────────────────────

import {
  completeTask as _completeAtrBpmnTask,
  completeAtrCaseTask as _completeAtrCaseTask,
  getProcessVariables,
  getVariableValue,
  startAtrExtensionCase,
  advanceExtensionCase,
  completeClosureNotificationJob,
   getUserById,
} from './flowableApi';
import pushInboxNotification from './flowableApi';



/** Looks up each userId's email via Flowable identity and fires a
 *  templated email through the mail module mounted at /api/mail.
 *  Best-effort: a failed lookup or send never blocks the workflow. */
async function notifyByUserIds(
  userIds: (string | undefined)[],
  template: string,
  subject: string,
  extraContext: Record<string, string> = {}
): Promise<void> {
  const ids = userIds.filter(Boolean) as string[];
  await Promise.all(
    ids.map(async (id) => {
      try {
        const user = await getUserById(id);
        if (!user?.email) return;
        await apiFetch('/api/mail/send-template', {
          method: 'POST',
          body: JSON.stringify({
            to: user.email,
            subject,
            template,
            context: {
              employeeName: `${user.firstName} ${user.lastName}`.trim(),
              ...extraContext,
            },
          }),
        });
      } catch (err) {
        console.error(`[mail] notify ${id} (${template}) failed:`, err);
      }
    })
  );
}
/** auditeeSubmitAction — sets "action" to SUBMIT / EXTENSION / CANCEL per
 *  gatewayAuditeeAction's conditions. SUBMIT/EXTENSION carry the auditee's
 *  write-up; EXTENSION additionally needs the requested new target date,
 *  which the CMMN case picks up as "requestedExtensionDate".
 *
 *  processInstanceId is required when action is 'EXTENSION': the XML
 *  documentation is explicit that no engine-side listener starts the
 *  ATR_EXTENSION_APPROVAL case anymore — React must do it itself, right
 *  after completing this task, using process variables already on the
 *  instance (observationId, commercialHeadId, functionalHeadId,
 *  targetDate) plus the auditee's requestedExtensionDate. */
export async function submitAtrAuditeeAction(
  taskId: string,
  body: {
    action: 'SUBMIT' | 'EXTENSION' | 'CANCEL';
    correctiveActionDetails?: string;
    extensionReason?: string;
    requestedExtensionDate?: string;
  },
  processInstanceId?: string
): Promise<void> {
  await _completeAtrBpmnTask(taskId, {
    stepName: 'auditeeSubmitAction',
    comments: body.correctiveActionDetails || body.extensionReason,
    ...( { action: body.action,
           correctiveActionDetails: body.correctiveActionDetails,
           extensionReason: body.extensionReason,
           requestedExtensionDate: body.requestedExtensionDate } as any ),
  });

  // ── SUBMIT: notify auditor + commercial head + functional head ──
  if (body.action === 'SUBMIT' && processInstanceId) {
    const vars = await getProcessVariables(processInstanceId);
    const observationId = getVariableValue(vars, 'observationId');
    await notifyByUserIds(
      [
        getVariableValue(vars, 'auditorId'),
        getVariableValue(vars, 'commercialHeadId'),
        getVariableValue(vars, 'functionalHeadId'),
      ],
      'corrective-action-submitted',
      `Corrective Action Submitted - ${observationId}`,
      {
        observationId,
        auditId: getVariableValue(vars, 'auditId'),
        auditName: getVariableValue(vars, 'auditName'),
        remarks: body.correctiveActionDetails || '',
      }
    );
  }

  if (body.action === 'EXTENSION') {
    if (!processInstanceId) {
      throw new Error('submitAtrAuditeeAction: processInstanceId is required to start the extension approval case.');
    }
    const vars = await getProcessVariables(processInstanceId);
    const observationId = getVariableValue(vars, 'observationId');
    const caseInstance = await startAtrExtensionCase({
      observationId,
      auditeeId:              getVariableValue(vars, 'auditeeId'),
      commercialHeadId:       getVariableValue(vars, 'commercialHeadId'),
      functionalHeadId:       getVariableValue(vars, 'functionalHeadId'),
      targetDate:             getVariableValue(vars, 'targetDate'),
      requestedExtensionDate: body.requestedExtensionDate || '',
    });
    await advanceExtensionCase(caseInstance.id, observationId);

    // ── EXTENSION: notify commercial head + functional head ──
    await notifyByUserIds(
      [
        getVariableValue(vars, 'commercialHeadId'),
        getVariableValue(vars, 'functionalHeadId'),
      ],
      'extension-requested',
      `Extension Requested - ${observationId}`,
      {
        observationId,
        auditId: getVariableValue(vars, 'auditId'),
        auditName: getVariableValue(vars, 'auditName'),
        requestedDueDate: body.requestedExtensionDate || '',
        remarks: body.extensionReason || '',
      }
    );
  }
}
/** auditorReviewEvidence — sets "reviewDecision" to one of
 *  APPROVE / REJECT / INVALID / BLOCKED per gatewayAuditorDecision.
 *  On APPROVE, also drives the sendClosureNotification external-worker
 *  job the BPMN process parks at right after — see completeTask's
 *  documentation on why that has to happen from here rather than
 *  waiting on a background worker that doesn't exist in this app. */

export async function submitAtrAuditorReview(
  taskId: string,
  body: { reviewDecision: 'APPROVE' | 'REJECT' | 'INVALID' | 'BLOCKED'; reviewComments?: string },
  processInstanceId?: string
): Promise<void> {
  await _completeAtrBpmnTask(taskId, {
    stepName: 'auditorReviewEvidence',
    comments: body.reviewComments,
    ...({ reviewDecision: body.reviewDecision } as any),
  });
 
  if (!processInstanceId) return;
  const vars = await getProcessVariables(processInstanceId);
  const observationId = getVariableValue(vars, 'observationId');
  const auditeeId = getVariableValue(vars, 'auditeeId');
 
  if (body.reviewDecision === 'APPROVE') {
    await completeClosureNotificationJob(processInstanceId, observationId, auditeeId);
  } else if (body.reviewDecision === 'REJECT') {
    // BPMN already loops the token back to auditeeSubmitAction on REJECT
    // (see flowRejectToInProgress -> setStatusInProgress -> auditeeSubmitAction
    // in ATR_OBSERVATION_LIFECYCLE_bpmn20.xml) — this just makes sure the
    // auditee is actually told about it, including the auditor's comment.
    await pushInboxNotification(auditeeId, {
      kind: 'observation-returned',
      message: body.reviewComments
        ? `Observation ${observationId} was returned by the auditor: "${body.reviewComments}"`
        : `Observation ${observationId} was returned by the auditor for revision.`,
      observationId,
    }).catch(() => {});
  }
}

/** commercialHeadApprovalTask (CMMN) — sets "commercialDecision".
 *  After completing, advances the case automation so that, on approve,
 *  functionalHeadApprovalTask becomes visible to the Functional Head
 *  right away, or on reject, the case exits and the BPMN process resumes
 *  as rejected — without anyone having to refresh into a stuck state. */
export async function decideAtrCommercialExtension(
  taskId: string,
  decision: 'APPROVE' | 'REJECT',
  caseInstanceId: string,
  observationId: string,
  comment?: string
): Promise<void> {
  await _completeAtrCaseTask(taskId, {
    commercialDecision: decision,
    ...(comment ? { commercialComment: comment } : {}),
  });
  await advanceExtensionCase(caseInstanceId, observationId);
}

/** functionalHeadApprovalTask (CMMN) — sets "functionalDecision". Same
 *  post-decision automation as the commercial approval above. */
export async function decideAtrFunctionalExtension(
  taskId: string,
  decision: 'APPROVE' | 'REJECT',
  caseInstanceId: string,
  observationId: string,
  comment?: string
): Promise<void> {
  await _completeAtrCaseTask(taskId, {
    functionalDecision: decision,
    ...(comment ? { functionalComment: comment } : {}),
  });
  await advanceExtensionCase(caseInstanceId, observationId);
}