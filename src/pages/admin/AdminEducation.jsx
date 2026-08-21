import React, {useState} from 'react';
import {base44} from '@/api/base44Client';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {Card, CardContent} from"@/components/ui/card";
import {Badge} from"@/components/ui/badge";
import {Button} from"@/components/ui/button";
import {Input} from"@/components/ui/input";
import {Label} from"@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from"@/components/ui/select";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from"@/components/ui/dialog";
import {Tabs, TabsContent, TabsList, TabsTrigger} from"@/components/ui/tabs";
import {GraduationCap, Plus, Edit, Trash2, CheckCircle, XCircle} from 'lucide-react';
import {toast} from"sonner";

const ENR_STATUS = {
 pendente: 'bg-yellow-100 text-yellow-700', em_analise: 'bg-blue-100 text-blue-700',
 aprovada: 'bg-green-100 text-green-700', recusada: 'bg-red-100 text-red-700',
 fila_espera: 'bg-orange-100 text-orange-700', matriculado: 'bg-purple-100 text-purple-700'
};

function SchoolForm({school, onSave, onClose}) {
 const [form, setForm] = useState(school || {name: '', address: '', neighborhood: '', phone: '', director: '', total_slots: 100, available_slots: 100, type: 'municipal', rating: 0});
 const f = (field, val) => setForm(p => ({...p, [field]: val}));

 return (
 <div className="space-y-3">
 <div className="grid grid-cols-2 gap-3">
 <div className="col-span-2 space-y-1"><Label className="text-xs">Nome da Escola *</Label><Input value={form.name} onChange={e => f('name', e.target.value)} className="h-9" /></div>
 <div className="col-span-2 space-y-1"><Label className="text-xs">Endereço *</Label><Input value={form.address} onChange={e => f('address', e.target.value)} className="h-9" /></div>
 <div className="space-y-1"><Label className="text-xs">Bairro</Label><Input value={form.neighborhood} onChange={e => f('neighborhood', e.target.value)} className="h-9" /></div>
 <div className="space-y-1"><Label className="text-xs">Tipo</Label>
 <Select value={form.type} onValueChange={v => f('type', v)}>
 <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
 <SelectContent>
 <SelectItem value="municipal">Municipal</SelectItem><SelectItem value="estadual">Estadual</SelectItem>
 <SelectItem value="federal">Federal</SelectItem><SelectItem value="creche">Creche</SelectItem><SelectItem value="cei">CEI</SelectItem>
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-1"><Label className="text-xs">Vagas Totais</Label><Input type="number" value={form.total_slots} onChange={e => f('total_slots', Number(e.target.value))} className="h-9" /></div>
 <div className="space-y-1"><Label className="text-xs">Vagas Disponíveis</Label><Input type="number" value={form.available_slots} onChange={e => f('available_slots', Number(e.target.value))} className="h-9" /></div>
 <div className="space-y-1"><Label className="text-xs">Telefone</Label><Input value={form.phone} onChange={e => f('phone', e.target.value)} className="h-9" /></div>
 <div className="space-y-1"><Label className="text-xs">Diretor</Label><Input value={form.director} onChange={e => f('director', e.target.value)} className="h-9" /></div>
 </div>
 <div className="flex gap-2 pt-2">
 <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={() => onSave(form)}>Salvar</Button>
 <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
 </div>
 </div>
 );
}

export default function AdminEducation() {
 const qc = useQueryClient();
 const [schoolModal, setSchoolModal] = useState(false);
 const [editingSchool, setEditingSchool] = useState(null);

 const {data: schools = []} = useQuery({queryKey: ['schools'], queryFn: () => base44.entities.School.list('-created_date', 100)});
 const {data: enrollments = []} = useQuery({queryKey: ['enrollments'], queryFn: () => base44.entities.SchoolEnrollment.list('-created_date', 100)});

 const saveSchoolMutation = useMutation({
 mutationFn: (form) => editingSchool ? base44.entities.School.update(editingSchool.id, form) : base44.entities.School.create(form),
 onSuccess: () => {qc.invalidateQueries({queryKey: ['schools']}); setSchoolModal(false); setEditingSchool(null); toast.success('Escola salva!');}
});

 const deleteSchoolMutation = useMutation({
 mutationFn: (id) => base44.entities.School.delete(id),
 onSuccess: () => {qc.invalidateQueries({queryKey: ['schools']}); toast.success('Escola removida');}
});

 const updateEnrMutation = useMutation({
 mutationFn: ({id, status}) => base44.entities.SchoolEnrollment.update(id, {status}),
 onSuccess: () => {qc.invalidateQueries({queryKey: ['enrollments']}); toast.success('Status atualizado');}
});

 const totalSlots = schools.reduce((s, sc) => s + (sc.total_slots || 0), 0);
 const availSlots = schools.reduce((s, sc) => s + (sc.available_slots || 0), 0);
 const pendingEnr = enrollments.filter(e => e.status === 'pendente').length;

 return (
 <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center"><GraduationCap className="w-5 h-5 text-indigo-600" /></div>
 <div><h1 className="text-xl font-bold">Gestão Educacional</h1><p className="text-sm text-muted-foreground">Escolas e matrículas</p></div>
 </div>
 <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2" onClick={() => {setEditingSchool(null); setSchoolModal(true);}}>
 <Plus className="w-4 h-4" />Nova Escola
 </Button>
 </div>

 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
 {[
 {label: 'Escolas', value: schools.length, color: 'text-indigo-600 bg-indigo-50'},
 {label: 'Vagas Totais', value: totalSlots, color: 'text-blue-600 bg-blue-50'},
 {label: 'Disponíveis', value: availSlots, color: 'text-green-600 bg-green-50'},
 {label: 'Pendentes', value: pendingEnr, color: 'text-orange-600 bg-orange-50'},
 ].map(s => (
 <Card key={s.label} className="border-0 shadow-sm">
 <CardContent className="p-4">
 <p className={`text-2xl font-bold ${s.color.split(' ')[0]}`}>{s.value}</p>
 <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
 </CardContent>
 </Card>
 ))}
 </div>

 <Tabs defaultValue="schools">
 <TabsList className="w-full">
 <TabsTrigger value="schools" className="flex-1">Escolas</TabsTrigger>
 <TabsTrigger value="enrollments" className="flex-1">Solicitações</TabsTrigger>
 </TabsList>

 <TabsContent value="schools" className="mt-4 space-y-2">
 {schools.map(school => (
 <Card key={school.id} className="border-0 shadow-sm">
 <CardContent className="p-4 flex items-center justify-between gap-3">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center"><GraduationCap className="w-5 h-5 text-indigo-600" /></div>
 <div>
 <p className="font-semibold text-sm">{school.name}</p>
 <p className="text-xs text-muted-foreground">{school.neighborhood} — {school.available_slots}/{school.total_slots} vagas</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {setEditingSchool(school); setSchoolModal(true);}}><Edit className="w-3.5 h-3.5" /></Button>
 <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteSchoolMutation.mutate(school.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
 </div>
 </CardContent>
 </Card>
 ))}
 </TabsContent>

 <TabsContent value="enrollments" className="mt-4 space-y-2">
 {enrollments.map(enr => (
 <Card key={enr.id} className="border-0 shadow-sm">
 <CardContent className="p-4">
 <div className="flex items-start justify-between">
 <div>
 <p className="font-semibold text-sm">{enr.student_name}</p>
 <p className="text-xs text-muted-foreground">{enr.grade_desired} — {enr.school_name}</p>
 <p className="text-xs text-muted-foreground">{enr.guardian_name} / {enr.guardian_phone}</p>
 {enr.protocol && <p className="text-xs font-mono text-gray-400 mt-0.5">{enr.protocol}</p>}
 </div>
 <div className="flex flex-col items-end gap-2">
 <Badge className={`text-xs border-0 ${ENR_STATUS[enr.status] || 'bg-gray-100 text-gray-700'}`}>{enr.status.replace('_',' ')}</Badge>
 {enr.status === 'pendente' && (
 <div className="flex gap-1">
 <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => updateEnrMutation.mutate({id: enr.id, status: 'aprovada'})}><CheckCircle className="w-3 h-3 mr-1" />Aprovar</Button>
 <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-200" onClick={() => updateEnrMutation.mutate({id: enr.id, status: 'recusada'})}><XCircle className="w-3 h-3" /></Button>
 </div>
 )}
 </div>
 </div>
 </CardContent>
 </Card>
 ))}
 </TabsContent>
 </Tabs>

 <Dialog open={schoolModal} onOpenChange={setSchoolModal}>
 <DialogContent className="max-w-md">
 <DialogHeader><DialogTitle>{editingSchool ? 'Editar Escola' : 'Nova Escola'}</DialogTitle></DialogHeader>
 <SchoolForm school={editingSchool} onSave={saveSchoolMutation.mutate} onClose={() => {setSchoolModal(false); setEditingSchool(null);}} />
 </DialogContent>
 </Dialog>
 </div>
 );
}