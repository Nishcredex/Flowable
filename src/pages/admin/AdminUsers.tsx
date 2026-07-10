import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { PlusIcon, SearchIcon, MailIcon, MoreVerticalIcon, XIcon, Loader2Icon } from 'lucide-react'
import {
  getAllUsers,
  createUser,
  deleteUser,
  getAllUserProfiles,
  saveUserProfile,
  deleteUserProfile,
  type FlowableUser,
  type UserProfile,
} from '../services/flowableApi'

// ─── Types ──────────────────────────────────────────────────────
// FlowableUser and UserProfile are imported from flowableApi.ts rather than
// redeclared here — two separately-declared interfaces with the same name
// are NOT the same type to TypeScript, which is what caused the
// "Index signature for type 'string' is missing in type 'FlowableUser'" error.

interface RowUser extends FlowableUser {
  profile?: UserProfile
}

interface InviteFormState {
  firstName: string
  lastName: string
  email: string
  password: string
  role: string
  department: string
}

// Avatar colors cycle based on index
const AVATAR_COLORS: string[] = [
  'bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-orange-500',
  'bg-pink-500', 'bg-teal-500', 'bg-gray-500', 'bg-indigo-500', 'bg-red-500', 'bg-yellow-500',
]

const ROLE_OPTIONS: string[] = [
  'Lead Auditor', 'Auditor', 'Auditee', 'Commercial Head', 'Functional Head',
  'Plant Manager', 'Safety Officer', 'Production Lead',
  'Environmental Auditor', 'Quality Inspector', 'Administrator',
]

// Role badge colors cycle by role name (deterministic, not by row index)
// so the same role always gets the same color, matching the old UI where
// e.g. every "Reviewer" pill was the same blue.
const ROLE_BADGE_COLORS: string[] = [
  'bg-blue-50 text-blue-700',
  'bg-purple-50 text-purple-700',
  'bg-teal-50 text-teal-700',
  'bg-orange-50 text-orange-700',
  'bg-pink-50 text-pink-700',
  'bg-indigo-50 text-indigo-700',
]

function roleBadgeColor(role?: string): string {
  if (!role) return 'bg-gray-50 text-gray-500'
  let hash = 0
  for (let i = 0; i < role.length; i++) hash = (hash * 31 + role.charCodeAt(i)) >>> 0
  return ROLE_BADGE_COLORS[hash % ROLE_BADGE_COLORS.length]
}

const getInitials = (firstName?: string, lastName?: string): string =>
  `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase()

// ─── Invite Modal ─────────────────────────────────────────────

interface InviteModalProps {
  onClose: () => void
  onCreated: () => void
}

function InviteModal({ onClose, onCreated }: InviteModalProps) {
  const [form, setForm] = useState<InviteFormState>({
    firstName: '',
    lastName: '',
    email: '',
    password: 'test', // default password
    role: '',
    department: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.role || !form.department) {
      setError('Please fill in all fields.')
      return
    }
    // Build id from email prefix e.g. "anita.sharma"
    const id = form.email.split('@')[0].toLowerCase().replace(/\s+/g, '.')
    setSaving(true)
    setError('')
    try {
      await createUser({ id, ...form })
      // Flowable's identity endpoint has no room for role/department/status/2FA,
      // so those live in a companion profile instance — see flowableApi.js.
      await saveUserProfile({
        userId: id,
        role: form.role,
        department: form.department,
        status: 'Active',
        twoFactorEnabled: false,
      })
      onCreated()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create user.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Invite User</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <XIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">First Name</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.firstName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, firstName: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.lastName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, lastName: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.role}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setForm(f => ({ ...f, role: e.target.value }))}
            >
              <option value="">Select role...</option>
              {ROLE_OPTIONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g. Quality Compliance, EHS, Unit 1 - Rayagada"
              value={form.department}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, department: e.target.value }))}
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving && <Loader2Icon className="w-4 h-4 animate-spin" />}
            {saving ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Status badge ──────────────────────────────────────────────

interface StatusBadgeProps {
  status?: string
}

function StatusBadge({ status }: StatusBadgeProps) {
  const active = status !== 'Disabled'
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
      }`}
    >
      {active ? 'Active' : 'Disabled'}
    </span>
  )
}

// ─── 2FA toggle ────────────────────────────────────────────────

interface TwoFAToggleProps {
  enabled: boolean
  onToggle: () => void
  disabled?: boolean
}

function TwoFAToggle({ enabled, onToggle, disabled }: TwoFAToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={enabled}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
        enabled ? 'bg-blue-600' : 'bg-gray-300'
      }`}
    >
      <span
        className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
        style={{ transform: enabled ? 'translateX(18px)' : 'translateX(2px)' }}
      />
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────

export default function AdminUsers() {
  const [users, setUsers] = useState<FlowableUser[]>([])
  const [profiles, setProfiles] = useState<Map<string, UserProfile>>(new Map())
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All roles')
  const [deptFilter, setDeptFilter] = useState('All departments')
  const [showInvite, setShowInvite] = useState(false)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const menuRef = useRef<HTMLTableCellElement>(null)

  const fetchUsers = async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [userData, profileData] = await Promise.all([
        getAllUsers(),
        getAllUserProfiles(),
      ])
      setUsers(userData)
      setProfiles(profileData)
    } catch (e) {
      console.error(e)
      setLoadError(e instanceof Error ? e.message : 'Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleDelete = async (userId: string) => {
    if (!confirm('Delete this user? This cannot be undone.')) return
    try {
      await deleteUser(userId)
      await deleteUserProfile(userId)
      setUsers(prev => prev.filter(u => u.id !== userId))
      setProfiles(prev => {
        const next = new Map(prev)
        next.delete(userId)
        return next
      })
    } catch (e) {
      alert('Failed to delete user.')
    }
    setMenuOpen(null)
  }

  const handleToggleStatus = async (user: FlowableUser, profile?: UserProfile) => {
    setTogglingId(user.id)
    const nextStatus = profile?.status === 'Disabled' ? 'Active' : 'Disabled'
    try {
      await saveUserProfile({
        userId: user.id,
        role: profile?.role || '',
        department: profile?.department || '',
        status: nextStatus,
        twoFactorEnabled: profile?.twoFactorEnabled || false,
      })
      setProfiles(prev => {
        const next = new Map(prev)
        const base: UserProfile = profile || { userId: user.id, role: '', department: '', status: 'Active', twoFactorEnabled: false }
        next.set(user.id, { ...base, status: nextStatus })
        return next
      })
    } catch (e) {
      alert('Failed to update status.')
    } finally {
      setTogglingId(null)
      setMenuOpen(null)
    }
  }

  const handleToggle2FA = async (user: FlowableUser, profile?: UserProfile) => {
    setTogglingId(user.id)
    const next2FA = !profile?.twoFactorEnabled
    try {
      await saveUserProfile({
        userId: user.id,
        role: profile?.role || '',
        department: profile?.department || '',
        status: profile?.status || 'Active',
        twoFactorEnabled: next2FA,
      })
      setProfiles(prev => {
        const next = new Map(prev)
        const base: UserProfile = profile || { userId: user.id, role: '', department: '', status: 'Active', twoFactorEnabled: false }
        next.set(user.id, { ...base, twoFactorEnabled: next2FA })
        return next
      })
    } catch (e) {
      alert('Failed to update 2FA.')
    } finally {
      setTogglingId(null)
    }
  }

  const rows: RowUser[] = useMemo(
    () => users.map(u => ({ ...u, profile: profiles.get(u.id) })),
    [users, profiles]
  )

  const roleOptions: string[] = useMemo(
    () => ['All roles', ...Array.from(new Set(rows.map(r => r.profile?.role).filter((r): r is string => Boolean(r))))],
    [rows]
  )
  const deptOptions: string[] = useMemo(
    () => ['All departments', ...Array.from(new Set(rows.map(r => r.profile?.department).filter((d): d is string => Boolean(d))))],
    [rows]
  )

  const filtered = rows.filter(u => {
    const name = `${u.firstName} ${u.lastName}`.toLowerCase()
    const matchesSearch =
      name.includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'All roles' || u.profile?.role === roleFilter
    const matchesDept = deptFilter === 'All departments' || u.profile?.department === deptFilter
    return matchesSearch && matchesRole && matchesDept
  })

  const activeCount = rows.filter(u => u.profile?.status !== 'Disabled').length
  const disabledCount = rows.length - activeCount

  const getInitialsFromUser = (u: FlowableUser) => getInitials(u.firstName, u.lastName)

  return (
    <div>
      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onCreated={fetchUsers}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-1">Manage team members, roles, and access</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          <span className="text-sm font-medium">Invite User</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative max-w-md">
              <SearchIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setRoleFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {roleOptions.map(r => <option key={r}>{r}</option>)}
            </select>
            <select
              value={deptFilter}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setDeptFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {deptOptions.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          {!loading && !loadError && (
            <span className="text-sm text-gray-500">
              {activeCount} active · {disabledCount} disabled
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-gray-500">
            <Loader2Icon className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading users...</span>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2 text-center px-6">
            <span className="text-sm text-red-600">{loadError}</span>
            <span className="text-xs text-gray-400">
              Check that your backend is running and VITE_API_BASE_URL points to it.
            </span>
            <button
              onClick={fetchUsers}
              className="mt-2 px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">Department</th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">2FA</th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Active</th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-sm text-gray-400">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((user, idx) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} rounded-full flex items-center justify-center text-white font-semibold text-sm`}>
                            {getInitialsFromUser(user)}
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-6">
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <MailIcon className="w-3 h-3" />
                          {user.email}
                        </div>
                      </td>
                      <td className="py-3 px-6">
                        {user.profile?.role ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleBadgeColor(user.profile.role)}`}>
                            {user.profile.role}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-600">
                        {user.profile?.department || <span className="text-gray-400">—</span>}
                      </td>
                      <td className="py-3 px-6">
                        <TwoFAToggle
                          enabled={!!user.profile?.twoFactorEnabled}
                          disabled={togglingId === user.id}
                          onToggle={() => handleToggle2FA(user, user.profile)}
                        />
                      </td>
                      <td className="py-3 px-6">
                        <StatusBadge status={user.profile?.status} />
                      </td>
                      <td className="py-3 px-6 text-xs text-gray-400">—</td>
                      <td className="py-3 px-6 relative" ref={menuOpen === user.id ? menuRef : null}>
                        <button
                          onClick={() => setMenuOpen(menuOpen === user.id ? null : user.id)}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                        >
                          <MoreVerticalIcon className="w-4 h-4" />
                        </button>
                        {menuOpen === user.id && (
                          <div className="absolute right-6 top-12 z-10 bg-white border border-gray-200 rounded-lg shadow-lg w-44 py-1">
                            <button
                              onClick={() => handleToggleStatus(user, user.profile)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              {user.profile?.status === 'Disabled' ? 'Enable User' : 'Disable User'}
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              Delete User
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}