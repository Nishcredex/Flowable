export const currentUser = {
  name: 'Souvanik Ghosh',
  initials: 'SG',
  email: 'souvanik@gmail.com',
  role: 'Compliance Officer',
  department: 'Audit Dept',
}

export const inboxActions = [
  { ref: 'ATR-2026-0418', subject: 'RBI inspection — KYC documentation gap, Branch 1142', category: 'Regulatory', priority: 'high', status: 'In Review', statusVariant: 'warn', assigned: 'R. Mehta', due: 'Overdue · 2d', dueVariant: 'high' },
  { ref: 'ATR-2026-0417', subject: 'Internal audit — Stale GL entries Q1 reconciliation', category: 'Audit', priority: 'med', status: 'Pending Action', statusVariant: 'info', assigned: 'You', due: 'May 31' },
  { ref: 'ATR-2026-0416', subject: 'Customer grievance #CG-44211 — Disputed transaction reversal', category: 'Grievance', priority: 'high', status: 'Escalated', statusVariant: 'danger', assigned: 'P. Sharma', due: 'Today, 6 PM' },
  { ref: 'ATR-2026-0415', subject: 'Vigilance referral — Unusual UPI activity, A/c ****7821', category: 'Vigilance', priority: 'high', status: 'In Review', statusVariant: 'warn', assigned: 'You', due: 'Jun 02' },
  { ref: 'ATR-2026-0414', subject: 'Concurrent audit — Locker register lapses, Br. 0871', category: 'Audit', priority: 'med', status: 'Pending Action', statusVariant: 'info', assigned: 'You', due: 'Jun 04' },
  { ref: 'ATR-2026-0413', subject: 'SEBI advisory — Mutual fund mis-selling complaint', category: 'Regulatory', priority: 'high', status: 'In Review', statusVariant: 'warn', assigned: 'A. Nair', due: 'Overdue · 1d', dueVariant: 'high' },
  { ref: 'ATR-2026-0412', subject: 'Statutory auditor remark — IT controls in core banking', category: 'Audit', priority: 'med', status: 'Escalated', statusVariant: 'danger', assigned: 'D. Kumar', due: 'Jun 10' },
  { ref: 'ATR-2026-0411', subject: 'Whistleblower report — Procurement deviation flagged', category: 'Vigilance', priority: 'high', status: 'Pending Action', statusVariant: 'info', assigned: 'P. Sharma', due: 'Jun 06' },
  { ref: 'ATR-2026-0410', subject: 'Concurrent audit — Cash retention limit breach Br. 2204', category: 'Audit', priority: 'low', status: 'Closed', statusVariant: 'success', assigned: 'You', due: 'May 22', dueSoft: true },
]

export const activityFeed = [
  { color: 'var(--success)', text: 'ATR-2026-0418 approved by R. Mehta', ref: 'ATR-2026-0418', time: '12 minutes ago' },
  { color: 'var(--warn)', text: 'ATR-2026-0412 escalated to Compliance Head', ref: 'ATR-2026-0412', time: '1 hour ago' },
  { color: 'var(--info)', text: 'You assigned ATR-2026-0411 to P. Sharma', ref: 'ATR-2026-0411', time: '2 hours ago' },
  { color: 'var(--danger)', text: 'ATR-2026-0403 breached SLA (5 days)', ref: 'ATR-2026-0403', time: 'Yesterday' },
  { color: 'var(--success)', text: '3 actions closed by your team', ref: null, time: 'Yesterday' },
]

export const slaByCategory = [
  { label: 'Audit Observations', value: 92, color: 'var(--success)' },
  { label: 'Regulatory Inspection', value: 78, color: 'var(--success)' },
  { label: 'Internal Investigation', value: 64, color: 'var(--warn)' },
  { label: 'Customer Grievance', value: 88, color: 'var(--success)' },
  { label: 'Vigilance Cases', value: 46, color: 'var(--danger)' },
]

export const topPerformers = [
  { label: 'A. Nair', value: 96, color: 'var(--success)' },
  { label: 'R. Mehta', value: 91, color: 'var(--success)' },
  { label: 'Souvanik Ghosh', value: 88, color: 'var(--success)' },
  { label: 'D. Kumar', value: 74, color: 'var(--warn)' },
  { label: 'P. Sharma', value: 62, color: 'var(--warn)' },
]

export const auditLog = [
  { ts: 'May 28, 11:42', actor: 'R. Mehta', event: 'Returned for clarification', entity: 'ATR-2026-0418', channel: 'Web' },
  { ts: 'May 28, 11:20', actor: 'system', event: 'SLA reminder dispatched', entity: 'ATR-2026-0418', channel: 'Email + Mobile' },
  { ts: 'May 28, 10:05', actor: 'A. Nair', event: 'Closed action', entity: 'ATR-2026-0405', channel: 'Web' },
  { ts: 'May 28, 09:32', actor: 'Souvanik Ghosh', event: 'Reassigned to P. Sharma', entity: 'ATR-2026-0411', channel: 'Web' },
  { ts: 'May 27, 18:11', actor: 'system', event: 'Workflow definition updated', entity: 'RBI Inspection v2.4', channel: 'Admin' },
]

export const users = [
  { initials: 'SG', color: null, name: 'Souvanik Ghosh', email: 'souvanik@gmail.com', role: 'Compliance Officer', roleVariant: 'primary', dept: 'Audit', twofa: true, status: 'Active', last: 'Now' },
  { initials: 'RM', color: '#a855f7', name: 'R. Mehta', email: 'r.mehta@corp.in', role: 'Compliance Head', roleVariant: 'primary', dept: 'Compliance', twofa: true, status: 'Active', last: '3 min ago' },
  { initials: 'AN', color: '#f59e0b', name: 'A. Nair', email: 'a.nair@corp.in', role: 'Reviewer', roleVariant: 'info', dept: 'Audit', twofa: true, status: 'Active', last: '1 hour ago' },
  { initials: 'PS', color: '#0ea5a3', name: 'P. Sharma', email: 'p.sharma@corp.in', role: 'Officer', roleVariant: 'neutral', dept: 'Vigilance', twofa: false, status: 'Active', last: 'Yesterday' },
  { initials: 'DK', color: '#6366f1', name: 'D. Kumar', email: 'd.kumar@corp.in', role: 'Reviewer', roleVariant: 'info', dept: 'Risk', twofa: true, status: 'Disabled', last: '14 days ago' },
]

export const workflowDefs = [
  { key: 'atr.rbi.inspection', name: 'RBI Inspection', version: 'v2.4', deployed: 'May 18, 2026', instances: 34, status: 'Active' },
  { key: 'atr.internal.audit', name: 'Internal Audit Observation', version: 'v3.1', deployed: 'Apr 02, 2026', instances: 71, status: 'Active' },
  { key: 'atr.grievance.customer', name: 'Customer Grievance', version: 'v1.8', deployed: 'Mar 11, 2026', instances: 23, status: 'Active' },
  { key: 'atr.vigilance.case', name: 'Vigilance Case', version: 'v2.0', deployed: 'Feb 27, 2026', instances: 9, status: 'Draft' },
]

export const timeline = [
  { dot: 'pending', title: 'Awaiting your action — submit response', sub: 'SLA breach in -2d · You are the current owner' },
  { dot: 'warn', title: 'R. Mehta requested clarification on root cause', sub: 'May 24, 11:42 AM — "Please confirm whether the 184 accounts include the dormant set."' },
  { dot: 'success', title: 'Souvanik Ghosh submitted initial action plan', sub: 'May 23, 4:18 PM' },
  { dot: 'success', title: 'Assigned to Souvanik Ghosh by system', sub: 'May 22, 9:00 AM — Auto-assigned via routing rule "Branch > West Zone"' },
  { dot: 'success', title: 'Action created from RBI Inspection import', sub: 'May 22, 8:51 AM — Source: F.No. 2026/CO/DBS-118 (PDF)' },
]
