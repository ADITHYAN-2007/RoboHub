import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import type { UserRole } from '../../types/index.js';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium tracking-wide">Initializing laboratory session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const RoleRoute: React.FC<{
  allowedRoles: UserRole[];
  children: React.ReactNode;
}> = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
        <div className="w-16 h-16 rounded-full bg-rose-950/60 border border-rose-800/80 flex items-center justify-center text-rose-400 mb-4 text-2xl font-bold">
          403
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Restricted Laboratory Area</h2>
        <p className="text-slate-400 max-w-md text-sm mb-6">
          Access denied. Your active role <span className="text-rose-400 font-semibold">{user.role}</span> does not have security clearance for this management module.
        </p>
        <a
          href="/dashboard"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
        >
          Return to Dashboard
        </a>
      </div>
    );
  }

  return <>{children}</>;
};
