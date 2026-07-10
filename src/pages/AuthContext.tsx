import React, { createContext, useContext, useState } from 'react';

export type UserRole =
  | 'admin'
  | 'auditor'
  | 'auditee'
  | 'commercialHead'
  | 'functionalHead';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  initials?: string;
  groups?: string[];
}

interface AuthCtx {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  isAdmin: boolean;
  isAuditor: boolean;
  isAuditee: boolean;
  isCommercialHead: boolean;
  isFunctionalHead: boolean;
  permissions: Permissions;
}

/**
 * Action-level permissions, centralized here so pages don't each re-derive
 * "can this role click this button" from role booleans scattered around the
 * app. Route access (who can *open* a page) lives in App.tsx/RoleRoute;
 * this is who can *do* things once they're on a page that multiple roles
 * can view (e.g. Commercial/Functional Head can view Audits & Checklist
 * Library read-only, but canCreateAudit/canRecordChecklist stay false).
 */
export interface Permissions {
  canCreateAudit:        boolean;
  canRecordChecklist:    boolean;
  canRecordObservation:  boolean;
  canReviewObservation:  boolean;
  canCloseObservation:   boolean;
  canRequestExtension:   boolean; // auditee: request extension on their own observation
  canApproveExtension:   boolean; // commercial/functional head
  canManageAdmin:        boolean;
  canSendEmailReminder:  boolean;
}

function permissionsForRole(role: UserRole | undefined): Permissions {
  const isAdmin   = role === 'admin';
  const isAuditor = role === 'auditor' || isAdmin;
  const isHead    = role === 'commercialHead' || role === 'functionalHead';

  return {
    canCreateAudit:       isAuditor,
    canRecordChecklist:   isAuditor,
    canRecordObservation: isAuditor,
    canReviewObservation: isAuditor,
    canCloseObservation:  isAuditor,
    canRequestExtension:  role === 'auditee',
    canApproveExtension:  isHead || isAdmin,
    canManageAdmin:       isAdmin,
    canSendEmailReminder: isAuditor,
  };
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  login: () => {},
  logout: () => {},
  isAdmin: false,
  isAuditor: false,
  isAuditee: false,
  isCommercialHead: false,
  isFunctionalHead: false,
  permissions: permissionsForRole(undefined),
});

export const useAuth = () => useContext(AuthContext);

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  auditor: 'Auditor',
  auditee: 'Auditee',
  commercialHead: 'Commercial Head',
  functionalHead: 'Functional Head',
};

export function getInitials(user: Pick<AuthUser, 'name' | 'initials'>): string {
  if (user.initials) return user.initials;
  return user.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/** Default landing route per business role. Auditee now lands on the
 *  same shared /dashboard as Admin/Auditor (see App.tsx's RoleRoute for
 *  /dashboard, which already allows 'auditee') — the separate
 *  /auditee/dashboard "My Audits" page has been removed. */
export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'commercialHead': return '/commercial/dashboard';
    case 'functionalHead': return '/functional/dashboard';
    default: return '/dashboard';
  }
}

const STORAGE_KEY = 'auditAppUser';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const login = (u: AuthUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  const role = user?.role;

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAdmin: role === 'admin',
      isAuditor: role === 'auditor' || role === 'admin',
      isAuditee: role === 'auditee',
      isCommercialHead: role === 'commercialHead',
      isFunctionalHead: role === 'functionalHead',
      permissions: permissionsForRole(role),
    }}>
      {children}
    </AuthContext.Provider>
  );
}