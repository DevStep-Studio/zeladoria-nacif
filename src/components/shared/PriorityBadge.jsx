import {Badge} from"@/components/ui/badge";
import {PRIORITY_CONFIG} from"@/lib/constants";

export default function PriorityBadge({priority}) {
 const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.media;
 return (
 <Badge variant="secondary" className={`${config.color} text-xs font-medium`}>
 {config.label}
 </Badge>
 );
}