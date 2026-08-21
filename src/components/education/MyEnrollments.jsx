import React from 'react';
import {appApi} from '@/services/app-api';
import {useQuery} from '@tanstack/react-query';
import {useAuth} from '@/lib/AuthContext';
import {Card, CardContent} from"@/components/ui/card";
import {Badge} from"@/components/ui/badge";
import {GraduationCap, MapPin, User} from 'lucide-react';

const STATUS = {
 pendente: {label: 'Pendente', color: 'bg-yellow-100 text-yellow-700'},
 em_analise: {label: 'Em Análise', color: 'bg-blue-100 text-blue-700'},
 aprovada: {label: 'Aprovada', color: 'bg-green-100 text-green-700'},
 recusada: {label: 'Recusada', color: 'bg-red-100 text-red-700'},
 fila_espera: {label: 'Fila de Espera', color: 'bg-orange-100 text-orange-700'},
 matriculado: {label: 'Matriculado', color: 'bg-purple-100 text-purple-700'},
};

export default function MyEnrollments() {
 const {user} = useAuth();

 const {data: enrollments = [], isLoading} = useQuery({
 queryKey: ['my-enrollments', user?.email],
 queryFn: () => appApi.entities.SchoolEnrollment.filter({guardian_email: user?.email}, '-created_date', 50),
 enabled: !!user?.email,
});

 if (isLoading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

 if (enrollments.length === 0) return (
 <div className="text-center py-16 text-muted-foreground">
 <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
 <p>Nenhuma solicitação de matrícula</p>
 </div>
 );

 return (
 <div className="space-y-3 pb-6">
 {enrollments.map(enr => {
 const st = STATUS[enr.status] || STATUS.pendente;
 return (
 <Card key={enr.id} className="border-0 shadow-sm">
 <CardContent className="p-4">
 <div className="flex items-start justify-between mb-2">
 <div>
 <div className="flex items-center gap-1.5">
 <User className="w-3.5 h-3.5 text-blue-600" />
 <h3 className="font-semibold text-sm">{enr.student_name}</h3>
 </div>
 <p className="text-xs text-blue-600 mt-0.5">{enr.grade_desired} — {enr.shift === 'manha' ? 'Manhã' : enr.shift === 'tarde' ? 'Tarde' : enr.shift === 'integral' ? 'Integral' : 'Noturno'}</p>
 </div>
 <Badge className={`text-xs border-0 ${st.color}`}>{st.label}</Badge>
 </div>
 {enr.school_name && (
 <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
 <MapPin className="w-3 h-3" />{enr.school_name}
 </div>
 )}
 {enr.protocol && (
 <div className="mt-2 bg-gray-50 rounded-lg px-3 py-1.5">
 <span className="text-xs text-muted-foreground">Protocolo: </span>
 <span className="text-xs font-mono font-bold">{enr.protocol}</span>
 </div>
 )}
 {/* Timeline */}
 <div className="mt-3 flex items-center gap-1">
 {['pendente','em_analise','aprovada','matriculado'].map((s, i) => {
 const statuses = ['pendente','em_analise','aprovada','matriculado'];
 const currentIdx = statuses.indexOf(enr.status);
 const isActive = i <= currentIdx && enr.status !== 'recusada';
 return (
 <React.Fragment key={s}>
 <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isActive ? 'bg-blue-500' : 'bg-gray-200'}`} />
 {i < 3 && <div className={`flex-1 h-0.5 ${i < currentIdx && enr.status !== 'recusada' ? 'bg-blue-500' : 'bg-gray-200'}`} />}
 </React.Fragment>
 );
})}
 </div>
 <div className="flex justify-between text-xs text-muted-foreground mt-1">
 <span>Pendente</span><span>Análise</span><span>Aprovada</span><span>Matrícula</span>
 </div>
 </CardContent>
 </Card>
 );
})}
 </div>
 );
}