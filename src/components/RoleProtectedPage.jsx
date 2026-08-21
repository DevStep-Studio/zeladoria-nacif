import React from 'react';
import {Navigate} from 'react-router-dom';
import {ShieldAlert} from 'lucide-react';
import {useAuth} from '@/lib/AuthContext';

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
   return (
    <div className="min-h-screen bg-slate-50/50 flex items-center justify-center px-4">
     <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center max-w-md">
      <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <h1 className="text-lg font-bold text-slate-800">Acesso restrito</h1>
      <p className="text-sm text-slate-500 mt-1">Esta área é destinada apenas aos perfis autorizados da prefeitura.</p>
     </div>
    </div>
   );
  }

 return children;
}
