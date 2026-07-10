/** Audit workflow status values stored in Flowable process variable `status`. */
export const AUDIT_STATUS = {
  CREATED: 'CREATED',
  ASSIGNED: 'ASSIGNED',
  PENDING_AUDITEE: 'PENDING_AUDITEE',
  UNDER_REVIEW: 'UNDER_REVIEW',
  REWORK_REQUIRED: 'REWORK_REQUIRED',
  EXTENSION_REQUESTED: 'EXTENSION_REQUESTED',
  COMMERCIAL_APPROVAL: 'COMMERCIAL_APPROVAL',
  FUNCTIONAL_APPROVAL: 'FUNCTIONAL_APPROVAL',
  EXTENSION_REJECTED: 'EXTENSION_REJECTED',
  EXTENDED: 'EXTENDED',
  COMPLETED: 'COMPLETED',
} as const;

export type AuditStatus = typeof AUDIT_STATUS[keyof typeof AUDIT_STATUS];

export const STATUS_LABELS: Record<string, string> = {
  CREATED: 'Created',
  ASSIGNED: 'Assigned',
  PENDING_AUDITEE: 'Pending Auditee',
  UNDER_REVIEW: 'Under Review',
  REWORK_REQUIRED: 'Rework Required',
  EXTENSION_REQUESTED: 'Extension Requested',
  COMMERCIAL_APPROVAL: 'Commercial Approval',
  FUNCTIONAL_APPROVAL: 'Functional Approval',
  EXTENSION_REJECTED: 'Extension Rejected',
  EXTENDED: 'Extended',
  COMPLETED: 'Completed',
};

export function statusBadgeClass(status: string): string {
  switch (status) {
    case 'COMPLETED': return 'badge-success';
    case 'UNDER_REVIEW': return 'badge-info';
    case 'REWORK_REQUIRED':
    case 'EXTENSION_REJECTED': return 'badge-danger';
    case 'EXTENDED':
    case 'COMMERCIAL_APPROVAL':
    case 'FUNCTIONAL_APPROVAL': return 'badge-warn';
    default: return 'badge-neutral';
  }
}

/** Pending auditee tab statuses */
export const AUDITEE_PENDING = ['PENDING_AUDITEE', 'EXTENDED', 'ASSIGNED', 'CREATED'];
export const AUDITEE_RETURNED = ['REWORK_REQUIRED', 'EXTENSION_REJECTED'];
export const AUDITEE_COMPLETED = ['COMPLETED', 'UNDER_REVIEW'];

export const COMMERCIAL_PENDING = ['EXTENSION_REQUESTED', 'COMMERCIAL_APPROVAL'];
export const FUNCTIONAL_PENDING = ['FUNCTIONAL_APPROVAL'];
