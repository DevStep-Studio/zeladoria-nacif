import React, {useMemo, useState} from 'react';
import {base44} from '@/api/base44Client';
import {useQuery} from '@tanstack/react-query';
import {useAuth} from '@/lib/AuthContext';
import {ClipboardList, FileX2, RefreshCw} from 'lucide-react';
import OccurrenceCard from '@/components/citizen/OccurrenceCard';
import {Button} from '@/components/ui/button';
import {STATUS_GROUPS, getStatusGroup} from '@/lib/constants';

const GROUP_ORDER = ['abertas', 'andamento', 'concluidas', 'canceladas'];

export default function MyOccurrences() {
 const {user} = useAuth();
 const [activeGroup, setActiveGroup] = useState('abertas');

 const {data: occurrences = [], isLoading, isError, refetch} = useQuery({
 queryKey: ['my-occurrences', user?.email],
 queryFn: () => base44.entities.Occurrence.filter({created_by: user?.email}, '-created_date', 200),
 enabled: !!user?.email,
});

 const grouped = useMemo(() => {
 const base = GROUP_ORDER.reduce((acc, key) => ({...acc, [key]: []}), {});
 occurrences.forEach(occ => {
 const group = getStatusGroup(occ.status);
 base[group]?.push(occ);
});
 return base;
}, [occurrences]);

 const activeOccurrences = grouped[activeGroup] || [];

 return (
 <div className="min-h-screen bg-slate-50/50">
 <div className="w-full max-w-4xl mx-auto px-4 md:px-6 py-6 pb-32 md:pb-10">
 <section className="bg-primary rounded-xl p-6 md:p-8 mb-6 relative overflow-hidden min-h-[150px] flex flex-col justify-center shadow-sm">
 <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
 <span className="material-symbols-outlined text-[180px]">assignment</span>
 </div>
 <div className="relative z-10">
 <div className="flex items-center gap-2 text-white/85 font-label-sm text-label-sm mb-4">
 <ClipboardList className="w-4 h-4" />
 <span>Área do cidadão</span>
 </div>
 <h1 className="text-white font-headline-lg text-headline-lg-mobile md:text-headline-lg leading-tight">
 Minhas ocorrências
 </h1>
 <p className="text-white/90 text-sm md:text-base mt-1">
 Acompanhe seus protocolos e interaja com a prefeitura.
 </p>
 </div>
 </section>

 <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-2 mb-5">
 <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
 {GROUP_ORDER.map(groupKey => {
 const isActive = activeGroup === groupKey;
 const group = STATUS_GROUPS[groupKey];
 const count = grouped[groupKey]?.length || 0;
 return (
 <button
 key={groupKey}
 type="button"
 onClick={() => setActiveGroup(groupKey)}
 className={`rounded-xl px-3 py-3 text-left transition-all border ${
 isActive
 ? 'bg-primary text-white border-primary shadow-sm'
 : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-slate-200 hover:bg-slate-100'
 }`}
 >
 <span className="block text-[12px] font-bold leading-tight">{group.label}</span>
 <span className={`block text-[20px] font-black mt-1 ${isActive ? 'text-white' : 'text-slate-800'}`}>{count}</span>
 </button>
 );
})}
 </div>
 </div>

 {isLoading ? (
 <div className="space-y-3">
 {[1, 2, 3].map(item => (
 <div key={item} className="bg-white p-4 rounded-[20px] border border-slate-200 shadow-sm animate-pulse flex gap-4">
 <div className="w-24 h-24 rounded-2xl bg-slate-100" />
 <div className="flex-1 space-y-3 py-1">
 <div className="h-4 bg-slate-100 rounded w-3/4" />
 <div className="h-3 bg-slate-100 rounded w-1/2" />
 <div className="h-3 bg-slate-100 rounded w-2/3" />
 </div>
 </div>
 ))}
 </div>
 ) : isError ? (
 <div className="text-center py-16 bg-white rounded-2xl border border-red-100 shadow-sm space-y-3">
 <FileX2 className="w-12 h-12 text-red-300 mx-auto" />
 <div>
 <p className="font-bold text-slate-800">Não foi possível carregar suas ocorrências</p>
 <p className="text-sm text-slate-500 mt-1">Tente novamente em instantes.</p>
 </div>
 <Button variant="outline" className="gap-2" onClick={() => refetch()}>
 <RefreshCw className="w-4 h-4" />
 Recarregar
 </Button>
 </div>
 ) : occurrences.length === 0 ? (
 <EmptyState
 title="Você ainda não registrou nenhuma ocorrência"
 description="Quando abrir um protocolo, ele aparecerá aqui com status, prazo e histórico."
 />
 ) : activeOccurrences.length === 0 ? (
 <EmptyState
 title={`Nenhuma ocorrência em "${STATUS_GROUPS[activeGroup].label}"`}
 description="Use as abas acima para consultar outros momentos do atendimento."
 compact
 />
 ) : (
 <div className="space-y-3">
 {activeOccurrences.map(occ => (
 <OccurrenceCard key={occ.id} occurrence={occ} />
 ))}
 </div>
 )}
 </div>
 </div>
 );
}

function EmptyState({title, description, compact = false}) {
 return (
 <div className={`text-center bg-white rounded-2xl border border-slate-200 border-dashed shadow-sm ${compact ? 'py-12' : 'py-16'} px-6 space-y-2`}>
 <ClipboardList className="w-12 h-12 text-slate-300 mx-auto" />
 <p className="font-bold text-slate-800">{title}</p>
 <p className="text-sm text-slate-500 max-w-md mx-auto">{description}</p>
 </div>
 );
}
