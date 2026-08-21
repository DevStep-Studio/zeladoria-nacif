import React from 'react';
import {appApi} from '@/services/app-api';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {useAuth} from '@/lib/AuthContext';
import {Card, CardContent} from"@/components/ui/card";
import {Badge} from"@/components/ui/badge";
import {Button} from"@/components/ui/button";
import {Calendar, Clock, MapPin, X} from 'lucide-react';
import {toast} from"sonner";

const STATUS = {
 agendado: {label: 'Agendado', color: 'bg-blue-100 text-blue-700'},
 confirmado: {label: 'Confirmado', color: 'bg-green-100 text-green-700'},
 cancelado: {label: 'Cancelado', color: 'bg-red-100 text-red-700'},
 realizado: {label: 'Realizado', color: 'bg-gray-100 text-gray-700'},
 fila_espera: {label: 'Fila de Espera', color: 'bg-yellow-100 text-yellow-700'},
};

const SPECIALTIES = {
 clinico_geral: 'Clínico Geral', pediatria: 'Pediatria', cardiologia: 'Cardiologia',
 ortopedia: 'Ortopedia', ginecologia: 'Ginecologia', neurologia: 'Neurologia',
 psiquiatria: 'Psiquiatria', oftalmologia: 'Oftalmologia', dermatologia: 'Dermatologia',
 odontologia: 'Odontologia'
};

export default function MyAppointments() {
 const {user} = useAuth();
 const qc = useQueryClient();

 const {data: appointments = [], isLoading} = useQuery({
 queryKey: ['my-appointments', user?.email],
 queryFn: () => appApi.entities.HealthAppointment.filter({patient_email: user?.email}, '-created_date', 50),
 enabled: !!user?.email,
});

 const cancelMutation = useMutation({
 mutationFn: (id) => appApi.entities.HealthAppointment.update(id, {status: 'cancelado'}),
 onSuccess: () => {qc.invalidateQueries({queryKey: ['my-appointments']}); toast.success('Consulta cancelada');},
});

 if (isLoading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

 if (appointments.length === 0) return (
 <div className="text-center py-16 text-muted-foreground">
 <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
 <p>Nenhuma consulta agendada</p>
 </div>
 );

 return (
 <div className="space-y-3 pb-6">
 {appointments.map(apt => {
 const st = STATUS[apt.status] || STATUS.agendado;
 return (
 <Card key={apt.id} className="border-0 shadow-sm">
 <CardContent className="p-4">
 <div className="flex items-start justify-between mb-2">
 <div>
 <h3 className="font-semibold text-sm">Dr(a). {apt.doctor_name}</h3>
 <p className="text-xs text-blue-600">{SPECIALTIES[apt.specialty]}</p>
 </div>
 <Badge className={`text-xs border-0 ${st.color}`}>{st.label}</Badge>
 </div>
 <div className="space-y-1 text-xs text-muted-foreground">
 <div className="flex items-center gap-1.5"><Calendar className="w-3 h-3" />{apt.appointment_date}</div>
 <div className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{apt.appointment_time}</div>
 <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{apt.unit_name}</div>
 </div>
 {apt.protocol && (
 <div className="mt-2 bg-gray-50 rounded-lg px-3 py-1.5">
 <span className="text-xs text-muted-foreground">Protocolo: </span>
 <span className="text-xs font-mono font-bold">{apt.protocol}</span>
 </div>
 )}
 {(apt.status === 'agendado' || apt.status === 'confirmado') && (
 <Button variant="outline" size="sm" className="mt-3 w-full h-7 text-xs text-red-600 border-red-200 hover:bg-red-50" onClick={() => cancelMutation.mutate(apt.id)}>
 <X className="w-3 h-3 mr-1" />Cancelar Consulta
 </Button>
 )}
 </CardContent>
 </Card>
 );
})}
 </div>
 );
}