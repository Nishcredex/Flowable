import { NavLink, Outlet } from 'react-router-dom'
import { workflowDefs } from '../data/mock'

interface WorkflowDef {
  key: string
  name: string
  version: string
  deployed: string
  instances: number
  status: 'Active' | 'Draft' | string
}

const SEG_TABS: { to: string; label: string }[] = [
  { to: 'users', label: 'Users & Roles' },
  { to: 'action-types', label: 'Action Types' },
  { to: 'workflow-definitions', label: 'Workflow Definitions' },
  { to: 'routing-rules', label: 'Routing Rules' },
  { to: 'notifications', label: 'Notifications' },
  { to: 'integrations', label: 'Integrations' },
]

const segClass = ({ isActive }: { isActive: boolean }) => 'seg-tab' + (isActive ? ' active' : '')

export default function AdminLayout() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Administration</h1>
          <div className="subtitle">Manage users, roles, action types, and workflow definitions</div>
        </div>
      </div>

      <div className="tab-bar">
        {SEG_TABS.map((t) => (
          <NavLink key={t.to} to={t.to} className={segClass}>
            {t.label}
          </NavLink>
        ))}
      </div>

      <Outlet />

      <div className="card mt-18">
        <div className="card-head"><h3>Workflow definitions (Flowable)</h3><button className="more">+ Deploy new</button></div>
        <table className="table">
          <thead>
            <tr><th>Process key</th><th>Name</th><th>Version</th><th>Deployed</th><th>Instances (active)</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {(workflowDefs as WorkflowDef[]).map((w) => (
              <tr key={w.key}>
                <td><span className="fw-600">{w.key}</span></td>
                <td>{w.name}</td>
                <td>{w.version}</td>
                <td>{w.deployed}</td>
                <td>{w.instances}</td>
                <td><span className={`badge badge-${w.status === 'Active' ? 'success' : 'warn'}`}>{w.status}</span></td>
                <td className="text-soft">⋯</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}