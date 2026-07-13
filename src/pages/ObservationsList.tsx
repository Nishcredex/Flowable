import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  SearchIcon,
  FilterIcon,
  Loader2Icon,
  AlertCircleIcon,
  RefreshCwIcon,
  Trash2Icon,
} from 'lucide-react';
import { useAuth } from '../pages/AuthContext';
import {
  getAllAtrObservations,
  getProcessVariables,
  getHistoricProcessVariables,
  getTasksByProcessInstance,
  cancelProcessInstance,
  getVariableValue,
  AtrObservationInstance,
  ProcessVariable,
} from './services/flowableApi';
import { STATUS_LABELS, statusBadgeClass } from '../constants/auditStatus';

// ── Shape of one row in the table ────────────────────────────
interface ObservationRow {
  processInstanceId: string;
  observationId:     string;
  auditName:         string;
  projectName:       string;
  department:        string;
  auditeeId:         string;
  category:          string;
  priority:          string;
  targetDate:        string;
  status:            string;   // raw status code, e.g. IN_PROGRESS / PENDING_COMMERCIAL_APPROVAL / COMPLETED
  ended:             boolean;
  commercialHeadId:  string;
  functionalHeadId:  string;
  activeTaskId:      string | null;
  activeTaskName:    string | null;
  activeTaskKey:     string | null;
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function priorityColor(priority: string): string {
  switch (priority) {
    case 'High':   return 'bg-red-100 text-red-700';
    case 'Medium': return 'bg-yellow-100 text-yellow-700';
    case 'Low':    return 'bg-green-100 text-green-700';
    default:       return 'bg-gray-100 text-gray-700';
  }
}

// getAllAtrObservations() already scopes correctly to
// ATR_OBSERVATION_LIFECYCLE (server-side, via processDefinitionKey query
// params) and gives us observationId/auditeeId/targetDate/status/ended —
// but not department/category/priority/projectName/auditName/
// commercialHeadId/functionalHeadId or the current open task, so each row
// still needs one more variables fetch (+ a task fetch while running).
// Same N+1 shape as the original AuditsList.tsx pattern.
async function enrichObservation(base: AtrObservationInstance): Promise<ObservationRow> {
  const vars: ProcessVariable[] = base.ended
    ? await getHistoricProcessVariables(base.id)
    : await getProcessVariables(base.id);

  const tasks = base.ended ? [] : await getTasksByProcessInstance(base.id);
  const activeTask = tasks[0] || null;

  return {
    processInstanceId: base.id,
    observationId: base.observationId || base.id,
    auditName:     getVariableValue(vars, 'auditName')   || '—',
    projectName:   getVariableValue(vars, 'projectName') || '—',
    department:    getVariableValue(vars, 'department')  || '—',
    auditeeId:     base.auditeeId || '—',
    category:      getVariableValue(vars, 'category')    || '—',
    priority:      getVariableValue(vars, 'priority')    || '—',
    targetDate:    base.targetDate || '—',
    status:        base.status,
    ended:         base.ended,
    commercialHeadId: getVariableValue(vars, 'commercialHeadId') || '',
    functionalHeadId: getVariableValue(vars, 'functionalHeadId') || '',
    activeTaskId:   activeTask?.id || null,
    activeTaskName: activeTask?.name || null,
    activeTaskKey:  activeTask?.taskDefinitionKey || null,
  };
}

export function ObservationsList() {
  const navigate = useNavigate();
  const { isAdmin, isAuditor, user } = useAuth();
  const [rows,        setRows]        = useState<ObservationRow[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [deletingId,   setDeletingId]   = useState<string | null>(null);

  const fetchObservations = async () => {
    setLoading(true);
    setError('');
    try {
      const base = await getAllAtrObservations();
      const built = await Promise.all(base.map(enrichObservation));
      setRows(built);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load observations from Flowable. Make sure it is running on port 8080.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchObservations(); }, []);

  const handleCancel = async (processInstanceId: string, observationId: string) => {
    if (!window.confirm(`Cancel observation "${observationId}"? This cannot be undone.`)) return;
    setDeletingId(processInstanceId);
    try {
      await cancelProcessInstance(processInstanceId);
      setRows((prev) => prev.filter((r) => r.processInstanceId !== processInstanceId));
    } catch (err) {
      alert('Failed to cancel observation: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleView = (row: ObservationRow) => {
    if (row.activeTaskId) {
      navigate(`/observations/tasks/${row.activeTaskId}`);
    }
    // No active BPMN task (sitting in CMMN head-approval, or completed) —
    // there's no read-only detail route yet, so the button stays disabled
    // in that case (see render below).
  };

  // Auditors and admins see every observation. commercialHead / functionalHead
  // only see observations where they're the assigned approver.
  const isMyObservation = (row: ObservationRow): boolean => {
    if (isAdmin || isAuditor) return true;
    if (!user) return false;
    if (user.role === 'commercialHead') return row.commercialHeadId === user.id;
    if (user.role === 'functionalHead') return row.functionalHeadId === user.id;
    return false;
  };

  const visibleRows = rows.filter(isMyObservation);

  const filtered = visibleRows.filter((row) =>
    row.observationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.auditName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.auditeeId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Observations</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchObservations}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-600 disabled:opacity-50"
            title="Refresh">
            <RefreshCwIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {(isAdmin || isAuditor) && (
            <Link
              to="/observations/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <PlusIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Record Observation</span>
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircleIcon className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">Failed to load observations</p>
            <p className="text-sm text-red-600 mt-0.5">{error}</p>
            <button onClick={fetchObservations} className="mt-2 text-sm text-red-700 underline hover:no-underline">
              Try again
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search observations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <FilterIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2Icon className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm text-gray-500">Loading observations from Flowable…</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
              <SearchIcon className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700">
              {searchQuery ? 'No observations match your search' : 'No observations found'}
            </p>
            {!searchQuery && (isAdmin || isAuditor) && (
              <Link to="/observations/new" className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                Record Observation
              </Link>
            )}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Observation</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Audit / Project</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Auditee</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Category</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Priority</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Target Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Current Step</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((obs) => (
                  <tr
                    key={obs.processInstanceId}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors">

                    {/* Observation ID */}
                    <td className="py-4 px-4 text-sm font-medium text-gray-900 max-w-[180px]">
                      <span className="line-clamp-2">{obs.observationId}</span>
                    </td>

                    {/* Audit / Project */}
                    <td className="py-4 px-4 text-sm text-gray-600">
                      <div>{obs.auditName}</div>
                      <div className="text-xs text-gray-400">{obs.projectName}{obs.department !== '—' ? ` · ${obs.department}` : ''}</div>
                    </td>

                    {/* Auditee */}
                    <td className="py-4 px-4 text-sm text-gray-600">{obs.auditeeId}</td>

                    {/* Category */}
                    <td className="py-4 px-4 text-sm text-gray-600">{obs.category}</td>

                    {/* Priority */}
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColor(obs.priority)}`}>
                        {obs.priority}
                      </span>
                    </td>

                    {/* Target Date */}
                    <td className="py-4 px-4 text-sm text-gray-600">{formatDate(obs.targetDate)}</td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <span className={`badge ${statusBadgeClass(obs.status)}`}>
                        {STATUS_LABELS[obs.status] || obs.status}
                      </span>
                    </td>

                    {/* Current Step */}
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {obs.activeTaskName || (obs.ended ? '—' : 'Approval stage')}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleView(obs)}
                          disabled={!obs.activeTaskId}
                          title={!obs.activeTaskId ? 'No open inbox task to view right now' : undefined}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:text-gray-300 disabled:cursor-not-allowed">
                          View
                        </button>
                        {isAdmin && !obs.ended && (
                          <button
                            onClick={() => handleCancel(obs.processInstanceId, obs.observationId)}
                            disabled={deletingId === obs.processInstanceId}
                            className="text-red-500 hover:text-red-600 disabled:opacity-50"
                            title="Cancel observation">
                            {deletingId === obs.processInstanceId
                              ? <Loader2Icon className="w-4 h-4 animate-spin" />
                              : <Trash2Icon className="w-4 h-4" />
                            }
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 text-xs text-gray-400 text-right">
              Showing {filtered.length} of {rows.length} observation{rows.length !== 1 ? 's' : ''} from Flowable
            </div>
          </div>
        )}
      </div>
    </div>
  );
}