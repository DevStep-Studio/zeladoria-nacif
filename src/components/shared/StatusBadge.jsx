import {Badge} from"@/components/ui/badge";
import {STATUS_CONFIG} from"@/lib/constants";

export default function StatusBadge({status}) {
 const config = STATUS_CONFIG[status] || STATUS_CONFIG.registrada;
 return (
 <Badge variant="outline" className={`${config.color} border text-xs font-medium`}>
 {config.label}
 </Badge>
 );
}
