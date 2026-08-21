import React, {useState, useEffect} from 'react';
import {base44} from '@/api/base44Client';
import {useQuery} from '@tanstack/react-query';
import {Card, CardContent, CardHeader, CardTitle} from"@/components/ui/card";
import {Badge} from"@/components/ui/badge";
import {
 Activity, AlertTriangle, Users, Radio, Eye, Wifi, CheckCircle2
} from 'lucide-react';
import {AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {format, subMinutes} from 'date-fns';
import {STATUS_CONFIG, getStatusGroup, isResolvedStatus} from '@/lib/constants';

const PULSE_INTERVAL = 10000;

function LiveMetric({label, value, unit, color, pulse}) {
 return (
 <div className="p-3 rounded-xl bg-card border border-border">
 <p className="text-xs text-muted-foreground font-medium">{label}</p>
 <div className="flex items-end gap-1 mt-1">
 <span className={`text-2xl font-black ${color}`}>{value}</span>
 {unit && <span className="text-xs text-muted-foreground mb-0.5">{unit}</span>}
 {pulse && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mb-1 ml-1" />}
 </div>
 </div>
 );
}

export default function SmartCityOps() {
 const [liveTime, setLiveTime] = useState(new Date());
 const [alertPulse, setAlertPulse] = useState(false);

 useEffect(() => {
 const t = setInterval(() => {
 setLiveTime(new Date());
 setAlertPulse(p => !p);
}, 1000);
 return () => clearInterval(t);
}, []);

 const {data: occurrences = []} = useQuery({
 queryKey: ['ops-occurrences'],
 queryFn: () => base44.entities.Occurrence.list('-created_date', 200),
 refetchInterval: 15000,
});

 const {data: teams = []} = useQuery({
 queryKey: ['ops-teams'],
 queryFn: () => base44.entities.Team.list(),
 refetchInterval: 15000,
});

 const critical = occurrences.filter(o => ['urgente', 'critica'].includes(o.priority) && !isResolvedStatus(o.status));
 const openCount = occurrences.filter(o => getStatusGroup(o.status) === 'abertas').length;
 const inFieldTeams = teams.filter(t => t.status === 'em_campo').length;
 const availTeams = teams.filter(t => t.status === 'disponivel').length;
 const resolvedToday = occurrences.filter(o => {
 if (!o.resolved_date) return false;
 const d = new Date(o.resolved_date);
 const today = new Date();
 return d.toDateString() === today.toDateString();
}).length;

 // Simulated live traffic data
 const liveData = Array.from({length: 20}, (_, i) => ({
 time: format(subMinutes(liveTime, 19 - i), 'HH:mm'),
 valor: Math.floor(Math.random() * 15) + 5,
}));

 const urgentItems = critical.slice(0, 8);
 const statusColors = Object.fromEntries(Object.entries(STATUS_CONFIG).map(([key, value]) => {
 const textColor = value.color.split(' ').find(item => item.startsWith('text-')) || 'text-gray-500';
 return [key, textColor.replace('text-', 'bg-')];
}));

 return (
 <div className="space-y-5">
 {/* Ops Header */}
 <div className="flex items-center justify-between flex-wrap gap-3">
 <div>
 <h2 className="text-xl font-black flex items-center gap-2">
 <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
 <Eye className="w-4 h-4 text-white" />
 </div>
 Central Operacional Smart City
 </h2>
 <div className="flex items-center gap-2 mt-1">
 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
 <span className="text-xs text-green-600 font-semibold">SISTEMA ONLINE</span>
 <span className="text-xs text-muted-foreground">— {format(liveTime, 'HH:mm:ss')}</span>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
 <Wifi className="w-3 h-3" /> Tempo Real
 </Badge>
 <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1">
 <Radio className="w-3 h-3" /> {teams.length} Equipes
 </Badge>
 </div>
 </div>

 {/* Live Metrics */}
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
 <LiveMetric label="OS Abertas" value={openCount} color="text-blue-600"pulse />
 <LiveMetric label="Críticas" value={critical.length} color={critical.length > 0 ?"text-red-600":"text-green-600"} pulse={critical.length > 0} />
 <LiveMetric label="Equipes em Campo" value={inFieldTeams} unit={`/${teams.length}`} color="text-purple-600"pulse />
 <LiveMetric label="Disponíveis" value={availTeams} color="text-green-600"pulse />
 <LiveMetric label="Resolvidas Hoje" value={resolvedToday} color="text-teal-600" />
 <LiveMetric label="Total Histórico" value={occurrences.length} color="text-slate-600" />
 </div>

 {/* Alerts + Live Chart */}
 <div className="grid lg:grid-cols-2 gap-4">
 {/* Critical alerts */}
 <Card className="border-0 shadow-sm">
 <CardHeader className="pb-2">
 <CardTitle className="text-sm flex items-center gap-2">
 <div className={`w-2 h-2 rounded-full bg-red-500 ${alertPulse ? 'opacity-100' : 'opacity-40'}`} />
 Alertas Críticos em Aberto
 {critical.length > 0 && <Badge className="bg-red-100 text-red-700 h-4 text-[10px] px-1">{critical.length}</Badge>}
 </CardTitle>
 </CardHeader>
 <CardContent>
 {urgentItems.length === 0 ? (
 <div className="flex flex-col items-center py-6 text-center">
 <CheckCircle2 className="w-10 h-10 text-green-500 mb-2" />
 <p className="text-sm font-semibold text-green-600">Nenhum alerta crítico</p>
 <p className="text-xs text-muted-foreground">Sistema operando normalmente</p>
 </div>
 ) : (
 <div className="space-y-2 max-h-60 overflow-y-auto">
 {urgentItems.map(occ => (
 <div key={occ.id} className="flex items-start gap-2.5 p-2.5 rounded-lg border border-red-100 bg-red-50/50">
 <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
 <div className="flex-1 min-w-0">
 <p className="text-xs font-semibold text-foreground truncate">{occ.title || occ.description?.substring(0, 50)}</p>
 <div className="flex items-center gap-2 mt-0.5">
 <span className="text-[10px] text-muted-foreground">{occ.neighborhood || occ.address || 'Sem localização'}</span>
 <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${occ.priority === 'urgente' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
 {occ.priority}
 </span>
 </div>
 </div>
 <div className={`w-2 h-2 rounded-full shrink-0 mt-1 ${statusColors[occ.status] || 'bg-gray-400'}`} />
 </div>
 ))}
 </div>
 )}
 </CardContent>
 </Card>

 {/* Live Activity Chart */}
 <Card className="border-0 shadow-sm">
 <CardHeader className="pb-2">
 <CardTitle className="text-sm flex items-center gap-2">
 <Activity className="w-4 h-4 text-green-500" />
 Atividade em Tempo Real
 </CardTitle>
 </CardHeader>
 <CardContent>
 <ResponsiveContainer width="100%" height={200}>
 <AreaChart data={liveData}>
 <XAxis dataKey="time" tick={{fontSize: 10}} interval={4} />
 <YAxis tick={{fontSize: 10}} />
 <Tooltip contentStyle={{fontSize: 11}} />
 <Area type="monotone" dataKey="valor" stroke="#10b981" fill="#10b981" fillOpacity={0.08} strokeWidth={2} name="Eventos" dot={false} />
 </AreaChart>
 </ResponsiveContainer>
 </CardContent>
 </Card>
 </div>

 {/* Teams Status */}
 <Card className="border-0 shadow-sm">
 <CardHeader className="pb-2">
 <CardTitle className="text-sm flex items-center gap-2">
 <Users className="w-4 h-4 text-primary" />
 Status das Equipes em Tempo Real
 </CardTitle>
 </CardHeader>
 <CardContent>
 {teams.length === 0 ? (
 <p className="text-sm text-muted-foreground text-center py-4">Nenhuma equipe cadastrada</p>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
 {teams.map(team => (
 <div key={team.id} className={`p-3 rounded-xl border-2 ${team.status === 'em_campo' ? 'border-blue-200 bg-blue-50' : team.status === 'disponivel' ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
 <div className="flex items-center justify-between mb-1.5">
 <span className="text-sm font-bold">{team.name}</span>
 <div className={`w-2 h-2 rounded-full ${team.status === 'em_campo' ? 'bg-blue-500 animate-pulse' : team.status === 'disponivel' ? 'bg-green-500' : 'bg-gray-400'}`} />
 </div>
 <div className="space-y-0.5">
 <p className="text-xs text-muted-foreground">{team.department || 'Geral'}</p>
 {team.leader && <p className="text-xs"><span className="text-muted-foreground">Líder:</span> {team.leader}</p>}
 {team.members_count > 0 && <p className="text-xs"><span className="text-muted-foreground">Membros:</span> {team.members_count}</p>}
 </div>
 <Badge className={`mt-2 text-[10px] h-4 ${team.status === 'em_campo' ? 'bg-blue-100 text-blue-700' : team.status === 'disponivel' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
 {team.status === 'disponivel' ? '✓ Disponível' : team.status === 'em_campo' ? '🚨 Em Campo' : '✗ Indisponível'}
 </Badge>
 </div>
 ))}
 </div>
 )}
 </CardContent>
 </Card>
 </div>
 );
}
