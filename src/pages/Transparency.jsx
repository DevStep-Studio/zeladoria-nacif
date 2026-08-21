import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import {appApi} from '@/services/app-api';
import {useQuery} from '@tanstack/react-query';
import {Card, CardContent, CardHeader, CardTitle} from"@/components/ui/card";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from"@/components/ui/select";
import {CheckCircle2, Clock, TrendingUp, MapPin, BarChart3} from 'lucide-react';
import {CATEGORIES, PUBLIC_STATUS_OPTIONS, getStatusGroup, isResolvedStatus} from '@/lib/constants';
import StatusBadge from '@/components/shared/StatusBadge';
import CategoryBadge from '@/components/shared/CategoryBadge';
import OccurrenceMap from '@/components/shared/OccurrenceMap';
import DataPagination from '@/components/shared/DataPagination';
import {usePagination} from '@/hooks/use-pagination';
import {format} from 'date-fns';
import {ptBR} from 'date-fns/locale';
import {BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer} from 'recharts';

export default function Transparency() {
 const [statusFilter, setStatusFilter] = useState('all');

 const {data: occurrences = [], isLoading} = useQuery({
   queryKey: ['transparency-occurrences'],
   queryFn: () => appApi.entities.Occurrence.list('-created_date', 500),
 });

 const total = occurrences.length;
 const resolved = occurrences.filter(o => isResolvedStatus(o.status)).length;
 const open = occurrences.filter(o => getStatusGroup(o.status) === 'abertas').length;
 const inProgress = occurrences.filter(o => getStatusGroup(o.status) === 'andamento').length;
 const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

 const resolvedWithTime = occurrences.filter(o => isResolvedStatus(o.status) && o.resolved_date);
 const avgHours = resolvedWithTime.length > 0
   ? resolvedWithTime.reduce((s, o) => s + (new Date(o.resolved_date).getTime() - new Date(o.created_date).getTime()) / 3600000, 0) / resolvedWithTime.length
   : 0;

 const catData = Object.entries(CATEGORIES).map(([key, cat]) => ({
   name: cat.label.substring(0, 12),
   total: occurrences.filter(o => o.category === key).length,
   resolvidos: occurrences.filter(o => o.category === key && isResolvedStatus(o.status)).length,
 })).filter(d => d.total > 0).sort((a, b) => b.total - a.total).slice(0, 8);

 const filtered = occurrences.filter(o => statusFilter === 'all' || o.status === statusFilter);
 const pagination = usePagination(filtered, {
   pageSize: 10,
   resetDeps: [statusFilter],
 });

 return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="w-full max-w-max-width mx-auto px-margin-mobile md:px-container-padding py-8 pb-32 md:pb-12 space-y-6">
        
        {/* Hero Section */}
        <section className="bg-teal-500 rounded-xl p-8 mb-8 relative overflow-hidden flex flex-col justify-center min-h-[160px] shadow-sm">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[200px]">language</span>
          </div>
          <div className="relative z-10 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-white font-label-sm text-label-sm opacity-80">
              <Link to="/" className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                <span className="material-symbols-outlined text-sm">arrow_back</span>
              </Link>
              <span>Início</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="font-bold">Transparência</span>
            </div>
            <div className="flex justify-between items-end mt-4">
              <div>
                <h1 className="text-white font-headline-lg text-headline-lg-mobile md:text-headline-lg mb-1">Portal de Transparência</h1>
                <p className="text-white font-body-sm text-body-sm opacity-90">Acompanhe em tempo real os dados da gestão pública.</p>
              </div>
              <Link to="/" className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors text-white">
                <span className="material-symbols-outlined">home</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Highlight Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            {label: 'Total Registros', value: total, icon: BarChart3},
            {label: 'Resolvidos', value: resolved, icon: CheckCircle2},
            {label: 'Em Andamento', value: inProgress, icon: Clock},
            {label: 'Taxa de Resolução', value: `${resolutionRate}%`, icon: TrendingUp},
          ].map(({label, value, icon: Icon}) => (
            <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
              <Icon className="w-6 h-6 mb-2 text-teal-600 opacity-90" />
              <p className="text-2xl font-black text-slate-800">{value}</p>
              <p className="text-[13px] font-medium text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* SLA Info */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border border-slate-200 shadow-sm rounded-xl">
            <CardContent className="p-5 text-center">
              <Clock className="w-8 h-8 mx-auto mb-3 text-teal-600" />
              <p className="text-3xl font-black text-slate-800">{Math.round(avgHours)}h</p>
              <p className="text-[13px] font-semibold text-slate-500 mt-1">Tempo médio de resolução</p>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 shadow-sm rounded-xl">
            <CardContent className="p-5 text-center">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-3 text-green-600" />
              <p className="text-3xl font-black text-green-600">{resolutionRate}%</p>
              <p className="text-[13px] font-semibold text-slate-500 mt-1">Índice de resolução geral</p>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 shadow-sm rounded-xl">
            <CardContent className="p-5 text-center">
              <MapPin className="w-8 h-8 mx-auto mb-3 text-orange-500" />
              <p className="text-3xl font-black text-orange-500">{open}</p>
              <p className="text-[13px] font-semibold text-slate-500 mt-1">Aguardando atendimento (Aberto)</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Chart */}
          <Card className="border border-slate-200 shadow-sm rounded-xl">
            <CardHeader className="pb-2 border-b border-slate-100">
              <CardTitle className="text-[15px] font-bold text-slate-800">Ocorrências por Categoria</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={catData}>
                  <XAxis dataKey="name" tick={{fontSize: 11, fill: '#64748b'}} tickLine={false} axisLine={false} />
                  <YAxis tick={{fontSize: 11, fill: '#64748b'}} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="total" name="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resolvidos" name="Resolvidos" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Map */}
          <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-white z-10 relative">
              <CardTitle className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-600" /> Mapa Público
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <OccurrenceMap occurrences={occurrences} height="295px" zoom={12} privacyMode />
            </CardContent>
          </Card>
        </div>

        {/* List */}
        <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50 flex flex-row items-center justify-between">
            <CardTitle className="text-[15px] font-bold text-slate-800">Ocorrências Recentes</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-9 bg-white border border-slate-200 hover:border-slate-300 rounded-[10px] text-[13px] font-medium text-slate-700 shadow-sm transition-colors">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                <SelectItem value="all" className="text-[13px]">Todos</SelectItem>
                {PUBLIC_STATUS_OPTIONS.map(([k, v]) => (
                  <SelectItem key={k} value={k} className="text-[13px]">{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {pagination.pageItems.map(occ => (
                <div key={occ.id} className="flex items-start gap-4 p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-slate-800 leading-tight mb-2 truncate">
                      {occ.title || occ.description?.substring(0, 60)}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={occ.status} />
                      <CategoryBadge category={occ.category} />
                      {occ.neighborhood && (
                        <span className="text-[12px] font-medium text-slate-500 flex items-center gap-1 bg-slate-100 px-2 py-[2px] rounded-md">
                          <MapPin className="w-3 h-3" /> {occ.neighborhood}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[12px] font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-md whitespace-nowrap">
                    {format(new Date(occ.created_date), 'dd/MM/yy', {locale: ptBR})}
                  </span>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-[14px] font-medium text-slate-500">Nenhuma ocorrência encontrada para este filtro.</p>
                </div>
              )}
            </div>
            <DataPagination
              page={pagination.page}
              pageSize={pagination.pageSize}
              totalItems={pagination.totalItems}
              totalPages={pagination.totalPages}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
              itemLabel="ocorrências"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
