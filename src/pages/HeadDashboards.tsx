// import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Loader2Icon, AlertCircleIcon, RefreshCwIcon, ChevronRightIcon } from 'lucide-react';
// import { useAuth } from './AuthContext';
// import { getMyAudits, type AuditRecord } from './services/auditApi';
// import { getTasksByCandidateGroups } from './services/flowableApi';
// import { STATUS_LABELS, statusBadgeClass } from '../constants/auditStatus';

// type Tab = 'pending' | 'approved' | 'rejected';

// interface HeadDashboardProps {
//   role: 'commercialHead' | 'functionalHead';
//   title: string;
//   pendingStatuses: string[];
//   approvedStatuses: string[];
//   rejectedStatuses: string[];
//   candidateGroup: string;
//   taskKey: string;
// }

// function HeadDashboard({
//   role, title, pendingStatuses, approvedStatuses, rejectedStatuses, candidateGroup, taskKey,
// }: HeadDashboardProps) {
//   const { user } = useAuth();
//   const navigate = useNavigate();
//   const [tab, setTab] = useState<Tab>('pending');
//   const [audits, setAudits] = useState<AuditRecord[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   const load = useCallback(async () => {
//     if (!user) return;
//     setLoading(true);
//     setError('');
//     try {
//       const records = await getMyAudits(user.id, role, user.groups || [candidateGroup]);
//       setAudits(records);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to load');
//     } finally {
//       setLoading(false);
//     }
//   }, [user, role, candidateGroup]);

//   useEffect(() => { load(); }, [load]);

//   const filtered = audits.filter((a) => {
//     if (tab === 'pending') return pendingStatuses.includes(a.status);
//     if (tab === 'approved') return approvedStatuses.includes(a.status);
//     return rejectedStatuses.includes(a.status);
//   });

//   const openTask = async () => {
//     if (!user) return;
//     const groups = user.groups?.length ? user.groups : [candidateGroup];
//     const tasks = await getTasksByCandidateGroups(groups);
//     const task = tasks.find((t) => t.taskDefinitionKey === taskKey);
//     if (task) navigate(`/observations/tasks/${task.id}`);
//   };

//   const tabs: { id: Tab; label: string }[] = [
//     { id: 'pending', label: 'Pending Extensions' },
//     { id: 'approved', label: 'Approved' },
//     { id: 'rejected', label: 'Rejected' },
//   ];

//   return (
//     <div>
//       <div className="page-head">
//         <div>
//           <h1>{title}</h1>
//           <div className="subtitle">Review extension requests from auditees</div>
//         </div>
//         <div className="page-actions">
//           <button className="btn btn-outline" onClick={load} disabled={loading}>
//             <RefreshCwIcon style={{ width: 14, height: 14 }} className={loading ? 'animate-spin' : ''} />
//             Refresh
//           </button>
//           {tab === 'pending' && (
//             <button className="btn btn-primary" onClick={openTask}>Open next task</button>
//           )}
//         </div>
//       </div>

//       {error && (
//         <div className="card" style={{ marginBottom: 16, padding: 16, background: '#fee2e2' }}>{error}</div>
//       )}

//       <div className="row gap-8" style={{ marginBottom: 16 }}>
//         {tabs.map((t) => (
//           <button key={t.id} onClick={() => setTab(t.id)} className={`btn ${tab === t.id ? 'btn-primary' : 'btn-outline'}`}>
//             {t.label}
//           </button>
//         ))}
//       </div>

//       {loading ? (
//         <div className="card card-body" style={{ textAlign: 'center' }}>
//           <Loader2Icon className="animate-spin" style={{ width: 24, height: 24, margin: '0 auto' }} />
//         </div>
//       ) : filtered.length === 0 ? (
//         <div className="card card-body text-soft">No extension requests in this category.</div>
//       ) : (
//         <div className="stack gap-12">
//           {filtered.map((audit) => (
//             <div key={audit.id} className="card">
//               <div className="card-head">
//                 <div style={{ flex: 1 }}>
//                   <h3>{audit.observationId} — {audit.auditName || 'Observation'}</h3>
//                   <div className="small text-soft">{audit.observationDescription?.slice(0, 100)}</div>
//                 </div>
//                 <span className={`badge ${statusBadgeClass(audit.status)}`}>
//                   {STATUS_LABELS[audit.status] || audit.status}
//                 </span>
//               </div>
//               <div className="card-body">
//                 <div className="small" style={{ marginBottom: 8 }}><strong>Auditee:</strong> {audit.auditeeId}</div>
//                 {tab === 'pending' && (
//                   <button className="btn btn-primary" onClick={openTask}>
//                     Review <ChevronRightIcon style={{ width: 14, height: 14 }} />
//                   </button>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// export function CommercialHeadDashboard() {
//   return (
//     <HeadDashboard
//       role="commercialHead"
//       title="Commercial Head — Extension Requests"
//       candidateGroup="commercialHead"
//       taskKey="approveExtensionCommercial"
//       pendingStatuses={['EXTENSION_REQUESTED', 'COMMERCIAL_APPROVAL']}
//       approvedStatuses={['FUNCTIONAL_APPROVAL', 'EXTENDED', 'COMPLETED']}
//       rejectedStatuses={['EXTENSION_REJECTED']}
//     />
//   );
// }

// export function FunctionalHeadDashboard() {
//   return (
//     <HeadDashboard
//       role="functionalHead"
//       title="Functional Head — Extension Requests"
//       candidateGroup="functionalHead"
//       taskKey="approveExtensionFunctional"
//       pendingStatuses={['FUNCTIONAL_APPROVAL']}
//       approvedStatuses={['EXTENDED', 'COMPLETED']}
//       rejectedStatuses={['EXTENSION_REJECTED']}
//     />
//   );
// }


import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2Icon, AlertCircleIcon, RefreshCwIcon, ChevronRightIcon } from 'lucide-react';
import { useAuth } from './AuthContext';
import {
  getAtrExtensionCasesForHead,
  getAtrCaseTasksByAssignee,
  type AtrExtensionCaseRecord,
} from './services/flowableApi';

type Tab = 'pending' | 'approved' | 'rejected';

interface HeadDashboardProps {
  role: 'commercialHead' | 'functionalHead';
  title: string;
  /** commercialHeadApprovalTask / functionalHeadApprovalTask — the CMMN
   *  humanTask id, assigned directly to this user (no candidate group). */
  taskDefinitionKey: string;
}

const TAB_LABELS: Record<Tab, string> = {
  pending: 'Pending Extensions',
  approved: 'Approved',
  rejected: 'Rejected',
};

function HeadDashboard({ role, title, taskDefinitionKey }: HeadDashboardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('pending');
  const [cases, setCases] = useState<AtrExtensionCaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Goes straight to the CMMN engine (via the /cmmn-flowable-api proxy) —
  // there's no backend "my audits" route for this workflow, so this reads
  // ATR_EXTENSION_APPROVAL case instances directly rather than depending
  // on a server.js route that doesn't exist.
  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const records = await getAtrExtensionCasesForHead(role, user.id);
      setCases(records);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load extension requests');
    } finally {
      setLoading(false);
    }
  }, [user, role]);

  useEffect(() => { load(); }, [load]);

  const filtered = cases.filter((c) => c.bucket === tab);

  // The CMMN humanTask is assigned directly (flowable:assignee=
  // ${commercialHeadId} / ${functionalHeadId}) — no candidate-group
  // claiming step in this workflow, so this looks the task up by
  // assignee, not by group membership.
  const openTask = async () => {
    if (!user) return;
    const tasks = await getAtrCaseTasksByAssignee(user.id);
    const task = tasks.find((t) => t.taskDefinitionKey === taskDefinitionKey);
    if (task) navigate(`/observations/tasks/${task.id}`);
  };

  const openCase = async (caseRecord: AtrExtensionCaseRecord) => {
    if (!user) return;
    const tasks = await getAtrCaseTasksByAssignee(user.id);
    const task = tasks.find(
      (t) => t.caseInstanceId === caseRecord.id && t.taskDefinitionKey === taskDefinitionKey
    );
    if (task) navigate(`/observations/tasks/${task.id}`);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'pending', label: TAB_LABELS.pending },
    { id: 'approved', label: TAB_LABELS.approved },
    { id: 'rejected', label: TAB_LABELS.rejected },
  ];

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{title}</h1>
          <div className="subtitle">Review extension requests from auditees</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={load} disabled={loading}>
            <RefreshCwIcon style={{ width: 14, height: 14 }} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          {tab === 'pending' && (
            <button className="btn btn-primary" onClick={openTask}>Open next task</button>
          )}
        </div>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: 16, padding: 16, background: '#fee2e2' }}>{error}</div>
      )}

      <div className="row gap-8" style={{ marginBottom: 16 }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`btn ${tab === t.id ? 'btn-primary' : 'btn-outline'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card card-body" style={{ textAlign: 'center' }}>
          <Loader2Icon className="animate-spin" style={{ width: 24, height: 24, margin: '0 auto' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card card-body text-soft">No extension requests in this category.</div>
      ) : (
        <div className="stack gap-12">
          {filtered.map((c) => (
            <div key={c.id} className="card">
              <div className="card-head">
                <div style={{ flex: 1 }}>
                  <h3>{c.observationId || 'Observation'}</h3>
                  <div className="small text-soft">{c.observationDescription?.slice(0, 100)}</div>
                </div>
                <span className="badge">{TAB_LABELS[c.bucket]}</span>
              </div>
              <div className="card-body">
                <div className="small" style={{ marginBottom: 4 }}><strong>Auditee:</strong> {c.auditeeId}</div>
                <div className="small" style={{ marginBottom: 8 }}>
                  <strong>Requested date:</strong> {c.requestedExtensionDate || '—'}
                </div>
                {tab === 'pending' && (
                  <button className="btn btn-primary" onClick={() => openCase(c)}>
                    Review <ChevronRightIcon style={{ width: 14, height: 14 }} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CommercialHeadDashboard() {
  return (
    <HeadDashboard
      role="commercialHead"
      title="Commercial Head — Extension Requests"
      taskDefinitionKey="commercialHeadApprovalTask"
    />
  );
}

export function FunctionalHeadDashboard() {
  return (
    <HeadDashboard
      role="functionalHead"
      title="Functional Head — Extension Requests"
      taskDefinitionKey="functionalHeadApprovalTask"
    />
  );
}