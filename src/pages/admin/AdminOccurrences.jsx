import React, {useState} from 'react';
import {base44} from '@/api/base44Client';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {useAuth} from '@/lib/AuthContext';
import {Button} from"@/components/ui/button";
import {Input} from"@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from"@/components/ui/select";
import {Search, Eye, AlertTriangle} from 'lucide-react';
import {CATEGORIES, PUBLIC_STATUS_OPTIONS, PRIORITY_CONFIG, calcSlaStatus, isClosedStatus, isResolvedStatus} from '@/lib/constants';
import {createHistoryEntry, createTimelineEvent, getProtocolNumber, getStatusLabel} from '@/lib/occurrences';
import StatusBadge from '@/components/shared/StatusBadge';
import CategoryBadge from '@/components/shared/CategoryBadge';
import SmartPriorityBadge from '@/components/shared/SmartPriorityBadge';
import SLABadge from '@/components/shared/SLABadge';
import OccurrenceDetailModal from '@/components/admin/OccurrenceDetailModal';
import {format} from 'date-fns';
import {ptBR} from 'date-fns/locale';

export default function AdminOccurrences() {
 const {user} = useAuth();
 const [statusFilter, setStatusFilter] = useState('all');
 const [categoryFilter, setCategoryFilter] = useState('all');
 const [priorityFilter, setPriorityFilter] = useState('all');
 const [slaFilter, setSlaFilter] = useState('all');
 const [search, setSearch] = useState('');
 const [selectedOcc, setSelectedOcc] = useState(null);

 const queryClient = useQueryClient();

 const {data: occurrences = [], isLoading} = useQuery({
 queryKey: ['admin-occurrences'],
 queryFn: () => base44.entities.Occurrence.list('-created_date', 200),
});

 const {data: teams = []} = useQuery({
 queryKey: ['teams'],
 queryFn: () => base44.entities.Team.list(),
});

 const {data: departments = []} = useQuery({
 queryKey: ['departments'],
 queryFn: () => base44.entities.Department.list(),
});

 const updateMutation = useMutation({
 mutationFn: /** @param {any} payload */ async (payload) => {
 const {occurrence, data} = payload;
 const now = new Date().toISOString();
 const statusChanged = data.status && data.status !== occurrence.status;
 const assignmentChanged = data.department_id !== occurrence.department_id || data.team_id !== occurrence.team_id;
 const finalData = {...data};

 if (statusChanged || assignmentChanged) {
 const descriptions = [];
 if (statusChanged) descriptions.push(`Status alterado para ${getStatusLabel(data.status)}.`);
 if (assignmentChanged) descriptions.push('Atribuição administrativa atualizada.');

 finalData.timeline = [
 ...(occurrence.timeline || []),
 createTimelineEvent({
 status: data.status || occurrence.status,
 title: statusChanged ? getStatusLabel(data.status) : 'Atribuição atualizada',
 description: descriptions.join(' '),
 actorRole: 'prefeitura',
 createdAt: now,
 }),
 ];
 finalData.change_history = [
 ...(occurrence.change_history || []),
 createHistoryEntry({
 action: statusChanged ? 'status_changed' : 'assignment_changed',
 description: descriptions.join(' '),
 actorRole: 'prefeitura',
 oldValue: statusChanged ? occurrence.status : undefined,
 newValue: statusChanged ? data.status : undefined,
 createdAt: now,
 }),
 ];
 finalData.last_public_update = now;
}

 if (isResolvedStatus(data.status)) finalData.resolved_date = finalData.resolved_date || now;
 if (!isClosedStatus(data.status) && data.status !== occurrence.status) finalData.resolution_confirmed = false;

 const updated = await base44.entities.Occurrence.update(occurrence.id, finalData);

 await base44.entities.AuditLog.create({
 user_email: user?.email || 'admin',
 action: statusChanged ? 'occurrence_status_changed' : 'occurrence_updated',
 entity_type: 'Occurrence',
 entity_id: occurrence.id,
 old_data: {status: occurrence.status, team_id: occurrence.team_id, department_id: occurrence.department_id},
 new_data: finalData,
 description: `Protocolo ${getProtocolNumber(occurrence)} atualizado no painel administrativo.`,
});

 if (statusChanged && occurrence.created_by) {
 await base44.entities.Notification.create({
 user_email: occurrence.created_by,
 title: 'Status da ocorrência atualizado',
 message: `Seu protocolo ${getProtocolNumber(occurrence)} agora está como ${getStatusLabel(data.status)}.`,
 type: 'status_update',
 occurrence_id: occurrence.id,
 priority: 'info',
});
}

 return updated;
},
 onSuccess: () => queryClient.invalidateQueries({queryKey: ['admin-occurrences']}),
});

 const filtered = occurrences.filter(o => {
 if (statusFilter !== 'all' && o.status !== statusFilter) return false;
 if (categoryFilter !== 'all' && o.category !== categoryFilter) return false;
 if (priorityFilter !== 'all' && o.priority !== priorityFilter) return false;
 if (slaFilter !== 'all') {
 const sla = calcSlaStatus(o);
 if (slaFilter === 'vencido' && sla.status !== 'vencido') return false;
 if (slaFilter === 'alerta' && !['alerta', 'critico'].includes(sla.status)) return false;
}
 if (search) {
 const s = search.toLowerCase();
 return (o.title || '').toLowerCase().includes(s) ||
 (o.description || '').toLowerCase().includes(s) ||
 (o.address || '').toLowerCase().includes(s) ||
 (o.neighborhood || '').toLowerCase().includes(s);
}
 return true;
});

 const slaVencidos = occurrences.filter(o => calcSlaStatus(o).status === 'vencido' && !isResolvedStatus(o.status)).length;

 return (
 <div className="space-y-4">
 {/* SLA Alert Banner */}
 {slaVencidos > 0 && (
 <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
 <AlertTriangle className="w-4 h-4 shrink-0" />
 <span><strong>{slaVencidos} ocorrência{slaVencidos > 1 ? 's' : ''}</strong> com SLA vencido — ação imediata necessária!</span>
 <button onClick={() => setSlaFilter('vencido')} className="ml-auto text-xs underline whitespace-nowrap">Ver agora</button>
 </div>
 )}

 {/* Filters */}
 <div className="flex flex-wrap gap-2">
 <div className="relative flex-1 min-w-[180px]">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
 </div>
 <Select value={statusFilter} onValueChange={setStatusFilter}>
 <SelectTrigger className="w-[130px]">
 <SelectValue placeholder="Status" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">Todos Status</SelectItem>
 {PUBLIC_STATUS_OPTIONS.map(([k, v]) => (
 <SelectItem key={k} value={k}>{v.label}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 <Select value={categoryFilter} onValueChange={setCategoryFilter}>
 <SelectTrigger className="w-[150px]">
 <SelectValue placeholder="Categoria" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">Todas</SelectItem>
 {Object.entries(CATEGORIES).map(([k, v]) => (
 <SelectItem key={k} value={k}>{v.label}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 <Select value={priorityFilter} onValueChange={setPriorityFilter}>
 <SelectTrigger className="w-[120px]">
 <SelectValue placeholder="Prioridade" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">Prioridade</SelectItem>
 {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
 <SelectItem key={k} value={k}>{v.label}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 <Select value={slaFilter} onValueChange={setSlaFilter}>
 <SelectTrigger className="w-[120px]">
 <SelectValue placeholder="SLA" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">Todo SLA</SelectItem>
 <SelectItem value="vencido">SLA Vencido</SelectItem>
 <SelectItem value="alerta">Em Alerta</SelectItem>
 </SelectContent>
 </Select>
 </div>

 <p className="text-sm text-muted-foreground">{filtered.length} ocorrências</p>

 {/* Table */}
 {isLoading ? (
 <div className="flex justify-center py-12">
 <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b text-left text-muted-foreground">
 <th className="p-3 font-medium">Data</th>
 <th className="p-3 font-medium">Descrição</th>
 <th className="p-3 font-medium">Categoria</th>
 <th className="p-3 font-medium">Status</th>
 <th className="p-3 font-medium">Prioridade</th>
 <th className="p-3 font-medium">SLA</th>
 <th className="p-3 font-medium">Bairro</th>
 <th className="p-3 font-medium">Ações</th>
 </tr>
 </thead>
 <tbody>
 {filtered.map(occ => (
 <tr key={occ.id} className="border-b hover:bg-muted/50 transition-colors">
 <td className="p-3 whitespace-nowrap text-xs">
 {format(new Date(occ.created_date), 'dd/MM/yy', {locale: ptBR})}
 </td>
 <td className="p-3 max-w-[200px] truncate">
 {occ.title || occ.description?.substring(0, 40)}
 </td>
 <td className="p-3"><CategoryBadge category={occ.category} /></td>
 <td className="p-3"><StatusBadge status={occ.status} /></td>
 <td className="p-3"><SmartPriorityBadge priority={occ.priority} /></td>
 <td className="p-3"><SLABadge occurrence={occ} /></td>
 <td className="p-3 text-xs">{occ.neighborhood || '-'}</td>
 <td className="p-3">
 <Button
 variant="ghost" size="sm" onClick={() => setSelectedOcc(occ)}
 >
 <Eye className="w-4 h-4" />
 </Button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}

 {selectedOcc && (
 <OccurrenceDetailModal
 occurrence={selectedOcc}
 teams={teams}
 departments={departments}
 onClose={() => setSelectedOcc(null)}
 onUpdate={(occurrence, data) => {
 updateMutation.mutate({occurrence, data});
 setSelectedOcc(null);
}}
 />
 )}
 </div>
 );
}
