import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import {appApi} from '@/services/app-api';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {Card, CardContent} from"@/components/ui/card";
import {Button} from"@/components/ui/button";
import {Textarea} from"@/components/ui/textarea";
import {
 MapPin, CheckCircle2, Camera, Navigation,
 FileText, Loader2, ChevronDown, ChevronUp, Play, CheckSquare
} from 'lucide-react';
import {calcSlaStatus} from '@/lib/constants';
import {createHistoryEntry, createTimelineEvent, getProtocolNumber, getStatusLabel} from '@/lib/occurrences';
import CategoryBadge from '@/components/shared/CategoryBadge';
import SLABadge from '@/components/shared/SLABadge';
import PhotoUploader from '@/components/shared/PhotoUploader';
import {toast} from 'sonner';
import {motion, AnimatePresence} from 'framer-motion';

export default function TeamApp() {
 const [selectedOcc, setSelectedOcc] = useState(null);
 const [notes, setNotes] = useState('');
 const [afterPhotos, setAfterPhotos] = useState([]);
 const [checklist, setChecklist] = useState({});
 const [saving, setSaving] = useState(false);
 const queryClient = useQueryClient();

 const {data: user} = useQuery({
   queryKey: ['me'],
   queryFn: () => appApi.auth.me(),
 });

 const {data: occurrences = [], isLoading} = useQuery({
   queryKey: ['team-occurrences'],
   queryFn: async () => {
     const items = await appApi.entities.Occurrence.list('-created_date', 100);
     return items.filter(occ => ['encaminhada', 'programada', 'em_execucao', 'equipe_enviada'].includes(occ.status));
   },
   refetchInterval: 60000,
 });

 const updateMutation = useMutation({
   mutationFn: /** @param {any} payload */ async (payload) => {
     const {occurrence, data, description} = payload;
     const updated = await appApi.entities.Occurrence.update(occurrence.id, data);
     await appApi.entities.AuditLog.create({
       user_email: user?.email || 'equipe',
       action: 'team_occurrence_updated',
       entity_type: 'Occurrence',
       entity_id: occurrence.id,
       old_data: {status: occurrence.status},
       new_data: data,
       description,
     });
     if (occurrence.created_by && data.status) {
       await appApi.entities.Notification.create({
         user_email: occurrence.created_by,
         title: 'Equipe atualizou sua ocorrência',
         message: `Seu protocolo ${getProtocolNumber(occurrence)} agora está como ${getStatusLabel(data.status)}.`,
         type: 'status_update',
         occurrence_id: occurrence.id,
         priority: 'info',
       });
     }
     return updated;
   },
   onSuccess: () => {
     queryClient.invalidateQueries({queryKey: ['team-occurrences']});
     setSelectedOcc(null);
     setNotes('');
     setAfterPhotos([]);
     setChecklist({});
     toast.success('OS finalizada com sucesso!');
   },
 });

 const checklistItems = {
   limpeza_publica: ['Área isolada', 'Limpeza realizada', 'Descarte correto', 'Área vistoriada'],
   poste_apagado: ['Segurança verificada', 'Reparo executado', 'Iluminação testada', 'Área liberada'],
   buraco_na_rua: ['Sinalização instalada', 'Tapa-buraco aplicado', 'Compactação realizada', 'Área liberada'],
   vazamento: ['Água cortada', 'Vazamento corrigido', 'Pressão verificada', 'Área drenada'],
   default: ['Equipamentos verificados', 'Serviço executado', 'Área limpa', 'Relatório preenchido'],
 };

 const getChecklist = (category) => checklistItems[category] || checklistItems.default;

 const handleComplete = async (occ) => {
   setSaving(true);
   const now = new Date().toISOString();
   const data = {
     status: 'concluida',
     resolved_date: now,
     admin_notes: notes || 'OS finalizada pela equipe.',
     timeline: [
       ...(occ.timeline || []),
       createTimelineEvent({
         status: 'concluida',
         title: 'Serviço concluído',
         description: notes || 'Ordem de serviço finalizada pela equipe de campo.',
         actorRole: 'equipe',
         createdAt: now,
       }),
     ],
     change_history: [
       ...(occ.change_history || []),
       createHistoryEntry({
         action: 'field_service_completed',
         description: 'Equipe de campo concluiu a ordem de serviço.',
         actorRole: 'equipe',
         oldValue: occ.status,
         newValue: 'concluida',
         createdAt: now,
       }),
     ],
     last_public_update: now,
   };
   if (afterPhotos.length > 0) {
     data.photos = [...(occ.photos || []), ...afterPhotos];
   }
   updateMutation.mutate({
     occurrence: occ,
     data,
     description: `Protocolo ${getProtocolNumber(occ)} concluído pela equipe de campo.`,
   });
   setSaving(false);
 };

 const handleStartOS = (occ) => {
   const now = new Date().toISOString();
   updateMutation.mutate({
     occurrence: occ,
     data: {
       status: 'em_execucao',
       timeline: [
         ...(occ.timeline || []),
         createTimelineEvent({
           status: 'em_execucao',
           title: 'Execução iniciada',
           description: 'Equipe de campo iniciou o atendimento no local.',
           actorRole: 'equipe',
           createdAt: now,
         }),
       ],
       change_history: [
         ...(occ.change_history || []),
         createHistoryEntry({
           action: 'field_service_started',
           description: 'Equipe de campo iniciou a ordem de serviço.',
           actorRole: 'equipe',
           oldValue: occ.status,
           newValue: 'em_execucao',
           createdAt: now,
         }),
       ],
       last_public_update: now,
     },
     description: `Execução iniciada para o protocolo ${getProtocolNumber(occ)}.`,
   });
   toast.info('OS aceita e iniciada');
 };

 const toggleCheck = (item) => {
   setChecklist(prev => ({...prev, [item]: !prev[item]}));
 };

 return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="w-full max-w-max-width mx-auto px-margin-mobile md:px-container-padding py-8 pb-32 md:pb-12 space-y-6">
        
        {/* Hero Section */}
        <section className="bg-slate-700 rounded-xl p-8 mb-8 relative overflow-hidden flex flex-col justify-center min-h-[160px] shadow-sm">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[200px]">engineering</span>
          </div>
          <div className="relative z-10 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-white font-label-sm text-label-sm opacity-80">
              <Link to="/" className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                <span className="material-symbols-outlined text-sm">arrow_back</span>
              </Link>
              <span>Início</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="font-bold">Equipe de Campo</span>
            </div>
            <div className="flex justify-between items-end mt-4">
              <div>
                <h1 className="text-white font-headline-lg text-headline-lg-mobile md:text-headline-lg mb-1">App Equipes</h1>
                <p className="text-white font-body-sm text-body-sm opacity-90">{user?.full_name || 'Técnico de Campo'}</p>
              </div>
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl text-white text-[13px] font-bold shadow-sm">
                <div className="w-2.5 h-2.5 bg-[#4ade80] rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                Online
              </div>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[18px] font-bold text-slate-800">Ordens de Serviço (OS)</h2>
          <span className="text-[12px] font-bold text-slate-600 bg-slate-50 px-3 py-1 rounded-lg">
            {occurrences.length} Pendentes
          </span>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
          </div>
        ) : occurrences.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-[#10b981]" />
            <p className="text-[16px] font-bold text-slate-800">Nenhuma OS pendente</p>
            <p className="text-[14px] text-slate-500 mt-1">Todas as ordens de serviço foram concluídas.</p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-4">
              {occurrences.map(occ => {
                const sla = calcSlaStatus(occ);
                const isExpanded = selectedOcc?.id === occ.id;
                const items = getChecklist(occ.category);
                const allChecked = items.every(item => checklist[item]);

                return (
                  <motion.div
                    key={occ.id}
                    initial={{opacity: 0, y: 10}}
                    animate={{opacity: 1, y: 0}}
                    layout
                  >
                    <Card className={`border shadow-sm rounded-xl overflow-hidden transition-all ${isExpanded ? 'shadow-md border-slate-500/40' : sla.status === 'vencido' ? 'border-red-300' : sla.status === 'critico' ? 'border-orange-300' : 'border-slate-200 hover:border-slate-300'}`}>
                      <CardContent className="p-0">
                        {/* OS Header */}
                        <div
                          className={`p-5 cursor-pointer transition-colors ${isExpanded ? 'bg-slate-50' : 'bg-white'}`} 
                          onClick={() => setSelectedOcc(isExpanded ? null : occ)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-[12px] font-black text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md">
                                  #{occ.id.substring(0, 6)}
                                </span>
                                <CategoryBadge category={occ.category} />
                              </div>
                              <p className="text-[15px] font-bold text-slate-800 leading-tight mb-2">
                                {occ.title || occ.description?.substring(0, 60)}
                              </p>
                              {occ.address && (
                                <p className="text-[13px] font-medium text-slate-500 flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5" />
                                  {occ.address}{occ.neighborhood ? ` · ${occ.neighborhood}` : ''}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-3">
                              <SLABadge occurrence={occ} />
                              <div className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${isExpanded ? 'bg-slate-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded OS */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{opacity: 0, height: 0}}
                              animate={{opacity: 1, height: 'auto'}}
                              exit={{opacity: 0, height: 0}}
                              className="px-5 pb-5 pt-2 bg-slate-50 space-y-5 overflow-hidden border-t border-slate-200"
                            >
                              {/* Description */}
                              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2">Descrição da Ocorrência</p>
                                <p className="text-[14px] text-slate-700 font-medium">{occ.description}</p>
                              </div>

                              {/* Navigate */}
                              {occ.latitude && occ.longitude && (
                                <a
                                  href={`https://www.google.com/maps/dir/?api=1&destination=${occ.latitude},${occ.longitude}`}
                                  target="_blank" rel="noopener noreferrer" className="block"
                                >
                                  <Button variant="outline" className="w-full h-12 gap-2 rounded-xl text-[14px] font-bold border-slate-500 text-slate-600 hover:bg-slate-500 hover:text-white transition-all shadow-sm">
                                    <Navigation className="w-4 h-4" />
                                    Navegar até o local pelo Maps
                                  </Button>
                                </a>
                              )}

                              {/* Checklist */}
                              <div>
                                <p className="text-[13px] font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                                  <CheckSquare className="w-4 h-4 text-slate-600" /> Checklist Operacional
                                </p>
                                <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                  {items.map(item => (
                                    <label key={item} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                                      <div
                                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all
                                        ${checklist[item] ? 'bg-slate-500 border-slate-500 shadow-[0_2px_8px_rgba(0,192,117,0.3)]' : 'border-slate-300'}`}
                                      >
                                        {checklist[item] && <CheckCircle2 className="w-4 h-4 text-white" />}
                                      </div>
                                      <span className={`text-[14px] font-medium transition-all ${checklist[item] ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                        {item}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>

                              {/* After Photos */}
                              <div>
                                <p className="text-[13px] font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                                  <Camera className="w-4 h-4 text-slate-600" /> Fotos Após Execução
                                </p>
                                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                  <PhotoUploader photos={afterPhotos} setPhotos={setAfterPhotos} maxPhotos={3} />
                                </div>
                              </div>

                              {/* Notes */}
                              <div>
                                <p className="text-[13px] font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                                  <FileText className="w-4 h-4 text-slate-600" /> Relatório da OS
                                </p>
                                <Textarea
                                  placeholder="Descreva o serviço executado, materiais utilizados, observações gerais..." value={notes}
                                  onChange={e => setNotes(e.target.value)}
                                  className="min-h-[100px] text-[14px] rounded-xl shadow-sm border-slate-200 focus:border-slate-500 focus:ring-slate-500"
                                />
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-3 pt-2">
                                <Button
                                  variant="outline" className="flex-1 h-12 gap-2 rounded-xl font-bold text-slate-700 border-slate-300 hover:bg-slate-100" onClick={() => handleStartOS(occ)}
                                >
                                  <Play className="w-4 h-4" />
                                  Iniciar
                                </Button>
                                <Button
                                  className="flex-[2] h-12 gap-2 rounded-xl font-bold shadow-[0_4px_14px_rgba(0,192,117,0.39)] transition-all" 
                                  disabled={saving || !allChecked}
                                  onClick={() => handleComplete(occ)}
                                >
                                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                  {allChecked ? 'Finalizar OS' : 'Complete o Checklist'}
                                </Button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
