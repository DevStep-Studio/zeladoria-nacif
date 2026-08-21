import React from 'react';
import {Navigate} from 'react-router-dom';
import {useAuth} from '@/lib/AuthContext';
import UnauthorizedPage from '@/pages/errors/UnauthorizedPage';

const DefaultFallback = () => (
 <div className="fixed inset-0 flex items-center justify-center bg-background">
  <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
 </div>
);

export default function RoleProtectedPage({roles = [], children, redirectTo = '/'}) {
 const {user, isLoadingAuth, authChecked} = useAuth();

 if (isLoadingAuth || !authChecked) {
  return <DefaultFallback />;
 }

  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  if (!isSuperAdmin && !roles.includes(user?.role)) {
   if (redirectTo) return <Navigate to={redirectTo} replace />;
   return <UnauthorizedPage />;
  }

 return children;
}
