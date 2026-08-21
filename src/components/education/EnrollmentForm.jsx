import React, {useState, useEffect} from 'react';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/lib/AuthContext';
import {useQuery} from '@tanstack/react-query';
import {Card, CardContent, CardHeader, CardTitle} from"@/components/ui/card";
import {Button} from"@/components/ui/button";
import {Input} from"@/components/ui/input";
import {Label} from"@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from"@/components/ui/select";
import {CheckCircle, Loader2, Upload} from 'lucide-react';
import {toast} from"sonner";

const GRADES = ['Creche (0-3 anos)','Pré-escola (4-5 anos)','1º ano','2º ano','3º ano','4º ano','5º ano','6º ano','7º ano','8º ano','9º ano','1º médio','2º médio','3º médio'];

export default function EnrollmentForm({preSelectedSchool, onDone}) {
 const {user} = useAuth();
 const [step, setStep] = useState(1);
 const [loading, setLoading] = useState(false);
 const [protocol, setProtocol] = useState('');
 const [selectedSchool, setSelectedSchool] = useState(preSelectedSchool);
 const [form, setForm] = useState({
 student_name: '',
 student_age: '',
 grade_desired: '',
 shift: '',
 guardian_name: user?.full_name || '',
 guardian_phone: user?.phone || '',
 guardian_email: user?.email || '',
 address: '',
 neighborhood: '',
 student_doc_url: '',
 residence_proof_url: ''
});
 const [uploadingDoc, setUploadingDoc] = useState(false);
 const [uploadingProof, setUploadingProof] = useState(false);

 useEffect(() => {if (preSelectedSchool) {setSelectedSchool(preSelectedSchool); setStep(2);}}, [preSelectedSchool]);

 const {data: schools = []} = useQuery({
 queryKey: ['schools'],
 queryFn: () => base44.entities.School.list('-created_date', 100),
});

 const handleUpload = async (e, field, setUploading) => {
 const file = e.target.files?.[0];
 if (!file) return;
 setUploading(true);
 const {file_url} = await base44.integrations.Core.UploadFile({file});
 setForm(f => ({...f, [field]: file_url}));
 setUploading(false);
 toast.success('Arquivo enviado!');
};

 const handleSubmit = async () => {
 if (!form.student_name || !form.grade_desired || !form.shift || !form.guardian_name || !form.guardian_phone) {
 toast.error('Preencha todos os campos obrigatórios');
 return;
}
 setLoading(true);
 const proto =`EDU-${Date.now().toString(36).toUpperCase()}`;
 await base44.entities.SchoolEnrollment.create({
 ...form,
 student_age: Number(form.student_age),
 school_id: selectedSchool?.id || '',
 school_name: selectedSchool?.name || '',
 protocol: proto,
 status: 'pendente'
});
 setProtocol(proto);
 setStep(4);
 setLoading(false);
 toast.success('Solicitação enviada com sucesso!');
};

 if (step === 4) return (
 <Card className="border-0 shadow-sm">
 <CardContent className="pt-10 pb-10 text-center space-y-4">
 <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
 <CheckCircle className="w-8 h-8 text-blue-600" />
 </div>
 <h2 className="text-lg font-bold text-blue-600">Solicitação Enviada!</h2>
 <div className="bg-blue-500/5 rounded-xl p-4 text-sm space-y-1">
 <p className="text-muted-foreground">Protocolo</p>
 <p className="font-mono font-bold text-lg text-blue-600">{protocol}</p>
 </div>
 <p className="text-xs text-muted-foreground">Acompanhe sua solicitação na aba"Acompanhar"</p>
 <Button className="w-full bg-blue-500 hover:bg-blue-500/90" onClick={() => {setStep(1); setSelectedSchool(null); onDone?.();}}>
 Ver Acompanhamento
 </Button>
 </CardContent>
 </Card>
 );

 return (
 <div className="space-y-4 pb-6">
 <div className="flex items-center justify-between bg-white rounded-xl shadow-sm p-3">
 {[1,2,3].map(s => (
 <div key={s} className="flex items-center gap-2">
 <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= s ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'}`}>{s}</div>
 <span className={`text-xs hidden sm:block ${step >= s ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>{['Escola','Aluno','Confirmar'][s-1]}</span>
 {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-blue-500' : 'bg-gray-200'}`} />}
 </div>
 ))}
 </div>

 {step === 1 && (
 <Card className="border-0 shadow-sm">
 <CardHeader className="pb-3"><CardTitle className="text-base">Selecionar Escola</CardTitle></CardHeader>
 <CardContent>
 <div className="space-y-2 max-h-96 overflow-y-auto">
 {schools.map(s => (
 <div key={s.id} onClick={() => {setSelectedSchool(s); setStep(2);}}
 className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedSchool?.id === s.id ? 'border-blue-500 bg-blue-500/5' : 'border-transparent bg-gray-50 hover:border-blue-500/30'}`}>
 <p className="font-semibold text-sm">{s.name}</p>
 <p className="text-xs text-muted-foreground mt-0.5">{s.neighborhood} — {s.available_slots ?? 0} vagas</p>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 )}

 {step === 2 && (
 <Card className="border-0 shadow-sm">
 <CardHeader className="pb-3">
 <CardTitle className="text-base">Dados do Aluno</CardTitle>
 {selectedSchool && <p className="text-sm text-muted-foreground">{selectedSchool.name}</p>}
 </CardHeader>
 <CardContent className="space-y-3">
 <div className="space-y-1.5">
 <Label className="text-xs">Nome do Aluno *</Label>
 <Input value={form.student_name} onChange={e => setForm(f => ({...f, student_name: e.target.value}))} placeholder="Nome completo" className="h-9" />
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div className="space-y-1.5">
 <Label className="text-xs">Idade *</Label>
 <Input type="number" min="0" max="18" value={form.student_age} onChange={e => setForm(f => ({...f, student_age: e.target.value}))} className="h-9" />
 </div>
 <div className="space-y-1.5">
 <Label className="text-xs">Série Desejada *</Label>
 <Select value={form.grade_desired} onValueChange={v => setForm(f => ({...f, grade_desired: v}))}>
 <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecionar" /></SelectTrigger>
 <SelectContent>{GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
 </Select>
 </div>
 </div>
 <div className="space-y-1.5">
 <Label className="text-xs">Turno *</Label>
 <Select value={form.shift} onValueChange={v => setForm(f => ({...f, shift: v}))}>
 <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecionar turno" /></SelectTrigger>
 <SelectContent>
 <SelectItem value="manha">Manhã</SelectItem>
 <SelectItem value="tarde">Tarde</SelectItem>
 <SelectItem value="integral">Integral</SelectItem>
 <SelectItem value="noturno">Noturno</SelectItem>
 </SelectContent>
 </Select>
 </div>
 <Button className="w-full bg-blue-500 hover:bg-blue-500/90" onClick={() => {if (!form.student_name || !form.grade_desired || !form.shift) {toast.error('Preencha os campos obrigatórios'); return;} setStep(3);}}>
 Continuar
 </Button>
 </CardContent>
 </Card>
 )}

 {step === 3 && (
 <Card className="border-0 shadow-sm">
 <CardHeader className="pb-3"><CardTitle className="text-base">Dados do Responsável</CardTitle></CardHeader>
 <CardContent className="space-y-3">
 <div className="space-y-1.5">
 <Label className="text-xs">Nome do Responsável *</Label>
 <Input value={form.guardian_name} onChange={e => setForm(f => ({...f, guardian_name: e.target.value}))} placeholder="Nome completo" className="h-9" />
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div className="space-y-1.5">
 <Label className="text-xs">Telefone *</Label>
 <Input value={form.guardian_phone} onChange={e => setForm(f => ({...f, guardian_phone: e.target.value}))} placeholder="(00) 00000-0000" className="h-9" />
 </div>
 <div className="space-y-1.5">
 <Label className="text-xs">Bairro</Label>
 <Input value={form.neighborhood} onChange={e => setForm(f => ({...f, neighborhood: e.target.value}))} placeholder="Seu bairro" className="h-9" />
 </div>
 </div>
 <div className="space-y-1.5">
 <Label className="text-xs">Endereço</Label>
 <Input value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} placeholder="Rua, número" className="h-9" />
 </div>
 {/* Document uploads */}
 <div className="space-y-2">
 <Label className="text-xs">Documento do Aluno</Label>
 <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-200 rounded-xl p-3 hover:border-blue-500/40 transition-colors">
 <Upload className="w-4 h-4 text-blue-600" />
 <span className="text-xs text-muted-foreground">{form.student_doc_url ? 'Documento enviado ✓' : uploadingDoc ? 'Enviando...' : 'Clique para enviar'}</span>
 <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => handleUpload(e, 'student_doc_url', setUploadingDoc)} disabled={uploadingDoc} />
 </label>
 </div>
 <div className="space-y-2">
 <Label className="text-xs">Comprovante de Residência</Label>
 <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-200 rounded-xl p-3 hover:border-blue-500/40 transition-colors">
 <Upload className="w-4 h-4 text-blue-600" />
 <span className="text-xs text-muted-foreground">{form.residence_proof_url ? 'Comprovante enviado ✓' : uploadingProof ? 'Enviando...' : 'Clique para enviar'}</span>
 <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => handleUpload(e, 'residence_proof_url', setUploadingProof)} disabled={uploadingProof} />
 </label>
 </div>
 <Button className="w-full bg-blue-500 hover:bg-blue-500/90" onClick={handleSubmit} disabled={loading || uploadingDoc || uploadingProof}>
 {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Enviando...</> : 'Enviar Solicitação'}
 </Button>
 <Button variant="outline" className="w-full" onClick={() => setStep(2)}>Voltar</Button>
 </CardContent>
 </Card>
 )}
 </div>
 );
}