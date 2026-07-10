
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  PlusIcon, SearchIcon, MailIcon, MoreVerticalIcon, XIcon, Loader2Icon,
  UsersIcon, AlertCircleIcon, RefreshCwIcon, LogOutIcon,
} from 'lucide-react';
import {
  getAllGroups,
  getUsersInGroup,
  createGroup,
  deleteGroup,
  createUser,
  addUserToGroup,
  removeUserFromGroup,
  deleteUser,
  FlowableGroup,
  FlowableUser,
} from '../pages/services/flowableApi'

// Avatar colors cycle based on index
const AVATAR_COLORS = [
  'bg-purple-500','bg-blue-500','bg-green-500','bg-orange-500',
  'bg-pink-500','bg-teal-500','bg-gray-500','bg-indigo-500','bg-red-500','bg-yellow-500',
];

const getInitials = (firstName: string, lastName: string) =>
  `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();

// ─── Create Group Modal ───────────────────────────────────────
function CreateGroupModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('assignment');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!id.trim() || !name.trim()) {
      setError('Group ID and name are both required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createGroup({ id: id.trim(), name: name.trim(), type });
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to create group.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Create Group</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <XIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Group ID</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g. commercialHead"
              value={id}
              onChange={e => setId(e.target.value)}
            />
            <p className="text-[11px] text-gray-400 mt-1">
              This is the exact group id Flowable candidate-group tasks match against — use the same id your BPMN/CMMN XML expects.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Display Name</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g. Commercial Head Group"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={type}
              onChange={e => setType(e.target.value)}
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving && <Loader2Icon className="w-4 h-4 animate-spin" />}
            {saving ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Invite (into selected group) Modal ───────────────────────
function InviteModal({
  group,
  onClose,
  onCreated,
}: {
  group: FlowableGroup;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: 'test', // default password
    role: '',
    department: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.department) {
      setError('Please fill in all fields.');
      return;
    }
    // Build id from email prefix e.g. "anita.sharma"
    const id = form.email.split('@')[0].toLowerCase().replace(/\s+/g, '.');
    setSaving(true);
    setError('');
    try {
      await createUser({ id, ...form, role: form.role || group.name });
      // The whole point of inviting from inside a group screen: the new
      // user actually becomes a member of *this* group immediately,
      // instead of existing but not showing up under any group until
      // someone manually adds them elsewhere.
      await addUserToGroup(group.id, id);
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to create user.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Invite User to “{group.name}”</h2>
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
                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.lastName}
                onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Job Title (optional)</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={group.name}
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g. Quality Compliance, EHS, Unit 1 - Rayagada"
              value={form.department}
              onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
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
  );
}

// ─── Main Component ───────────────────────────────────────────
export function Users() {
  const [groups, setGroups] = useState<FlowableGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupsError, setGroupsError] = useState('');

  const [selectedGroup, setSelectedGroup] = useState<FlowableGroup | null>(null);
  const [members, setMembers] = useState<FlowableUser[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState('');

  const [search, setSearch] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // ── Groups (left panel) ──────────────────────────────────────
  const loadGroups = useCallback(async () => {
    setGroupsLoading(true);
    setGroupsError('');
    try {
      const data = await getAllGroups();
      setGroups(data);
    } catch (e: any) {
      setGroupsError(e?.message || 'Failed to load groups.');
    } finally {
      setGroupsLoading(false);
    }
  }, []);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  // ── Members of the selected group (right panel) ──────────────
  // This is the fix: members always come from getUsersInGroup(groupId)
  // — Flowable's GET /identity/users?memberOfGroup= — never from
  // getAllUsers() filtered client-side. Selecting a different group
  // always re-fetches from Flowable rather than reusing a stale list.
  const loadMembers = useCallback(async (group: FlowableGroup) => {
    setMembersLoading(true);
    setMembersError('');
    try {
      const data = await getUsersInGroup(group.id);
      setMembers(data);
    } catch (e: any) {
      setMembersError(e?.message || 'Failed to load group members.');
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }, []);

  const selectGroup = (group: FlowableGroup) => {
    setSelectedGroup(group);
    setSearch('');
    loadMembers(group);
  };

  const refreshMembers = () => {
    if (selectedGroup) loadMembers(selectedGroup);
  };

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleRemoveFromGroup = async (userId: string) => {
    if (!selectedGroup) return;
    if (!confirm(`Remove this user from "${selectedGroup.name}"? They will keep their account but lose this group's access.`)) return;
    try {
      await removeUserFromGroup(selectedGroup.id, userId);
      setMembers(prev => prev.filter(u => u.id !== userId));
    } catch (e) {
      alert('Failed to remove user from group.');
    }
    setMenuOpen(null);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Delete this user entirely? This cannot be undone.')) return;
    try {
      await deleteUser(userId);
      setMembers(prev => prev.filter(u => u.id !== userId));
    } catch (e) {
      alert('Failed to delete user.');
    }
    setMenuOpen(null);
  };

  const handleDeleteGroup = async (group: FlowableGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete group "${group.name}"? Members keep their accounts but lose this group.`)) return;
    try {
      await deleteGroup(group.id);
      setGroups(prev => prev.filter(g => g.id !== group.id));
      if (selectedGroup?.id === group.id) {
        setSelectedGroup(null);
        setMembers([]);
      }
    } catch (e) {
      alert('Failed to delete group.');
    }
  };

  const filteredMembers = members.filter(u => {
    const name = `${u.firstName} ${u.lastName}`.toLowerCase();
    return name.includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
  });

  const getInitialsFromUser = (u: FlowableUser) => getInitials(u.firstName, u.lastName);

  return (
    <div className="p-8">
      {showCreateGroup && (
        <CreateGroupModal onClose={() => setShowCreateGroup(false)} onCreated={loadGroups} />
      )}
      {showInvite && selectedGroup && (
        <InviteModal group={selectedGroup} onClose={() => setShowInvite(false)} onCreated={refreshMembers} />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-1">Manage team members by group — select a group to see its members</p>
        </div>
      </div>

      <div className="grid grid-cols-[320px_1fr] gap-6 items-start">

        {/* ── LEFT: Groups ── */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Groups</span>
            <button
              onClick={() => setShowCreateGroup(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Create group
            </button>
          </div>

          {groupsError && (
            <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-start gap-2">
              <AlertCircleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {groupsError}
            </div>
          )}

          {groupsLoading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-gray-500">
              <Loader2Icon className="w-4 h-4 animate-spin" />
              <span className="text-xs">Loading groups...</span>
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-10 px-4 text-xs text-gray-400">
              No groups yet — create one to organize users by role.
            </div>
          ) : (
            <div>
              {groups.map(group => (
                <div
                  key={group.id}
                  onClick={() => selectGroup(group)}
                  className={`group flex items-center justify-between px-4 py-3.5 border-l-4 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 ${
                    selectedGroup?.id === group.id
                      ? 'border-l-blue-600 bg-blue-50'
                      : 'border-l-transparent hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-sm ${selectedGroup?.id === group.id ? 'text-blue-700 font-medium' : 'text-gray-800'}`}>
                    {group.name}
                  </span>
                  <button
                    onClick={(e) => handleDeleteGroup(group, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-opacity"
                    title="Delete group"
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: Selected group's members ── */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[420px]">
          {!selectedGroup ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[420px] text-gray-400 gap-2">
              <UsersIcon className="w-8 h-8 opacity-30" />
              <p className="text-sm">Select a group from the list to view its members.</p>
            </div>
          ) : (
            <>
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">{selectedGroup.name}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Group id: <span className="font-mono">{selectedGroup.id}</span> · {members.length} member{members.length === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={refreshMembers}
                    disabled={membersLoading}
                    className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-xs text-gray-600 disabled:opacity-50"
                  >
                    <RefreshCwIcon className={`w-3.5 h-3.5 ${membersLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  <button
                    onClick={() => setShowInvite(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Invite User
                  </button>
                </div>
              </div>

              <div className="p-6 border-b border-gray-200">
                <div className="relative max-w-md">
                  <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search this group's members..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {membersError && (
                <div className="m-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-start gap-2">
                  <AlertCircleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {membersError}
                </div>
              )}

              {membersLoading ? (
                <div className="flex items-center justify-center py-20 gap-2 text-gray-500">
                  <Loader2Icon className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Loading members...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/50">
                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">User</th>
                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Login ID</th>
                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Email</th>
                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-700"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-12 text-sm text-gray-400">
                            {members.length === 0
                              ? 'No members in this group yet.'
                              : 'No members match your search.'}
                          </td>
                        </tr>
                      ) : (
                        filteredMembers.map((user, idx) => (
                          <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} rounded-full flex items-center justify-center text-white font-semibold text-sm`}>
                                  {getInitialsFromUser(user)}
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                  {user.firstName} {user.lastName}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-sm text-gray-600 font-mono">{user.id}</td>
                            <td className="py-4 px-6">
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <MailIcon className="w-3 h-3" />
                                {user.email}
                              </div>
                            </td>
                            <td className="py-4 px-6 relative" ref={menuOpen === user.id ? menuRef : null}>
                              <button
                                onClick={() => setMenuOpen(menuOpen === user.id ? null : user.id)}
                                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                              >
                                <MoreVerticalIcon className="w-4 h-4" />
                              </button>
                              {menuOpen === user.id && (
                                <div className="absolute right-6 top-12 z-10 bg-white border border-gray-200 rounded-lg shadow-lg w-56 py-1">
                                  <button
                                    onClick={() => handleRemoveFromGroup(user.id)}
                                    className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    <LogOutIcon className="w-3.5 h-3.5" />
                                    Remove from this group
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                  >
                                    Delete User (all groups)
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}