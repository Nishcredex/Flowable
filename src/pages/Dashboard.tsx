// // // ============================================================
// // //  Dashboard.tsx — with task status shown in My Open Tasks
// // // ============================================================

// // import React, { useState, useEffect, useCallback } from 'react';
// // import { useNavigate } from 'react-router-dom';
// // import { useAuth } from '../pages/AuthContext';
// // import {
// //   ClipboardListIcon,
// //   CheckCircle2Icon,
// //   ClockIcon,
// //   AlertTriangleIcon,
// //   PlusIcon,
// //   Loader2Icon,
// //   RefreshCwIcon,
// //   AlertCircleIcon,
// //   ChevronRightIcon,
// //   UserIcon,
// //   FolderIcon,
// //   TrendingUpIcon,
// //   ActivityIcon,
// //   BanIcon,
// //   PauseCircleIcon,
// // } from 'lucide-react';
// // import {
// //   getAuditStats,
// //   getAllProcessInstances,
// //   getTasksByAssignee,
// //   getProcessVariables,
// //   getVariableValue,
// //   AuditStats,
// //   ProcessInstance,
// //   FlowableTask,
// // } from './services/flowableApi';

// // // ─────────────────────────────────────────────────────────────
// // // TYPES
// // // ─────────────────────────────────────────────────────────────

// // type TaskStatus = 'Open' | 'In Progress' | 'Blocked' | 'On Hold' | 'Invalid' | 'Needs Review' | 'Completed';

// // interface RecentAudit {
// //   id:        string;
// //   name:      string;
// //   project:   string;
// //   auditor:   string;
// //   startTime: string;
// //   status:    'In Progress' | 'Completed' | 'Suspended';
// // }

// // interface EnrichedDashboardTask {
// //   task:       FlowableTask;
// //   taskStatus: TaskStatus;
// // }

// // interface DashboardData {
// //   stats:        AuditStats;
// //   recentAudits: RecentAudit[];
// //   myTasks:      EnrichedDashboardTask[];
// // }

// // // ─────────────────────────────────────────────────────────────
// // // HELPERS
// // // ─────────────────────────────────────────────────────────────

// // function formatDate(iso: string): string {
// //   try {
// //     return new Date(iso).toLocaleDateString('en-GB', {
// //       day: '2-digit', month: 'short', year: 'numeric',
// //     });
// //   } catch { return iso; }
// // }

// // function timeAgo(iso: string): string {
// //   const diff = Date.now() - new Date(iso).getTime();
// //   const mins  = Math.floor(diff / 60000);
// //   const hours = Math.floor(diff / 3600000);
// //   const days  = Math.floor(diff / 86400000);
// //   if (mins  < 1)  return 'just now';
// //   if (mins  < 60) return `${mins}m ago`;
// //   if (hours < 24) return `${hours}h ago`;
// //   return `${days}d ago`;
// // }

// // function getInstanceStatus(instance: ProcessInstance): 'In Progress' | 'Completed' | 'Suspended' {
// //   if (instance.ended)     return 'Completed';
// //   if (instance.suspended) return 'Suspended';
// //   return 'In Progress';
// // }

// // // ─────────────────────────────────────────────────────────────
// // // TASK STATUS BADGE (for My Tasks panel)
// // // ─────────────────────────────────────────────────────────────

// // const ALERT_STATUSES: TaskStatus[] = ['Blocked', 'On Hold', 'Needs Review'];

// // function TaskStatusPill({ status }: { status: TaskStatus }) {
// //   const cfg: Partial<Record<TaskStatus, { cls: string; icon: React.ReactNode }>> = {
// //     'Blocked':      { cls: 'bg-red-100 text-red-700',      icon: <BanIcon className="w-3 h-3" /> },
// //     'On Hold':      { cls: 'bg-yellow-100 text-yellow-700', icon: <PauseCircleIcon className="w-3 h-3" /> },
// //     'Needs Review': { cls: 'bg-purple-100 text-purple-700', icon: <AlertTriangleIcon className="w-3 h-3" /> },
// //     'In Progress':  { cls: 'bg-blue-100 text-blue-700',    icon: <ClockIcon className="w-3 h-3" /> },
// //     'Invalid':      { cls: 'bg-gray-100 text-gray-500',    icon: null },
// //   };
// //   const c = cfg[status];
// //   if (!c) return null;
// //   return (
// //     <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${c.cls}`}>
// //       {c.icon} {status}
// //     </span>
// //   );
// // }

// // // ─────────────────────────────────────────────────────────────
// // // STAT CARD
// // // ─────────────────────────────────────────────────────────────

// // function StatCard({
// //   label, value, icon, color, textColor, loading, onClick,
// // }: {
// //   label: string; value: number | string; icon: React.ReactNode;
// //   color: string; textColor: string; loading: boolean; onClick?: () => void;
// // }) {
// //   return (
// //     <div
// //       onClick={onClick}
// //       className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex items-center gap-5 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-300 transition-all' : ''}`}>
// //       <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
// //         {icon}
// //       </div>
// //       <div>
// //         <p className="text-sm text-gray-500 mb-0.5">{label}</p>
// //         {loading
// //           ? <div className="h-8 w-16 bg-gray-100 rounded animate-pulse" />
// //           : <p className={`text-3xl font-bold ${textColor}`}>{value}</p>
// //         }
// //       </div>
// //     </div>
// //   );
// // }

// // function StatusBadge({ status }: { status: RecentAudit['status'] }) {
// //   const map = {
// //     'In Progress': 'bg-blue-100 text-blue-700',
// //     'Completed':   'bg-green-100 text-green-700',
// //     'Suspended':   'bg-gray-100 text-gray-500',
// //   };
// //   return (
// //     <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>
// //       {status}
// //     </span>
// //   );
// // }

// // function PriorityBadge({ priority }: { priority: number }) {
// //   if (priority >= 75) return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">High</span>;
// //   if (priority >= 50) return <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">Medium</span>;
// //   return <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Low</span>;
// // }

// // // ─────────────────────────────────────────────────────────────
// // // MAIN COMPONENT
// // // ─────────────────────────────────────────────────────────────

// // export function Dashboard() {
// //   const navigate    = useNavigate();
// //   // const currentUser = 'admin';
// //   const { user, isAdmin } = useAuth();
// //   const currentUser       = user?.id || 'admin';

// //   const [data,      setData]      = useState<DashboardData | null>(null);
// //   const [loading,   setLoading]   = useState(true);
// //   const [error,     setError]     = useState('');
// //   const [lastFetch, setLastFetch] = useState<Date | null>(null);

// //   const fetchDashboard = useCallback(async () => {
// //     setLoading(true);
// //     setError('');
// //     try {
// //       const [stats, instances, rawTasks] = await Promise.all([
// //         getAuditStats(),
// //         getAllProcessInstances(),
// //         getTasksByAssignee(currentUser).catch(() => [] as FlowableTask[]),
// //       ]);

// //       // Enrich recent audits
// //       // const recent = instances
// //       //   .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
// //       //   .slice(0, 5);

// //       // const recentAudits: RecentAudit[] = await Promise.all(
// //       //   recent.map(async (inst) => {
// //       //     let name = 'Unnamed Audit', project = '—', auditor = inst.startUserId || '—';
// //       //     const inlineVars = Array.isArray(inst.variables) && inst.variables.length > 0 ? inst.variables : null;
// //       //     if (inlineVars) {
// //       //       const get = (key: string) => {
// //       //         const v = (inlineVars as any[]).find((x: any) => x.name === key);
// //       //         return v ? String(v.value) : '';
// //       //       };
// //       //       name    = get('auditName')   || name;
// //       //       project = get('projectName') || project;
// //       //       auditor = get('auditorName') || auditor;
// //       //     } else if (!inst.ended && !inst._historic) {
// //       //       try {
// //       //         const vars = await getProcessVariables(inst.id);
// //       //         name    = getVariableValue(vars, 'auditName')   || name;
// //       //         project = getVariableValue(vars, 'projectName') || project;
// //       //         auditor = getVariableValue(vars, 'auditorName') || auditor;
// //       //       } catch { /* use defaults */ }
// //       //     }
// //       //     return { id: inst.id, name, project, auditor, startTime: inst.startTime, status: getInstanceStatus(inst) };
// //       //   })
// //       // );

// //       // Enrich tasks with their persisted taskStatus
// //       const myTasks: EnrichedDashboardTask[] = await Promise.all(
// //         rawTasks.map(async (task) => {
// //           let taskStatus: TaskStatus = 'Open';
// //           try {
// //             const vars = await getProcessVariables(task.processInstanceId);
// //             const saved = getVariableValue(vars, 'taskStatus') as TaskStatus | '';
// //             if (saved) taskStatus = saved;
// //           } catch { /* default Open */ }
// //           return { task, taskStatus };
// //         })
// //       );
// // // Enrich recent audits — auditors see only their own
// //       const sorted = instances
// //         .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
// //         .slice(0, 20);  // fetch more so auditor filter has enough after filtering

// //       const allEnriched: RecentAudit[] = await Promise.all(
// //         sorted.map(async (inst) => {
// //           let name = 'Unnamed Audit', project = '—', auditor = inst.startUserId || '—';
// //           const inlineVars = Array.isArray(inst.variables) && inst.variables.length > 0 ? inst.variables : null;
// //           if (inlineVars) {
// //             const get = (key: string) => {
// //               const v = (inlineVars as any[]).find((x: any) => x.name === key);
// //               return v ? String(v.value) : '';
// //             };
// //             name    = get('auditName')   || name;
// //             project = get('projectName') || project;
// //             auditor = get('auditorName') || auditor;
// //           } else if (!inst.ended && !inst._historic) {
// //             try {
// //               const vars = await getProcessVariables(inst.id);
// //               name    = getVariableValue(vars, 'auditName')   || name;
// //               project = getVariableValue(vars, 'projectName') || project;
// //               auditor = getVariableValue(vars, 'auditorName') || auditor;
// //             } catch { /* use defaults */ }
// //           }
// //           return { id: inst.id, name, project, auditor, startTime: inst.startTime, status: getInstanceStatus(inst) };
// //         })
// //       );

// //       // Filter by auditor name if not admin
// //       const recentAudits = isAdmin
// //         ? allEnriched.slice(0, 5)
// //         : allEnriched.filter(a => a.auditor === user?.name).slice(0, 5);

// //       setData({ stats, recentAudits, myTasks });
// //       setData({ stats, recentAudits, myTasks });
// //       setLastFetch(new Date());
// //     } catch (err) {
// //       setError(
// //         err instanceof Error
// //           ? err.message
// //           : 'Failed to load dashboard data from Flowable. Make sure Flowable is running on port 8080.'
// //       );
// //     } finally {
// //       setLoading(false);
// //     }
// //   }, [currentUser]);

// //   useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

// //   const handleOpenAudit = (audit: RecentAudit) => {
// //     localStorage.setItem('currentProcessInstanceId', audit.id);
// //     localStorage.setItem('currentAuditName',         audit.name);
// //     localStorage.setItem('currentProjectName',        audit.project);
// //     localStorage.setItem('currentAuditorName',        audit.auditor);
// //     navigate('/audits/manufacturing-unit-1/checklist');
// //   };

// //   // Count tasks that need attention
// //   const alertTaskCount = (data?.myTasks ?? []).filter(
// //     e => ALERT_STATUSES.includes(e.taskStatus)
// //   ).length;

// //   return (
// //     <div className="p-8">

// //       {/* ── Header ── */}
// //       <div className="flex items-center justify-between mb-8">
// //         <div>
// //           <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
// //           <p className="text-sm text-gray-500 mt-0.5">
// //             JK Copier — Audit Management Overview
// //             {lastFetch && (
// //               <span className="ml-2 text-xs text-gray-400">
// //                 · Updated {lastFetch.toLocaleTimeString()}
// //               </span>
// //             )}
// //           </p>
// //         </div>
// //         <div className="flex items-center gap-3">
// //           <button
// //             onClick={fetchDashboard}
// //             disabled={loading}
// //             className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
// //             <RefreshCwIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
// //             Refresh
// //           </button>
// //          {isAdmin && ( <button
// //             onClick={() => navigate('/audits/create')}
// //             className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
// //             <PlusIcon className="w-4 h-4" />
// //             New Audit
// //           </button>)}
// //         </div>
// //       </div>

// //       {error && (
// //         <div className="flex items-start gap-3 mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
// //           <AlertCircleIcon className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
// //           <div>
// //             <p className="text-sm font-semibold text-red-700">Failed to load dashboard</p>
// //             <p className="text-sm text-red-600 mt-0.5">{error}</p>
// //             <button onClick={fetchDashboard} className="mt-2 text-sm text-red-700 underline hover:no-underline">
// //               Try again
// //             </button>
// //           </div>
// //         </div>
// //       )}

// //       {/* ── Stat Cards ── */}
// //       <div className="grid grid-cols-4 gap-5 mb-8">
// //         <StatCard
// //           label="Total Audits"
// //           value={data?.stats.total ?? 0}
// //           icon={<ClipboardListIcon className="w-6 h-6 text-blue-600" />}
// //           color="bg-blue-50" textColor="text-gray-900" loading={loading}
// //           onClick={() => navigate('/audits')}
// //         />
// //         <StatCard
// //           label="In Progress"
// //           value={data?.stats.inProgress ?? 0}
// //           icon={<TrendingUpIcon className="w-6 h-6 text-amber-600" />}
// //           color="bg-amber-50" textColor="text-amber-700" loading={loading}
// //           onClick={() => navigate('/audits')}
// //         />
// //         <StatCard
// //           label="Completed"
// //           value={data?.stats.completed ?? 0}
// //           icon={<CheckCircle2Icon className="w-6 h-6 text-green-600" />}
// //           color="bg-green-50" textColor="text-green-700" loading={loading}
// //         />
// //         <StatCard
// //           label="Overdue Tasks"
// //           value={data?.stats.overdue ?? 0}
// //           icon={<AlertTriangleIcon className="w-6 h-6 text-red-600" />}
// //           color="bg-red-50" textColor="text-red-600" loading={loading}
// //           onClick={() => navigate('/tasks')}
// //         />
// //       </div>

// //       {/* ── Main two-column layout ── */}
// //       <div className="grid grid-cols-3 gap-6">

// //         {/* ── LEFT: Recent Audits ── */}
// //         <div className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
// //           <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
// //             <div className="flex items-center gap-2">
// //               <ActivityIcon className="w-4 h-4 text-gray-400" />
// //               <h2 className="text-sm font-semibold text-gray-800">Recent Audits</h2>
// //             </div>
// //             <button
// //               onClick={() => navigate('/audits')}
// //               className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
// //               View all <ChevronRightIcon className="w-3 h-3" />
// //             </button>
// //           </div>

// //           {loading && (
// //             <div className="p-6 space-y-4">
// //               {[1, 2, 3].map((i) => (
// //                 <div key={i} className="flex items-center gap-4">
// //                   <div className="flex-1 space-y-2">
// //                     <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse" />
// //                     <div className="h-3 bg-gray-100 rounded w-1/3 animate-pulse" />
// //                   </div>
// //                   <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
// //                 </div>
// //               ))}
// //             </div>
// //           )}

// //           {!loading && (data?.recentAudits.length ?? 0) === 0 && (
// //             <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
// //               <ClipboardListIcon className="w-10 h-10 text-gray-300" />
// //               <p className="text-sm text-gray-500">No audits found in Flowable</p>
// //               <button onClick={() => navigate('/audits/create')} className="text-sm text-blue-600 hover:underline">
// //                 Create your first audit →
// //               </button>
// //             </div>
// //           )}

// //           {!loading && (data?.recentAudits ?? []).map((audit, idx) => (
// //             <div
// //               key={audit.id}
// //               className={`flex items-center gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors ${idx < (data?.recentAudits.length ?? 1) - 1 ? 'border-b border-gray-100' : ''}`}
// //               onClick={() => handleOpenAudit(audit)}>
// //               <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
// //                 <ClipboardListIcon className="w-4 h-4 text-blue-600" />
// //               </div>
// //               <div className="flex-1 min-w-0">
// //                 <p className="text-sm font-medium text-gray-900 truncate">{audit.name}</p>
// //                 <div className="flex items-center gap-3 mt-0.5">
// //                   <span className="flex items-center gap-1 text-xs text-gray-400">
// //                     <FolderIcon className="w-3 h-3" /> {audit.project}
// //                   </span>
// //                   <span className="flex items-center gap-1 text-xs text-gray-400">
// //                     <UserIcon className="w-3 h-3" /> {audit.auditor}
// //                   </span>
// //                 </div>
// //               </div>
// //               <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
// //                 <StatusBadge status={audit.status} />
// //                 <span className="text-xs text-gray-400">{timeAgo(audit.startTime)}</span>
// //               </div>
// //               <ChevronRightIcon className="w-4 h-4 text-gray-300 flex-shrink-0" />
// //             </div>
// //           ))}
// //         </div>

// //         {/* ── RIGHT: My Tasks ── */}
// //         <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
// //           <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
// //             <div className="flex items-center gap-2">
// //               <ClockIcon className="w-4 h-4 text-gray-400" />
// //               <h2 className="text-sm font-semibold text-gray-800">My Open Tasks</h2>
// //               {/* Attention badge if any task is blocked/on-hold */}
// //               {!loading && alertTaskCount > 0 && (
// //                 <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">
// //                   <BanIcon className="w-2.5 h-2.5" /> {alertTaskCount}
// //                 </span>
// //               )}
// //             </div>
// //             <button
// //               onClick={() => navigate('/tasks')}
// //               className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
// //               View all <ChevronRightIcon className="w-3 h-3" />
// //             </button>
// //           </div>

// //           {loading && (
// //             <div className="p-6 space-y-4">
// //               {[1, 2, 3].map((i) => (
// //                 <div key={i} className="space-y-2">
// //                   <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
// //                   <div className="h-3 bg-gray-100 rounded w-2/3 animate-pulse" />
// //                 </div>
// //               ))}
// //             </div>
// //           )}

// //           {!loading && (data?.myTasks.length ?? 0) === 0 && (
// //             <div className="flex flex-col items-center justify-center py-12 gap-2 text-center px-6">
// //               <CheckCircle2Icon className="w-8 h-8 text-green-400" />
// //               <p className="text-sm text-gray-500">No open tasks assigned to you</p>
// //             </div>
// //           )}

// //           {!loading && (data?.myTasks ?? []).slice(0, 6).map(({ task, taskStatus }, idx) => (
// //             <div
// //               key={task.id}
// //               className={`px-6 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors
// //                 ${idx < Math.min((data?.myTasks.length ?? 1), 6) - 1 ? 'border-b border-gray-100' : ''}
// //                 ${ALERT_STATUSES.includes(taskStatus) ? 'bg-red-50/40' : ''}
// //               `}
// //               onClick={() => {
// //                 localStorage.setItem('currentTaskId', task.id);
// //                 localStorage.setItem('currentProcessInstanceId', task.processInstanceId);
// //                 navigate(`/tasks/${task.id}`);
// //               }}>
// //               <div className="flex items-start justify-between gap-2 mb-1">
// //                 <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-2">{task.name}</p>
// //                 <PriorityBadge priority={task.priority || 0} />
// //               </div>

// //               {/* Task status pill — only shown if not Open */}
// //               {taskStatus && taskStatus !== 'Open' && (
// //                 <div className="mb-1">
// //                   <TaskStatusPill status={taskStatus} />
// //                 </div>
// //               )}

// //               {task.dueDate && (
// //                 <p className="text-xs text-gray-400 flex items-center gap-1">
// //                   <ClockIcon className="w-3 h-3" />
// //                   Due {formatDate(task.dueDate)}
// //                 </p>
// //               )}
// //             </div>
// //           ))}

// //           {!loading && (data?.myTasks.length ?? 0) > 6 && (
// //             <div className="px-6 py-3 border-t border-gray-100">
// //               <button onClick={() => navigate('/tasks')} className="text-xs text-blue-600 hover:underline">
// //                 +{(data?.myTasks.length ?? 0) - 6} more tasks →
// //               </button>
// //             </div>
// //           )}
// //         </div>
// //       </div>

// //       {/* ── Quick Actions ── */}
// //       <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
// //         <h2 className="text-sm font-semibold text-gray-800 mb-4">Quick Actions</h2>
// //         <div className="flex items-center gap-3">
// //           <button
// //             onClick={() => navigate('/audits/create')}
// //             className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
// //             <PlusIcon className="w-4 h-4" />
// //             Create New Audit
// //           </button>
// //           <button
// //             onClick={() => navigate('/audits')}
// //             className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
// //             <ClipboardListIcon className="w-4 h-4" />
// //             View All Audits
// //           </button>
// //           <button
// //             onClick={() => navigate('/tasks')}
// //             className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
// //             <ClockIcon className="w-4 h-4" />
// //             My Tasks
// //           </button>
// //           <button
// //             onClick={() => navigate('/workflows')}
// //             className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
// //             <ActivityIcon className="w-4 h-4" />
// //             Workflow View
// //           </button>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

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
//   Loader2Icon,
//   RefreshCwIcon,
//   AlertCircleIcon,
//   ChevronRightIcon,
//   UserIcon,
//   FolderIcon,
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

// function StatusBadge({ status }: { status: RecentAudit['status'] }) {
//   const map: Record<RecentAudit['status'], string> = {
//     'In Progress': 'bg-[#e7edff] text-[#173cab]',
//     'Completed':   'bg-[#dcfce7] text-[#166534]',
//     'Suspended':   'bg-[#eef1f6] text-[#5b6678]',
//   };
//   return (
//     <span className={`px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold ${map[status]}`}>
//       {status}
//     </span>
//   );
// }

// function PriorityBadge({ priority }: { priority: number }) {
//   if (priority >= 75) return <span className="px-2 py-0.5 rounded-full text-[11.5px] font-semibold bg-[#fee2e2] text-[#991b1b]">High</span>;
//   if (priority >= 50) return <span className="px-2 py-0.5 rounded-full text-[11.5px] font-semibold bg-[#fef3c7] text-[#92400e]">Medium</span>;
//   return <span className="px-2 py-0.5 rounded-full text-[11.5px] font-semibold bg-[#dcfce7] text-[#166534]">Low</span>;
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

//       {/* ── Main two-column layout ── */}
//       <div className="grid grid-cols-3 gap-[18px]">

//         {/* ── LEFT: Recent Audits ── */}
//         <div className="col-span-2 bg-white rounded-lg border border-[#e3e7ee] shadow-[0_1px_2px_rgba(15,23,42,0.06),0_4px_12px_rgba(15,23,42,0.04)]">
//           <div className="flex items-center justify-between px-[18px] py-[14px] border-b border-[#e3e7ee]">
//             <div className="flex items-center gap-2">
//               <ActivityIcon className="w-4 h-4 text-[#8893a4]" />
//               <h2 className="text-[14px] font-semibold text-[#1a2233]">Recent Audits</h2>
//             </div>
//             <button
//               onClick={() => navigate('/audits')}
//               className="text-[12.5px] text-[#1f4ed8] hover:underline flex items-center gap-0.5">
//               View all <ChevronRightIcon className="w-3 h-3" />
//             </button>
//           </div>

//           {loading && (
//             <div className="p-[18px] space-y-4">
//               {[1, 2, 3].map((i) => (
//                 <div key={i} className="flex items-center gap-4">
//                   <div className="flex-1 space-y-2">
//                     <div className="h-4 bg-[#eef1f6] rounded w-2/3 animate-pulse" />
//                     <div className="h-3 bg-[#eef1f6] rounded w-1/3 animate-pulse" />
//                   </div>
//                   <div className="h-6 w-20 bg-[#eef1f6] rounded-full animate-pulse" />
//                 </div>
//               ))}
//             </div>
//           )}

//           {!loading && (data?.recentAudits.length ?? 0) === 0 && (
//             <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
//               <ClipboardListIcon className="w-10 h-10 text-[#cdd4e0]" />
//               <p className="text-[13px] text-[#5b6678]">No audits found in Flowable</p>
//               <button onClick={() => navigate('/audits/create')} className="text-[13px] text-[#1f4ed8] hover:underline">
//                 Create your first audit →
//               </button>
//             </div>
//           )}

//           {!loading && (data?.recentAudits ?? []).map((audit, idx) => (
//             <div
//               key={audit.id}
//               className={`flex items-center gap-4 px-[18px] py-[14px] hover:bg-[#fafbfd] cursor-pointer transition-colors ${idx < (data?.recentAudits.length ?? 1) - 1 ? 'border-b border-[#e3e7ee]' : ''}`}
//               onClick={() => handleOpenAudit(audit)}>
//               <div className="w-9 h-9 bg-[#e7edff] rounded-lg flex items-center justify-center flex-shrink-0">
//                 <ClipboardListIcon className="w-4 h-4 text-[#1f4ed8]" />
//               </div>
//               <div className="flex-1 min-w-0">
//                 <p className="text-[13px] font-medium text-[#1a2233] truncate">{audit.name}</p>
//                 <div className="flex items-center gap-3 mt-0.5">
//                   <span className="flex items-center gap-1 text-[12px] text-[#8893a4]">
//                     <FolderIcon className="w-3 h-3" /> {audit.project}
//                   </span>
//                   <span className="flex items-center gap-1 text-[12px] text-[#8893a4]">
//                     <UserIcon className="w-3 h-3" /> {audit.auditor}
//                   </span>
//                 </div>
//               </div>
//               <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
//                 <StatusBadge status={audit.status} />
//                 <span className="text-[12px] text-[#8893a4]">{timeAgo(audit.startTime)}</span>
//               </div>
//               <ChevronRightIcon className="w-4 h-4 text-[#cdd4e0] flex-shrink-0" />
//             </div>
//           ))}
//         </div>

//         {/* ── RIGHT: My Tasks ── */}
//         <div className="bg-white rounded-lg border border-[#e3e7ee] shadow-[0_1px_2px_rgba(15,23,42,0.06),0_4px_12px_rgba(15,23,42,0.04)]">
//           <div className="flex items-center justify-between px-[18px] py-[14px] border-b border-[#e3e7ee]">
//             <div className="flex items-center gap-2">
//               <ClockIcon className="w-4 h-4 text-[#8893a4]" />
//               <h2 className="text-[14px] font-semibold text-[#1a2233]">My Open Tasks</h2>
//               {/* Attention badge if any task is blocked/on-hold */}
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

//           {loading && (
//             <div className="p-[18px] space-y-4">
//               {[1, 2, 3].map((i) => (
//                 <div key={i} className="space-y-2">
//                   <div className="h-4 bg-[#eef1f6] rounded w-full animate-pulse" />
//                   <div className="h-3 bg-[#eef1f6] rounded w-2/3 animate-pulse" />
//                 </div>
//               ))}
//             </div>
//           )}

//           {!loading && (data?.myTasks.length ?? 0) === 0 && (
//             <div className="flex flex-col items-center justify-center py-12 gap-2 text-center px-6">
//               <CheckCircle2Icon className="w-8 h-8 text-[#86efac]" />
//               <p className="text-[13px] text-[#5b6678]">No open tasks assigned to you</p>
//             </div>
//           )}

//           {!loading && (data?.myTasks ?? []).slice(0, 6).map(({ task, taskStatus }, idx) => (
//             <div
//               key={task.id}
//               className={`px-[18px] py-3 hover:bg-[#fafbfd] cursor-pointer transition-colors
//                 ${idx < Math.min((data?.myTasks.length ?? 1), 6) - 1 ? 'border-b border-[#e3e7ee]' : ''}
//                 ${ALERT_STATUSES.includes(taskStatus) ? 'bg-[#fee2e2]/25' : ''}
//               `}
//               onClick={() => {
//                 localStorage.setItem('currentTaskId', task.id);
//                 localStorage.setItem('currentProcessInstanceId', task.processInstanceId);
//                 navigate(`/tasks/${task.id}`);
//               }}>
//               <div className="flex items-start justify-between gap-2 mb-1">
//                 <p className="text-[13px] font-medium text-[#1a2233] leading-snug line-clamp-2">{task.name}</p>
//                 <PriorityBadge priority={task.priority || 0} />
//               </div>

//               {/* Task status pill — only shown if not Open */}
//               {taskStatus && taskStatus !== 'Open' && (
//                 <div className="mb-1">
//                   <TaskStatusPill status={taskStatus} />
//                 </div>
//               )}

//               {task.dueDate && (
//                 <p className="text-[12px] text-[#8893a4] flex items-center gap-1">
//                   <ClockIcon className="w-3 h-3" />
//                   Due {formatDate(task.dueDate)}
//                 </p>
//               )}
//             </div>
//           ))}

//           {!loading && (data?.myTasks.length ?? 0) > 6 && (
//             <div className="px-[18px] py-3 border-t border-[#e3e7ee]">
//               <button onClick={() => navigate('/tasks')} className="text-[12.5px] text-[#1f4ed8] hover:underline">
//                 +{(data?.myTasks.length ?? 0) - 6} more tasks →
//               </button>
//             </div>
//           )}
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
  const { user, isAdmin } = useAuth();
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

      // Filter by auditor name if not admin
      const recentAudits = isAdmin
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
         {isAdmin && ( <button
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