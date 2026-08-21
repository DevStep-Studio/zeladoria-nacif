import React, {useState} from 'react';
import {base44} from '@/api/base44Client';
import {useQuery} from '@tanstack/react-query';
import {Badge} from"@/components/ui/badge";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from"@/components/ui/select";

const SPECIALTIES = {
 clinico_geral: 'Clínico Geral', pediatria: 'Pediatria', cardiologia: 'Cardiologia',
 ortopedia: 'Ortopedia', ginecologia: 'Ginecologia', neurologia: 'Neurologia',
 psiquiatria: 'Psiquiatria', oftalmologia: 'Oftalmologia', dermatologia: 'Dermatologia',
 odontologia: 'Odontologia'
};

const STATUS_CONFIG = {
 disponivel: {label: 'Disponível', color: 'bg-green-100 text-green-700'},
 ocupado: {label: 'Ocupado', color: 'bg-yellow-100 text-yellow-700'},
 indisponivel: {label: 'Indisponível', color: 'bg-red-100 text-red-700'},
};

export default function DoctorsList({onBook}) {
 const [search, setSearch] = useState('');
 const [filterSpecialty, setFilterSpecialty] = useState('all');
 const [filterNeighborhood, setFilterNeighborhood] = useState('all');

 const {data: doctors = [], isLoading} = useQuery({
 queryKey: ['health-doctors'],
 queryFn: () => base44.entities.HealthDoctor.list('-created_date', 100),
});

 const neighborhoods = [...new Set(doctors.map(d => d.neighborhood).filter(Boolean))];

 const filtered = doctors.filter(d => {
 const matchSearch = !search || d.name?.toLowerCase().includes(search.toLowerCase()) || d.unit_name?.toLowerCase().includes(search.toLowerCase());
 const matchSpec = filterSpecialty === 'all' || d.specialty === filterSpecialty;
 const matchNeigh = filterNeighborhood === 'all' || d.neighborhood === filterNeighborhood;
 return matchSearch && matchSpec && matchNeigh;
});

 return (
    <div className="space-y-4 pb-6">
      {/* Filters */}
      <div className="bg-white rounded-xl p-2 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center gap-4 mb-8">
        <div className="flex-1 flex items-center gap-3 px-4 py-2 w-full">
          <span className="material-symbols-outlined text-slate-400">search</span>
          <input 
            className="w-full bg-transparent border-none focus:ring-0 text-[15px] text-slate-800 placeholder-slate-400 p-0" 
            placeholder="Buscar médico ou unidade..." 
            type="text"
            value={search} 
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="hidden md:block w-[1px] h-8 bg-slate-200"></div>
        <div className="flex items-center gap-4 w-full md:w-auto px-4 justify-between md:justify-end">
          <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
            <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 h-auto p-0 hover:bg-transparent [&>svg]:hidden flex items-center gap-2 text-slate-700 font-medium text-[13px] hover:text-rose-600 transition-colors">
              <SelectValue placeholder="Todas especialidades" />
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Todas especialidades</SelectItem>
              {Object.entries(SPECIALTIES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>

          <div className="hidden md:block w-[1px] h-6 bg-slate-200"></div>

          <Select value={filterNeighborhood} onValueChange={setFilterNeighborhood}>
            <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 h-auto p-0 hover:bg-transparent [&>svg]:hidden flex items-center gap-2 text-slate-700 font-medium text-[13px] hover:text-rose-600 transition-colors">
              <SelectValue placeholder="Bairro" />
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Todos os bairros</SelectItem>
              {neighborhoods.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <span className="material-symbols-outlined text-[48px] opacity-30 mb-3 block">health_and_safety</span>
          <p>Nenhum médico encontrado</p>
          <p className="text-sm mt-1">Tente ajustar os filtros</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(doctor => {
            const hasSlots = (doctor.available_slots ?? 0) > 0;
            const statusCfg = STATUS_CONFIG[doctor.status] || STATUS_CONFIG.disponivel;
            return (
              <article key={doctor.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col gap-4">
                <div className="flex gap-4 items-start">
                  <div className="w-[72px] h-[72px] rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 overflow-hidden relative border border-slate-100">
                    {doctor.photo ? <img src={doctor.photo} alt={doctor.name} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-rose-600 text-3xl relative z-10" style={{fontVariationSettings: "'FILL' 0, 'wght' 300"}}>health_and_safety</span>}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1.5">
                      <h3 className="font-semibold text-[15px] text-slate-800 leading-tight pr-2">Dr(a). {doctor.name}</h3>
                      <Badge className={`text-[10px] h-[20px] px-1.5 ${statusCfg.color} border-0 flex-shrink-0 font-bold`}>{statusCfg.label}</Badge>
                    </div>
                    <p className="text-slate-500 text-[13px] flex items-start gap-1 mb-3 leading-snug">
                      <span className="material-symbols-outlined text-[14px] mt-[2px]" style={{fontVariationSettings: "'FILL' 0"}}>location_on</span>
                      <span className="line-clamp-2">{doctor.unit_name} — {doctor.neighborhood}</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2 py-[2px] bg-[#e5eeff] text-[#3c4a40] rounded text-[11px] font-medium">{SPECIALTIES[doctor.specialty]}</span>
                      {doctor.schedule && (
                         <span className="px-2 py-[2px] bg-[#e5eeff] text-[#3c4a40] rounded text-[11px] font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">schedule</span>
                            {doctor.schedule}
                         </span>
                      )}
                    </div>
                  </div>
                </div>
                <hr className="border-slate-100 border-t mt-1"/>
                <div className="flex justify-between items-center mt-1">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${hasSlots ? 'bg-rose-50 text-rose-600' : 'bg-[#fce8e8] text-red-600'}`}>
                      <span className="material-symbols-outlined text-[18px]" style={{fontVariationSettings: "'FILL' 0"}}>{hasSlots ? 'group' : 'group_off'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[14px] text-slate-900 font-bold leading-tight">{hasSlots ? `${doctor.available_slots} vagas` : 'Sem vagas'}</span>
                      <span className="text-[11px] text-slate-500">{hasSlots ? 'disponíveis agora' : 'Fila de espera aberta'}</span>
                    </div>
                  </div>
                  <button 
                    className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-colors ${hasSlots ? 'bg-rose-500 hover:bg-rose-700 text-white' : 'border border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                    disabled={doctor.status === 'indisponivel'}
                    onClick={() => onBook(doctor)}
                  >
                    {hasSlots ? 'Agendar' : 'Fila'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
 );
}
