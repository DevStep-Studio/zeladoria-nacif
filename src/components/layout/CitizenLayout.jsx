import React, {useEffect, useState} from 'react';
import {Outlet, Link, useLocation} from 'react-router-dom';
import {motion, AnimatePresence} from 'framer-motion';
import {Home, PlusCircle, ClipboardList, User, Heart, GraduationCap, Shield, Globe, MoreHorizontal} from 'lucide-react';
import {useAuth} from '@/lib/AuthContext';
import NotificationCenter from '@/components/shared/NotificationCenter';
import SOSButton from '@/components/shared/SOSButton';
import AIAssistant from '@/components/shared/AIAssistant';
import ZeladoriaLogo from '@/components/shared/ZeladoriaLogo';

const desktopItems = [
 {path: '/saude-publica', icon: Heart, label: 'Saúde'},
 {path: '/matricula-escolar', icon: GraduationCap, label: 'Educação'},
 {path: '/defesa-civil', icon: Shield, label: 'Defesa Civil'},
 {path: '/minhas-ocorrencias', icon: ClipboardList, label: 'Minhas ocorrências'},
 {path: '/transparencia', icon: Globe, label: 'Transparência'},
 {path: '/perfil', icon: User, label: 'Perfil'},
];

const mobileNavItems = [
 {path: '/', icon: Home, label: 'Início'},
 {path: '/nova-ocorrencia', icon: PlusCircle, label: 'Registrar'},
 {path: '/minhas-ocorrencias', icon: ClipboardList, label: 'Histórico'},
 {path: '/perfil', icon: User, label: 'Perfil'},
];

const moreItems = [
 {path: '/admin', icon: Shield, label: 'Painel Super Admin (Prefeitura)'},
 {path: '/saude-publica', icon: Heart, label: 'Saúde'},
 {path: '/matricula-escolar', icon: GraduationCap, label: 'Educação'},
 {path: '/defesa-civil', icon: Shield, label: 'Defesa Civil'},
 {path: '/participacao', icon: ClipboardList, label: 'Participar'},
 {path: '/transparencia', icon: Globe, label: 'Transparência'},
];

export default function CitizenLayout() {
 const location = useLocation();
 const {user} = useAuth();
 const [moreOpen, setMoreOpen] = useState(false);
 const isMoreActive = moreItems.some(item => item.path === location.pathname);

 useEffect(() => {
  setMoreOpen(false);
 }, [location.pathname]);

 return (
 <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar (Desktop) */}
      <header className="hidden md:flex justify-between items-center w-full px-6 lg:px-8 h-16 bg-surface shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <ZeladoriaLogo size="sm" to="/" />
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-all shadow-sm"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Painel Super Admin</span>
          </Link>
          {user?.is_investor && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              {user.investor_badge || 'Investidor • Sessão Confidencial'}
            </span>
          )}
        </div>


        <div className="flex items-center gap-4 text-on-surface-variant">
          {desktopItems.map(({path, icon: Icon, label}) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                title={label}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                className={`hover:text-primary transition-colors ${isActive ? 'text-primary' : ''}`}
              >
                <Icon className="w-5 h-5" />
              </Link>
            );
          })}
          <div className="pl-2 border-l border-surface-container-highest">
             <NotificationCenter />
          </div>
        </div>
      </header>

      {/* Top bar (Mobile) */}
      <header className="fixed top-0 left-0 right-0 md:hidden h-[73px] px-4 bg-white/95 backdrop-blur-xl border-b border-slate-200/70 z-40 flex items-center justify-between">
        <ZeladoriaLogo size="xs" to="/" />
        <div className="flex items-center gap-2">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 text-white text-[11px] font-bold"
          >
            <Shield className="w-3 h-3 text-emerald-400" />
            <span>Admin</span>
          </Link>
          <NotificationCenter />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto pt-[73px] md:pt-0 pb-20 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="min-h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating buttons */}
      <SOSButton />
      <AIAssistant />

      {/* Bottom nav */}
      {moreOpen && (
        <div className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] left-3 right-3 z-[9998] md:hidden pointer-events-none">
          <div className="pointer-events-auto bg-white border border-slate-200 rounded-2xl shadow-xl p-2 grid grid-cols-2 gap-1">
            {moreItems.map(({path, icon: Icon, label}) => (
              <Link
                key={path}
                to={path}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors"
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
      <div className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-[9999] pointer-events-none flex justify-center left-3 right-3 md:hidden">
        <nav className="bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-3xl pointer-events-auto w-full max-w-lg px-2">
          <div className="flex justify-around py-2 gap-2">
            {mobileNavItems.map(({path, icon: Icon, label}) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all active:scale-95 ${
                    isActive ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-primary/10 text-primary' : ''}`}>
                    <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
                  </div>
                  <span className={`text-[10px] font-semibold leading-none ${isActive ? 'text-primary' : ''}`}>{label}</span>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setMoreOpen(open => !open)}
              aria-expanded={moreOpen}
              aria-label="Abrir mais opções"
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all active:scale-95 ${
                isMoreActive || moreOpen ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${isMoreActive || moreOpen ? 'bg-primary/10 text-primary' : ''}`}>
                <MoreHorizontal className={`w-5 h-5 ${isMoreActive || moreOpen ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
              </div>
              <span className={`text-[10px] font-semibold leading-none ${isMoreActive || moreOpen ? 'text-primary' : ''}`}>Mais</span>
            </button>
          </div>
        </nav>
      </div>
 </div>
 );
}
