import React from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {ArrowLeft, Home, ChevronRight} from 'lucide-react';

/**
 * Reusable page header with back button, home button and optional breadcrumb.
 * Usage: <PageHeader title="Saúde Pública" breadcrumb={[{label:'Saúde'}]} />
 */
export default function PageHeader({title, subtitle, icon: Icon, breadcrumb = [], backTo, homeHref = '/', theme = 'light'}) {
  const isDark = theme === 'dark';
 const navigate = useNavigate();

 const handleBack = () => {
 if (backTo) {
 navigate(backTo);
} else {
 navigate(-1);
}
};

 return (
  <div className="flex items-start gap-4 mb-2">
    {/* Back button */}
    <button
      onClick={handleBack}
      className={`flex items-center justify-center w-11 h-11 rounded-[16px] transition-all active:scale-95 shrink-0 ${isDark ? 'bg-white/20 hover:bg-white/30 text-white border border-white/20 backdrop-blur-md' : 'bg-white border border-slate-100 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)] hover:shadow-md text-slate-600 hover:text-slate-900'}`} aria-label="Voltar">
      <ArrowLeft className="w-5 h-5" />
    </button>

 {/* Title area */}
 <div className="flex-1 min-w-0">
 {/* Breadcrumb */}
  {breadcrumb.length > 0 && (
  <div className={`flex items-center gap-1 text-xs mb-0.5 ${isDark ? 'text-white/70' : 'text-slate-500'}`}>
  <Link to={homeHref} className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`}>Início</Link>
  {breadcrumb.map((crumb, i) => (
  <React.Fragment key={i}>
  <ChevronRight className="w-3 h-3 opacity-50" />
  {crumb.href ? (
  <Link to={crumb.href} className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`}>{crumb.label}</Link>
  ) : (
  <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{crumb.label}</span>
  )}
 </React.Fragment>
 ))}
 </div>
 )}
    <div className="flex items-center gap-2.5 mt-1">
      {Icon && <Icon className={`w-6 h-6 shrink-0 ${isDark ? 'text-white' : 'text-primary'}`} />}
      <h1 className={`text-xl sm:text-2xl font-extrabold tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{title}</h1>
    </div>
    {subtitle && <p className={`text-sm mt-1 truncate ${isDark ? 'text-white/80' : 'text-slate-500'}`}>{subtitle}</p>}
  </div>

    {/* Home button */}
    <Link
      to={homeHref}
      className={`flex items-center justify-center w-11 h-11 rounded-[16px] transition-all active:scale-95 shrink-0 ${isDark ? 'bg-white/20 hover:bg-white/30 text-white border border-white/20 backdrop-blur-md' : 'bg-primary/10 border border-primary/20 shadow-sm hover:bg-primary/20 text-primary'}`} aria-label="Ir para Início" title="Início">
      <Home className="w-5 h-5" />
    </Link>
  </div>
 );
}