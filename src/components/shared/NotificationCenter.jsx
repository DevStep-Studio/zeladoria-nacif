import React, {useState} from 'react';
import {appApi} from '@/services/app-api';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {useAuth} from '@/lib/AuthContext';
import {Bell, X, CheckCheck, AlertCircle, Info, AlertTriangle, ExternalLink, ShieldAlert, Shield} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Link} from 'react-router-dom';
import {formatDistanceToNow} from 'date-fns';
import {ptBR} from 'date-fns/locale';

const TYPE_ICONS = {
 sla_alert: {icon: AlertTriangle, color: 'text-red-500 bg-red-50'},
 status_update: {icon: Info, color: 'text-blue-500 bg-blue-50'},
 assignment: {icon: AlertCircle, color: 'text-orange-500 bg-orange-50'},
 system: {icon: Bell, color: 'text-purple-500 bg-purple-50'},
 priority_change: {icon: AlertTriangle, color: 'text-yellow-500 bg-yellow-50'},
 defesa_civil_alert: {icon: ShieldAlert, color: 'text-red-600 bg-red-100 ring-2 ring-red-400/50'},
};

export default function NotificationCenter() {
 const [open, setOpen] = useState(false);
 const {user} = useAuth();
 const qc = useQueryClient();

 const {data: notifications = []} = useQuery({
 queryKey: ['notifications', user?.email],
 queryFn: () => appApi.entities.Notification.filter({user_email: user?.email}, '-created_date', 30),
 enabled: !!user?.email,
 refetchInterval: 30000,
});

 const unread = notifications.filter(n => !n.read).length;

 const markRead = useMutation({
 mutationFn: (id) => appApi.entities.Notification.update(id, {read: true}),
 onSuccess: () => qc.invalidateQueries({queryKey: ['notifications']}),
});

 const markAllRead = async () => {
 const unreadOnes = notifications.filter(n => !n.read);
 await Promise.all(unreadOnes.map(n => appApi.entities.Notification.update(n.id, {read: true})));
 qc.invalidateQueries({queryKey: ['notifications']});
};

 const timeAgo = (date) => {
 try {return formatDistanceToNow(new Date(date), {addSuffix: true, locale: ptBR});} catch {return '';}
};

 return (
 <div className="relative">
 <Button variant="ghost" size="icon" className="relative h-9 w-9" onClick={() => setOpen(o => !o)}>
 <Bell className="w-4 h-4" />
 {unread > 0 && (
 <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
 {unread > 9 ? '9+' : unread}
 </span>
 )}
 </Button>

 {open && (
 <>
 <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
 <div className="absolute right-0 top-11 w-80 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
 {/* Header */}
 <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
 <div className="flex items-center gap-2">
 <Bell className="w-4 h-4 text-primary" />
 <span className="font-semibold text-sm">Notificações</span>
 {unread > 0 && <Badge className="h-4 text-[10px] px-1.5 bg-red-500">{unread}</Badge>}
 </div>
 <div className="flex items-center gap-1">
 {unread > 0 && (
 <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={markAllRead}>
 <CheckCheck className="w-3 h-3" /> Marcar lidas
 </Button>
 )}
 <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
 <X className="w-3.5 h-3.5" />
 </Button>
 </div>
 </div>

 {/* List */}
 <div className="max-h-80 overflow-y-auto divide-y divide-border">
 {notifications.length === 0 ? (
 <div className="p-8 text-center text-muted-foreground text-sm">
 <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
 Nenhuma notificação
 </div>
 ) : notifications.map(n => {
 const cfg = TYPE_ICONS[n.type] || TYPE_ICONS.system;
 const Icon = cfg.icon;
 return (
 <div key={n.id}
 className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${!n.read ? 'bg-primary/3' : ''}`}
 onClick={() => {markRead.mutate(n.id);}}>
 <div className="flex items-start gap-2.5">
 <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${cfg.color}`}>
 <Icon className="w-3.5 h-3.5" />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-start justify-between gap-1">
 <p className={`text-xs font-medium leading-tight ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>
 {n.title}
 </p>
 {!n.read && <div className="w-1.5 h-1.5 bg-primary rounded-full shrink-0 mt-1" />}
 </div>
 <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{n.message}</p>
 <p className="text-[10px] text-muted-foreground/70 mt-1">{timeAgo(n.created_date)}</p>
 </div>
 </div>
 {n.occurrence_id && (
 <Link to={`/ocorrencia/${n.occurrence_id}`} className="mt-1.5 flex items-center gap-1 text-[10px] text-primary font-medium" onClick={e => e.stopPropagation()}>
 <ExternalLink className="w-3 h-3" /> Ver ocorrência
 </Link>
 )}
 {n.type === 'defesa_civil_alert' && (
 <Link to="/defesa-civil" className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-red-600 font-bold hover:underline" onClick={e => e.stopPropagation()}>
 <Shield className="w-3 h-3" /> Abrir Painel Defesa Civil
 </Link>
 )}
 </div>
 );
})}
 </div>
 </div>
 </>
 )}
 </div>
 );
}
