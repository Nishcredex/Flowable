import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, UserRole, getDashboardPath } from '../pages/AuthContext';

interface RoleRouteProps {
  children: React.ReactNode;
  allowed: UserRole[];
  fallback?: string;
}

export function RoleRoute({ children, allowed, fallback }: RoleRouteProps) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allowed.includes(user.role)) {
    return <Navigate to={fallback || getDashboardPath(user.role)} replace />;
  }
  return <>{children}</>;
}

/** Sends logged-in user to their role-specific home dashboard */
export function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={getDashboardPath(user.role)} replace />;
}
