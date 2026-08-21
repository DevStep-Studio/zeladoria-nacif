import React, {useState, useEffect} from 'react';
import {appApi} from '@/services/app-api';
import {useAuth} from '@/lib/AuthContext';
import {useQuery} from '@tanstack/react-query';
import {Card, CardContent, CardHeader, CardTitle} from"@/components/ui/card";
import {Button} from"@/components/ui/button";
import {Input} from"@/components/ui/input";
import {Label} from"@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from"@/components/ui/select";
import {CheckCircle, Loader2, Calendar, Clock, User} from 'lucide-react';
import {toast} from"sonner";
import {format} from 'date-fns';

const SPECIALTIES = {
 clinico_geral: 'Clínico Geral', pediatria: 'Pediatria', cardiologia: 'Cardiologia',
 ortopedia: 'Ortopedia', ginecologia: 'Ginecologia', neurologia: 'Neurologia',
 psiquiatria: 'Psiquiatria', oftalmologia: 'Oftalmologia', dermatologia: 'Dermatologia',
 odontologia: 'Odontologia'
};

const TIMES = ['07:00','07:30','08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30'];

export default function AppointmentForm({preSelectedDoctor, onDone}) {
 const {user} = useAuth();
 const [step, setStep] = useState(1);
 const [loading, setLoading] = useState(false);
 const [protocol, setProtocol] = useState('');
 const [filterSpec, setFilterSpec] = useState(preSelectedDoctor?.specialty || 'all');
 const [selectedDoctor, setSelectedDoctor] = useState(preSelectedDoctor);
 const [form, setForm] = useState({
 patient_name: user?.full_name || '',
 patient_phone: user?.phone || '',
 urgency: 'media',
 appointment_type: 'presencial',
 appointment_date: '',
 appointment_time: '',
 notes: ''
});

 useEffect(() => {if (preSelectedDoctor) {setSelectedDoctor(preSelectedDoctor); setStep(2);}}, [preSelectedDoctor]);

 const {data: doctors = []} = useQuery({
 queryKey: ['health-doctors'],
 queryFn: () => appApi.entities.HealthDoctor.list('-created_date', 100),
});

 const filteredDoctors = filterSpec === 'all' ? doctors : doctors.filter(d => d.specialty === filterSpec);

 const handleSubmit = async () => {
 if (!form.appointment_date || !form.appointment_time) {toast.error('Selecione data e horário'); return;}
 setLoading(true);
 const proto =`SAU-${Date.now().toString(36).toUpperCase()}`;
 await appApi.entities.HealthAppointment.create({
 ...form,
 doctor_id: selectedDoctor.id,
 doctor_name: selectedDoctor.name,
 specialty: selectedDoctor.specialty,
 unit_name: selectedDoctor.unit_name,
 patient_email: user?.email,
 protocol: proto,
 status: 'agendado'
});
 setProtocol(proto);
 setStep(4);
 setLoading(false);
 toast.success('Consulta agendada com sucesso!');
};

 if (step === 4) return (
 <Card className="border-0 shadow-sm">
 <CardContent className="pt-10 pb-10 text-center space-y-4">
 <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
 <CheckCircle className="w-8 h-8 text-green-600" />
 </div>
 <h2 className="text-lg font-bold text-green-700">Consulta Agendada!</h2>
 <div className="bg-rose-50 rounded-xl p-4 text-sm space-y-1">
 <p className="text-muted-foreground">Protocolo</p>
 <p className="font-mono font-bold text-lg text-green-800">{protocol}</p>
 </div>
 <p className="text-xs text-muted-foreground">Guarde seu protocolo para acompanhamento</p>
 <Button className="w-full bg-rose-600 hover:bg-rose-700" onClick={() => {setStep(1); setSelectedDoctor(null); onDone?.();}}>Ver Histórico</Button>
 </CardContent>
 </Card>
 );

 return (
 <div className="space-y-4 pb-6">
 {/* Step indicator */}
 <div className="flex items-center justify-between bg-white rounded-xl shadow-sm p-3">
 {[1,2,3].map(s => (
 <div key={s} className="flex items-center gap-2">
 <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= s ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-400'}`}>{s}</div>
 <span className={`text-xs hidden sm:block ${step >= s ? 'text-rose-600 font-medium' : 'text-gray-400'}`}>{['Médico','Horário','Confirmar'][s-1]}</span>
 {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-rose-600' : 'bg-gray-200'}`} />}
 </div>
 ))}
 </div>

 {step === 1 && (
 <Card className="border-0 shadow-sm">
 <CardHeader className="pb-3"><CardTitle className="text-base">Selecionar Médico</CardTitle></CardHeader>
 <CardContent className="space-y-3">
 <Select value={filterSpec} onValueChange={setFilterSpec}>
 <SelectTrigger><SelectValue placeholder="Filtrar por especialidade" /></SelectTrigger>
 <SelectContent>
 <SelectItem value="all">Todas especialidades</SelectItem>
 {Object.entries(SPECIALTIES).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
 </SelectContent>
 </Select>
 <div className="space-y-2 max-h-80 overflow-y-auto">
 {filteredDoctors.map(d => (
 <div key={d.id} onClick={() => {setSelectedDoctor(d); setStep(2);}}
 className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedDoctor?.id === d.id ? 'border-rose-500 bg-rose-50' : 'border-transparent bg-gray-50 hover:border-rose-200'}`}>
 <p className="font-semibold text-sm">Dr(a). {d.name}</p>
 <p className="text-xs text-rose-600">{SPECIALTIES[d.specialty]}</p>
 <p className="text-xs text-muted-foreground mt-0.5">{d.unit_name} — {d.available_slots ?? 0} vagas</p>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 )}

 {step === 2 && selectedDoctor && (
 <Card className="border-0 shadow-sm">
 <CardHeader className="pb-3">
 <CardTitle className="text-base">Selecionar Horário</CardTitle>
 <p className="text-sm text-muted-foreground">Dr(a). {selectedDoctor.name} — {SPECIALTIES[selectedDoctor.specialty]}</p>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-1.5">
 <Label className="text-xs">Data da Consulta</Label>
 <Input type="date" min={format(new Date(), 'yyyy-MM-dd')} value={form.appointment_date} onChange={e => setForm(f => ({...f, appointment_date: e.target.value}))} className="h-9" />
 </div>
 <div className="space-y-1.5">
 <Label className="text-xs">Horário</Label>
 <div className="grid grid-cols-4 gap-1.5">
 {TIMES.map(t => (
 <button key={t} onClick={() => setForm(f => ({...f, appointment_time: t}))}
 className={`py-1.5 rounded-lg text-xs font-medium transition-all border ${form.appointment_time === t ? 'bg-rose-600 text-white border-rose-600' : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-rose-300'}`}>
 {t}
 </button>
 ))}
 </div>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div className="space-y-1.5">
 <Label className="text-xs">Urgência</Label>
 <Select value={form.urgency} onValueChange={v => setForm(f => ({...f, urgency: v}))}>
 <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
 <SelectContent>
 <SelectItem value="baixa">Baixa</SelectItem>
 <SelectItem value="media">Média</SelectItem>
 <SelectItem value="alta">Alta</SelectItem>
 <SelectItem value="urgente">Urgente</SelectItem>
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-1.5">
 <Label className="text-xs">Tipo</Label>
 <Select value={form.appointment_type} onValueChange={v => setForm(f => ({...f, appointment_type: v}))}>
 <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
 <SelectContent>
 <SelectItem value="presencial">Presencial</SelectItem>
 <SelectItem value="teleconsulta">Teleconsulta</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>
 <Button className="w-full bg-rose-600 hover:bg-rose-700" onClick={() => {if (!form.appointment_date || !form.appointment_time) {toast.error('Selecione data e horário'); return;} setStep(3);}}>
 Continuar
 </Button>
 </CardContent>
 </Card>
 )}

 {step === 3 && (
 <Card className="border-0 shadow-sm">
 <CardHeader className="pb-3"><CardTitle className="text-base">Confirmar Agendamento</CardTitle></CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-1.5">
 <Label className="text-xs">Seu nome</Label>
 <Input value={form.patient_name} onChange={e => setForm(f => ({...f, patient_name: e.target.value}))} className="h-9" placeholder="Nome completo" />
 </div>
 <div className="space-y-1.5">
 <Label className="text-xs">Telefone</Label>
 <Input value={form.patient_phone} onChange={e => setForm(f => ({...f, patient_phone: e.target.value}))} className="h-9" placeholder="(00) 00000-0000" />
 </div>
 <div className="bg-rose-50 rounded-xl p-3 space-y-1.5 text-sm">
 <div className="flex items-center gap-2"><User className="w-4 h-4 text-rose-600" /><span className="font-medium">Dr(a). {selectedDoctor?.name}</span></div>
 <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-rose-600" /><span>{form.appointment_date}</span></div>
 <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-rose-600" /><span>{form.appointment_time}</span></div>
 </div>
 <Button className="w-full bg-rose-600 hover:bg-rose-700" onClick={handleSubmit} disabled={loading}>
 {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Agendando...</> : 'Confirmar Agendamento'}
 </Button>
 <Button variant="outline" className="w-full" onClick={() => setStep(2)}>Voltar</Button>
 </CardContent>
 </Card>
 )}
 </div>
 );
}