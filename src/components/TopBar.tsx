// import { IcoSearch, IcoBell, IcoHelp } from './Icons'
// import { currentUser } from '../pages/data/mock'

// // `mock.js` is untyped — this describes the shape actually used below.
// // See the matching note in Sidebar.tsx.
// interface CurrentUser {
//   name: string
//   initials: string
// }

// const user = currentUser as CurrentUser

// const TITLES: Record<string, string> = {
//   '/dashboard': 'Dashboard',
//   '/inbox': 'My Inbox',
//   '/workflow': 'Workflow',
//   '/reports': 'Reports',
//   '/admin': 'Administration',
// }

// interface TopbarProps {
//   pathname: string
// }

// export default function Topbar({ pathname }: TopbarProps) {
//   let title = TITLES[pathname]
//   if (!title && pathname.startsWith('/actions/')) title = 'Action Detail'
//   if (!title) title = 'Dashboard'

//   return (
//     <div className="topbar">
//       <div className="crumbs">Workspace / <strong>{title}</strong></div>
//       <div className="search">
//         <span className="search-ico"><IcoSearch /></span>
//         <input placeholder="Search actions, references, employees…" />
//       </div>
//       <div className="top-actions">
//         <button className="icon-btn" title="Notifications">
//           <IcoBell />
//           <span className="dot"></span>
//         </button>
//         <button className="icon-btn" title="Help">
//           <IcoHelp />
//         </button>
//         <div className="avatar" title={user.name}>{user.initials}</div>
//       </div>
//     </div>
//   )
// }
import { IcoSearch, IcoBell, IcoHelp } from './Icons'
import { useAuth, getInitials } from '../pages/AuthContext'

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/inbox': 'My Inbox',
  '/workflow': 'Workflow',
  '/reports': 'Reports',
  '/admin': 'Administration',
}

interface TopbarProps {
  pathname: string
}

export default function Topbar({ pathname }: TopbarProps) {
  const { user } = useAuth()

  let title = TITLES[pathname]
  if (!title && pathname.startsWith('/actions/')) title = 'Action Detail'
  if (!title) title = 'Dashboard'

  return (
    <div className="topbar">
      <div className="crumbs">Workspace / <strong>{title}</strong></div>
      <div className="search">
        <span className="search-ico"><IcoSearch /></span>
        <input placeholder="Search actions, references, employees…" />
      </div>
      <div className="top-actions">
        <button className="icon-btn" title="Notifications">
          <IcoBell />
          <span className="dot"></span>
        </button>
        <button className="icon-btn" title="Help">
          <IcoHelp />
        </button>
        {user && (
          <div className="avatar" title={user.name}>{getInitials(user)}</div>
        )}
      </div>
    </div>
  )
}