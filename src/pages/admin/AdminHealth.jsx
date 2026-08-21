import React, {useState} from 'react';
import {appApi} from '@/services/app-api';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {Card, CardContent} from"@/components/ui/card";
import {Badge} from"@/components/ui/badge";
import {Button} from"@/components/ui/button";
import {Input} from"@/components/ui/input";
import {Label} from"@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from"@/components/ui/select";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from"@/components/ui/dialog";
import {Tabs, TabsContent, TabsList, TabsTrigger} from"@/components/ui/tabs";
import {Heart, Users, Calendar, Plus, Edit, Trash2, Clock, Activity} from 'lucide-react';
import {toast} from"sonner";

const SPECIALTIES = {
 clinico_geral: 'Clínico Geral', pediatria: 'Pediatria', cardiologia: 'Cardiologia',
 ortopedia: 'Ortopedia', ginecologia: 'Ginecologia', neurologia: 'Neurologia',
 psiquiatria: 'Psiquiatria', oftalmologia: 'Oftalmologia', dermatologia: 'Dermatologia',
 odontologia: 'Odontologia'
};

const APT_STATUS = {
 agendado: 'bg-blue-100 text-blue-700', confirmado: 'bg-green-100 text-green-700',
 cancelado: 'bg-red-100 text-red-700', realizado: 'bg-gray-100 text-gray-700', fila_espera: 'bg-yellow-100 text-yellow-700'
};

function DoctorForm({doctor, onSave, onClose}) {
 const [form, setForm] = useState(doctor || {name: '', specialty: 'clinico_geral', unit_name: '', unit_address: '', neighborhood: '', schedule: '', available_slots: 10, total_slots: 20, status: 'disponivel', crm: ''});
 const f = (field, val) => setForm(p => ({...p, [field]: val}));

 return (
 <div className="space-y-3">
 <div className="grid grid-cols-2 gap-3">
 <div className="col-span-2 space-y-1"><Label className="text-xs">Nome *</Label><Input value={form.name} onChange={e => f('name', e.target.value)} className="h-9" /></div>
 <div className="space-y-1"><Label className="text-xs">Especialidade</Label>
 <Select value={form.specialty} onValueChange={v => f('specialty', v)}>
 <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
 <SelectContent>{Object.entries(SPECIALTIES).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
 </Select>
 </div>
 <div className="space-y-1"><Label className="text-xs">CRM</Label><Input value={form.crm} onChange={e => f('crm', e.target.value)} className="h-9" /></div>
 <div className="col-span-2 space-y-1"><Label className="text-xs">Unidade de Saúde *</Label><Input value={form.unit_name} onChange={e => f('unit_name', e.target.value)} className="h-9" /></div>
 <div className="col-span-2 space-y-1"><Label className="text-xs">Endereço</Label><Input value={form.unit_address} onChange={e => f('unit_address', e.target.value)} className="h-9" /></div>
 <div className="space-y-1"><Label className="text-xs">Bairro</Label><Input value={form.neighborhood} onChange={e => f('neighborhood', e.target.value)} className="h-9" /></div>
 <div className="space-y-1"><Label className="text-xs">Horário</Label><Input value={form.schedule} onChange={e => f('schedule', e.target.value)} placeholder="Seg-Sex 08:00-17:00" className="h-9" /></div>
 <div className="space-y-1"><Label className="text-xs">Vagas Disponíveis</Label><Input type="number" value={form.available_slots} onChange={e => f('available_slots', Number(e.target.value))} className="h-9" /></div>
 <div className="space-y-1"><Label className="text-xs">Total de Vagas</Label><Input type="number" value={form.total_slots} onChange={e => f('total_slots', Number(e.target.value))} className="h-9" /></div>
 <div className="col-span-2 space-y-1"><Label className="text-xs">Status</Label>
 <Select value={form.status} onValueChange={v => f('status', v)}>
 <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
 <SelectContent><SelectItem value="disponivel">Disponível</SelectItem><SelectItem value="ocupado">Ocupado</SelectItem><SelectItem value="indisponivel">Indisponível</SelectItem></SelectContent>
 </Select>
 </div>
 </div>
 <div className="flex gap-2 pt-2">
 <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => onSave(form)}>Salvar</Button>
 <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
 </div>
 </div>
 );
}

export default function AdminHealth() {
 const qc = useQueryClient();
 const [doctorModal, setDoctorModal] = useState(false);
 const [editingDoctor, setEditingDoctor] = useState(null);

 const {data: doctors = []} = useQuery({queryKey: ['health-doctors'], queryFn: () => appApi.entities.HealthDoctor.list('-created_date', 100)});
 const {data: appointments = []} = useQuery({queryKey: ['health-appointments'], queryFn: () => appApi.entities.HealthAppointment.list('-created_date', 100)});

 const saveDoctorMutation = useMutation({
 mutationFn: (form) => editingDoctor ? appApi.entities.HealthDoctor.update(editingDoctor.id, form) : appApi.entities.HealthDoctor.create(form),
 onSuccess: () => {qc.invalidateQueries({queryKey: ['health-doctors']}); setDoctorModal(false); setEditingDoctor(null); toast.success('Médico salvo!');}
});

 const deleteDoctorMutation = useMutation({
 mutationFn: (id) => appApi.entities.HealthDoctor.delete(id),
 onSuccess: () => {qc.invalidateQueries({queryKey: ['health-doctors']}); toast.success('Médico removido');}
});

 const updateAptMutation = useMutation({
 mutationFn: ({id, data}) => appApi.entities.HealthAppointment.update(id, data),
 onSuccess: () => {qc.invalidateQueries({queryKey: ['health-appointments']}); toast.success('Agendamento atualizado');}
});

 const stats = {
 totalDoctors: doctors.length,
 availableDoctors: doctors.filter(d => d.status === 'disponivel').length,
 totalApts: appointments.length,
 todayApts: appointments.filter(a => a.appointment_date === new Date().toISOString().split('T')[0]).length,
};

 return (
 <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center"><Heart className="w-5 h-5 text-blue-600" /></div>
 <div><h1 className="text-xl font-bold">Gestão de Saúde</h1><p className="text-sm text-muted-foreground">Médicos e agendamentos</p></div>
 </div>
 <Button className="bg-blue-600 hover:bg-blue-700 gap-2" onClick={() => {setEditingDoctor(null); setDoctorModal(true);}}>
 <Plus className="w-4 h-4" />Novo Médico
 </Button>
 </div>

 {/* Stats */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
 {[
 {label: 'Médicos', value: stats.totalDoctors, icon: Users, color: 'text-blue-600 bg-blue-50'},
 {label: 'Disponíveis', value: stats.availableDoctors, icon: Activity, color: 'text-green-600 bg-green-50'},
 {label: 'Agendamentos', value: stats.totalApts, icon: Calendar, color: 'text-purple-600 bg-purple-50'},
 {label: 'Hoje', value: stats.todayApts, icon: Clock, color: 'text-orange-600 bg-orange-50'},
 ].map(s => (
 <Card key={s.label} className="border-0 shadow-sm">
 <CardContent className="p-4 flex items-center gap-3">
 <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}><s.icon className="w-5 h-5" /></div>
 <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
 </CardContent>
 </Card>
 ))}
 </div>

 <Tabs defaultValue="doctors">
 <TabsList className="w-full">
 <TabsTrigger value="doctors" className="flex-1">Médicos Cadastrados</TabsTrigger>
 <TabsTrigger value="appointments" className="flex-1">Agendamentos</TabsTrigger>
 </TabsList>

 <TabsContent value="doctors" className="mt-4">
 <div className="space-y-2">
 {doctors.map(doctor => (
 <Card key={doctor.id} className="border-0 shadow-sm">
 <CardContent className="p-4 flex items-center justify-between gap-3">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center font-bold text-blue-700">{doctor.name?.[0]}</div>
 <div>
 <p className="font-semibold text-sm">Dr(a). {doctor.name}</p>
 <p className="text-xs text-blue-600">{SPECIALTIES[doctor.specialty]}</p>
 <p className="text-xs text-muted-foreground">{doctor.unit_name} — {doctor.available_slots} vagas</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {setEditingDoctor(doctor); setDoctorModal(true);}}><Edit className="w-3.5 h-3.5" /></Button>
 <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteDoctorMutation.mutate(doctor.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 </TabsContent>

 <TabsContent value="appointments" className="mt-4">
 <div className="space-y-2">
 {appointments.map(apt => (
 <Card key={apt.id} className="border-0 shadow-sm">
 <CardContent className="p-4">
 <div className="flex items-center justify-between">
 <div>
 <p className="font-semibold text-sm">{apt.patient_name}</p>
 <p className="text-xs text-muted-foreground">Dr(a). {apt.doctor_name} — {apt.appointment_date} às {apt.appointment_time}</p>
 {apt.protocol && <p className="text-xs font-mono text-gray-500 mt-0.5">{apt.protocol}</p>}
 </div>
 <div className="flex items-center gap-2">
 <Badge className={`text-xs border-0 ${APT_STATUS[apt.status] || 'bg-gray-100 text-gray-700'}`}>{apt.status}</Badge>
 {apt.status === 'agendado' && (
 <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateAptMutation.mutate({id: apt.id, data: {status: 'confirmado'}})}>Confirmar</Button>
 )}
 </div>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 </TabsContent>
 </Tabs>

 <Dialog open={doctorModal} onOpenChange={setDoctorModal}>
 <DialogContent className="max-w-md">
 <DialogHeader><DialogTitle>{editingDoctor ? 'Editar Médico' : 'Novo Médico'}</DialogTitle></DialogHeader>
 <DoctorForm doctor={editingDoctor} onSave={saveDoctorMutation.mutate} onClose={() => {setDoctorModal(false); setEditingDoctor(null);}} />
 </DialogContent>
 </Dialog>
 </div>
 );
}