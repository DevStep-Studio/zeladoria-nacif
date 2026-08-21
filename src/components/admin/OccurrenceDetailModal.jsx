import React, {useState} from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from"@/components/ui/dialog";
import {Button} from"@/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from"@/components/ui/select";
import {Textarea} from"@/components/ui/textarea";
import {Label} from"@/components/ui/label";
import {MapPin, Clock, User, Save, Sparkles} from 'lucide-react';
import {format} from 'date-fns';
import {ptBR} from 'date-fns/locale';
import StatusBadge from '@/components/shared/StatusBadge';
import CategoryBadge from '@/components/shared/CategoryBadge';
import SLABadge from '@/components/shared/SLABadge';
import {PUBLIC_STATUS_OPTIONS, PRIORITY_CONFIG, calcSmartPriority, isResolvedStatus} from '@/lib/constants';

export default function OccurrenceDetailModal({occurrence, teams, departments, onClose, onUpdate}) {
 const [status, setStatus] = useState(occurrence.status);
 const [priority, setPriority] = useState(occurrence.priority || 'media');
 const [teamId, setTeamId] = useState(occurrence.team_id || 'none');
 const [deptId, setDeptId] = useState(occurrence.department_id || 'none');
 const [notes, setNotes] = useState(occurrence.admin_notes || '');

 const handleSave = () => {
 const selectedTeam = teams.find(team => team.id === teamId);
 const selectedDepartment = departments.find(department => department.id === deptId);
 const data = {
 status,
 priority,
 team_id: teamId === 'none' ? '' : teamId,
 team_name: selectedTeam?.name || '',
 department_id: deptId === 'none' ? '' : deptId,
 department_name: selectedDepartment?.name || '',
 admin_notes: notes,
};
 if (isResolvedStatus(status)) data.resolved_date = new Date().toISOString();
 onUpdate(occurrence, data);
};

 return (
 <Dialog open onOpenChange={onClose}>
 <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
 <DialogHeader>
 <DialogTitle>{occurrence.title || 'Detalhes da Ocorrência'}</DialogTitle>
 </DialogHeader>

 <div className="space-y-4">
 {/* Photos */}
 {occurrence.photos?.length > 0 && (
 <div className="flex gap-2 overflow-x-auto">
 {occurrence.photos.map((url, i) => (
 <img key={i} src={url} alt="" className="w-32 h-24 object-cover rounded-lg shrink-0" />
 ))}
 </div>
 )}

 {/* Info */}
 <div className="flex flex-wrap gap-2">
 <StatusBadge status={occurrence.status} />
 <CategoryBadge category={occurrence.category} />
 <SLABadge occurrence={occurrence} />
 </div>

 {/* Smart Priority suggestion */}
 {!isResolvedStatus(occurrence.status) && (
 <div className="bg-primary/5 border border-primary/20 rounded-lg p-2.5 flex items-center justify-between">
 <div className="flex items-center gap-1.5 text-xs text-primary">
 <Sparkles className="w-3.5 h-3.5" />
 <span>Prioridade sugerida pela IA: <strong className="capitalize">{calcSmartPriority(occurrence)}</strong></span>
 </div>
 <button
 className="text-xs underline text-primary" onClick={() => setPriority(calcSmartPriority(occurrence))}
 >
 Aplicar
 </button>
 </div>
 )}

 <p className="text-sm">{occurrence.description}</p>

 <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
 <div className="flex items-center gap-1.5">
 <MapPin className="w-3.5 h-3.5" />
 {occurrence.address || 'Sem endereço'}
 {occurrence.neighborhood &&`- ${occurrence.neighborhood}`}
 </div>
 <div className="flex items-center gap-1.5">
 <Clock className="w-3.5 h-3.5" />
 {format(new Date(occurrence.created_date),"dd/MM/yyyy HH:mm", {locale: ptBR})}
 </div>
 <div className="flex items-center gap-1.5">
 <User className="w-3.5 h-3.5" />
 {occurrence.created_by}
 </div>
 </div>

 {/* Admin actions */}
 <div className="border-t pt-4 grid grid-cols-2 gap-3">
 <div className="space-y-1.5">
 <Label className="text-xs">Status</Label>
 <Select value={status} onValueChange={setStatus}>
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {PUBLIC_STATUS_OPTIONS.map(([k, v]) => (
 <SelectItem key={k} value={k}>{v.label}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-1.5">
 <Label className="text-xs">Prioridade</Label>
 <Select value={priority} onValueChange={setPriority}>
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
 <SelectItem key={k} value={k}>{v.label}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-1.5">
 <Label className="text-xs">Equipe</Label>
 <Select value={teamId} onValueChange={setTeamId}>
 <SelectTrigger>
 <SelectValue placeholder="Selecionar equipe" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="none">Nenhuma</SelectItem>
 {teams.map(t => (
 <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-1.5">
 <Label className="text-xs">Secretaria</Label>
 <Select value={deptId} onValueChange={setDeptId}>
 <SelectTrigger>
 <SelectValue placeholder="Encaminhar" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="none">Nenhuma</SelectItem>
 {departments.map(d => (
 <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div className="col-span-2 space-y-1.5">
 <Label className="text-xs">Notas Internas</Label>
 <Textarea
 value={notes}
 onChange={(e) => setNotes(e.target.value)}
 placeholder="Observações internas..." className="min-h-[60px]" />
 </div>
 </div>

 <Button onClick={handleSave} className="w-full gap-2">
 <Save className="w-4 h-4" />
 Salvar Alterações
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 );
}
