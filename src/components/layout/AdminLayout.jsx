import React, {useState} from 'react';
import {Outlet, Link, useLocation, useNavigate} from 'react-router-dom';
import {motion, AnimatePresence} from 'framer-motion';
import {useAuth} from '@/lib/AuthContext';
import {
 LayoutDashboard, ClipboardList, Users, Building2,
 ChevronLeft, Menu, LogOut, Home,
 Activity, TrendingUp, Globe, HardHat, Heart, GraduationCap, Eye,
 Wrench, Plus, HelpCircle, ShieldAlert
} from 'lucide-react';
import ZeladoriaLogo from '@/components/shared/ZeladoriaLogo';
import NotificationCenter from '@/components/shared/NotificationCenter';

const sidebarItems = [
 {path: '/admin', icon: LayoutDashboard, label: 'Dashboard', group: 'principal'},
 {path: '/admin/executivo', icon: TrendingUp, label: 'Painel Executivo', group: 'principal'},
 {path: '/admin/operacoes', icon: Activity, label: 'Central Ops', group: 'principal'},
 {path: '/admin/smart-ops', icon: Eye, label: 'Smart City Ops', group: 'principal'},
 {path: '/admin/ocorrencias', icon: ClipboardList, label: 'Ocorrências', group: 'gestao'},
 {path: '/admin/ordens-servico', icon: Wrench, label: 'Ordens de Serviço', group: 'gestao'},
 {path: '/admin/equipes', icon: Users, label: 'Equipes', group: 'gestao'},
 {path: '/admin/secretarias', icon: Building2, label: 'Secretarias', group: 'gestao'},
 {path: '/admin/saude', icon: Heart, label: 'Saúde Pública', group: 'modulos'},
 {path: '/admin/educacao', icon: GraduationCap, label: 'Educação', group: 'modulos'},
 {path: '/transparencia', icon: Globe, label: 'Portal Público', group: 'extra'},
 {path: '/app-equipe', icon: HardHat, label: 'App Equipe', group: 'extra'},
];

const GROUP_LABELS = {
 principal: 'Principal',
 gestao: 'Gestão',
 modulos: 'Módulos',
 extra: 'Outros',
};

const MUNICIPAL_ROLES = ['super_admin', 'admin', 'gestor', 'atendente', 'fiscal', 'equipe', 'equipe_campo'];

export default function AdminLayout() {
 const location = useLocation();
 const navigate = useNavigate();
 const {user, logout, switchRole} = useAuth();
 const [collapsed, setCollapsed] = useState(false);
 const [mobileOpen, setMobileOpen] = useState(false);

 const currentItem = sidebarItems.find(i => i.path === location.pathname);

 if (!MUNICIPAL_ROLES.includes(user?.role)) {
 return (
 <div className="min-h-screen bg-slate-50/50 flex items-center justify-center px-4">
 <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center max-w-md">
 <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
 <h1 className="text-lg font-bold text-slate-800">Acesso administrativo restrito</h1>
 <p className="text-sm text-slate-500 mt-1 mb-5">Esta área é destinada apenas aos perfis da prefeitura.</p>
 <div className="flex flex-col gap-2">
   <button onClick={() => switchRole('super_admin')} className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800">
     Ativar Acesso Super Admin
   </button>
   <Link to="/" className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200">
     Voltar ao app cidadão
   </Link>
 </div>
 </div>
 </div>
 );
}

 const NavLink = ({path, icon: Icon, label}) => {
 const isActive = location.pathname === path;
 return (
 <Link key={path} to={path} onClick={() => setMobileOpen(false)}
 title={collapsed ? label : undefined}
  className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 font-medium ${
  isActive
  ? 'bg-primary/15 text-primary'
  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
 }`}>
 <Icon className="w-4 h-4 shrink-0" />
 {!collapsed && <span className="truncate">{label}</span>}
 </Link>
 );
};

 const SidebarContent = () => (
 <div className="flex flex-col h-full">
 {/* Logo */}
 <div className="p-4 border-b border-sidebar-border shrink-0">
 {collapsed ? (
 <ZeladoriaLogo size="xs" variant="icon" to="/admin" className="mx-auto" />
 ) : (
 <ZeladoriaLogo size="sm" to="/admin" />
 )}
 {!collapsed && <p className="text-[10px] text-sidebar-foreground/40 mt-1 font-medium uppercase tracking-wider">Painel Administrativo</p>}
 </div>

 {/* Back to citizen app */}
 <div className="px-2 pt-2 shrink-0">
 <Link to="/" onClick={() => setMobileOpen(false)}
 className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all border border-sidebar-border/50 hover:border-sidebar-border">
 <Home className="w-3.5 h-3.5 shrink-0" />
 {!collapsed && <span>← App Cidadão</span>}
 </Link>
 </div>

 {/* Nav */}
 <nav className="flex-1 overflow-y-auto p-2 space-y-0.5 mt-1">
 {['principal', 'gestao', 'modulos', 'extra'].map(group => (
 <div key={group}>
 {!collapsed && (
 <p className="px-3 pt-3 pb-1 text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-wider">
 {GROUP_LABELS[group]}
 </p>
 )}
 {sidebarItems.filter(i => i.group === group).map(item => (
 <NavLink key={item.path} {...item} />
 ))}
 </div>
 ))}
 </nav>

 {/* Footer */}
 <div className="p-3 border-t border-sidebar-border shrink-0">
 {!collapsed && (
 <div className="px-2 pb-2">
 <p className="text-xs font-semibold text-sidebar-foreground/80 truncate">{user?.full_name || user?.email}</p>
 <p className="text-[10px] text-sidebar-foreground/40 capitalize">{user?.role || 'admin'}</p>
 </div>
 )}
 <button onClick={logout}
 className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/50 hover:bg-red-500/10 hover:text-red-400 transition-colors w-full">
 <LogOut className="w-4 h-4 shrink-0" />
 {!collapsed && <span>Sair</span>}
 </button>
 </div>
 </div>
 );

 return (
 <div className="flex h-screen bg-background overflow-hidden">
 {/* Mobile overlay */}
 {mobileOpen && <div className="fixed inset-0 bg-black/50 z-[9998] lg:hidden" onClick={() => setMobileOpen(false)} />}

 {/* Sidebar desktop */}
 <aside className={`hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 relative ${collapsed ? 'w-16' : 'w-60'}`}>
 <SidebarContent />
 <button onClick={() => setCollapsed(c => !c)}
 className="absolute bottom-20 -right-3 w-6 h-6 rounded-full bg-sidebar border border-sidebar-border flex items-center justify-center shadow-sm z-10 hover:bg-sidebar-accent transition-colors">
 <ChevronLeft className={`w-3 h-3 text-sidebar-foreground/50 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
 </button>
 </aside>

 {/* Sidebar mobile */}
 <aside className={`fixed left-0 top-0 bottom-0 w-60 bg-sidebar border-r border-sidebar-border z-[9999] lg:hidden transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
 <SidebarContent />
 </aside>

 {/* Main */}
 <div className="flex-1 flex flex-col min-w-0 bg-background">
 <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-white shrink-0">
 <div className="flex items-center gap-4">
 <button className="lg:hidden p-1.5 rounded-lg hover:bg-muted transition-colors text-sidebar-foreground" onClick={() => setMobileOpen(true)}>
 <Menu className="w-5 h-5" />
 </button>
 <h1 className="font-bold text-lg text-foreground hidden md:block">
 <span className="text-muted-foreground/60 font-normal block text-xs">{currentItem?.group ? GROUP_LABELS[currentItem.group] : 'Zeladoria Cidades'}</span>
 {currentItem?.label || 'Admin'}
 </h1>
 </div>
 <div className="flex items-center gap-4">
 <div className="hidden md:flex items-center bg-slate-100 rounded-full px-4 py-2 w-64 border border-transparent focus-within:border-primary/30 focus-within:bg-white transition-colors">
 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
 <input type="text" placeholder="Buscar no sistema" className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground/70 text-foreground" />
  <div className="text-[10px] font-semibold text-muted-foreground bg-slate-200 px-1.5 py-0.5 rounded ml-2">Ctrl K</div>
  </div>
  <Link to="/admin/ocorrencias" className="hidden md:flex items-center gap-2 bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
  <Plus className="w-4 h-4" /> Triagem
  </Link>
  <button className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full border border-border/60 hover:bg-muted text-muted-foreground transition-colors">
  <HelpCircle className="w-4 h-4" />
  </button>
 <span className="text-xs text-muted-foreground hidden md:block truncate max-w-32">{user?.email}</span>
 <NotificationCenter />
 </div>
 </header>
 <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 relative">
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
 </div>
 </div>
 );
}
