import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: Array<'moderator' | 'admin' | 'member'>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { currentUser, isAuthenticated, isAuthChecking } = useApp();
  const location = useLocation();

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 font-medium">
          Vérification sécurisée de la session...
        </p>
      </div>
    );
  }

  // Utilisateur non connecté -> Redirection immédiate vers /login
  if (!isAuthenticated || !currentUser.id) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Scoping par rôle (Modérateur vs Membre)
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = currentUser.role || 'moderator';
    if (!allowedRoles.includes(userRole as any)) {
      if (userRole === 'member') {
        return <Navigate to="/member" replace />;
      }
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};
