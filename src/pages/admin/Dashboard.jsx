import React from 'react';
import {Link} from 'react-router-dom';
import {appApi} from '@/services/app-api';
import {useQuery} from '@tanstack/react-query';
import {Card, CardContent, CardHeader, CardTitle} from"@/components/ui/card";
import {AlertCircle, CheckCircle2, Clock, Users, Activity, TrendingUp, ArrowRight, Zap} from 'lucide-react';
import {calcSlaStatus, getStatusGroup, isResolvedStatus} from '@/lib/constants';
import OccurrenceMap from '@/components/shared/OccurrenceMap';
import DashboardCharts from '@/components/admin/DashboardCharts';

export default function Dashboard() {
 const {data: occurrences = [], isLoading} = useQuery({
 queryKey: ['admin-occurrences'],
 queryFn: () => appApi.entities.Occurrence.list('-created_date', 500),
});

 const {data: teams = []} = useQuery({
 queryKey: ['teams'],
 queryFn: () => appApi.entities.Team.list(),
});

 const slaVencidos = occurrences.filter(o => !isResolvedStatus(o.status) && calcSlaStatus(o).status === 'vencido').length;

 const stats = {
 total: occurrences.length,
 aberto: occurrences.filter(o => getStatusGroup(o.status) === 'abertas').length,
 em_andamento: occurrences.filter(o => getStatusGroup(o.status) === 'andamento').length,
 resolvido: occurrences.filter(o => isResolvedStatus(o.status)).length,
 teams_available: teams.filter(t => t.status === 'disponivel').length,
};

 const statCards = [
 {title: 'Total', value: stats.total, icon: AlertCircle, color: 'text-primary bg-primary/10'},
 {title: 'Abertos', value: stats.aberto, icon: Clock, color: 'text-red-600 bg-red-50'},
 {title: 'Em Andamento', value: stats.em_andamento, icon: Users, color: 'text-yellow-600 bg-yellow-50'},
 {title: 'Resolvidos', value: stats.resolvido, icon: CheckCircle2, color: 'text-green-600 bg-green-50'},
 ];

 if (isLoading) {
 return (
 <div className="flex justify-center py-12">
 <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
 </div>
 );
}

 return (
 <div className="space-y-8 animate-in fade-in duration-500">
 {/* Greeting Header */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <Zap className="w-5 h-5 text-primary fill-primary/20" />
 <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Olá, {appApi.auth.user?.full_name || appApi.auth.user?.email?.split('@')[0] || 'Usuário'}</h2>
 </div>
 <p className="text-muted-foreground text-sm">Painel administrativo para gestão de zeladoria urbana e ocorrências.</p>
 </div>
 </div>

 {/* SLA Alert */}
 {slaVencidos > 0 && (
 <Link to="/admin/ocorrencias">
 <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm hover:bg-red-100 transition-colors shadow-sm">
 <Zap className="w-5 h-5 shrink-0" />
 <span><strong>{slaVencidos} SLA{slaVencidos > 1 ? 's' : ''} vencido{slaVencidos > 1 ? 's' : ''}</strong> — ação imediata necessária</span>
 <ArrowRight className="w-4 h-4 ml-auto" />
 </div>
 </Link>
 )}

 {/* Resumo Operacional */}
 <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
 <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-4">Resumo Operacional</p>
 <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
 <div className="max-w-md">
 <h3 className="text-3xl font-extrabold text-slate-800 mb-2">{stats.total} ocorrências no sistema</h3>
 <p className="text-sm text-slate-500">Acompanhe o volume de ocorrências, chamados abertos e resoluções da zeladoria urbana em tempo real.</p>
 </div>
 
 <div className="flex flex-wrap gap-3">
 <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 min-w-[110px]">
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Abertos</p>
 <p className="text-2xl font-bold text-slate-800">{stats.aberto}</p>
 </div>
 <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 min-w-[110px]">
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Andamento</p>
 <p className="text-2xl font-bold text-slate-800">{stats.em_andamento}</p>
 </div>
 <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 min-w-[110px]">
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Resolvidos</p>
 <p className="text-2xl font-bold text-slate-800">{stats.resolvido}</p>
 </div>
 <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 min-w-[110px]">
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Equipes</p>
 <p className="text-2xl font-bold text-slate-800">{stats.teams_available}</p>
 </div>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 <div className="bg-primary rounded-2xl p-5 text-white shadow-sm flex flex-col justify-between h-full hover:scale-[1.02] transition-transform">
 <div>
 <div className="bg-white w-8 h-8 rounded-lg flex items-center justify-center mb-5 text-primary">
 <AlertCircle className="w-5 h-5" />
 </div>
 <p className="text-[10px] font-bold text-white/90 uppercase tracking-wider mb-1">Total de Ocorrências</p>
 <p className="text-3xl font-extrabold">{stats.total}</p>
 </div>
 <p className="text-sm text-white/80 mt-6 truncate">Volume geral no sistema</p>
 </div>
 
 <div className="bg-primary rounded-2xl p-5 text-white shadow-sm flex flex-col justify-between h-full hover:scale-[1.02] transition-transform">
 <div>
 <div className="bg-white w-8 h-8 rounded-lg flex items-center justify-center mb-5 text-primary">
 <Clock className="w-5 h-5" />
 </div>
 <p className="text-[10px] font-bold text-white/90 uppercase tracking-wider mb-1">Aguardando Atendimento</p>
 <p className="text-3xl font-extrabold">{stats.aberto}</p>
 </div>
 <p className="text-sm text-white/80 mt-6 truncate">Ocorrências abertas</p>
 </div>
 
 <div className="bg-primary rounded-2xl p-5 text-white shadow-sm flex flex-col justify-between h-full hover:scale-[1.02] transition-transform">
 <div>
 <div className="bg-white w-8 h-8 rounded-lg flex items-center justify-center mb-5 text-primary">
 <Activity className="w-5 h-5" />
 </div>
 <p className="text-[10px] font-bold text-white/90 uppercase tracking-wider mb-1">Em Andamento</p>
 <p className="text-3xl font-extrabold">{stats.em_andamento}</p>
 </div>
 <p className="text-sm text-white/80 mt-6 truncate">Equipes mobilizadas</p>
 </div>
 
 <div className="bg-primary rounded-2xl p-5 text-white shadow-sm flex flex-col justify-between h-full hover:scale-[1.02] transition-transform">
 <div>
 <div className="bg-white w-8 h-8 rounded-lg flex items-center justify-center mb-5 text-primary">
 <CheckCircle2 className="w-5 h-5" />
 </div>
 <p className="text-[10px] font-bold text-white/90 uppercase tracking-wider mb-1">Taxa de Resolução</p>
 <p className="text-3xl font-extrabold">{stats.total > 0 ? Math.round((stats.resolvido / stats.total) * 100) : 0}%</p>
 </div>
 <p className="text-sm text-white/80 mt-6 truncate">{stats.resolvido} concluídas</p>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Map - takes up 2 columns on large screens */}
 <div className="lg:col-span-2">
 <Card className="border-slate-200 shadow-sm h-full">
 <CardHeader className="pb-2 border-b border-slate-100">
 <CardTitle className="text-base text-slate-800">Mapa em Tempo Real</CardTitle>
 </CardHeader>
 <CardContent className="p-0">
 <OccurrenceMap
 occurrences={occurrences.filter(o => !isResolvedStatus(o.status))}
 height="400px" zoom={12}
 />
 </CardContent>
 </Card>
 </div>
 
 {/* Quick Nav & Info - takes up 1 column */}
 <div className="space-y-6">
 <Card className="border-slate-200 shadow-sm">
 <CardHeader className="pb-3 border-b border-slate-100">
 <CardTitle className="text-base text-slate-800">Acesso Rápido</CardTitle>
 </CardHeader>
 <CardContent className="p-4 space-y-3">
 <Link to="/admin/operacoes">
 <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-primary/30 hover:bg-slate-50 transition-colors group">
 <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
 <Activity className="w-4 h-4 text-primary" />
 </div>
 <div>
 <p className="text-sm font-semibold text-slate-700 group-hover:text-primary transition-colors">Central de Operações</p>
 <p className="text-xs text-muted-foreground">Monitoramento ao vivo</p>
 </div>
 <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary ml-auto transition-colors" />
 </div>
 </Link>
 <Link to="/admin/executivo">
 <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-primary/30 hover:bg-slate-50 transition-colors group">
 <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
 <TrendingUp className="w-4 h-4 text-primary" />
 </div>
 <div>
 <p className="text-sm font-semibold text-slate-700 group-hover:text-primary transition-colors">Dashboard Executivo</p>
 <p className="text-xs text-muted-foreground">Visão estratégica</p>
 </div>
 <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary ml-auto transition-colors" />
 </div>
 </Link>
 </CardContent>
 </Card>
 </div>
 </div>

 {/* Charts */}
 <DashboardCharts occurrences={occurrences} />
 </div>
 );
}
