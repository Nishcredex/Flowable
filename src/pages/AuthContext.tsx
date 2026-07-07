// // ============================================================
// //  AuthContext.tsx — Role-based auth (Admin / Auditor)
// //  Drop into src/context/AuthContext.tsx
// // ============================================================

// import React, { createContext, useContext, useState, useEffect } from 'react';

// export type UserRole = 'admin' | 'auditor';

// export interface AuthUser {
//   id:       string;   // e.g. 'admin', 'rajesh.kumar'
//   name:     string;   // display name
//   email:    string;
//   role:     UserRole;
// }

// interface AuthCtx {
//   user:    AuthUser | null;
//   login:   (user: AuthUser) => void;
//   logout:  () => void;
//   isAdmin: boolean;
// }

// const AuthContext = createContext<AuthCtx>({
//   user: null, login: () => {}, logout: () => {}, isAdmin: false,
// });

// export const useAuth = () => useContext(AuthContext);

// const STORAGE_KEY = 'auditAppUser';

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [user, setUser] = useState<AuthUser | null>(() => {
//     try {
//       const raw = localStorage.getItem(STORAGE_KEY);
//       return raw ? JSON.parse(raw) : null;
//     } catch { return null; }
//   });

//   const login = (u: AuthUser) => {
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
//     setUser(u);
//   };

//   const logout = () => {
//     localStorage.removeItem(STORAGE_KEY);
//     setUser(null);
//   };

//   return (
//     <AuthContext.Provider value={{ user, login, logout, isAdmin: user?.role === 'admin' }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }
// ============================================================
//  AuthContext.tsx — Role-based auth (Admin / Auditor)
//  Location: src/pages/AuthContext.tsx
//  (App.tsx, Sidebar.tsx, TopBar.tsx and Login.tsx all import this as
//   './pages/AuthContext' / '../pages/AuthContext' — keep it here, not in
//   a separate src/context/ folder, or update every one of those imports.)
// ============================================================

import React, { createContext, useContext, useState } from 'react';

export type UserRole = 'admin' | 'auditor';

export interface AuthUser {
  id: string;           // e.g. 'admin', 'rajesh.kumar'
  name: string;          // display name
  email: string;
  role: UserRole;
  department?: string;   // shown in the sidebar footer
  initials?: string;     // shown in the avatar; derived from name if omitted
}

interface AuthCtx {
  user:    AuthUser | null;
  login:   (user: AuthUser) => void;
  logout:  () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthCtx>({
  user: null, login: () => {}, logout: () => {}, isAdmin: false,
});

export const useAuth = () => useContext(AuthContext);

/** Human-friendly label for each role, used anywhere a role is displayed. */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  auditor: 'Auditor',
};

/** Falls back to initials derived from the name when `initials` isn't set. */
export function getInitials(user: Pick<AuthUser, 'name' | 'initials'>): string {
  if (user.initials) return user.initials;
  return user.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const STORAGE_KEY = 'auditAppUser';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const login = (u: AuthUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}