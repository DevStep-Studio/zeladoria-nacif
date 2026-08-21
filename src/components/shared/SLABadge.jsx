import {Clock, AlertTriangle, CheckCircle2} from"lucide-react";
import {calcSlaStatus} from"@/lib/constants";

export default function SLABadge({occurrence, showLabel = true}) {
 const sla = calcSlaStatus(occurrence);

 const configs = {
 ok: {color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2},
 alerta: {color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock},
 critico: {color: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertTriangle},
 vencido: {color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle},
};

 const config = configs[sla.status] || configs.ok;
 const Icon = config.icon;

 if (!showLabel) return (
 <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
 <Icon className="w-3 h-3" />
 </span>
 );

 return (
 <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
 <Icon className="w-3 h-3" />
 <span>SLA: {sla.label}</span>
 </span>
 );
}