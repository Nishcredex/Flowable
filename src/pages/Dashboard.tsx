
// // ============================================================
// //  Dashboard.tsx — with task status shown in My Open Tasks
// //  UI restyled to match ATRTool mock (light corporate theme)
// // ============================================================

// import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../pages/AuthContext';
// import {
//   ClipboardListIcon,
//   CheckCircle2Icon,
//   ClockIcon,
//   AlertTriangleIcon,
//   PlusIcon,
//   RefreshCwIcon,
//   AlertCircleIcon,
//   ChevronRightIcon,
//   TrendingUpIcon,
//   ActivityIcon,
//   BanIcon,
//   PauseCircleIcon,
// } from 'lucide-react';
// import {
//   getAuditStats,
//   getAllProcessInstances,
//   getTasksByAssignee,
//   getProcessVariables,
//   getVariableValue,
//   AuditStats,
//   ProcessInstance,
//   FlowableTask,
// } from './services/flowableApi';

// // ─────────────────────────────────────────────────────────────
// // TYPES
// // ─────────────────────────────────────────────────────────────

// type TaskStatus = 'Open' | 'In Progress' | 'Blocked' | 'On Hold' | 'Invalid' | 'Needs Review' | 'Completed';

// interface RecentAudit {
//   id:        string;
//   name:      string;
//   project:   string;
//   auditor:   string;
//   startTime: string;
//   status:    'In Progress' | 'Completed' | 'Suspended';
// }

// interface EnrichedDashboardTask {
//   task:       FlowableTask;
//   taskStatus: TaskStatus;
// }

// interface DashboardData {
//   stats:        AuditStats;
//   recentAudits: RecentAudit[];
//   myTasks:      EnrichedDashboardTask[];
// }

// // ─────────────────────────────────────────────────────────────
// // HELPERS
// // ─────────────────────────────────────────────────────────────

// function formatDate(iso: string): string {
//   try {
//     return new Date(iso).toLocaleDateString('en-GB', {
//       day: '2-digit', month: 'short', year: 'numeric',
//     });
//   } catch { return iso; }
// }

// function timeAgo(iso: string): string {
//   const diff = Date.now() - new Date(iso).getTime();
//   const mins  = Math.floor(diff / 60000);
//   const hours = Math.floor(diff / 3600000);
//   const days  = Math.floor(diff / 86400000);
//   if (mins  < 1)  return 'just now';
//   if (mins  < 60) return `${mins}m ago`;
//   if (hours < 24) return `${hours}h ago`;
//   return `${days}d ago`;
// }

// function getInstanceStatus(instance: ProcessInstance): 'In Progress' | 'Completed' | 'Suspended' {
//   if (instance.ended)     return 'Completed';
//   if (instance.suspended) return 'Suspended';
//   return 'In Progress';
// }

// // ─────────────────────────────────────────────────────────────
// // TASK STATUS BADGE (for My Tasks panel)
// // ─────────────────────────────────────────────────────────────

// const ALERT_STATUSES: TaskStatus[] = ['Blocked', 'On Hold', 'Needs Review'];

// function TaskStatusPill({ status }: { status: TaskStatus }) {
//   const cfg: Partial<Record<TaskStatus, { cls: string; icon: React.ReactNode }>> = {
//     'Blocked':      { cls: 'bg-[#fee2e2] text-[#991b1b]',   icon: <BanIcon className="w-3 h-3" /> },
//     'On Hold':      { cls: 'bg-[#fef3c7] text-[#92400e]',   icon: <PauseCircleIcon className="w-3 h-3" /> },
//     'Needs Review': { cls: 'bg-[#e7edff] text-[#173cab]',   icon: <AlertTriangleIcon className="w-3 h-3" /> },
//     'In Progress':  { cls: 'bg-[#e0f2fe] text-[#075985]',   icon: <ClockIcon className="w-3 h-3" /> },
//     'Invalid':      { cls: 'bg-[#eef1f6] text-[#5b6678]',   icon: null },
//   };
//   const c = cfg[status];
//   if (!c) return null;
//   return (
//     <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${c.cls}`}>
//       {c.icon} {status}
//     </span>
//   );
// }

// // ─────────────────────────────────────────────────────────────
// // STAT CARD
// // ─────────────────────────────────────────────────────────────

// function StatCard({
//   label, value, icon, accent, textColor, loading, onClick, foot,
// }: {
//   label: string; value: number | string; icon: React.ReactNode;
//   accent: string; textColor: string; loading: boolean; onClick?: () => void; foot?: string;
// }) {
//   return (
//     <div
//       onClick={onClick}
//       className={`bg-white rounded-lg border border-[#e3e7ee] p-[18px] shadow-[0_1px_2px_rgba(15,23,42,0.06),0_4px_12px_rgba(15,23,42,0.04)] ${onClick ? 'cursor-pointer hover:border-[#cdd4e0] transition-colors' : ''}`}>
//       <div className="flex items-center justify-between mb-2">
//         <p className="text-[12px] uppercase tracking-wide font-medium text-[#5b6678]">{label}</p>
//         <div className={`w-9 h-9 ${accent} rounded-lg flex items-center justify-center flex-shrink-0`}>
//           {icon}
//         </div>
//       </div>
//       {loading
//         ? <div className="h-7 w-16 bg-[#eef1f6] rounded animate-pulse" />
//         : <p className={`text-[26px] font-semibold leading-none ${textColor}`}>{value}</p>
//       }
//       {foot && <p className="text-[12px] text-[#8893a4] mt-1.5">{foot}</p>}
//     </div>
//   );
// }

// function PriorityBadge({ priority }: { priority: number }) {
//   if (priority >= 75) return <span className="px-2 py-0.5 rounded-full text-[11.5px] font-semibold bg-[#fee2e2] text-[#991b1b]">High</span>;
//   if (priority >= 50) return <span className="px-2 py-0.5 rounded-full text-[11.5px] font-semibold bg-[#fef3c7] text-[#92400e]">Medium</span>;
//   return <span className="px-2 py-0.5 rounded-full text-[11.5px] font-semibold bg-[#dcfce7] text-[#166534]">Low</span>;
// }

// // ─────────────────────────────────────────────────────────────
// // ACTIONS-BY-STATUS DONUT  (built from `stats`, no chart lib)
// // ─────────────────────────────────────────────────────────────

// function StatusDonut({ stats, loading }: { stats: AuditStats | undefined; loading: boolean }) {
//   const inProgress = stats?.inProgress ?? 0;
//   const completed  = stats?.completed  ?? 0;
//   const overdue    = stats?.overdue    ?? 0;
//   const total      = stats?.total      ?? 0;
//   const other      = Math.max(0, total - inProgress - completed - overdue);

//   const segments = [
//     { label: 'In Progress', value: inProgress, color: '#1f4ed8' },
//     { label: 'Completed',   value: completed,  color: '#16a34a' },
//     { label: 'Overdue',     value: overdue,    color: '#dc2626' },
//     { label: 'Other',       value: other,      color: '#cdd4e0' },
//   ];
//   const sum = segments.reduce((s, x) => s + x.value, 0) || 1;

//   const r = 54, c = 2 * Math.PI * r;
//   let cursor = 0;

//   return (
//     <div className="flex items-center gap-6">
//       <div className="relative w-[140px] h-[140px] flex-shrink-0">
//         {loading ? (
//           <div className="w-full h-full rounded-full bg-[#eef1f6] animate-pulse" />
//         ) : (
//           <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
//             <circle cx="70" cy="70" r={r} fill="none" stroke="#eef1f6" strokeWidth="16" />
//             {segments.filter(s => s.value > 0).map((s, i) => {
//               const len = (s.value / sum) * c;
//               const dasharray = `${len} ${c - len}`;
//               const dashoffset = -cursor;
//               cursor += len;
//               return (
//                 <circle
//                   key={i}
//                   cx="70" cy="70" r={r} fill="none"
//                   stroke={s.color} strokeWidth="16"
//                   strokeDasharray={dasharray}
//                   strokeDashoffset={dashoffset}
//                 />
//               );
//             })}
//           </svg>
//         )}
//         <div className="absolute inset-0 flex flex-col items-center justify-center">
//           <span className="text-[22px] font-semibold text-[#1a2233]">{loading ? '—' : total}</span>
//           <span className="text-[11px] text-[#8893a4]">total</span>
//         </div>
//       </div>
//       <div className="flex-1 space-y-2">
//         {segments.map((s, i) => (
//           <div key={i} className="flex items-center justify-between text-[13px]">
//             <span className="flex items-center gap-2 text-[#5b6678]">
//               <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: s.color }} />
//               {s.label}
//             </span>
//             <span className="font-semibold text-[#1a2233]">{loading ? '—' : s.value}</span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────
// // TASK-STATUS BREAKDOWN  (mini-stat bars, from `myTasks`)
// // ─────────────────────────────────────────────────────────────

// const TASK_STATUS_ORDER: TaskStatus[] = ['Open', 'In Progress', 'Blocked', 'On Hold', 'Needs Review', 'Completed'];
// const TASK_STATUS_COLOR: Record<TaskStatus, string> = {
//   'Open':          '#1f4ed8',
//   'In Progress':   '#0ea5a3',
//   'Blocked':       '#dc2626',
//   'On Hold':       '#d97706',
//   'Needs Review':  '#a855f7',
//   'Completed':     '#16a34a',
//   'Invalid':       '#8893a4',
// };

// function TaskStatusBreakdown({ tasks, loading }: { tasks: EnrichedDashboardTask[]; loading: boolean }) {
//   const counts: Record<string, number> = {};
//   tasks.forEach(({ taskStatus }) => { counts[taskStatus] = (counts[taskStatus] ?? 0) + 1; });
//   const max = Math.max(1, ...Object.values(counts));

//   if (!loading && tasks.length === 0) {
//     return (
//       <div className="flex flex-col items-center justify-center py-10 gap-2 text-center px-6">
//         <CheckCircle2Icon className="w-8 h-8 text-[#86efac]" />
//         <p className="text-[13px] text-[#5b6678]">No open tasks assigned to you</p>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-3">
//       {TASK_STATUS_ORDER.filter(s => loading || counts[s]).map((status) => {
//         const value = counts[status] ?? 0;
//         const pct = loading ? 0 : Math.round((value / max) * 100);
//         return (
//           <div key={status} className="flex items-center gap-3 text-[13px]">
//             <span className="w-[100px] flex-shrink-0 text-[#5b6678]">{status}</span>
//             <span className="flex-1 h-[6px] rounded-full bg-[#eef1f6] overflow-hidden">
//               <span
//                 className="block h-full rounded-full transition-all"
//                 style={{ width: `${pct}%`, background: TASK_STATUS_COLOR[status] }}
//               />
//             </span>
//             <span className="w-6 text-right font-semibold text-[#1a2233]">{loading ? '—' : value}</span>
//           </div>
//         );
//       })}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────
// // MAIN COMPONENT
// // ─────────────────────────────────────────────────────────────

// export function Dashboard() {
//   const navigate    = useNavigate();
//   // const currentUser = 'admin';
//   const { user, isAdmin } = useAuth();
//   const currentUser       = user?.id || 'admin';

//   const [data,      setData]      = useState<DashboardData | null>(null);
//   const [loading,   setLoading]   = useState(true);
//   const [error,     setError]     = useState('');
//   const [lastFetch, setLastFetch] = useState<Date | null>(null);

//   const fetchDashboard = useCallback(async () => {
//     setLoading(true);
//     setError('');
//     try {
//       const [stats, instances, rawTasks] = await Promise.all([
//         getAuditStats(),
//         getAllProcessInstances(),
//         getTasksByAssignee(currentUser).catch(() => [] as FlowableTask[]),
//       ]);

//       // Enrich recent audits
//       // const recent = instances
//       //   .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
//       //   .slice(0, 5);

//       // const recentAudits: RecentAudit[] = await Promise.all(
//       //   recent.map(async (inst) => {
//       //     let name = 'Unnamed Audit', project = '—', auditor = inst.startUserId || '—';
//       //     const inlineVars = Array.isArray(inst.variables) && inst.variables.length > 0 ? inst.variables : null;
//       //     if (inlineVars) {
//       //       const get = (key: string) => {
//       //         const v = (inlineVars as any[]).find((x: any) => x.name === key);
//       //         return v ? String(v.value) : '';
//       //       };
//       //       name    = get('auditName')   || name;
//       //       project = get('projectName') || project;
//       //       auditor = get('auditorName') || auditor;
//       //     } else if (!inst.ended && !inst._historic) {
//       //       try {
//       //         const vars = await getProcessVariables(inst.id);
//       //         name    = getVariableValue(vars, 'auditName')   || name;
//       //         project = getVariableValue(vars, 'projectName') || project;
//       //         auditor = getVariableValue(vars, 'auditorName') || auditor;
//       //       } catch { /* use defaults */ }
//       //     }
//       //     return { id: inst.id, name, project, auditor, startTime: inst.startTime, status: getInstanceStatus(inst) };
//       //   })
//       // );

//       // Enrich tasks with their persisted taskStatus
//       const myTasks: EnrichedDashboardTask[] = await Promise.all(
//         rawTasks.map(async (task) => {
//           let taskStatus: TaskStatus = 'Open';
//           try {
//             const vars = await getProcessVariables(task.processInstanceId);
//             const saved = getVariableValue(vars, 'taskStatus') as TaskStatus | '';
//             if (saved) taskStatus = saved;
//           } catch { /* default Open */ }
//           return { task, taskStatus };
//         })
//       );
// // Enrich recent audits — auditors see only their own
//       const sorted = instances
//         .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
//         .slice(0, 20);  // fetch more so auditor filter has enough after filtering

//       const allEnriched: RecentAudit[] = await Promise.all(
//         sorted.map(async (inst) => {
//           let name = 'Unnamed Audit', project = '—', auditor = inst.startUserId || '—';
//           const inlineVars = Array.isArray(inst.variables) && inst.variables.length > 0 ? inst.variables : null;
//           if (inlineVars) {
//             const get = (key: string) => {
//               const v = (inlineVars as any[]).find((x: any) => x.name === key);
//               return v ? String(v.value) : '';
//             };
//             name    = get('auditName')   || name;
//             project = get('projectName') || project;
//             auditor = get('auditorName') || auditor;
//           } else if (!inst.ended && !inst._historic) {
//             try {
//               const vars = await getProcessVariables(inst.id);
//               name    = getVariableValue(vars, 'auditName')   || name;
//               project = getVariableValue(vars, 'projectName') || project;
//               auditor = getVariableValue(vars, 'auditorName') || auditor;
//             } catch { /* use defaults */ }
//           }
//           return { id: inst.id, name, project, auditor, startTime: inst.startTime, status: getInstanceStatus(inst) };
//         })
//       );

//       // Filter by auditor name if not admin
//       const recentAudits = isAdmin
//         ? allEnriched.slice(0, 5)
//         : allEnriched.filter(a => a.auditor === user?.name).slice(0, 5);

//       setData({ stats, recentAudits, myTasks });
//       setData({ stats, recentAudits, myTasks });
//       setLastFetch(new Date());
//     } catch (err) {
//       setError(
//         err instanceof Error
//           ? err.message
//           : 'Failed to load dashboard data from Flowable. Make sure Flowable is running on port 8080.'
//       );
//     } finally {
//       setLoading(false);
//     }
//   }, [currentUser]);

//   useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

//   const handleOpenAudit = (audit: RecentAudit) => {
//     localStorage.setItem('currentProcessInstanceId', audit.id);
//     localStorage.setItem('currentAuditName',         audit.name);
//     localStorage.setItem('currentProjectName',        audit.project);
//     localStorage.setItem('currentAuditorName',        audit.auditor);
//     navigate('/audits/manufacturing-unit-1/checklist');
//   };

//   // Count tasks that need attention
//   const alertTaskCount = (data?.myTasks ?? []).filter(
//     e => ALERT_STATUSES.includes(e.taskStatus)
//   ).length;

//   return (
//     <div className="p-7 bg-[#f4f6fa] min-h-full">

//       {/* ── Header ── */}
//       <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
//         <div>
//           <h1 className="text-[22px] font-semibold text-[#1a2233]">Dashboard</h1>
//           <p className="text-[13px] text-[#5b6678] mt-0.5">
//             JK Copier — Audit Management Overview
//             {lastFetch && (
//               <span className="ml-2 text-[12px] text-[#8893a4]">
//                 · Updated {lastFetch.toLocaleTimeString()}
//               </span>
//             )}
//           </p>
//         </div>
//         <div className="flex items-center gap-2">
//           <button
//             onClick={fetchDashboard}
//             disabled={loading}
//             className="flex items-center gap-1.5 px-3.5 py-2 border border-[#cdd4e0] bg-white rounded-md text-[13px] font-medium text-[#1a2233] hover:bg-[#eef1f6] transition-colors disabled:opacity-50">
//             <RefreshCwIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
//             Refresh
//           </button>
//          {isAdmin && ( <button
//             onClick={() => navigate('/audits/create')}
//             className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1f4ed8] text-white rounded-md text-[13px] font-medium hover:bg-[#173cab] transition-colors">
//             <PlusIcon className="w-3.5 h-3.5" />
//             New Audit
//           </button>)}
//         </div>
//       </div>

//       {error && (
//         <div className="flex items-start gap-3 mb-6 p-4 bg-[#fee2e2] border border-[#fca5a5] rounded-lg">
//           <AlertCircleIcon className="w-5 h-5 text-[#dc2626] mt-0.5 flex-shrink-0" />
//           <div>
//             <p className="text-[13px] font-semibold text-[#991b1b]">Failed to load dashboard</p>
//             <p className="text-[13px] text-[#b91c1c] mt-0.5">{error}</p>
//             <button onClick={fetchDashboard} className="mt-2 text-[13px] text-[#991b1b] underline hover:no-underline">
//               Try again
//             </button>
//           </div>
//         </div>
//       )}

//       {/* ── Stat Cards ── */}
//       <div className="grid grid-cols-4 gap-[14px] mb-6">
//         <StatCard
//           label="Total Audits"
//           value={data?.stats.total ?? 0}
//           icon={<ClipboardListIcon className="w-4.5 h-4.5 text-[#1f4ed8]" />}
//           accent="bg-[#e7edff]" textColor="text-[#1a2233]" loading={loading}
//           onClick={() => navigate('/audits')}
//           foot="All audit instances"
//         />
//         <StatCard
//           label="In Progress"
//           value={data?.stats.inProgress ?? 0}
//           icon={<TrendingUpIcon className="w-4.5 h-4.5 text-[#d97706]" />}
//           accent="bg-[#fef3c7]" textColor="text-[#92400e]" loading={loading}
//           onClick={() => navigate('/audits')}
//           foot="Currently active"
//         />
//         <StatCard
//           label="Completed"
//           value={data?.stats.completed ?? 0}
//           icon={<CheckCircle2Icon className="w-4.5 h-4.5 text-[#16a34a]" />}
//           accent="bg-[#dcfce7]" textColor="text-[#166534]" loading={loading}
//           foot="Closed out"
//         />
//         <StatCard
//           label="Overdue Tasks"
//           value={data?.stats.overdue ?? 0}
//           icon={<AlertTriangleIcon className="w-4.5 h-4.5 text-[#dc2626]" />}
//           accent="bg-[#fee2e2]" textColor="text-[#dc2626]" loading={loading}
//           onClick={() => navigate('/tasks')}
//           foot="Needs attention"
//         />
//       </div>

//       {/* ── Main 2x2 panel grid (mirrors the HTML mock's dashboard layout) ── */}
//       <div className="grid grid-cols-2 gap-[18px]">

//         {/* ── Actions by status ── */}
//         <div className="bg-white rounded-lg border border-[#e3e7ee] shadow-[0_1px_2px_rgba(15,23,42,0.06),0_4px_12px_rgba(15,23,42,0.04)]">
//           <div className="flex items-center justify-between px-[18px] py-[14px] border-b border-[#e3e7ee]">
//             <h2 className="text-[14px] font-semibold text-[#1a2233]">Actions by status</h2>
//           </div>
//           <div className="p-[18px]">
//             <StatusDonut stats={data?.stats} loading={loading} />
//           </div>
//         </div>

//         {/* ── Recent activity ── */}
//         <div className="bg-white rounded-lg border border-[#e3e7ee] shadow-[0_1px_2px_rgba(15,23,42,0.06),0_4px_12px_rgba(15,23,42,0.04)]">
//           <div className="flex items-center justify-between px-[18px] py-[14px] border-b border-[#e3e7ee]">
//             <h2 className="text-[14px] font-semibold text-[#1a2233]">Recent activity</h2>
//             <button
//               onClick={() => navigate('/audits')}
//               className="text-[12.5px] text-[#1f4ed8] hover:underline flex items-center gap-0.5">
//               View all <ChevronRightIcon className="w-3 h-3" />
//             </button>
//           </div>

//           {loading && (
//             <div className="p-[18px] space-y-4">
//               {[1, 2, 3].map((i) => (
//                 <div key={i} className="flex items-center gap-3">
//                   <div className="w-2 h-2 rounded-full bg-[#eef1f6] flex-shrink-0" />
//                   <div className="flex-1 h-3 bg-[#eef1f6] rounded animate-pulse" />
//                 </div>
//               ))}
//             </div>
//           )}

//           {!loading && (data?.recentAudits.length ?? 0) === 0 && (
//             <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
//               <ClipboardListIcon className="w-8 h-8 text-[#cdd4e0]" />
//               <p className="text-[13px] text-[#5b6678]">No recent activity</p>
//             </div>
//           )}

//           {!loading && (data?.recentAudits ?? []).slice(0, 5).map((audit, idx) => {
//             const dotColor = audit.status === 'Completed' ? '#16a34a'
//               : audit.status === 'Suspended' ? '#8893a4' : '#1f4ed8';
//             return (
//               <div
//                 key={audit.id}
//                 className={`flex items-start gap-3 px-[18px] py-3 hover:bg-[#fafbfd] cursor-pointer transition-colors ${idx < Math.min((data?.recentAudits.length ?? 1), 5) - 1 ? 'border-b border-[#e3e7ee]' : ''}`}
//                 onClick={() => handleOpenAudit(audit)}>
//                 <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: dotColor }} />
//                 <div className="flex-1 min-w-0">
//                   <p className="text-[13px] text-[#1a2233] leading-snug">
//                     <span className="font-semibold">{audit.name}</span> — {audit.status}
//                   </p>
//                   <p className="text-[12px] text-[#8893a4] mt-0.5">{audit.project} · {timeAgo(audit.startTime)}</p>
//                 </div>
//               </div>
//             );
//           })}
//         </div>

//         {/* ── Task status breakdown ── */}
//         <div className="bg-white rounded-lg border border-[#e3e7ee] shadow-[0_1px_2px_rgba(15,23,42,0.06),0_4px_12px_rgba(15,23,42,0.04)]">
//           <div className="flex items-center justify-between px-[18px] py-[14px] border-b border-[#e3e7ee]">
//             <div className="flex items-center gap-2">
//               <h2 className="text-[14px] font-semibold text-[#1a2233]">My tasks by status</h2>
//               {!loading && alertTaskCount > 0 && (
//                 <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#fee2e2] text-[#991b1b]">
//                   <BanIcon className="w-2.5 h-2.5" /> {alertTaskCount}
//                 </span>
//               )}
//             </div>
//             <button
//               onClick={() => navigate('/tasks')}
//               className="text-[12.5px] text-[#1f4ed8] hover:underline flex items-center gap-0.5">
//               View all <ChevronRightIcon className="w-3 h-3" />
//             </button>
//           </div>
//           <div className="p-[18px]">
//             <TaskStatusBreakdown tasks={data?.myTasks ?? []} loading={loading} />
//           </div>
//         </div>

//         {/* ── Upcoming deadlines ── */}
//         <div className="bg-white rounded-lg border border-[#e3e7ee] shadow-[0_1px_2px_rgba(15,23,42,0.06),0_4px_12px_rgba(15,23,42,0.04)]">
//           <div className="flex items-center justify-between px-[18px] py-[14px] border-b border-[#e3e7ee]">
//             <h2 className="text-[14px] font-semibold text-[#1a2233]">Upcoming deadlines</h2>
//             <button
//               onClick={() => navigate('/tasks')}
//               className="text-[12.5px] text-[#1f4ed8] hover:underline flex items-center gap-0.5">
//               View all <ChevronRightIcon className="w-3 h-3" />
//             </button>
//           </div>

//           {loading && (
//             <div className="p-[18px] space-y-4">
//               {[1, 2, 3].map((i) => (
//                 <div key={i} className="space-y-2">
//                   <div className="h-4 bg-[#eef1f6] rounded w-full animate-pulse" />
//                   <div className="h-3 bg-[#eef1f6] rounded w-1/3 animate-pulse" />
//                 </div>
//               ))}
//             </div>
//           )}

//           {(() => {
//             const upcoming = (data?.myTasks ?? [])
//               .filter(({ task }) => !!task.dueDate)
//               .sort((a, b) => new Date(a.task.dueDate!).getTime() - new Date(b.task.dueDate!).getTime())
//               .slice(0, 5);

//             if (!loading && upcoming.length === 0) {
//               return (
//                 <div className="flex flex-col items-center justify-center py-10 gap-2 text-center px-6">
//                   <CheckCircle2Icon className="w-8 h-8 text-[#86efac]" />
//                   <p className="text-[13px] text-[#5b6678]">No upcoming deadlines</p>
//                 </div>
//               );
//             }

//             return !loading && upcoming.map(({ task, taskStatus }, idx) => (
//               <div
//                 key={task.id}
//                 className={`flex items-start justify-between gap-3 px-[18px] py-3 hover:bg-[#fafbfd] cursor-pointer transition-colors ${idx < upcoming.length - 1 ? 'border-b border-[#e3e7ee]' : ''}`}
//                 onClick={() => {
//                   localStorage.setItem('currentTaskId', task.id);
//                   localStorage.setItem('currentProcessInstanceId', task.processInstanceId);
//                   navigate(`/tasks/${task.id}`);
//                 }}>
//                 <div className="min-w-0">
//                   <p className="text-[13px] font-medium text-[#1a2233] leading-snug line-clamp-1">{task.name}</p>
//                   <p className="text-[12px] text-[#8893a4] mt-0.5 flex items-center gap-1">
//                     <ClockIcon className="w-3 h-3" /> Due {formatDate(task.dueDate!)}
//                   </p>
//                 </div>
//                 <div className="flex flex-col items-end gap-1 flex-shrink-0">
//                   <PriorityBadge priority={task.priority || 0} />
//                   {taskStatus !== 'Open' && <TaskStatusPill status={taskStatus} />}
//                 </div>
//               </div>
//             ));
//           })()}
//         </div>
//       </div>

//       {/* ── Quick Actions ── */}
//       <div className="mt-[18px] bg-white rounded-lg border border-[#e3e7ee] shadow-[0_1px_2px_rgba(15,23,42,0.06),0_4px_12px_rgba(15,23,42,0.04)] p-[18px]">
//         <h2 className="text-[14px] font-semibold text-[#1a2233] mb-4">Quick Actions</h2>
//         <div className="flex items-center gap-2.5 flex-wrap">
//           <button
//             onClick={() => navigate('/audits/create')}
//             className="flex items-center gap-2 px-3.5 py-2.5 bg-[#1f4ed8] text-white rounded-md text-[13px] font-medium hover:bg-[#173cab] transition-colors">
//             <PlusIcon className="w-4 h-4" />
//             Create New Audit
//           </button>
//           <button
//             onClick={() => navigate('/audits')}
//             className="flex items-center gap-2 px-3.5 py-2.5 border border-[#cdd4e0] bg-white text-[#1a2233] rounded-md text-[13px] font-medium hover:bg-[#eef1f6] transition-colors">
//             <ClipboardListIcon className="w-4 h-4" />
//             View All Audits
//           </button>
//           <button
//             onClick={() => navigate('/tasks')}
//             className="flex items-center gap-2 px-3.5 py-2.5 border border-[#cdd4e0] bg-white text-[#1a2233] rounded-md text-[13px] font-medium hover:bg-[#eef1f6] transition-colors">
//             <ClockIcon className="w-4 h-4" />
//             My Tasks
//           </button>
//           <button
//             onClick={() => navigate('/workflows')}
//             className="flex items-center gap-2 px-3.5 py-2.5 border border-[#cdd4e0] bg-white text-[#1a2233] rounded-md text-[13px] font-medium hover:bg-[#eef1f6] transition-colors">
//             <ActivityIcon className="w-4 h-4" />
//             Workflow View
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }


// ============================================================
//  Dashboard.tsx — with task status shown in My Open Tasks
//  UI restyled to match ATRTool mock (light corporate theme)
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../pages/AuthContext';
import {
  ClipboardListIcon,
  CheckCircle2Icon,
  ClockIcon,
  AlertTriangleIcon,
  PlusIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  ChevronRightIcon,
  TrendingUpIcon,
  ActivityIcon,
  BanIcon,
  PauseCircleIcon,
} from 'lucide-react';
import {
  getAuditStats,
  getAllProcessInstances,
  getTasksByAssignee,
  getProcessVariables,
  getVariableValue,
  AuditStats,
  ProcessInstance,
  FlowableTask,
} from './services/flowableApi';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

type TaskStatus = 'Open' | 'In Progress' | 'Blocked' | 'On Hold' | 'Invalid' | 'Needs Review' | 'Completed';

interface RecentAudit {
  id:        string;
  name:      string;
  project:   string;
  auditor:   string;
  startTime: string;
  status:    'In Progress' | 'Completed' | 'Suspended';
}

interface EnrichedDashboardTask {
  task:       FlowableTask;
  taskStatus: TaskStatus;
}

interface DashboardData {
  stats:        AuditStats;
  recentAudits: RecentAudit[];
  myTasks:      EnrichedDashboardTask[];
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return iso; }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function getInstanceStatus(instance: ProcessInstance): 'In Progress' | 'Completed' | 'Suspended' {
  if (instance.ended)     return 'Completed';
  if (instance.suspended) return 'Suspended';
  return 'In Progress';
}

// ─────────────────────────────────────────────────────────────
// TASK STATUS BADGE (for My Tasks panel)
// ─────────────────────────────────────────────────────────────

const ALERT_STATUSES: TaskStatus[] = ['Blocked', 'On Hold', 'Needs Review'];

function TaskStatusPill({ status }: { status: TaskStatus }) {
  const cfg: Partial<Record<TaskStatus, { cls: string; icon: React.ReactNode }>> = {
    'Blocked':      { cls: 'bg-[#fee2e2] text-[#991b1b]',   icon: <BanIcon className="w-3 h-3" /> },
    'On Hold':      { cls: 'bg-[#fef3c7] text-[#92400e]',   icon: <PauseCircleIcon className="w-3 h-3" /> },
    'Needs Review': { cls: 'bg-[#e7edff] text-[#173cab]',   icon: <AlertTriangleIcon className="w-3 h-3" /> },
    'In Progress':  { cls: 'bg-[#e0f2fe] text-[#075985]',   icon: <ClockIcon className="w-3 h-3" /> },
    'Invalid':      { cls: 'bg-[#eef1f6] text-[#5b6678]',   icon: null },
  };
  const c = cfg[status];
  if (!c) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${c.cls}`}>
      {c.icon} {status}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon, accent, textColor, loading, onClick, foot,
}: {
  label: string; value: number | string; icon: React.ReactNode;
  accent: string; textColor: string; loading: boolean; onClick?: () => void; foot?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg border border-[#e3e7ee] p-[18px] shadow-[0_1px_2px_rgba(15,23,42,0.06),0_4px_12px_rgba(15,23,42,0.04)] ${onClick ? 'cursor-pointer hover:border-[#cdd4e0] transition-colors' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[12px] uppercase tracking-wide font-medium text-[#5b6678]">{label}</p>
        <div className={`w-9 h-9 ${accent} rounded-lg flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
      </div>
      {loading
        ? <div className="h-7 w-16 bg-[#eef1f6] rounded animate-pulse" />
        : <p className={`text-[26px] font-semibold leading-none ${textColor}`}>{value}</p>
      }
      {foot && <p className="text-[12px] text-[#8893a4] mt-1.5">{foot}</p>}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: number }) {
  if (priority >= 75) return <span className="px-2 py-0.5 rounded-full text-[11.5px] font-semibold bg-[#fee2e2] text-[#991b1b]">High</span>;
  if (priority >= 50) return <span className="px-2 py-0.5 rounded-full text-[11.5px] font-semibold bg-[#fef3c7] text-[#92400e]">Medium</span>;
  return <span className="px-2 py-0.5 rounded-full text-[11.5px] font-semibold bg-[#dcfce7] text-[#166534]">Low</span>;
}

// ─────────────────────────────────────────────────────────────
// ACTIONS-BY-STATUS DONUT  (built from `stats`, no chart lib)
// ─────────────────────────────────────────────────────────────

function StatusDonut({ stats, loading }: { stats: AuditStats | undefined; loading: boolean }) {
  const inProgress = stats?.inProgress ?? 0;
  const completed  = stats?.completed  ?? 0;
  const overdue    = stats?.overdue    ?? 0;
  const total      = stats?.total      ?? 0;
  const other      = Math.max(0, total - inProgress - completed - overdue);

  const segments = [
    { label: 'In Progress', value: inProgress, color: '#1f4ed8' },
    { label: 'Completed',   value: completed,  color: '#16a34a' },
    { label: 'Overdue',     value: overdue,    color: '#dc2626' },
    { label: 'Other',       value: other,      color: '#cdd4e0' },
  ];
  const sum = segments.reduce((s, x) => s + x.value, 0) || 1;

  const r = 54, c = 2 * Math.PI * r;
  let cursor = 0;

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-[140px] h-[140px] flex-shrink-0">
        {loading ? (
          <div className="w-full h-full rounded-full bg-[#eef1f6] animate-pulse" />
        ) : (
          <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
            <circle cx="70" cy="70" r={r} fill="none" stroke="#eef1f6" strokeWidth="16" />
            {segments.filter(s => s.value > 0).map((s, i) => {
              const len = (s.value / sum) * c;
              const dasharray = `${len} ${c - len}`;
              const dashoffset = -cursor;
              cursor += len;
              return (
                <circle
                  key={i}
                  cx="70" cy="70" r={r} fill="none"
                  stroke={s.color} strokeWidth="16"
                  strokeDasharray={dasharray}
                  strokeDashoffset={dashoffset}
                />
              );
            })}
          </svg>
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[22px] font-semibold text-[#1a2233]">{loading ? '—' : total}</span>
          <span className="text-[11px] text-[#8893a4]">total</span>
        </div>
      </div>
      <div className="flex-1 space-y-2">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-2 text-[#5b6678]">
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: s.color }} />
              {s.label}
            </span>
            <span className="font-semibold text-[#1a2233]">{loading ? '—' : s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TASK-STATUS BREAKDOWN  (mini-stat bars, from `myTasks`)
// ─────────────────────────────────────────────────────────────

const TASK_STATUS_ORDER: TaskStatus[] = ['Open', 'In Progress', 'Blocked', 'On Hold', 'Needs Review', 'Completed'];
const TASK_STATUS_COLOR: Record<TaskStatus, string> = {
  'Open':          '#1f4ed8',
  'In Progress':   '#0ea5a3',
  'Blocked':       '#dc2626',
  'On Hold':       '#d97706',
  'Needs Review':  '#a855f7',
  'Completed':     '#16a34a',
  'Invalid':       '#8893a4',
};

function TaskStatusBreakdown({ tasks, loading }: { tasks: EnrichedDashboardTask[]; loading: boolean }) {
  const counts: Record<string, number> = {};
  tasks.forEach(({ taskStatus }) => { counts[taskStatus] = (counts[taskStatus] ?? 0) + 1; });
  const max = Math.max(1, ...Object.values(counts));

  if (!loading && tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2 text-center px-6">
        <CheckCircle2Icon className="w-8 h-8 text-[#86efac]" />
        <p className="text-[13px] text-[#5b6678]">No open tasks assigned to you</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {TASK_STATUS_ORDER.filter(s => loading || counts[s]).map((status) => {
        const value = counts[status] ?? 0;
        const pct = loading ? 0 : Math.round((value / max) * 100);
        return (
          <div key={status} className="flex items-center gap-3 text-[13px]">
            <span className="w-[100px] flex-shrink-0 text-[#5b6678]">{status}</span>
            <span className="flex-1 h-[6px] rounded-full bg-[#eef1f6] overflow-hidden">
              <span
                className="block h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: TASK_STATUS_COLOR[status] }}
              />
            </span>
            <span className="w-6 text-right font-semibold text-[#1a2233]">{loading ? '—' : value}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export function Dashboard() {
  const navigate    = useNavigate();
  // const currentUser = 'admin';
  const { user, isAuditor } = useAuth();
  const currentUser       = user?.id || 'admin';

  const [data,      setData]      = useState<DashboardData | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [stats, instances, rawTasks] = await Promise.all([
        getAuditStats(),
        getAllProcessInstances(),
        getTasksByAssignee(currentUser).catch(() => [] as FlowableTask[]),
      ]);

      // Enrich recent audits
      // const recent = instances
      //   .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      //   .slice(0, 5);

      // const recentAudits: RecentAudit[] = await Promise.all(
      //   recent.map(async (inst) => {
      //     let name = 'Unnamed Audit', project = '—', auditor = inst.startUserId || '—';
      //     const inlineVars = Array.isArray(inst.variables) && inst.variables.length > 0 ? inst.variables : null;
      //     if (inlineVars) {
      //       const get = (key: string) => {
      //         const v = (inlineVars as any[]).find((x: any) => x.name === key);
      //         return v ? String(v.value) : '';
      //       };
      //       name    = get('auditName')   || name;
      //       project = get('projectName') || project;
      //       auditor = get('auditorName') || auditor;
      //     } else if (!inst.ended && !inst._historic) {
      //       try {
      //         const vars = await getProcessVariables(inst.id);
      //         name    = getVariableValue(vars, 'auditName')   || name;
      //         project = getVariableValue(vars, 'projectName') || project;
      //         auditor = getVariableValue(vars, 'auditorName') || auditor;
      //       } catch { /* use defaults */ }
      //     }
      //     return { id: inst.id, name, project, auditor, startTime: inst.startTime, status: getInstanceStatus(inst) };
      //   })
      // );

      // Enrich tasks with their persisted taskStatus
      const myTasks: EnrichedDashboardTask[] = await Promise.all(
        rawTasks.map(async (task) => {
          let taskStatus: TaskStatus = 'Open';
          try {
            const vars = await getProcessVariables(task.processInstanceId);
            const saved = getVariableValue(vars, 'taskStatus') as TaskStatus | '';
            if (saved) taskStatus = saved;
          } catch { /* default Open */ }
          return { task, taskStatus };
        })
      );
// Enrich recent audits — auditors see only their own
      const sorted = instances
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
        .slice(0, 20);  // fetch more so auditor filter has enough after filtering

      const allEnriched: RecentAudit[] = await Promise.all(
        sorted.map(async (inst) => {
          let name = 'Unnamed Audit', project = '—', auditor = inst.startUserId || '—';
          const inlineVars = Array.isArray(inst.variables) && inst.variables.length > 0 ? inst.variables : null;
          if (inlineVars) {
            const get = (key: string) => {
              const v = (inlineVars as any[]).find((x: any) => x.name === key);
              return v ? String(v.value) : '';
            };
            name    = get('auditName')   || name;
            project = get('projectName') || project;
            auditor = get('auditorName') || auditor;
          } else if (!inst.ended && !inst._historic) {
            try {
              const vars = await getProcessVariables(inst.id);
              name    = getVariableValue(vars, 'auditName')   || name;
              project = getVariableValue(vars, 'projectName') || project;
              auditor = getVariableValue(vars, 'auditorName') || auditor;
            } catch { /* use defaults */ }
          }
          return { id: inst.id, name, project, auditor, startTime: inst.startTime, status: getInstanceStatus(inst) };
        })
      );

      // Auditors and admins see every recent audit; anyone else (shouldn't
      // normally reach this page — it's route-guarded to admin/auditor)
      // only sees audits where they're the assigned auditor.
      const recentAudits = isAuditor
        ? allEnriched.slice(0, 5)
        : allEnriched.filter(a => a.auditor === user?.name).slice(0, 5);

      setData({ stats, recentAudits, myTasks });
      setData({ stats, recentAudits, myTasks });
      setLastFetch(new Date());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load dashboard data from Flowable. Make sure Flowable is running on port 8080.'
      );
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const handleOpenAudit = (audit: RecentAudit) => {
    localStorage.setItem('currentProcessInstanceId', audit.id);
    localStorage.setItem('currentAuditName',         audit.name);
    localStorage.setItem('currentProjectName',        audit.project);
    localStorage.setItem('currentAuditorName',        audit.auditor);
    navigate('/audits/manufacturing-unit-1/checklist');
  };

  // Count tasks that need attention
  const alertTaskCount = (data?.myTasks ?? []).filter(
    e => ALERT_STATUSES.includes(e.taskStatus)
  ).length;

  return (
    <div className="p-7 bg-[#f4f6fa] min-h-full">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1a2233]">Dashboard</h1>
          <p className="text-[13px] text-[#5b6678] mt-0.5">
            JK Copier — Audit Management Overview
            {lastFetch && (
              <span className="ml-2 text-[12px] text-[#8893a4]">
                · Updated {lastFetch.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-[#cdd4e0] bg-white rounded-md text-[13px] font-medium text-[#1a2233] hover:bg-[#eef1f6] transition-colors disabled:opacity-50">
            <RefreshCwIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
         {isAuditor && ( <button
            onClick={() => navigate('/audits/create')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1f4ed8] text-white rounded-md text-[13px] font-medium hover:bg-[#173cab] transition-colors">
            <PlusIcon className="w-3.5 h-3.5" />
            New Audit
          </button>)}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 mb-6 p-4 bg-[#fee2e2] border border-[#fca5a5] rounded-lg">
          <AlertCircleIcon className="w-5 h-5 text-[#dc2626] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-[#991b1b]">Failed to load dashboard</p>
            <p className="text-[13px] text-[#b91c1c] mt-0.5">{error}</p>
            <button onClick={fetchDashboard} className="mt-2 text-[13px] text-[#991b1b] underline hover:no-underline">
              Try again
            </button>
          </div>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-4 gap-[14px] mb-6">
        <StatCard
          label="Total Audits"
          value={data?.stats.total ?? 0}
          icon={<ClipboardListIcon className="w-4.5 h-4.5 text-[#1f4ed8]" />}
          accent="bg-[#e7edff]" textColor="text-[#1a2233]" loading={loading}
          onClick={() => navigate('/audits')}
          foot="All audit instances"
        />
        <StatCard
          label="In Progress"
          value={data?.stats.inProgress ?? 0}
          icon={<TrendingUpIcon className="w-4.5 h-4.5 text-[#d97706]" />}
          accent="bg-[#fef3c7]" textColor="text-[#92400e]" loading={loading}
          onClick={() => navigate('/audits')}
          foot="Currently active"
        />
        <StatCard
          label="Completed"
          value={data?.stats.completed ?? 0}
          icon={<CheckCircle2Icon className="w-4.5 h-4.5 text-[#16a34a]" />}
          accent="bg-[#dcfce7]" textColor="text-[#166534]" loading={loading}
          foot="Closed out"
        />
        <StatCard
          label="Overdue Tasks"
          value={data?.stats.overdue ?? 0}
          icon={<AlertTriangleIcon className="w-4.5 h-4.5 text-[#dc2626]" />}
          accent="bg-[#fee2e2]" textColor="text-[#dc2626]" loading={loading}
          onClick={() => navigate('/tasks')}
          foot="Needs attention"
        />
      </div>

      {/* ── Main 2x2 panel grid (mirrors the HTML mock's dashboard layout) ── */}
      <div className="grid grid-cols-2 gap-[18px]">

        {/* ── Actions by status ── */}
        <div className="bg-white rounded-lg border border-[#e3e7ee] shadow-[0_1px_2px_rgba(15,23,42,0.06),0_4px_12px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between px-[18px] py-[14px] border-b border-[#e3e7ee]">
            <h2 className="text-[14px] font-semibold text-[#1a2233]">Actions by status</h2>
          </div>
          <div className="p-[18px]">
            <StatusDonut stats={data?.stats} loading={loading} />
          </div>
        </div>

        {/* ── Recent activity ── */}
        <div className="bg-white rounded-lg border border-[#e3e7ee] shadow-[0_1px_2px_rgba(15,23,42,0.06),0_4px_12px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between px-[18px] py-[14px] border-b border-[#e3e7ee]">
            <h2 className="text-[14px] font-semibold text-[#1a2233]">Recent activity</h2>
            <button
              onClick={() => navigate('/audits')}
              className="text-[12.5px] text-[#1f4ed8] hover:underline flex items-center gap-0.5">
              View all <ChevronRightIcon className="w-3 h-3" />
            </button>
          </div>

          {loading && (
            <div className="p-[18px] space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#eef1f6] flex-shrink-0" />
                  <div className="flex-1 h-3 bg-[#eef1f6] rounded animate-pulse" />
                </div>
              ))}
            </div>
          )}

          {!loading && (data?.recentAudits.length ?? 0) === 0 && (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
              <ClipboardListIcon className="w-8 h-8 text-[#cdd4e0]" />
              <p className="text-[13px] text-[#5b6678]">No recent activity</p>
            </div>
          )}

          {!loading && (data?.recentAudits ?? []).slice(0, 5).map((audit, idx) => {
            const dotColor = audit.status === 'Completed' ? '#16a34a'
              : audit.status === 'Suspended' ? '#8893a4' : '#1f4ed8';
            return (
              <div
                key={audit.id}
                className={`flex items-start gap-3 px-[18px] py-3 hover:bg-[#fafbfd] cursor-pointer transition-colors ${idx < Math.min((data?.recentAudits.length ?? 1), 5) - 1 ? 'border-b border-[#e3e7ee]' : ''}`}
                onClick={() => handleOpenAudit(audit)}>
                <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: dotColor }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-[#1a2233] leading-snug">
                    <span className="font-semibold">{audit.name}</span> — {audit.status}
                  </p>
                  <p className="text-[12px] text-[#8893a4] mt-0.5">{audit.project} · {timeAgo(audit.startTime)}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Task status breakdown ── */}
        <div className="bg-white rounded-lg border border-[#e3e7ee] shadow-[0_1px_2px_rgba(15,23,42,0.06),0_4px_12px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between px-[18px] py-[14px] border-b border-[#e3e7ee]">
            <div className="flex items-center gap-2">
              <h2 className="text-[14px] font-semibold text-[#1a2233]">My tasks by status</h2>
              {!loading && alertTaskCount > 0 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#fee2e2] text-[#991b1b]">
                  <BanIcon className="w-2.5 h-2.5" /> {alertTaskCount}
                </span>
              )}
            </div>
            <button
              onClick={() => navigate('/tasks')}
              className="text-[12.5px] text-[#1f4ed8] hover:underline flex items-center gap-0.5">
              View all <ChevronRightIcon className="w-3 h-3" />
            </button>
          </div>
          <div className="p-[18px]">
            <TaskStatusBreakdown tasks={data?.myTasks ?? []} loading={loading} />
          </div>
        </div>

        {/* ── Upcoming deadlines ── */}
        <div className="bg-white rounded-lg border border-[#e3e7ee] shadow-[0_1px_2px_rgba(15,23,42,0.06),0_4px_12px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between px-[18px] py-[14px] border-b border-[#e3e7ee]">
            <h2 className="text-[14px] font-semibold text-[#1a2233]">Upcoming deadlines</h2>
            <button
              onClick={() => navigate('/tasks')}
              className="text-[12.5px] text-[#1f4ed8] hover:underline flex items-center gap-0.5">
              View all <ChevronRightIcon className="w-3 h-3" />
            </button>
          </div>

          {loading && (
            <div className="p-[18px] space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-[#eef1f6] rounded w-full animate-pulse" />
                  <div className="h-3 bg-[#eef1f6] rounded w-1/3 animate-pulse" />
                </div>
              ))}
            </div>
          )}

          {(() => {
            const upcoming = (data?.myTasks ?? [])
              .filter(({ task }) => !!task.dueDate)
              .sort((a, b) => new Date(a.task.dueDate!).getTime() - new Date(b.task.dueDate!).getTime())
              .slice(0, 5);

            if (!loading && upcoming.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-center px-6">
                  <CheckCircle2Icon className="w-8 h-8 text-[#86efac]" />
                  <p className="text-[13px] text-[#5b6678]">No upcoming deadlines</p>
                </div>
              );
            }

            return !loading && upcoming.map(({ task, taskStatus }, idx) => (
              <div
                key={task.id}
                className={`flex items-start justify-between gap-3 px-[18px] py-3 hover:bg-[#fafbfd] cursor-pointer transition-colors ${idx < upcoming.length - 1 ? 'border-b border-[#e3e7ee]' : ''}`}
                onClick={() => {
                  localStorage.setItem('currentTaskId', task.id);
                  localStorage.setItem('currentProcessInstanceId', task.processInstanceId);
                  navigate(`/tasks/${task.id}`);
                }}>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[#1a2233] leading-snug line-clamp-1">{task.name}</p>
                  <p className="text-[12px] text-[#8893a4] mt-0.5 flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" /> Due {formatDate(task.dueDate!)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <PriorityBadge priority={task.priority || 0} />
                  {taskStatus !== 'Open' && <TaskStatusPill status={taskStatus} />}
                </div>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="mt-[18px] bg-white rounded-lg border border-[#e3e7ee] shadow-[0_1px_2px_rgba(15,23,42,0.06),0_4px_12px_rgba(15,23,42,0.04)] p-[18px]">
        <h2 className="text-[14px] font-semibold text-[#1a2233] mb-4">Quick Actions</h2>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => navigate('/audits/create')}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-[#1f4ed8] text-white rounded-md text-[13px] font-medium hover:bg-[#173cab] transition-colors">
            <PlusIcon className="w-4 h-4" />
            Create New Audit
          </button>
          <button
            onClick={() => navigate('/audits')}
            className="flex items-center gap-2 px-3.5 py-2.5 border border-[#cdd4e0] bg-white text-[#1a2233] rounded-md text-[13px] font-medium hover:bg-[#eef1f6] transition-colors">
            <ClipboardListIcon className="w-4 h-4" />
            View All Audits
          </button>
          <button
            onClick={() => navigate('/tasks')}
            className="flex items-center gap-2 px-3.5 py-2.5 border border-[#cdd4e0] bg-white text-[#1a2233] rounded-md text-[13px] font-medium hover:bg-[#eef1f6] transition-colors">
            <ClockIcon className="w-4 h-4" />
            My Tasks
          </button>
          <button
            onClick={() => navigate('/workflows')}
            className="flex items-center gap-2 px-3.5 py-2.5 border border-[#cdd4e0] bg-white text-[#1a2233] rounded-md text-[13px] font-medium hover:bg-[#eef1f6] transition-colors">
            <ActivityIcon className="w-4 h-4" />
            Workflow View
          </button>
        </div>
      </div>
    </div>
  );
}