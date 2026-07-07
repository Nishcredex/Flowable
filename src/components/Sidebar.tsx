
import { NavLink, useNavigate } from 'react-router-dom'
import { IcoDashboard, IcoInbox, IcoWorkflow, IcoReports, IcoAdmin } from './Icons'
import { useAuth, ROLE_LABELS } from '../pages/AuthContext'

const navClass = ({ isActive }: { isActive: boolean }) => 'nav-item' + (isActive ? ' active' : '')

export default function Sidebar() {
  const navigate = useNavigate()
  const { user, isAdmin, logout } = useAuth()
 const selectedTaskId = "16abc471-5f3f-11f1-8df8-12bef5f62c72"; 
  function handleSignOut() {
    logout()
    navigate('/login')
  }

  // Sidebar only ever renders inside ProtectedRoute, so `user` should be set
  // by the time we get here — guard anyway rather than crash on a null name.
  if (!user) return null

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">AT</div>
        <div>
          <div className="brand-name">ATRTool</div>
          <div className="brand-sub">Action Taken &amp; Workflow</div>
        </div>
      </div>

      <div className="nav-section">Workspace</div>
      <NavLink to="/dashboard" className={navClass}>
        <span className="ico"><IcoDashboard /></span>
        Dashboard
      </NavLink>
      <NavLink to="/tasks" className={navClass}>
        <span className="ico"><IcoInbox /></span>
        My Inbox
        <span className="badge">17</span>
      </NavLink>
     

    <NavLink to={`/tasks/${selectedTaskId}`} className={navClass}>
      <span className="ico"><IcoWorkflow /></span>
      Action Details
    </NavLink>
    <NavLink to="/projects" className={navClass}>
        <span className="ico"><IcoReports /></span>
        Projects
      </NavLink>
      <NavLink to="/workflows" className={navClass}>
        <span className="ico"><IcoWorkflow /></span>
        Workflow
      </NavLink>
      <NavLink to="/reports" className={navClass}>
        <span className="ico"><IcoReports /></span>
        Reports
      </NavLink>

      {/* Admin-only — auditors never see this link, and the /admin routes
          themselves are also guarded by AdminRoute in App.tsx, so this is
          a UX nicety, not the actual security boundary. */}
      {isAdmin && (
        <>
          <div className="nav-section">Manage</div>
          <NavLink to="/admin" className={navClass}>
            <span className="ico"><IcoAdmin /></span>
            Administration
          </NavLink>
        </>
      )}

      <div className="sidebar-footer">
        <div style={{ color: '#c4cbe0', fontSize: '12.5px' }}>{user.name}</div>
        <div>{ROLE_LABELS[user.role]}{user.department ? ` · ${user.department}` : ''}</div>
        <button
          className="btn btn-ghost"
          style={{ color: '#c4cbe0', padding: '6px 0', marginTop: '8px', fontSize: '12px' }}
          onClick={handleSignOut}
        >
          Sign out →
        </button>
      </div>
    </aside>
  )
}