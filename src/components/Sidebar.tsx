// // import { NavLink, useNavigate } from 'react-router-dom'
// // import { IcoDashboard, IcoInbox, IcoWorkflow, IcoReports, IcoAdmin } from './Icons'
// // import { useAuth, ROLE_LABELS } from '../pages/AuthContext'

// // const navClass = ({ isActive }: { isActive: boolean }) => 'nav-item' + (isActive ? ' active' : '')

// // export default function Sidebar() {
// //   const navigate = useNavigate()
// //   const { user, isAdmin, isAuditor, isAuditee, isCommercialHead, isFunctionalHead, logout } = useAuth()

// //   function handleSignOut() {
// //     logout()
// //     navigate('/login')
// //   }

// //   if (!user) return null

// //   return (
// //     <aside className="sidebar">
// //       <div className="brand">
// //         <div className="brand-logo">AT</div>
// //         <div>
// //           <div className="brand-name">ATRTool</div>
// //           <div className="brand-sub">Action Taken &amp; Workflow</div>
// //         </div>
// //       </div>

// //       <div className="nav-section">Workspace</div>

// //       {(isAuditor || isAdmin) && (
// //         <>
// //           <NavLink to="/dashboard" className={navClass}>
// //             <span className="ico"><IcoDashboard /></span>
// //             Dashboard
// //           </NavLink>
// //           <NavLink to="/audits" className={navClass}>
// //             <span className="ico"><IcoReports /></span>
// //             Audits
// //           </NavLink>
// //           <NavLink to="/observations/new" className={navClass}>
// //             <span className="ico"><IcoWorkflow /></span>
// //             Record Observation
// //           </NavLink>
// //         </>
// //       )}

// //       {isAuditee && (
// //         <NavLink to="/auditee/dashboard" className={navClass}>
// //           <span className="ico"><IcoDashboard /></span>
// //           My Audits
// //         </NavLink>
// //       )}

// //       {isCommercialHead && (
// //         <NavLink to="/commercial/dashboard" className={navClass}>
// //           <span className="ico"><IcoDashboard /></span>
// //           Extensions
// //         </NavLink>
// //       )}

// //       {isFunctionalHead && (
// //         <NavLink to="/functional/dashboard" className={navClass}>
// //           <span className="ico"><IcoDashboard /></span>
// //           Extensions
// //         </NavLink>
// //       )}

// //       <NavLink to="/tasks" className={navClass}>
// //         <span className="ico"><IcoInbox /></span>
// //         My Inbox
// //       </NavLink>

// //       {(isAuditor || isAdmin) && (
// //         <>
// //           <NavLink to="/projects" className={navClass}>
// //             <span className="ico"><IcoReports /></span>
// //             Projects
// //           </NavLink>
// //           <NavLink to="/workflows" className={navClass}>
// //             <span className="ico"><IcoWorkflow /></span>
// //             Workflow
// //           </NavLink>
// //           <NavLink to="/reports" className={navClass}>
// //             <span className="ico"><IcoReports /></span>
// //             Reports
// //           </NavLink>
// //         </>
// //       )}

// //       {isAdmin && (
// //         <>
// //           <div className="nav-section">Manage</div>
// //           <NavLink to="/admin" className={navClass}>
// //             <span className="ico"><IcoAdmin /></span>
// //             Administration
// //           </NavLink>
// //         </>
// //       )}

// //       <div className="sidebar-footer">
// //         <div style={{ color: '#c4cbe0', fontSize: '12.5px' }}>{user.name}</div>
// //         <div>{ROLE_LABELS[user.role]}{user.department ? ` · ${user.department}` : ''}</div>
// //         <button
// //           className="btn btn-ghost"
// //           style={{ color: '#c4cbe0', padding: '6px 0', marginTop: '8px', fontSize: '12px' }}
// //           onClick={handleSignOut}
// //         >
// //           Sign out →
// //         </button>
// //       </div>
// //     </aside>
// //   )
// // }


// import { NavLink, useNavigate } from 'react-router-dom'
// import {
//   IcoDashboard, IcoInbox, IcoWorkflow, IcoReports, IcoAdmin, IcoDetail,
// } from './Icons'
// import { useAuth, ROLE_LABELS } from '../pages/AuthContext'

// const navClass = ({ isActive }: { isActive: boolean }) => 'nav-item' + (isActive ? ' active' : '')

// // Small inline badge for links that a role can open but not act on
// // (Commercial/Functional Head viewing Audits & Checklist Library).
// function ReadOnlyTag() {
//   return (
//     <span
//       style={{
//         marginLeft: 'auto',
//         fontSize: '10px',
//         fontWeight: 600,
//         letterSpacing: '0.02em',
//         color: '#8b93a7',
//         background: 'rgba(255,255,255,0.06)',
//         borderRadius: 4,
//         padding: '1px 6px',
//       }}
//     >
//       VIEW
//     </span>
//   )
// }

// export default function Sidebar() {
//   const navigate = useNavigate()
//   const {
//     user, isAdmin, isAuditor, isAuditee, isCommercialHead, isFunctionalHead,
//     logout,
//   } = useAuth()

//   function handleSignOut() {
//     logout()
//     navigate('/login')
//   }

//   if (!user) return null

//   // isAuditor already covers admin (see AuthContext), so this one flag
//   // gates every "Admin or Auditor" item below.
//   const isHead = isCommercialHead || isFunctionalHead

//   return (
//     <aside className="sidebar">
//       <div className="brand">
//         <div className="brand-logo">AT</div>
//         <div>
//           <div className="brand-name">ATRTool</div>
//           <div className="brand-sub">Action Taken &amp; Workflow</div>
//         </div>
//       </div>

//       <div className="nav-section">Workspace</div>

//       {/* ── Dashboards — exactly one per role, never more than one shown ── */}
//       {isAuditor && (
//         <NavLink to="/dashboard" className={navClass}>
//           <span className="ico"><IcoDashboard /></span>
//           Dashboard
//         </NavLink>
//       )}

//       {isAuditee && (
//         <NavLink to="/auditee/dashboard" className={navClass}>
//           <span className="ico"><IcoDashboard /></span>
//           My Audits
//         </NavLink>
//       )}

//       {isCommercialHead && (
//         <NavLink to="/commercial/dashboard" className={navClass}>
//           <span className="ico"><IcoDashboard /></span>
//           Commercial Dashboard
//         </NavLink>
//       )}

//       {isFunctionalHead && (
//         <NavLink to="/functional/dashboard" className={navClass}>
//           <span className="ico"><IcoDashboard /></span>
//           Functional Dashboard
//         </NavLink>
//       )}

//       {/* ── Audits & Checklist Library — Admin/Auditor (full) or Heads (read-only) ── */}
//       {(isAuditor || isHead) && (
//         <>
//           <NavLink to="/audits" className={navClass}>
//             <span className="ico"><IcoReports /></span>
//             Audits
//             {isHead && <ReadOnlyTag />}
//           </NavLink>
//           <NavLink to="/checklist-library" className={navClass}>
//             <span className="ico"><IcoDetail /></span>
//             Checklist Library
//             {isHead && <ReadOnlyTag />}
//           </NavLink>
//         </>
//       )}

//       {/* ── Record Observation — Admin/Auditor only, never Auditee or Heads ── */}
//       {isAuditor && (
//         <NavLink to="/observations/new" className={navClass}>
//           <span className="ico"><IcoWorkflow /></span>
//           Record Observation
//         </NavLink>
//       )}

//       {/* ── My Inbox — every role lands their assigned work here:
//              Auditee responds to observations, Heads approve/reject
//              extensions, Auditor/Admin work every task type. ── */}
//       <NavLink to="/tasks" className={navClass}>
//         <span className="ico"><IcoInbox /></span>
//         My Inbox
//       </NavLink>

//       {/* ── Projects / Workflow / Reports — visible to every role ── */}
//       <NavLink to="/projects" className={navClass}>
//         <span className="ico"><IcoReports /></span>
//         Projects
//       </NavLink>
//       <NavLink to="/workflows" className={navClass}>
//         <span className="ico"><IcoWorkflow /></span>
//         Workflow
//       </NavLink>
//       <NavLink to="/reports" className={navClass}>
//         <span className="ico"><IcoReports /></span>
//         Reports
//       </NavLink>

//       {isAdmin && (
//         <>
//           <div className="nav-section">Manage</div>
//           <NavLink to="/admin" className={navClass}>
//             <span className="ico"><IcoAdmin /></span>
//             Administration
//           </NavLink>
//         </>
//       )}

//       <div className="sidebar-footer">
//         <div style={{ color: '#c4cbe0', fontSize: '12.5px' }}>{user.name}</div>
//         <div>{ROLE_LABELS[user.role]}{user.department ? ` · ${user.department}` : ''}</div>
//         <button
//           className="btn btn-ghost"
//           style={{ color: '#c4cbe0', padding: '6px 0', marginTop: '8px', fontSize: '12px' }}
//           onClick={handleSignOut}
//         >
//           Sign out →
//         </button>
//       </div>
//     </aside>
//   )
// }


// import { NavLink, useNavigate } from 'react-router-dom'
// import { IcoDashboard, IcoInbox, IcoWorkflow, IcoReports, IcoAdmin } from './Icons'
// import { useAuth, ROLE_LABELS } from '../pages/AuthContext'

// const navClass = ({ isActive }: { isActive: boolean }) => 'nav-item' + (isActive ? ' active' : '')

// export default function Sidebar() {
//   const navigate = useNavigate()
//   const { user, isAdmin, isAuditor, isAuditee, isCommercialHead, isFunctionalHead, logout } = useAuth()

//   function handleSignOut() {
//     logout()
//     navigate('/login')
//   }

//   if (!user) return null

//   return (
//     <aside className="sidebar">
//       <div className="brand">
//         <div className="brand-logo">AT</div>
//         <div>
//           <div className="brand-name">ATRTool</div>
//           <div className="brand-sub">Action Taken &amp; Workflow</div>
//         </div>
//       </div>

//       <div className="nav-section">Workspace</div>

//       {(isAuditor || isAdmin) && (
//         <>
//           <NavLink to="/dashboard" className={navClass}>
//             <span className="ico"><IcoDashboard /></span>
//             Dashboard
//           </NavLink>
//           <NavLink to="/audits" className={navClass}>
//             <span className="ico"><IcoReports /></span>
//             Audits
//           </NavLink>
//           <NavLink to="/observations/new" className={navClass}>
//             <span className="ico"><IcoWorkflow /></span>
//             Record Observation
//           </NavLink>
//         </>
//       )}

//       {isAuditee && (
//         <NavLink to="/auditee/dashboard" className={navClass}>
//           <span className="ico"><IcoDashboard /></span>
//           My Audits
//         </NavLink>
//       )}

//       {isCommercialHead && (
//         <NavLink to="/commercial/dashboard" className={navClass}>
//           <span className="ico"><IcoDashboard /></span>
//           Extensions
//         </NavLink>
//       )}

//       {isFunctionalHead && (
//         <NavLink to="/functional/dashboard" className={navClass}>
//           <span className="ico"><IcoDashboard /></span>
//           Extensions
//         </NavLink>
//       )}

//       <NavLink to="/tasks" className={navClass}>
//         <span className="ico"><IcoInbox /></span>
//         My Inbox
//       </NavLink>

//       {(isAuditor || isAdmin) && (
//         <>
//           <NavLink to="/projects" className={navClass}>
//             <span className="ico"><IcoReports /></span>
//             Projects
//           </NavLink>
//           <NavLink to="/workflows" className={navClass}>
//             <span className="ico"><IcoWorkflow /></span>
//             Workflow
//           </NavLink>
//           <NavLink to="/reports" className={navClass}>
//             <span className="ico"><IcoReports /></span>
//             Reports
//           </NavLink>
//         </>
//       )}

//       {isAdmin && (
//         <>
//           <div className="nav-section">Manage</div>
//           <NavLink to="/admin" className={navClass}>
//             <span className="ico"><IcoAdmin /></span>
//             Administration
//           </NavLink>
//         </>
//       )}

//       <div className="sidebar-footer">
//         <div style={{ color: '#c4cbe0', fontSize: '12.5px' }}>{user.name}</div>
//         <div>{ROLE_LABELS[user.role]}{user.department ? ` · ${user.department}` : ''}</div>
//         <button
//           className="btn btn-ghost"
//           style={{ color: '#c4cbe0', padding: '6px 0', marginTop: '8px', fontSize: '12px' }}
//           onClick={handleSignOut}
//         >
//           Sign out →
//         </button>
//       </div>
//     </aside>
//   )
// }


import { NavLink, useNavigate } from 'react-router-dom'
import {
  IcoDashboard, IcoInbox, IcoWorkflow, IcoReports, IcoAdmin, IcoDetail,
} from './Icons'
import { useAuth, ROLE_LABELS } from '../pages/AuthContext'

const navClass = ({ isActive }: { isActive: boolean }) => 'nav-item' + (isActive ? ' active' : '')

// Small inline badge for links that a role can open but not act on
// (Commercial/Functional Head viewing Audits & Checklist Library).
function ReadOnlyTag() {
  return (
    <span
      style={{
        marginLeft: 'auto',
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        color: '#8b93a7',
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 4,
        padding: '1px 6px',
      }}
    >
      VIEW
    </span>
  )
}

export default function Sidebar() {
  const navigate = useNavigate()
  const {
    user, isAdmin, isAuditor, isAuditee, isCommercialHead, isFunctionalHead,
    logout,
  } = useAuth()

  function handleSignOut() {
    logout()
    navigate('/login')
  }

  if (!user) return null

  // isAuditor already covers admin (see AuthContext), so this one flag
  // gates every "Admin or Auditor" item below.
  const isHead = isCommercialHead || isFunctionalHead

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

      {/* ── Dashboards — exactly one per role, never more than one shown ──
             Auditee shares the same /dashboard as Admin/Auditor (the old
             separate "My Audits" page has been removed). ── */}
      {(isAuditor || isAuditee) && (
        <NavLink to="/dashboard" className={navClass}>
          <span className="ico"><IcoDashboard /></span>
          Dashboard
        </NavLink>
      )}

      {isCommercialHead && (
        <NavLink to="/commercial/dashboard" className={navClass}>
          <span className="ico"><IcoDashboard /></span>
          Commercial Dashboard
        </NavLink>
      )}

      {isFunctionalHead && (
        <NavLink to="/functional/dashboard" className={navClass}>
          <span className="ico"><IcoDashboard /></span>
          Functional Dashboard
        </NavLink>
      )}

      {/* ── Audits & Checklist Library — Admin/Auditor (full) or Heads (read-only) ── */}
      {(isAuditor || isHead) && (
        <>
          <NavLink to="/audits" className={navClass}>
            <span className="ico"><IcoReports /></span>
            Audits
            {isHead && <ReadOnlyTag />}
          </NavLink>
          <NavLink to="/checklist-library" className={navClass}>
            <span className="ico"><IcoDetail /></span>
            Checklist Library
            {isHead && <ReadOnlyTag />}
          </NavLink>
        </>
      )}

      {/* ── Record Observation — Admin/Auditor only, never Auditee or Heads ── */}
      {isAuditor && (
        <NavLink to="/observations/new" className={navClass}>
          <span className="ico"><IcoWorkflow /></span>
          Record Observation
        </NavLink>
      )}

      {/* ── My Inbox — every role lands their assigned work here:
             Auditee responds to observations, Heads approve/reject
             extensions, Auditor/Admin work every task type. ── */}
      <NavLink to="/tasks" className={navClass}>
        <span className="ico"><IcoInbox /></span>
        My Inbox
      </NavLink>

      {/* ── Projects / Workflow / Reports — visible to every role ── */}
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