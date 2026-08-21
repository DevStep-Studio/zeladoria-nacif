import React, {useState} from 'react';
import {base44} from '@/api/base44Client';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {Card, CardContent} from"@/components/ui/card";
import {Button} from"@/components/ui/button";
import {Input} from"@/components/ui/input";
import {Label} from"@/components/ui/label";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from"@/components/ui/dialog";
import {Plus, Building2, Mail, Phone, Trash2} from 'lucide-react';
import {toast} from"sonner";

export default function AdminDepartments() {
 const [showForm, setShowForm] = useState(false);
 const [form, setForm] = useState({name: '', responsible: '', email: '', phone: ''});
 const queryClient = useQueryClient();

 const {data: departments = [], isLoading} = useQuery({
 queryKey: ['departments'],
 queryFn: () => base44.entities.Department.list('-created_date'),
});

 const createMutation = useMutation({
 mutationFn: (data) => base44.entities.Department.create(data),
 onSuccess: () => {
 queryClient.invalidateQueries({queryKey: ['departments']});
 setShowForm(false);
 setForm({name: '', responsible: '', email: '', phone: ''});
 toast.success('Secretaria criada!');
},
});

 const deleteMutation = useMutation({
 mutationFn: (id) => base44.entities.Department.delete(id),
 onSuccess: () => {
 queryClient.invalidateQueries({queryKey: ['departments']});
 toast.success('Secretaria removida');
},
});

 return (
 <div className="space-y-4">
 <div className="flex justify-between items-center">
 <p className="text-sm text-muted-foreground">{departments.length} secretarias</p>
 <Dialog open={showForm} onOpenChange={setShowForm}>
 <DialogTrigger asChild>
 <Button size="sm" className="gap-1.5">
 <Plus className="w-4 h-4" /> Nova Secretaria
 </Button>
 </DialogTrigger>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Nova Secretaria</DialogTitle>
 </DialogHeader>
 <div className="space-y-3">
 <div className="space-y-1">
 <Label className="text-xs">Nome *</Label>
 <Input value={form.name} onChange={(e) => setForm(p => ({...p, name: e.target.value}))} placeholder="Ex: Sec. de Obras" />
 </div>
 <div className="space-y-1">
 <Label className="text-xs">Responsável</Label>
 <Input value={form.responsible} onChange={(e) => setForm(p => ({...p, responsible: e.target.value}))} />
 </div>
 <div className="grid grid-cols-2 gap-2">
 <div className="space-y-1">
 <Label className="text-xs">Email</Label>
 <Input value={form.email} onChange={(e) => setForm(p => ({...p, email: e.target.value}))} />
 </div>
 <div className="space-y-1">
 <Label className="text-xs">Telefone</Label>
 <Input value={form.phone} onChange={(e) => setForm(p => ({...p, phone: e.target.value}))} />
 </div>
 </div>
 <Button onClick={() => createMutation.mutate(form)} disabled={!form.name} className="w-full">
 Criar Secretaria
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
 {departments.map(dept => (
 <Card key={dept.id} className="border-0 shadow-sm">
 <CardContent className="p-4">
 <div className="flex justify-between items-start">
 <div className="flex items-start gap-3">
 <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
 <Building2 className="w-4 h-4 text-primary" />
 </div>
 <div>
 <h3 className="font-semibold text-sm">{dept.name}</h3>
 {dept.responsible && <p className="text-xs text-muted-foreground">{dept.responsible}</p>}
 <div className="mt-1 space-y-0.5">
 {dept.email && (
 <p className="text-xs text-muted-foreground flex items-center gap-1">
 <Mail className="w-3 h-3" /> {dept.email}
 </p>
 )}
 {dept.phone && (
 <p className="text-xs text-muted-foreground flex items-center gap-1">
 <Phone className="w-3 h-3" /> {dept.phone}
 </p>
 )}
 </div>
 </div>
 </div>
 <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(dept.id)}>
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