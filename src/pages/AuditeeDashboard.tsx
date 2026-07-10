import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Loader2Icon, AlertCircleIcon, RefreshCwIcon, ChevronRightIcon, CalendarIcon,
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { getMyAudits, type AuditRecord, type CommentEntry } from './services/auditApi';
import {
  AUDITEE_PENDING, AUDITEE_RETURNED, AUDITEE_COMPLETED,
  STATUS_LABELS, statusBadgeClass,
} from '../constants/auditStatus';
import { getTasksByAssignee } from './services/flowableApi';

type Tab = 'pending' | 'returned' | 'completed';

function parseComments(raw: string): CommentEntry[] {
  try {
    const p = JSON.parse(raw || '[]');
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

export function AuditeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('pending');
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const [records, tasks] = await Promise.all([
        getMyAudits(user.id, 'auditee', user.groups || []),
        getTasksByAssignee(user.id, user.name).catch(() => []),
      ]);
      setAudits(records);

      const activeTask = tasks.find((t) =>
        ['submitCorrectiveAction'].includes(t.taskDefinitionKey)
      );
      if (activeTask && tab === 'pending') {
        // surface active task hint via first pending row navigation
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audits');
    } finally {
      setLoading(false);
    }
  }, [user, tab]);

  useEffect(() => { load(); }, [load]);

  const filtered = audits.filter((a) => {
    if (tab === 'pending') return AUDITEE_PENDING.includes(a.status) || (!a.ended && !AUDITEE_COMPLETED.includes(a.status) && !AUDITEE_RETURNED.includes(a.status));
    if (tab === 'returned') return AUDITEE_RETURNED.includes(a.status);
    return a.ended || AUDITEE_COMPLETED.includes(a.status);
  });

  const openTask = async (audit: AuditRecord) => {
    if (!user) return;
    const tasks = await getTasksByAssignee(user.id, user.name);
    const task = tasks.find(
      (t) => t.processInstanceId === audit.id && t.taskDefinitionKey === 'submitCorrectiveAction'
    );
    if (task) {
      navigate(`/observations/tasks/${task.id}`);
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'pending', label: 'Pending' },
    { id: 'returned', label: 'Returned' },
    { id: 'completed', label: 'Completed' },
  ];

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>My Assigned Audits</h1>
          <div className="subtitle">Observations assigned to you — respond, upload evidence, or request extension</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={load} disabled={loading}>
            <RefreshCwIcon style={{ width: 14, height: 14 }} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: 16, padding: 16, borderColor: '#fca5a5', background: '#fee2e2' }}>
          <AlertCircleIcon style={{ width: 16, height: 16, color: '#b91c1c', display: 'inline' }} /> {error}
        </div>
      )}

      <div className="row gap-8" style={{ marginBottom: 16 }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`btn ${tab === t.id ? 'btn-primary' : 'btn-outline'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card card-body" style={{ textAlign: 'center' }}>
          <Loader2Icon className="animate-spin" style={{ width: 24, height: 24, margin: '0 auto' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card card-body text-soft">No audits in this category.</div>
      ) : (
        <div className="stack gap-12">
          {filtered.map((audit) => (
            <div key={audit.id} className="card">
              <div className="card-head">
                <div style={{ flex: 1 }}>
                  <h3>{audit.auditName || audit.observationId || 'Observation'}</h3>
                  <div className="small text-soft">{audit.observationDescription?.slice(0, 120)}</div>
                </div>
                <span className={`badge ${statusBadgeClass(audit.status)}`}>
                  {STATUS_LABELS[audit.status] || audit.status}
                </span>
              </div>
              <div className="card-body">
                <div className="grid-2" style={{ gap: 12, marginBottom: 12 }}>
                  <div className="small"><strong>Due:</strong> {formatDate(audit.dueDate)}</div>
                  <div className="small"><strong>Priority:</strong> {audit.priority || 'Medium'}</div>
                  <div className="small"><strong>Auditor:</strong> {audit.auditorId}</div>
                  <div className="small"><strong>Comments:</strong> {parseComments(audit.comments).length}</div>
                </div>
                {tab !== 'completed' && (
                  <button className="btn btn-primary" onClick={() => openTask(audit)}>
                    Open observation <ChevronRightIcon style={{ width: 14, height: 14 }} />
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
