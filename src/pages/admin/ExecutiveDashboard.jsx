import React, {useState} from 'react';
import {appApi} from '@/services/app-api';
import {useQuery} from '@tanstack/react-query';
import {Card, CardContent, CardHeader, CardTitle} from"@/components/ui/card";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from"@/components/ui/select";
import {
 BarChart, Bar, PieChart, Pie, Cell,
 XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
 TrendingUp, Award, Target, Building2, AlertTriangle, CheckCircle2,
 Clock, Zap, Users, Activity, Heart, GraduationCap,
 TrendingDown, BarChart2, Star, Shield
} from 'lucide-react';
import {CATEGORIES, PUBLIC_STATUS_OPTIONS, calcSlaStatus, getStatusGroup, isResolvedStatus} from '@/lib/constants';
import {format, subDays, startOfDay} from 'date-fns';
import {ptBR} from 'date-fns/locale';

const COLORS = ['#2563eb', '#06b6d4', '#16a34a', '#ea580c', '#dc2626', '#7c3aed', '#d97706', '#ec4899'];

function KpiCard({label, value, sub, icon: Icon, colorClass, trend, trendUp}) {
 return (
 <Card className="border-0 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
 <CardContent className="p-0">
 <div className="p-4">
 <div className="flex items-start justify-between mb-3">
 <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
 <Icon className="w-5 h-5" />
 </div>
 {trend !== undefined && (
 <span className={`text-xs font-semibold flex items-center gap-0.5 ${trendUp ? 'text-green-600' : 'text-red-500'}`}>
 {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
 {trend}%
 </span>
 )}
 </div>
 <p className="text-2xl font-black text-foreground">{value}</p>
 <p className="text-xs font-semibold text-foreground/80 mt-0.5">{label}</p>
 {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
 </div>
 <div className={`h-1 w-full ${colorClass.replace('text-', 'bg-').replace('bg-', 'bg-').split(' ')[1] || 'bg-primary/30'}`} />
 </CardContent>
 </Card>
 );
}

export default function ExecutiveDashboard() {
 const [period, setPeriod] = useState('14');
 const [neighborhoodFilter, setNeighborhoodFilter] = useState('all');

 const {data: occurrences = []} = useQuery({
 queryKey: ['exec-occurrences'],
 queryFn: () => appApi.entities.Occurrence.list('-created_date', 1000),
});
 const {data: teams = []} = useQuery({
 queryKey: ['teams'],
 queryFn: () => appApi.entities.Team.list(),
});
 const {data: departments = []} = useQuery({
 queryKey: ['departments'],
 queryFn: () => appApi.entities.Department.list(),
});
 const {data: appointments = []} = useQuery({
 queryKey: ['exec-appointments'],
 queryFn: () => appApi.entities.HealthAppointment.list('-created_date', 500),
});
 const {data: enrollments = []} = useQuery({
 queryKey: ['exec-enrollments'],
 queryFn: () => appApi.entities.SchoolEnrollment.list('-created_date', 500),
});
 const {data: schools = []} = useQuery({
 queryKey: ['exec-schools'],
 queryFn: () => appApi.entities.School.list(),
});
 const {data: doctors = []} = useQuery({
 queryKey: ['exec-doctors'],
 queryFn: () => appApi.entities.HealthDoctor.list(),
});

 const days = parseInt(period);

 // Daily trend
 const dailyData = Array.from({length: days}, (_, i) => {
 const day = subDays(new Date(), days - 1 - i);
 const dayStr = format(day, 'dd/MM', {locale: ptBR});
 const dayStart = startOfDay(day);
 const dayEnd = new Date(dayStart.getTime() + 86400000);
 const created = occurrences.filter(o => {const d = new Date(o.created_date); return d >= dayStart && d < dayEnd;}).length;
 const resolved = occurrences.filter(o => {if (!o.resolved_date) return false; const d = new Date(o.resolved_date); return d >= dayStart && d < dayEnd;}).length;
 return {day: dayStr, abertas: created, resolvidas: resolved};
});

 // Neighborhood data
 const neighborhoodMap = {};
 occurrences.forEach(o => {
 if (o.neighborhood) neighborhoodMap[o.neighborhood] = (neighborhoodMap[o.neighborhood] || 0) + 1;
});
 const topNeighborhoods = Object.entries(neighborhoodMap).map(([name, total]) => ({name, total})).sort((a, b) => b.total - a.total).slice(0, 8);

 // Category data
 const catData = Object.entries(CATEGORIES).map(([key, cat]) => ({
 name: cat.label.length > 12 ? cat.label.substring(0, 12) + '…' : cat.label,
 value: occurrences.filter(o => o.category === key).length,
 fullName: cat.label,
})).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

 // SLA
 const nonResolved = occurrences.filter(o => !isResolvedStatus(o.status));
 const slaOk = nonResolved.filter(o => calcSlaStatus(o).status === 'ok').length;
 const slaAlert = nonResolved.filter(o => ['alerta', 'critico'].includes(calcSlaStatus(o).status)).length;
 const slaVencido = nonResolved.filter(o => calcSlaStatus(o).status === 'vencido').length;
 const slaData = [
 {name: 'No Prazo', value: slaOk, fill: '#16a34a'},
 {name: 'Em Alerta', value: slaAlert, fill: '#ea580c'},
 {name: 'Vencido', value: slaVencido, fill: '#dc2626'},
 ].filter(d => d.value > 0);

 // Core metrics
 const total = occurrences.length;
 const resolved = occurrences.filter(o => isResolvedStatus(o.status)).length;
 const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
 const resolvedWithTime = occurrences.filter(o => isResolvedStatus(o.status) && o.resolved_date);
 const avgResolutionHours = resolvedWithTime.length > 0
 ? resolvedWithTime.reduce((s, o) => s + (new Date(o.resolved_date) - new Date(o.created_date)) / 3600000, 0) / resolvedWithTime.length : 0;
 const openOccurrences = occurrences.filter(o => getStatusGroup(o.status) === 'abertas').length;
 const inProgress = occurrences.filter(o => getStatusGroup(o.status) === 'andamento').length;

 // Health metrics
 const totalAppoints = appointments.length;
 const pendingAppoints = appointments.filter(a => a.status === 'agendado').length;
 const totalDoctors = doctors.length;
 const availDoctors = doctors.filter(d => d.status === 'disponivel').length;
 const specialtyData = {};
 appointments.forEach(a => {if (a.specialty) specialtyData[a.specialty] = (specialtyData[a.specialty] || 0) + 1;});
 const topSpecialties = Object.entries(specialtyData).map(([k, v]) => ({name: k, value: v})).sort((a, b) => b.value - a.value).slice(0, 5);

 // Education metrics
 const totalEnroll = enrollments.length;
 const approvedEnroll = enrollments.filter(e => ['aprovada', 'matriculado'].includes(e.status)).length;
 const pendingEnroll = enrollments.filter(e => e.status === 'pendente').length;
 const waitlistEnroll = enrollments.filter(e => e.status === 'fila_espera').length;
 const totalSchoolSlots = schools.reduce((s, sc) => s + (sc.total_slots || 0), 0);
 const availSchoolSlots = schools.reduce((s, sc) => s + (sc.available_slots || 0), 0);
 const occupancyRate = totalSchoolSlots > 0 ? Math.round(((totalSchoolSlots - availSchoolSlots) / totalSchoolSlots) * 100) : 0;

 // Team productivity
 const teamData = teams.map(t => ({
 name: t.name?.substring(0, 10) || 'Equipe',
 status: t.status === 'disponivel' ? 1 : t.status === 'em_campo' ? 2 : 0,
 label: t.status === 'disponivel' ? 'Disponível' : t.status === 'em_campo' ? 'Em Campo' : 'Indisponível',
}));

 const statusBreakdown = PUBLIC_STATUS_OPTIONS.map(([key, cfg]) => ({
 name: cfg.label,
 value: occurrences.filter(o => o.status === key).length,
 fill: cfg.markerColor || '#7c3aed',
})).filter(d => d.value > 0);

 return (
 <div className="space-y-6">
 {/* Header */}
 <div className="flex items-center justify-between flex-wrap gap-3">
 <div>
 <h2 className="text-xl font-black flex items-center gap-2">
 <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
 <BarChart2 className="w-4 h-4 text-white" />
 </div>
 Dashboard Executivo
 </h2>
 <p className="text-sm text-muted-foreground">Visão estratégica — gestão municipal inteligente</p>
 </div>
 <Select value={period} onValueChange={setPeriod}>
 <SelectTrigger className="w-36 h-8 text-xs">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="7">Últimos 7 dias</SelectItem>
 <SelectItem value="14">Últimos 14 dias</SelectItem>
 <SelectItem value="30">Últimos 30 dias</SelectItem>
 </SelectContent>
 </Select>
 </div>

 {/* === OCORRÊNCIAS KPIs === */}
 <div>
 <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
 <AlertTriangle className="w-3.5 h-3.5 text-orange-500" /> Ocorrências Urbanas
 </h3>
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
 <KpiCard label="Total Ocorrências" value={total} sub="histórico completo" icon={AlertTriangle} colorClass="text-blue-600 bg-blue-100" />
 <KpiCard label="Taxa de Resolução" value={`${resolutionRate}%`} sub={`${resolved} resolvidas`} icon={Target} colorClass="text-green-600 bg-green-100" trendUp={resolutionRate > 60} trend={resolutionRate} />
 <KpiCard label="Tempo Médio" value={`${Math.round(avgResolutionHours)}h`} sub="para resolução" icon={Clock} colorClass="text-purple-600 bg-purple-100" />
 <KpiCard label="OS Abertas" value={openOccurrences} sub="aguardando análise" icon={Activity} colorClass={openOccurrences > 10 ?"text-red-600 bg-red-100":"text-green-600 bg-green-100"} />
 <KpiCard label="Em Andamento" value={inProgress} sub="equipes atuando" icon={Zap} colorClass="text-orange-600 bg-orange-100" />
 <KpiCard label="SLA Vencidos" value={slaVencido} sub="requerem ação" icon={Shield} colorClass={slaVencido > 0 ?"text-red-600 bg-red-100":"text-green-600 bg-green-100"} />
 </div>
 </div>

 {/* === SAÚDE KPIs === */}
 <div>
 <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
 <Heart className="w-3.5 h-3.5 text-red-500" /> Saúde Pública
 </h3>
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
 <KpiCard label="Consultas Agendadas" value={totalAppoints} sub="total histórico" icon={Heart} colorClass="text-red-600 bg-red-100" />
 <KpiCard label="Ag. Pendentes" value={pendingAppoints} sub="a confirmar" icon={Clock} colorClass="text-orange-600 bg-orange-100" />
 <KpiCard label="Médicos Ativos" value={availDoctors} sub={`de ${totalDoctors} total`} icon={Users} colorClass="text-cyan-600 bg-cyan-100" />
 <KpiCard label="Fila de Espera" value={appointments.filter(a => a.status === 'fila_espera').length} sub="aguardando vaga" icon={Activity} colorClass="text-yellow-600 bg-yellow-100" />
 <KpiCard label="Realizadas" value={appointments.filter(a => a.status === 'realizado').length} sub="consultas concluídas" icon={CheckCircle2} colorClass="text-green-600 bg-green-100" />
 <KpiCard label="Canceladas" value={appointments.filter(a => a.status === 'cancelado').length} sub="este período" icon={AlertTriangle} colorClass="text-gray-600 bg-gray-100" />
 </div>
 </div>

 {/* === EDUCAÇÃO KPIs === */}
 <div>
 <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
 <GraduationCap className="w-3.5 h-3.5 text-indigo-500" /> Educação
 </h3>
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
 <KpiCard label="Matrículas Total" value={totalEnroll} sub="todas as solicitações" icon={GraduationCap} colorClass="text-indigo-600 bg-indigo-100" />
 <KpiCard label="Aprovadas" value={approvedEnroll} sub="matrículas confirmadas" icon={CheckCircle2} colorClass="text-green-600 bg-green-100" />
 <KpiCard label="Pendentes" value={pendingEnroll} sub="aguardando análise" icon={Clock} colorClass="text-yellow-600 bg-yellow-100" />
 <KpiCard label="Fila de Espera" value={waitlistEnroll} sub="sem vaga ainda" icon={Activity} colorClass="text-orange-600 bg-orange-100" />
 <KpiCard label="Ocupação Escolas" value={`${occupancyRate}%`} sub={`${availSchoolSlots} vagas livres`} icon={Building2} colorClass="text-blue-600 bg-blue-100" />
 <KpiCard label="Escolas" value={schools.length} sub="unidades ativas" icon={Star} colorClass="text-purple-600 bg-purple-100" />
 </div>
 </div>

 {/* Charts Row 1 */}
 <div className="grid lg:grid-cols-2 gap-4">
 {/* Daily Trend */}
 <Card className="border-0 shadow-sm">
 <CardHeader className="pb-2">
 <CardTitle className="text-sm flex items-center gap-2">
 <TrendingUp className="w-4 h-4 text-primary" />
 Tendência de Ocorrências ({period} dias)
 </CardTitle>
 </CardHeader>
 <CardContent>
 <ResponsiveContainer width="100%" height={200}>
 <AreaChart data={dailyData}>
 <XAxis dataKey="day" tick={{fontSize: 10}} />
 <YAxis tick={{fontSize: 10}} />
 <Tooltip contentStyle={{fontSize: 12}} />
 <Area type="monotone" dataKey="abertas" stroke="#2563eb" fill="#2563eb" fillOpacity={0.08} strokeWidth={2} name="Abertas" />
 <Area type="monotone" dataKey="resolvidas" stroke="#16a34a" fill="#16a34a" fillOpacity={0.08} strokeWidth={2} name="Resolvidas" />
 </AreaChart>
 </ResponsiveContainer>
 </CardContent>
 </Card>

 {/* Category Bar */}
 <Card className="border-0 shadow-sm">
 <CardHeader className="pb-2">
 <CardTitle className="text-sm flex items-center gap-2">
 <BarChart2 className="w-4 h-4 text-primary" />
 Por Categoria
 </CardTitle>
 </CardHeader>
 <CardContent>
 <ResponsiveContainer width="100%" height={200}>
 <BarChart data={catData.slice(0, 7)} layout="vertical">
 <XAxis type="number" tick={{fontSize: 10}} />
 <YAxis dataKey="name" type="category" width={95} tick={{fontSize: 10}} />
 <Tooltip contentStyle={{fontSize: 12}} />
 <Bar dataKey="value" name="Qtd" radius={[0, 4, 4, 0]}>
 {catData.slice(0, 7).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
 </Bar>
 </BarChart>
 </ResponsiveContainer>
 </CardContent>
 </Card>
 </div>

 {/* Charts Row 2 */}
 <div className="grid lg:grid-cols-3 gap-4">
 {/* SLA Donut */}
 <Card className="border-0 shadow-sm">
 <CardHeader className="pb-2">
 <CardTitle className="text-sm">Conformidade SLA</CardTitle>
 </CardHeader>
 <CardContent>
 <ResponsiveContainer width="100%" height={180}>
 <PieChart>
 <Pie data={slaData.length > 0 ? slaData : [{name: 'Sem dados', value: 1, fill: '#e5e7eb'}]}
 cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value">
 {(slaData.length > 0 ? slaData : [{fill: '#e5e7eb'}]).map((e, i) => <Cell key={i} fill={e.fill} />)}
 </Pie>
 <Tooltip contentStyle={{fontSize: 11}} />
 </PieChart>
 </ResponsiveContainer>
 <div className="flex flex-wrap justify-center gap-3 mt-1">
 {slaData.map(d => (
 <div key={d.name} className="flex items-center gap-1 text-xs">
 <div className="w-2 h-2 rounded-full" style={{background: d.fill}} />
 {d.name}: <strong>{d.value}</strong>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>

 {/* Status Breakdown */}
 <Card className="border-0 shadow-sm">
 <CardHeader className="pb-2">
 <CardTitle className="text-sm">Status das OS</CardTitle>
 </CardHeader>
 <CardContent>
 <ResponsiveContainer width="100%" height={180}>
 <PieChart>
 <Pie data={statusBreakdown.length > 0 ? statusBreakdown : [{name: 'Vazio', value: 1, fill: '#e5e7eb'}]}
 cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({name, percent}) => percent > 0.08 ?`${(percent * 100).toFixed(0)}%`: ''} labelLine={false}>
 {statusBreakdown.map((e, i) => <Cell key={i} fill={e.fill} />)}
 </Pie>
 <Tooltip contentStyle={{fontSize: 11}} />
 </PieChart>
 </ResponsiveContainer>
 <div className="flex flex-wrap justify-center gap-2 mt-1">
 {statusBreakdown.map(d => (
 <div key={d.name} className="flex items-center gap-1 text-xs">
 <div className="w-2 h-2 rounded-full" style={{background: d.fill}} />
 {d.name}: <strong>{d.value}</strong>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>

 {/* Neighborhood Ranking */}
 <Card className="border-0 shadow-sm">
 <CardHeader className="pb-2">
 <CardTitle className="text-sm flex items-center gap-2">
 <Award className="w-4 h-4 text-yellow-500" />
 Ranking de Bairros
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-2">
 {topNeighborhoods.slice(0, 6).map(({name, total: count}, i) => (
 <div key={name}>
 <div className="flex items-center justify-between text-xs mb-1">
 <div className="flex items-center gap-2">
 <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center
 ${i === 0 ? 'bg-red-500 text-white' : i === 1 ? 'bg-orange-400 text-white' : i === 2 ? 'bg-yellow-400 text-white' : 'bg-muted text-muted-foreground'}`}>
 {i + 1}
 </span>
 <span className="truncate max-w-[100px] font-medium">{name}</span>
 </div>
 <span className="font-bold text-muted-foreground">{count}</span>
 </div>
 <div className="h-1.5 bg-muted rounded-full overflow-hidden">
 <div className="h-full rounded-full bg-primary/60 transition-all" style={{width:`${(count / (topNeighborhoods[0]?.total || 1)) * 100}%`}} />
 </div>
 </div>
 ))}
 {topNeighborhoods.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sem dados de bairro</p>}
 </CardContent>
 </Card>
 </div>

 {/* Health specialties + Education bar */}
 <div className="grid lg:grid-cols-2 gap-4">
 <Card className="border-0 shadow-sm">
 <CardHeader className="pb-2">
 <CardTitle className="text-sm flex items-center gap-2">
 <Heart className="w-4 h-4 text-red-500" />
 Especialidades Mais Procuradas
 </CardTitle>
 </CardHeader>
 <CardContent>
 {topSpecialties.length > 0 ? (
 <ResponsiveContainer width="100%" height={160}>
 <BarChart data={topSpecialties}>
 <XAxis dataKey="name" tick={{fontSize: 10}} />
 <YAxis tick={{fontSize: 10}} />
 <Tooltip contentStyle={{fontSize: 11}} />
 <Bar dataKey="value" name="Consultas" radius={[4, 4, 0, 0]}>
 {topSpecialties.map((_, i) => <Cell key={i} fill={['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'][i]} />)}
 </Bar>
 </BarChart>
 </ResponsiveContainer>
 ) : (
 <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">Nenhuma consulta ainda</div>
 )}
 </CardContent>
 </Card>

 <Card className="border-0 shadow-sm">
 <CardHeader className="pb-2">
 <CardTitle className="text-sm flex items-center gap-2">
 <GraduationCap className="w-4 h-4 text-indigo-500" />
 Status das Matrículas
 </CardTitle>
 </CardHeader>
 <CardContent>
 {enrollments.length > 0 ? (() => {
 const data = [
 {name: 'Pendente', value: pendingEnroll, fill: '#eab308'},
 {name: 'Aprovada', value: approvedEnroll, fill: '#22c55e'},
 {name: 'Fila Espera', value: waitlistEnroll, fill: '#f97316'},
 {name: 'Recusada', value: enrollments.filter(e => e.status === 'recusada').length, fill: '#ef4444'},
 ].filter(d => d.value > 0);
 return (
 <ResponsiveContainer width="100%" height={160}>
 <PieChart>
 <Pie data={data} cx="50%" cy="50%" outerRadius={65} dataKey="value" label={({name, percent}) =>`${name} ${(percent * 100).toFixed(0)}%`} labelLine={true} style={{fontSize: 10}}>
 {data.map((e, i) => <Cell key={i} fill={e.fill} />)}
 </Pie>
 <Tooltip contentStyle={{fontSize: 11}} />
 </PieChart>
 </ResponsiveContainer>
 );
})() : (
 <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">Nenhuma matrícula ainda</div>
 )}
 </CardContent>
 </Card>
 </div>

 {/* Teams + Departments */}
 <div className="grid lg:grid-cols-2 gap-4">
 <Card className="border-0 shadow-sm">
 <CardHeader className="pb-2">
 <CardTitle className="text-sm flex items-center gap-2">
 <Users className="w-4 h-4 text-primary" />
 Equipes em Campo
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="space-y-2">
 {teams.slice(0, 6).map(t => (
 <div key={t.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
 <div className="flex items-center gap-2">
 <div className={`w-2 h-2 rounded-full ${t.status === 'disponivel' ? 'bg-green-500' : t.status === 'em_campo' ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`} />
 <span className="text-xs font-medium">{t.name}</span>
 </div>
 <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${t.status === 'disponivel' ? 'bg-green-100 text-green-700' : t.status === 'em_campo' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
 {t.status === 'disponivel' ? 'Disponível' : t.status === 'em_campo' ? 'Em Campo' : 'Indisponível'}
 </span>
 </div>
 ))}
 {teams.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma equipe cadastrada</p>}
 </div>
 </CardContent>
 </Card>

 <Card className="border-0 shadow-sm">
 <CardHeader className="pb-2">
 <CardTitle className="text-sm flex items-center gap-2">
 <Building2 className="w-4 h-4 text-primary" />
 Secretarias / Departamentos
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="space-y-2">
 {departments.slice(0, 6).map((dep, i) => {
 const depOcc = occurrences.filter(o => o.department_id === dep.id).length;
 return (
 <div key={dep.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
 <div className="flex items-center gap-2">
 <div className="w-2 h-2 rounded-full" style={{background: COLORS[i % COLORS.length]}} />
 <span className="text-xs font-medium truncate max-w-[160px]">{dep.name}</span>
 </div>
 <span className="text-xs font-bold text-muted-foreground">{depOcc} OS</span>
 </div>
 );
})}
 {departments.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma secretaria cadastrada</p>}
 </div>
 </CardContent>
 </Card>
 </div>
 </div>
 );
}
