// ============================================================
//  App.tsx — with AuthProvider + ProtectedRoute
// ============================================================

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, getDashboardPath } from './pages/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/Loginpage';
import { CreateAudit } from './pages/CreateAudit';
import { AuditChecklist } from './pages/AuditChecklist';
import { CompleteStep } from './pages/CompleteStep';
import { MyTasks } from './pages/MyTasks';
import { TaskDetails } from './pages/TaskDetails';
import { Dashboard } from './pages/Dashboard';
import { WorkflowView } from './pages/WorkflowView';
import { EmailReminder } from './pages/EmailReminder';
import { AuditsList } from './pages/AuditsList';
import { ChecklistLibrary } from './pages/ChecklistLibrary';
import { Projects } from './pages/Projects';
import { Reports } from './pages/Reports';
import { ObservationTask } from './pages/ObservationTask';
import { CommercialHeadDashboard, FunctionalHeadDashboard } from './pages/HeadDashboards';
import { RoleRoute, HomeRedirect } from './components/RoleRoute';
import AdminLayout from './pages/admin/AdminLayout';
import { ObservationsList } from "./pages/ObservationsList.tsx";
import AdminPlaceholder from './pages/admin/AdminPlaceholder';
import AdminUsers from './pages/admin/AdminUsers';
import { CreateAtrObservation } from "./pages/Createobservation";
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to={getDashboardPath(user.role)} replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to={getDashboardPath(user.role)} replace /> : <LoginPage />}
      />

      <Route path="/" element={
        <ProtectedRoute><Layout><HomeRedirect /></Layout></ProtectedRoute>
      } />

      <Route path="/dashboard" element={
        <RoleRoute allowed={['admin', 'auditor','auditee', 'commercialHead', 'functionalHead']}>
          <Layout><Dashboard /></Layout>
        </RoleRoute>
      } />

      <Route path="/commercial/dashboard" element={
        <RoleRoute allowed={['commercialHead']}>
          <Layout><CommercialHeadDashboard /></Layout>
        </RoleRoute>
      } />

      <Route path="/functional/dashboard" element={
        <RoleRoute allowed={['functionalHead']}>
          <Layout><FunctionalHeadDashboard /></Layout>
        </RoleRoute>
      } />

      {/* Audit list/checklist: admin, auditor, and both head roles can VIEW audits,
          but only admin/auditor can create or record steps against them. */}
      <Route path="/audits" element={
        <RoleRoute allowed={['admin', 'auditor', 'commercialHead', 'functionalHead']}>
         
          <Layout><ObservationsList /></Layout>
        </RoleRoute>
      } />

      <Route path="/audits/create" element={
        <RoleRoute allowed={['admin', 'auditor']}>
          <Layout><CreateAudit /></Layout>
        </RoleRoute>
      } />

      <Route path="/audits/manufacturing-unit-1/checklist" element={
        <RoleRoute allowed={['admin', 'auditor', 'commercialHead', 'functionalHead']}>
          <Layout><AuditChecklist /></Layout>
        </RoleRoute>
      } />

      {/* Recording/completing a step is an auditor action only */}
      <Route path="/audits/manufacturing-unit-1/checklist/step-1" element={
        <RoleRoute allowed={['admin', 'auditor']}>
          <Layout><CompleteStep /></Layout>
        </RoleRoute>
      } />

      {/* Workflow view is informational — every role (incl. auditee & heads) can see it */}
      <Route path="/workflows" element={
        <ProtectedRoute><Layout><WorkflowView /></Layout></ProtectedRoute>
      } />

      <Route path="/checklist-library" element={
        <RoleRoute allowed={['admin', 'auditor', 'commercialHead', 'functionalHead']}>
          <Layout><ChecklistLibrary /></Layout>
        </RoleRoute>
      } />

      <Route path="/tasks" element={
        <ProtectedRoute><Layout><MyTasks /></Layout></ProtectedRoute>
      } />

      <Route path="/tasks/:taskId" element={
        <ProtectedRoute><Layout><TaskDetails /></Layout></ProtectedRoute>
      } />

      {/* Recording a new observation is an admin/auditor action only — auditees
          and heads only ever RESPOND to observations assigned to them via
          /observations/tasks/:taskId (their My Inbox), never create one. */}
      <Route path="/observations/new" element={
        <RoleRoute allowed={['admin', 'auditor']}>
          <Layout><CreateAtrObservation /></Layout>
        </RoleRoute>
      } />

      <Route path="/observations/tasks/:taskId" element={
        <ProtectedRoute><Layout><ObservationTask /></Layout></ProtectedRoute>
      } />

      {/* Projects & Reports are visible to every authenticated role */}
      <Route path="/projects" element={
        <ProtectedRoute><Layout><Projects /></Layout></ProtectedRoute>
      } />

      <Route path="/reports" element={
        <ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>
      } />

      <Route path="/admin" element={
        <AdminRoute><Layout><AdminLayout /></Layout></AdminRoute>
      }>
        <Route index element={<Navigate to="users" replace />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="action-types" element={<AdminPlaceholder title="Action Types" />} />
        <Route path="workflow-definitions" element={<AdminPlaceholder title="Workflow Definitions" />} />
        <Route path="routing-rules" element={<AdminPlaceholder title="Routing Rules" />} />
        <Route path="notifications" element={<AdminPlaceholder title="Notifications" />} />
        <Route path="integrations" element={<AdminPlaceholder title="Integrations" />} />
      </Route>

      <Route path="/email-reminder" element={
        <RoleRoute allowed={['admin', 'auditor']}>
          <Layout><EmailReminder /></Layout>
        </RoleRoute>
      } />

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}