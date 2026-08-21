import {Zap} from"lucide-react";
import {PRIORITY_CONFIG} from"@/lib/constants";

const PRIORITY_STYLES = {
 baixa: 'bg-slate-100 text-slate-600 border-slate-200',
 media: 'bg-yellow-100 text-yellow-700 border-yellow-200',
 alta: 'bg-orange-100 text-orange-700 border-orange-200',
 urgente: 'bg-red-100 text-red-700 border-red-200',
 critica: 'bg-red-900 text-red-100 border-red-800 animate-pulse',
};

export default function SmartPriorityBadge({priority, showIcon = true}) {
 const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.media;
 const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES.media;
 const isCritical = priority === 'critica';

 return (
 <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${style}`}>
 {showIcon && isCritical && <Zap className="w-3 h-3" />}
 {config.label}
 </span>
 );
}