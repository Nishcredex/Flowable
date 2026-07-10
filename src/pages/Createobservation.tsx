
// ============================================================
//  CreateAtrObservation.tsx
//  Starts ATR_OBSERVATION_LIFECYCLE (new workflow, ATR_OBSERVATION_LIFECYCLE_bpmn20.xml).
//  Parallel to Createobservation.tsx, which stays wired to the old
//  auditObservationWorkflow untouched.
//
//  Route suggestion: /observations/new  (add in your router alongside
//  the existing /observations/create route for the old flow).
//  Restrict to auditors/admins the same way the old screen does.
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2Icon, AlertCircleIcon } from 'lucide-react';
import { startAtrObservationProcess, completeAuditeeNotificationJob, getUsersByRole, FlowableUser } from './services/flowableApi';
import { useAuth, getDashboardPath } from '../pages/AuthContext';

const inputCls =
  'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent';

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

export function CreateAtrObservation() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    auditeeId: '',
    observationDescription: '',
    department: '',
    category: 'Minor',
    priority: 'Medium',
    targetDate: '',
    auditName: '',
    projectName: '',
    commercialHeadId: '',
    functionalHeadId: '',
  });
  const [commercialHeads, setCommercialHeads] = useState<FlowableUser[]>([]);
  const [functionalHeads, setFunctionalHeads] = useState<FlowableUser[]>([]);
  const [loadingHeads, setLoadingHeads] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // The CMMN case tasks (commercialHeadApprovalTask / functionalHeadApprovalTask)
  // are assigned directly to these ids — resolve them up front from
  // whoever is configured with those roles, same source of truth as the
  // rest of the app (user profiles / Flowable identity groups).
  useEffect(() => {
    (async () => {
      setLoadingHeads(true);
      try {
        const [ch, fh] = await Promise.all([
          getUsersByRole('commercialHead'),
          getUsersByRole('functionalHead'),
        ]);
        setCommercialHeads(ch);
        setFunctionalHeads(fh);
        setForm((f) => ({
          ...f,
          commercialHeadId: f.commercialHeadId || ch[0]?.id || '',
          functionalHeadId: f.functionalHeadId || fh[0]?.id || '',
        }));
      } catch {
        // Non-fatal — auditor can still type an id manually below.
      } finally {
        setLoadingHeads(false);
      }
    })();
  }, []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const valid =
    form.auditeeId.trim() &&
    form.observationDescription.trim() &&
    form.targetDate &&
    form.commercialHeadId.trim() &&
    form.functionalHeadId.trim();

  const submit = async () => {
    if (!user) return;
    setSubmitting(true);
    setError('');
    try {
      const observationId = `OBS-${Date.now()}`;
      const instance = await startAtrObservationProcess({
        observationId,
        auditorId: user.id,
        auditeeId: form.auditeeId,
        targetDate: form.targetDate,
        department: form.department,
        category: form.category,
        priority: form.priority,
        commercialHeadId: form.commercialHeadId,
        functionalHeadId: form.functionalHeadId,
        observationDescription: form.observationDescription,
        auditName: form.auditName,
        projectName: form.projectName,
      });
      // The process instance parks at the sendAuditeeNotification
      // external-worker job right after this — there's no background
      // worker in this app to pick it up, so we complete it inline here.
      // Best-effort: a missed notification job shouldn't block the
      // auditor from moving on, so failures here aren't surfaced as a
      // create-observation error.
      completeAuditeeNotificationJob(instance.id, observationId, form.auditeeId).catch(() => {});
      // Send the auditor back to wherever their role's inbox actually is
      // (My Tasks for auditors/admins, but auditee/commercial/functional
      // land elsewhere) instead of a hardcoded '/tasks'.
      navigate(getDashboardPath(user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start observation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Record Audit Observation</h1>
      <p className="text-sm text-gray-500 mb-6">
        Starts the ATR_OBSERVATION_LIFECYCLE workflow. An extension request will route to the
        Commercial Head, then Functional Head chosen below.
      </p>

      {error && (
        <div className="mb-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircleIcon className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Auditee (Flowable user id)" required>
            <input className={inputCls} value={form.auditeeId} onChange={(e) => set('auditeeId', e.target.value)} placeholder="e.g. auditee.suresh" />
          </Field>
          <Field label="Audit Name">
            <input className={inputCls} value={form.auditName} onChange={(e) => set('auditName', e.target.value)} />
          </Field>
          <Field label="Project / Plant">
            <input className={inputCls} value={form.projectName} onChange={(e) => set('projectName', e.target.value)} />
          </Field>
          <Field label="Department">
            <input className={inputCls} value={form.department} onChange={(e) => set('department', e.target.value)} />
          </Field>
          <Field label="Category">
            <select className={inputCls} value={form.category} onChange={(e) => set('category', e.target.value)}>
              <option>Major</option><option>Minor</option><option>Opportunity for Improvement</option>
            </select>
          </Field>
          <Field label="Priority">
            <select className={inputCls} value={form.priority} onChange={(e) => set('priority', e.target.value)}>
              <option>High</option><option>Medium</option><option>Low</option>
            </select>
          </Field>
          <Field label="Target Date" required>
            <input type="date" className={inputCls} value={form.targetDate} onChange={(e) => set('targetDate', e.target.value)} />
          </Field>
        </div>

        <Field label="Observation Description" required>
          <textarea rows={4} className={inputCls} value={form.observationDescription} onChange={(e) => set('observationDescription', e.target.value)} />
        </Field>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          <Field label="Commercial Head (extension approver 1)" required>
            {commercialHeads.length > 0 ? (
              <select className={inputCls} value={form.commercialHeadId} onChange={(e) => set('commercialHeadId', e.target.value)}>
                {commercialHeads.map((u) => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.id})</option>
                ))}
              </select>
            ) : (
              <input
                className={inputCls}
                value={form.commercialHeadId}
                onChange={(e) => set('commercialHeadId', e.target.value)}
                placeholder={loadingHeads ? 'Loading…' : 'No user with role Commercial Head found — enter user id'}
              />
            )}
          </Field>
          <Field label="Functional Head (extension approver 2)" required>
            {functionalHeads.length > 0 ? (
              <select className={inputCls} value={form.functionalHeadId} onChange={(e) => set('functionalHeadId', e.target.value)}>
                {functionalHeads.map((u) => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.id})</option>
                ))}
              </select>
            ) : (
              <input
                className={inputCls}
                value={form.functionalHeadId}
                onChange={(e) => set('functionalHeadId', e.target.value)}
                placeholder={loadingHeads ? 'Loading…' : 'No user with role Functional Head found — enter user id'}
              />
            )}
          </Field>
        </div>

        <button
          onClick={submit}
          disabled={!valid || submitting}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting && <Loader2Icon className="w-4 h-4 animate-spin" />}
          Record Observation
        </button>
      </div>
    </div>
  );
}