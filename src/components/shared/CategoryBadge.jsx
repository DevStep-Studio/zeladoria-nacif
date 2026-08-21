import {Badge} from"@/components/ui/badge";
import {CATEGORIES} from"@/lib/constants";

export default function CategoryBadge({category}) {
 const config = CATEGORIES[category];
 if (!config) return null;
 return (
 <Badge variant="secondary" className={`${config.color} border text-xs font-medium`}>
 {config.label}
 </Badge>
 );
}
