import React, {useState} from 'react';
import {appApi} from '@/services/app-api';
import {useQuery} from '@tanstack/react-query';


import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from"@/components/ui/select";
import { GraduationCap, Sun, Moon, Sunrise} from 'lucide-react';

const SHIFT_CONFIG = {
 manha: {label: 'Manhã', icon: Sunrise, color: 'text-yellow-500'},
 tarde: {label: 'Tarde', icon: Sun, color: 'text-orange-500'},
 integral: {label: 'Integral', icon: GraduationCap, color: 'text-green-500'},
 noturno: {label: 'Noturno', icon: Moon, color: 'text-blue-500'},
};

export default function SchoolsList({onEnroll}) {
 const [search, setSearch] = useState('');
 const [filterNeighborhood, setFilterNeighborhood] = useState('all');
 const [filterShift, setFilterShift] = useState('all');

 const {data: schools = [], isLoading} = useQuery({
 queryKey: ['schools'],
 queryFn: () => appApi.entities.School.list('-created_date', 100),
});

 const neighborhoods = [...new Set(schools.map(s => s.neighborhood).filter(Boolean))];

 const filtered = schools.filter(s => {
 const matchSearch = !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.neighborhood?.toLowerCase().includes(search.toLowerCase());
 const matchNeigh = filterNeighborhood === 'all' || s.neighborhood === filterNeighborhood;
 const matchShift = filterShift === 'all' || s.shifts?.includes(filterShift);
 return matchSearch && matchNeigh && matchShift;
});

 return (
  <div className="pb-10">
    {/* Filter Bar */}
    <div className="bg-surface-container-lowest rounded-xl p-2 shadow-sm border border-surface-container-highest flex flex-col md:flex-row items-center gap-4 mb-8">
      <div className="flex-1 flex items-center gap-3 px-4 py-2 w-full">
        <span className="material-symbols-outlined text-secondary">search</span>
        <input 
          className="w-full bg-transparent border-none focus:ring-0 text-body-lg font-body-lg text-on-surface placeholder-secondary p-0" 
          placeholder="Buscar escola ou bairro..." 
          type="text"
          value={search} 
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="hidden md:block w-[1px] h-8 bg-surface-container-highest"></div>
      <div className="flex items-center gap-4 w-full md:w-auto px-4 justify-between md:justify-end">
        <Select value={filterNeighborhood} onValueChange={setFilterNeighborhood}>
          <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 h-auto p-0 hover:bg-transparent [&>svg]:hidden flex items-center gap-2 text-on-surface font-label-md text-label-md hover:text-blue-600 transition-colors">
            <SelectValue placeholder="Todos os bairros" />
            <span className="material-symbols-outlined text-sm">expand_more</span>
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Todos os bairros</SelectItem>
            {neighborhoods.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="hidden md:block w-[1px] h-6 bg-surface-container-highest"></div>

        <Select value={filterShift} onValueChange={setFilterShift}>
          <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 h-auto p-0 hover:bg-transparent [&>svg]:hidden flex items-center gap-2 text-on-surface font-label-md text-label-md hover:text-blue-600 transition-colors">
            <SelectValue placeholder="Todos os turnos" />
            <span className="material-symbols-outlined text-sm">expand_more</span>
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Todos os turnos</SelectItem>
            {Object.entries(SHIFT_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {isLoading ? (
    <div className="flex justify-center py-12 col-span-full"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
  ) : filtered.length === 0 ? (
    <div className="text-center py-16 text-muted-foreground col-span-full">
      <span className="material-symbols-outlined text-[48px] opacity-30 mb-3 block">school</span>
      <p>Nenhuma escola encontrada</p>
    </div>
  ) : filtered.map(school => {
    const slotsPercent = school.total_slots ? (school.available_slots / school.total_slots) * 100 : 0;
    const hasSlots = (school.available_slots ?? 0) > 0;
    return (
      <article key={school.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col gap-4">
        <div className="flex gap-4 items-start">
          <div className="w-[72px] h-[72px] rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 overflow-hidden relative border border-slate-100">
            <div className="absolute inset-0 bg-cover bg-center w-full h-full opacity-40 mix-blend-multiply" style={school.photo ? {backgroundImage: `url('${school.photo}')`} : {}}></div>
            <span className="material-symbols-outlined text-blue-600 text-3xl relative z-10" style={{fontVariationSettings: "'FILL' 0, 'wght' 300"}}>{!hasSlots ? 'child_care' : 'school'}</span>
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-1.5">
              <h3 className="font-semibold text-[15px] text-slate-800 leading-tight pr-2">{school.name}</h3>
              {school.rating > 0 && (
                <div className="flex items-center gap-1 bg-[#fff8d6] text-[#eab308] px-2 py-0.5 rounded-md text-xs font-bold shrink-0">
                  <span className="material-symbols-outlined text-[12px]" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                  <span>{school.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            <p className="text-slate-500 text-[13px] flex items-start gap-1 mb-3 leading-snug">
              <span className="material-symbols-outlined text-[14px] mt-[2px]" style={{fontVariationSettings: "'FILL' 0"}}>location_on</span>
              <span className="line-clamp-2">{school.address} — {school.neighborhood}</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {school.shifts?.map(sh => (
                <span key={sh} className="px-2 py-[2px] bg-[#e5eeff] text-[#3c4a40] rounded text-[11px] font-medium">{sh.charAt(0).toUpperCase() + sh.slice(1)}</span>
              ))}
              {school.grades?.slice(0, 3).map(g => (
                <span key={g} className="px-2 py-[2px] bg-[#e5eeff] text-[#3c4a40] rounded text-[11px] font-medium">{g}</span>
              ))}
            </div>
          </div>
        </div>
        <hr className="border-slate-100 border-t mt-1"/>
        <div className="flex justify-between items-center mt-1">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${hasSlots ? 'bg-blue-50 text-blue-600' : 'bg-[#fce8e8] text-red-600'}`}>
              <span className="material-symbols-outlined text-[18px]" style={{fontVariationSettings: "'FILL' 0"}}>{hasSlots ? 'group' : 'group_off'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] text-slate-900 font-bold leading-tight">{hasSlots ? `${school.available_slots} vagas` : 'Sem vagas'}</span>
              <span className="text-[11px] text-slate-500">{hasSlots ? 'disponíveis agora' : 'Fila de espera aberta'}</span>
            </div>
          </div>
          <button 
            className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-colors ${hasSlots ? 'bg-blue-500 hover:bg-blue-700 text-white' : 'border border-slate-300 text-slate-600 hover:bg-slate-50'}`}
            onClick={() => onEnroll(school)}
          >
            {hasSlots ? 'Solicitar Vaga' : 'Entrar na Fila'}
          </button>
        </div>
      </article>
    );
  })}
    </div>
  </div>
 );
}