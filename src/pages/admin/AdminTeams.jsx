import React, {useState} from 'react';
import {base44} from '@/api/base44Client';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {Card, CardContent} from"@/components/ui/card";
import {Button} from"@/components/ui/button";
import {Input} from"@/components/ui/input";
import {Label} from"@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from"@/components/ui/select";
import {Badge} from"@/components/ui/badge";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from"@/components/ui/dialog";
import {Plus, Users, Phone, Trash2} from 'lucide-react';
import {toast} from"sonner";

const TEAM_STATUS = {
 disponivel: {label: 'Disponível', color: 'bg-green-100 text-green-700'},
 em_campo: {label: 'Em Campo', color: 'bg-blue-100 text-blue-700'},
 indisponivel: {label: 'Indisponível', color: 'bg-slate-100 text-slate-600'},
};

export default function AdminTeams() {
 const [showForm, setShowForm] = useState(false);
 const [form, setForm] = useState({name: '', department: '', leader: '', phone: '', members_count: 1});
 const queryClient = useQueryClient();

 const {data: teams = [], isLoading} = useQuery({
 queryKey: ['teams'],
 queryFn: () => base44.entities.Team.list('-created_date'),
});

 const createMutation = useMutation({
 mutationFn: (data) => base44.entities.Team.create(data),
 onSuccess: () => {
 queryClient.invalidateQueries({queryKey: ['teams']});
 setShowForm(false);
 setForm({name: '', department: '', leader: '', phone: '', members_count: 1});
 toast.success('Equipe criada!');
},
});

 const updateMutation = useMutation({
 mutationFn: ({id, data}) => base44.entities.Team.update(id, data),
 onSuccess: () => queryClient.invalidateQueries({queryKey: ['teams']}),
});

 const deleteMutation = useMutation({
 mutationFn: (id) => base44.entities.Team.delete(id),
 onSuccess: () => {
 queryClient.invalidateQueries({queryKey: ['teams']});
 toast.success('Equipe removida');
},
});

 return (
 <div className="space-y-4">
 <div className="flex justify-between items-center">
 <p className="text-sm text-muted-foreground">{teams.length} equipes cadastradas</p>
 <Dialog open={showForm} onOpenChange={setShowForm}>
 <DialogTrigger asChild>
 <Button size="sm" className="gap-1.5">
 <Plus className="w-4 h-4" /> Nova Equipe
 </Button>
 </DialogTrigger>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Nova Equipe</DialogTitle>
 </DialogHeader>
 <div className="space-y-3">
 <div className="space-y-1">
 <Label className="text-xs">Nome da Equipe *</Label>
 <Input value={form.name} onChange={(e) => setForm(p => ({...p, name: e.target.value}))} placeholder="Ex: Equipe Limpeza Norte" />
 </div>
 <div className="space-y-1">
 <Label className="text-xs">Setor</Label>
 <Input value={form.department} onChange={(e) => setForm(p => ({...p, department: e.target.value}))} placeholder="Ex: Limpeza Urbana" />
 </div>
 <div className="grid grid-cols-2 gap-2">
 <div className="space-y-1">
 <Label className="text-xs">Líder</Label>
 <Input value={form.leader} onChange={(e) => setForm(p => ({...p, leader: e.target.value}))} />
 </div>
 <div className="space-y-1">
 <Label className="text-xs">Telefone</Label>
 <Input value={form.phone} onChange={(e) => setForm(p => ({...p, phone: e.target.value}))} />
 </div>
 </div>
 <div className="space-y-1">
 <Label className="text-xs">Membros</Label>
 <Input type="number" min="1" value={form.members_count} onChange={(e) => setForm(p => ({...p, members_count: parseInt(e.target.value) || 1}))} />
 </div>
 <Button onClick={() => createMutation.mutate(form)} disabled={!form.name} className="w-full">
 Criar Equipe
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 </div>

 {isLoading ? (
 <div className="flex justify-center py-12">
 <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
 {teams.map(team => (
 <Card key={team.id} className="border-0 shadow-sm">
 <CardContent className="p-4">
 <div className="flex justify-between items-start mb-2">
 <div>
 <h3 className="font-semibold text-sm">{team.name}</h3>
 {team.department && <p className="text-xs text-muted-foreground">{team.department}</p>}
 </div>
 <Badge className={TEAM_STATUS[team.status || 'disponivel']?.color}>
 {TEAM_STATUS[team.status || 'disponivel']?.label}
 </Badge>
 </div>
 <div className="space-y-1 text-xs text-muted-foreground">
 {team.leader && <p>Líder: {team.leader}</p>}
 {team.phone && (
 <p className="flex items-center gap-1">
 <Phone className="w-3 h-3" /> {team.phone}
 </p>
 )}
 <p className="flex items-center gap-1">
 <Users className="w-3 h-3" /> {team.members_count || 1} membros
 </p>
 </div>
 <div className="flex gap-2 mt-3">
 <Select
 value={team.status || 'disponivel'}
 onValueChange={(v) => updateMutation.mutate({id: team.id, data: {status: v}})}
 >
 <SelectTrigger className="h-8 text-xs flex-1">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {Object.entries(TEAM_STATUS).map(([k, v]) => (
 <SelectItem key={k} value={k}>{v.label}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(team.id)}>
 <Trash2 className="w-3.5 h-3.5" />
 </Button>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 )}
 </div>
 );
}