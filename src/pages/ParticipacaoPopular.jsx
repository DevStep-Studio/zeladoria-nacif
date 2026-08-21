import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import {base44} from '@/api/base44Client';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {useAuth} from '@/lib/AuthContext';
import {Button} from"@/components/ui/button";
import {Input} from"@/components/ui/input";
import {Textarea} from"@/components/ui/textarea";
import {Badge} from"@/components/ui/badge";
import {Tabs, TabsContent, TabsList, TabsTrigger} from"@/components/ui/tabs";
import {Loader2} from 'lucide-react';
import {toast} from 'sonner';

// Entity: PublicPoll
const POLL_STATUS = {
  aberta: {label: 'Aberta', color: 'bg-primary/10 text-primary'}, 
  encerrada: {label: 'Encerrada', color: 'bg-slate-100 text-slate-600'}, 
  em_analise: {label: 'Em Análise', color: 'bg-[#fff8d6] text-[#eab308]'}
};

export default function ParticipacaoPopular() {
 const {user} = useAuth();
 const qc = useQueryClient();
 const [tab, setTab] = useState('polls');
 const [showForm, setShowForm] = useState(false);
 const [newSuggestion, setNewSuggestion] = useState({title: '', description: '', category: 'sugestao'});
 const [submitting, setSubmitting] = useState(false);
 const [voted, setVoted] = useState({});

 const {data: polls = []} = useQuery({
   queryKey: ['public-polls'],
   queryFn: () => base44.entities.PublicPoll?.list('-created_date', 50) || Promise.resolve([]),
 });

 const MOCK_POLLS = [
 {
 id: 'mock1', title: 'Como deve ser usado o orçamento participativo 2025?', type: 'enquete', status: 'aberta',
 description: 'Decida onde investir: Saúde, Educação, Mobilidade ou Segurança.',
  options: [
  {id: 'a', label: 'Saúde Pública', icon: 'local_hospital', votes: 234},
  {id: 'b', label: 'Educação', icon: 'school', votes: 189},
  {id: 'c', label: 'Mobilidade Urbana', icon: 'traffic', votes: 156},
  {id: 'd', label: 'Segurança', icon: 'security', votes: 98},
  ], total_votes: 677,
},
 {
 id: 'mock2', title: 'Qual horário de funcionamento das UBSs é melhor?', type: 'enquete', status: 'aberta',
 description: 'Ajude a definir o horário ideal para as Unidades Básicas de Saúde.',
  options: [
  {id: 'a', label: '7h–17h (atual)', icon: 'wb_sunny', votes: 145},
  {id: 'b', label: '10h–20h (tarde/noite)', icon: 'nights_stay', votes: 210},
  {id: 'c', label: '24h emergência', icon: 'emergency', votes: 320},
  ], total_votes: 675,
},
 {
 id: 'mock3', title: 'Avaliação dos serviços públicos municipais', type: 'consulta_publica', status: 'aberta',
 description: 'Como você avalia os serviços da prefeitura nos últimos 6 meses?',
  options: [
  {id: 'a', label: 'Excelente', stars: 5, votes: 89},
  {id: 'b', label: 'Bom', stars: 4, votes: 156},
  {id: 'c', label: 'Regular', stars: 3, votes: 234},
  {id: 'd', label: 'Ruim', stars: 2, votes: 120},
  {id: 'e', label: 'Muito Ruim', stars: 1, votes: 67},
  ], total_votes: 666,
},
 ];

 const MOCK_SUGGESTIONS = [
 {id: 's1', title: 'Instalar mais lixeiras nas praças', category: 'sugestao', votes_up: 145, votes_down: 12, status: 'em_analise', created_by: 'cidadão@email.com', created_date: new Date(Date.now() - 86400000 * 3).toISOString()},
 {id: 's2', title: 'Ampliar horário das academias ao ar livre', category: 'sugestao', votes_up: 234, votes_down: 8, status: 'aberta', created_by: 'outro@email.com', created_date: new Date(Date.now() - 86400000 * 7).toISOString()},
 {id: 's3', title: 'Criar ciclovias na Av. Principal', category: 'sugestao', votes_up: 412, votes_down: 23, status: 'em_analise', created_by: 'bicicleta@email.com', created_date: new Date(Date.now() - 86400000 * 14).toISOString()},
 {id: 's4', title: 'Ponto de ônibus com cobertura no Terminal Sul', category: 'sugestao', votes_up: 189, votes_down: 5, status: 'aberta', created_by: 'transporte@email.com', created_date: new Date(Date.now() - 86400000 * 2).toISOString()},
 ];

 const handleVotePoll = (pollId, optionId) => {
 const key =`${pollId}_${optionId}`;
 if (voted[key]) return;
 setVoted(v => ({...v, [key]: true}));
 toast.success('Voto registrado! Obrigado pela participação.');
};

 const handleVoteSuggestion = (id, type) => {
 const key =`sug_${id}_${type}`;
 if (voted[key]) return;
 setVoted(v => ({...v, [key]: true}));
 toast.success(type === 'up' ? 'Apoio registrado!' : 'Voto registrado!');
};

 const handleSubmitSuggestion = async () => {
 if (!newSuggestion.title.trim()) {toast.error('Digite o título da sugestão'); return;}
 setSubmitting(true);
 await new Promise(r => setTimeout(r, 1000));
 toast.success('Sua sugestão foi enviada para análise!');
 setShowForm(false);
 setNewSuggestion({title: '', description: '', category: 'sugestao'});
 setSubmitting(false);
};

 const timeAgo = (d) => {
 const diff = Date.now() - new Date(d).getTime();
 const days = Math.floor(diff / 86400000);
 return days === 0 ? 'hoje' :`há ${days} dia${days > 1 ? 's' : ''}`;
};

 return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="w-full max-w-max-width mx-auto px-margin-mobile md:px-container-padding py-8 pb-32 md:pb-12 space-y-6">
        
        {/* Hero Section */}
        <section className="bg-primary rounded-xl p-8 mb-8 relative overflow-hidden flex flex-col justify-center min-h-[160px] shadow-sm">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[200px]">how_to_vote</span>
          </div>
          <div className="relative z-10 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-white font-label-sm text-label-sm opacity-80">
              <Link to="/" className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                <span className="material-symbols-outlined text-sm">arrow_back</span>
              </Link>
              <span>Início</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="font-bold">Cidadania</span>
            </div>
            <div className="flex justify-between items-end mt-4">
              <div>
                <h1 className="text-white font-headline-lg text-headline-lg-mobile md:text-headline-lg mb-1">Participação Popular</h1>
                <p className="text-white font-body-sm text-body-sm opacity-90">Sua voz na gestão da cidade e colaboração coletiva.</p>
              </div>
              <Link to="/" className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors text-white">
                <span className="material-symbols-outlined">home</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-[#e5eeff] text-[#3c4a40] flex items-center justify-center mx-auto mb-2">
              <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings: "'FILL' 0"}}>front_hand</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{MOCK_POLLS.reduce((s, p) => s + p.total_votes, 0).toLocaleString()}</p>
            <p className="text-[12px] text-slate-500 font-medium">Votos Totais nas Enquetes</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
              <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings: "'FILL' 0"}}>how_to_vote</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{MOCK_POLLS.filter(p => p.status === 'aberta').length}</p>
            <p className="text-[12px] text-slate-500 font-medium">Enquetes Abertas</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-[#fff8d6] text-[#eab308] flex items-center justify-center mx-auto mb-2">
              <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings: "'FILL' 0"}}>thumb_up</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{MOCK_SUGGESTIONS.reduce((s, sg) => s + sg.votes_up, 0)}</p>
            <p className="text-[12px] text-slate-500 font-medium">Apoios em Sugestões</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex bg-surface-container-lowest rounded-xl p-1 mb-6 shadow-sm border border-surface-container-highest max-w-fit mx-auto md:mx-0 h-auto">
            <TabsTrigger value="polls" className="px-6 py-2 rounded-lg data-[state=active]:bg-surface-container-high data-[state=active]:text-primary text-secondary hover:bg-surface-container-low font-label-md text-label-md flex items-center gap-2 transition-colors data-[state=active]:shadow-none">
              <span className="material-symbols-outlined text-sm">how_to_vote</span> Enquetes
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="px-6 py-2 rounded-lg data-[state=active]:bg-surface-container-high data-[state=active]:text-primary text-secondary hover:bg-surface-container-low font-label-md text-label-md flex items-center gap-2 transition-colors data-[state=active]:shadow-none">
              <span className="material-symbols-outlined text-sm">lightbulb</span> Sugestões
            </TabsTrigger>
          </TabsList>

          {/* Polls Tab */}
          <TabsContent value="polls">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {MOCK_POLLS.map(poll => {
                const hasVoted = poll.options.some(o => voted[`${poll.id}_${o.id}`]);
                const maxVotes = Math.max(...poll.options.map(o => o.votes));
                return (
                  <article key={poll.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={`text-[10px] h-[22px] px-2 font-bold ${POLL_STATUS[poll.status]?.color} border-0`}>{POLL_STATUS[poll.status]?.label}</Badge>
                          <span className="text-[12px] text-slate-500 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">groups</span> {poll.total_votes.toLocaleString()} votos</span>
                        </div>
                        <h3 className="text-[16px] font-bold text-slate-800 leading-tight mb-1">{poll.title}</h3>
                        <p className="text-[13px] text-slate-500">{poll.description}</p>
                      </div>
                    </div>
                    <div className="space-y-2 mt-4">
                      {poll.options.map(opt => {
                        const pct = poll.total_votes > 0 ? Math.round((opt.votes / poll.total_votes) * 100) : 0;
                        const isVoted = voted[`${poll.id}_${opt.id}`];
                        const isWinner = opt.votes === maxVotes;
                        return (
                          <button key={opt.id} onClick={() => handleVotePoll(poll.id, opt.id)} disabled={hasVoted}
                            className={`w-full text-left rounded-xl p-3 border transition-all relative overflow-hidden ${isVoted ? 'border-primary bg-primary/10' : isWinner && hasVoted ? 'border-primary/20 bg-primary/10' : 'border-slate-200 hover:border-primary/50 hover:bg-slate-50'}`}>
                            {hasVoted && (
                              <div className="absolute left-0 top-0 bottom-0 bg-primary/10 transition-all duration-500" style={{width:`${pct}%`}} />
                            )}
                            <div className="flex items-center justify-between relative z-10">
                              <div className="flex items-center gap-2">
                                {opt.icon && <span className="material-symbols-outlined text-[18px] text-slate-500" style={{fontVariationSettings: "'FILL' 0"}}>{opt.icon}</span>}
                                {opt.stars && (
                                  <div className="flex text-amber-400">
                                    {Array.from({length: 5}).map((_, i) => (
                                      <span key={i} className="material-symbols-outlined text-[16px]" style={{fontVariationSettings: i < opt.stars ? "'FILL' 1" : "'FILL' 0"}}>{i < opt.stars ? 'star' : 'star'}</span>
                                    ))}
                                  </div>
                                )}
                                <span className="text-[14px] font-semibold text-slate-800">{opt.label}</span>
                              </div>
                              {hasVoted && <span className="text-[13px] font-black text-primary">{pct}%</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {!hasVoted && <p className="text-[12px] text-slate-400 mt-3 text-center">Selecione uma opção para votar</p>}
                  </article>
                );
              })}
            </div>
          </TabsContent>

          {/* Suggestions Tab */}
          <TabsContent value="suggestions" className="max-w-3xl mx-auto space-y-4">
            <Button className="w-full gap-2 h-12 rounded-xl text-[15px] font-bold shadow-md transition-all bg-primary hover:bg-primary/90" onClick={() => setShowForm(s => !s)}>
              <span className="material-symbols-outlined text-[20px]">add</span> Enviar Nova Sugestão
            </Button>

            {showForm && (
              <article className="bg-white rounded-xl p-5 shadow-sm border border-primary/30">
                <h3 className="text-[15px] font-bold text-slate-800 mb-4">Detalhes da Sugestão</h3>
                <div className="space-y-4">
                  <Input placeholder="Título da sua sugestão (ex: Mais lixeiras na praça)" className="h-12 rounded-xl" value={newSuggestion.title} onChange={e => setNewSuggestion(prev => ({...prev, title: e.target.value}))} />
                  <Textarea placeholder="Descreva sua sugestão em detalhes para a prefeitura e outros cidadãos..." value={newSuggestion.description} onChange={e => setNewSuggestion(prev => ({...prev, description: e.target.value}))} className="min-h-[100px] rounded-xl" />
                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setShowForm(false)}>Cancelar</Button>
                    <Button className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90" onClick={handleSubmitSuggestion} disabled={submitting}>
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar Sugestão'}
                    </Button>
                  </div>
                </div>
              </article>
            )}

            <div className="space-y-4 mt-6">
              {MOCK_SUGGESTIONS.map(sug => (
                <article key={sug.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <button onClick={() => handleVoteSuggestion(sug.id, 'up')} disabled={!!voted[`sug_${sug.id}_up`]}
                        className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-colors ${voted[`sug_${sug.id}_up`] ? 'bg-primary/10 text-primary' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                        <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings: voted[`sug_${sug.id}_up`] ? "'FILL' 1" : "'FILL' 0"}}>thumb_up</span>
                        <span className="text-[11px] font-black">{sug.votes_up + (voted[`sug_${sug.id}_up`] ? 1 : 0)}</span>
                      </button>
                      <button onClick={() => handleVoteSuggestion(sug.id, 'down')} disabled={!!voted[`sug_${sug.id}_down`]}
                        className={`w-12 h-8 rounded-xl flex items-center justify-center transition-colors ${voted[`sug_${sug.id}_down`] ? 'bg-[#fce8e8] text-red-600' : 'text-slate-300 hover:bg-slate-50 hover:text-red-400'}`}>
                        <span className="material-symbols-outlined text-[16px]" style={{fontVariationSettings: voted[`sug_${sug.id}_down`] ? "'FILL' 1" : "'FILL' 0"}}>thumb_down</span>
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge className={`text-[10px] h-[20px] px-2 font-bold ${POLL_STATUS[sug.status]?.color || 'bg-[#e5eeff] text-[#3c4a40]'} border-0`}>
                          {POLL_STATUS[sug.status]?.label || sug.status}
                        </Badge>
                        <span className="text-[12px] text-slate-400 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">schedule</span> {timeAgo(sug.created_date)}</span>
                      </div>
                      <h3 className="text-[15px] font-bold text-slate-800 leading-tight mb-2">{sug.title}</h3>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-[2px] bg-[#e5eeff] text-[#3c4a40] rounded text-[11px] font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">group</span>
                          {sug.votes_up + sug.votes_down} participantes
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}