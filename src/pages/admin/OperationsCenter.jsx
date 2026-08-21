import React, {useState, useEffect} from 'react';
import {appApi} from '@/services/app-api';
import {useQuery} from '@tanstack/react-query';
import {Card, CardContent, CardHeader, CardTitle} from"@/components/ui/card";
import {AlertTriangle, Users, CheckCircle2, Clock, Zap, Activity, MapPin, TrendingUp} from 'lucide-react';
import {CATEGORIES, calcSlaStatus, isResolvedStatus} from '@/lib/constants';
import OccurrenceMap from '@/components/shared/OccurrenceMap';
import {format} from 'date-fns';
import {ptBR} from 'date-fns/locale';
import {motion, AnimatePresence} from 'framer-motion';

export default function OperationsCenter() {
 const [now, setNow] = useState(new Date());

 useEffect(() => {
 const timer = setInterval(() => setNow(new Date()), 30000);
 return () => clearInterval(timer);
}, []);

 const {data: occurrences = []} = useQuery({
 queryKey: ['ops-occurrences'],
 queryFn: () => appApi.entities.Occurrence.list('-created_date', 500),
 refetchInterval: 30000,
});

 const {data: teams = []} = useQuery({
 queryKey: ['ops-teams'],
 queryFn: () => appApi.entities.Team.list(),
 refetchInterval: 30000,
});

 const active = occurrences.filter(o => !isResolvedStatus(o.status));
 const critical = active.filter(o => {
 const sla = calcSlaStatus(o);
 return sla.status === 'vencido' || sla.status === 'critico' || o.priority === 'urgente' || o.priority === 'critica';
});
 const teamsOnField = teams.filter(t => t.status === 'em_campo');
 const resolvedToday = occurrences.filter(o => {
 if (!isResolvedStatus(o.status) || !o.resolved_date) return false;
 const resolved = new Date(o.resolved_date);
 return resolved.toDateString() === now.toDateString();
});

 // Neighborhood ranking
 const neighborhoodCount = {};
 active.forEach(o => {
 if (o.neighborhood) neighborhoodCount[o.neighborhood] = (neighborhoodCount[o.neighborhood] || 0) + 1;
});
 const topNeighborhoods = Object.entries(neighborhoodCount)
 .sort((a, b) => b[1] - a[1])
 .slice(0, 5);

 // SLA expired
 const slaVencidos = active.filter(o => calcSlaStatus(o).status === 'vencido');
 const slaCriticos = active.filter(o => calcSlaStatus(o).status === 'critico');

 const kpis = [
 {label: 'Ocorrências Ativas', value: active.length, icon: Activity, color: 'text-blue-600 bg-blue-50', border: 'border-blue-200'},
 {label: 'Críticas / Urgentes', value: critical.length, icon: AlertTriangle, color: 'text-red-600 bg-red-50', border: 'border-red-200', alert: critical.length > 0},
 {label: 'SLA Vencidos', value: slaVencidos.length, icon: Clock, color: 'text-orange-600 bg-orange-50', border: 'border-orange-200', alert: slaVencidos.length > 0},
 {label: 'Equipes em Campo', value: teamsOnField.length, icon: Users, color: 'text-purple-600 bg-purple-50', border: 'border-purple-200'},
 {label: 'Resolvidos Hoje', value: resolvedToday.length, icon: CheckCircle2, color: 'text-green-600 bg-green-50', border: 'border-green-200'},
 {label: 'SLA em Alerta', value: slaCriticos.length, icon: Zap, color: 'text-yellow-600 bg-yellow-50', border: 'border-yellow-200', alert: slaCriticos.length > 0},
 ];

 return (
 <div className="space-y-6">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div>
 <h2 className="text-xl font-bold flex items-center gap-2">
 <Activity className="w-5 h-5 text-primary" />
 Central de Operações
 </h2>
 <p className="text-sm text-muted-foreground">Monitoramento em tempo real</p>
 </div>
 <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
 <span>Ao vivo · {format(now,"HH:mm", {locale: ptBR})}</span>
 </div>
 </div>

 {/* KPIs */}
 <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
 {kpis.map(({label, value, icon: Icon, color, border, alert}) => (
 <motion.div key={label} initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}}>
 <Card className={`border ${border || 'border-border'} ${alert && value > 0 ? 'ring-2 ring-red-400' : ''}`}>
 <CardContent className="p-3">
 <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${color}`}>
 <Icon className="w-4 h-4" />
 </div>
 <p className={`text-2xl font-bold ${alert && value > 0 ? 'text-red-600' : ''}`}>{value}</p>
 <p className="text-xs text-muted-foreground leading-tight mt-0.5">{label}</p>
 </CardContent>
 </Card>
 </motion.div>
 ))}
 </div>

 {/* Map + Critical List */}
 <div className="grid lg:grid-cols-3 gap-4">
 {/* Big Map */}
 <Card className="lg:col-span-2 border-0 shadow-sm">
 <CardHeader className="pb-2">
 <CardTitle className="text-sm flex items-center gap-2">
 <MapPin className="w-4 h-4 text-primary" />
 Mapa Operacional
 </CardTitle>
 </CardHeader>
 <CardContent>
 <OccurrenceMap occurrences={active} height="400px" zoom={12} />
 </CardContent>
 </Card>

 {/* Critical Alerts */}
 <Card className="border-0 shadow-sm">
 <CardHeader className="pb-2">
 <CardTitle className="text-sm flex items-center gap-2 text-red-600">
 <AlertTriangle className="w-4 h-4" />
 Alertas Críticos ({critical.length})
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
 <AnimatePresence>
 {critical.length === 0 ? (
 <div className="text-center py-8 text-sm text-muted-foreground">
 <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
 Nenhum alerta crítico
 </div>
 ) : (
 critical.map(occ => {
 const sla = calcSlaStatus(occ);
 return (
 <motion.div
 key={occ.id}
 initial={{opacity: 0, x: 20}}
 animate={{opacity: 1, x: 0}}
 className="p-3 rounded-lg border border-red-200 bg-red-50">
 <div className="flex items-start justify-between gap-2">
 <div className="flex-1 min-w-0">
 <p className="text-xs font-semibold text-red-800 truncate">
 {CATEGORIES[occ.category]?.label || occ.category}
 </p>
 <p className="text-xs text-red-700 mt-0.5 truncate">
 {occ.neighborhood || occ.address || 'Sem localização'}
 </p>
 {sla.status === 'vencido' && (
 <span className="text-xs bg-red-700 text-white px-1.5 py-0.5 rounded mt-1 inline-block">
 {sla.label}
 </span>
 )}
 </div>
 <span className="text-xs text-red-500 whitespace-nowrap">
 {format(new Date(occ.created_date), 'dd/MM HH:mm')}
 </span>
 </div>
 </motion.div>
 );
})
 )}
 </AnimatePresence>
 </CardContent>
 </Card>
 </div>

 {/* Teams Status + Neighborhood Ranking */}
 <div className="grid lg:grid-cols-2 gap-4">
 {/* Teams */}
 <Card className="border-0 shadow-sm">
 <CardHeader className="pb-2">
 <CardTitle className="text-sm flex items-center gap-2">
 <Users className="w-4 h-4 text-primary" />
 Status das Equipes
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-2">
 {teams.length === 0 ? (
 <p className="text-sm text-muted-foreground">Nenhuma equipe cadastrada</p>
 ) : teams.map(team => {
 const statusColors = {
 disponivel: 'bg-green-100 text-green-700',
 em_campo: 'bg-blue-100 text-blue-700',
 indisponivel: 'bg-slate-100 text-slate-500',
};
 const statusDot = {
 disponivel: 'bg-green-500',
 em_campo: 'bg-blue-500 animate-pulse',
 indisponivel: 'bg-slate-400',
};
 return (
 <div key={team.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
 <div className="flex items-center gap-2">
 <div className={`w-2 h-2 rounded-full ${statusDot[team.status] || 'bg-slate-400'}`} />
 <div>
 <p className="text-sm font-medium">{team.name}</p>
 <p className="text-xs text-muted-foreground">{team.leader}</p>
 </div>
 </div>
 <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[team.status] || ''}`}>
 {team.status === 'disponivel' ? 'Disponível' : team.status === 'em_campo' ? 'Em Campo' : 'Indisponível'}
 </span>
 </div>
 );
})}
 </CardContent>
 </Card>

 {/* Neighborhood Ranking */}
 <Card className="border-0 shadow-sm">
 <CardHeader className="pb-2">
 <CardTitle className="text-sm flex items-center gap-2">
 <TrendingUp className="w-4 h-4 text-primary" />
 Bairros Mais Críticos
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-2">
 {topNeighborhoods.length === 0 ? (
 <p className="text-sm text-muted-foreground">Dados insuficientes</p>
 ) : topNeighborhoods.map(([name, count], i) => {
 const pct = (count / (topNeighborhoods[0]?.[1] || 1)) * 100;
 return (
 <div key={name} className="space-y-1">
 <div className="flex items-center justify-between text-sm">
 <div className="flex items-center gap-2">
 <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
 ${i === 0 ? 'bg-red-500 text-white' : i === 1 ? 'bg-orange-400 text-white' : 'bg-slate-200 text-slate-600'}`}>
 {i + 1}
 </span>
 <span className="font-medium">{name}</span>
 </div>
 <span className="text-muted-foreground">{count} oc.</span>
 </div>
 <div className="w-full bg-muted rounded-full h-1.5">
 <div
 className={`h-1.5 rounded-full ${i === 0 ? 'bg-red-500' : i === 1 ? 'bg-orange-400' : 'bg-primary'}`}
 style={{width:`${pct}%`}}
 />
 </div>
 </div>
 );
})}
 </CardContent>
 </Card>
 </div>
 </div>
 );
}
