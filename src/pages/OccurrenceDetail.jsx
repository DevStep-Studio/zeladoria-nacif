import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useParams, Link} from 'react-router-dom';
import {appApi} from '@/services/app-api';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useAuth} from '@/lib/AuthContext';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {Badge} from '@/components/ui/badge';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Bell,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  History,
  Image as ImageIcon,
  Loader2,
  MapPin,
  MessageSquare,
  Paperclip,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
  Star,
  ThumbsUp,
  Users,
  Video,
  icons
} from 'lucide-react';
import {format, formatDistanceToNow} from 'date-fns';
import {ptBR} from 'date-fns/locale';
import {toast} from 'sonner';
import OccurrenceMap from '@/components/shared/OccurrenceMap';
import StatusBadge from '@/components/shared/StatusBadge';
import CategoryBadge from '@/components/shared/CategoryBadge';
import {
  CATEGORIES,
  OCCURRENCE_STATUS_FLOW,
  STATUS_CONFIG,
  isCancelledStatus,
  isClosedStatus,
  isResolvedStatus,
  normalizeStatus
} from '@/lib/constants';
import {
  buildOccurrenceTimeline,
  createHistoryEntry,
  createTimelineEvent,
  getOccurrenceTitle,
  getProtocolNumber,
  getStatusLabel,
  splitMediaUrls,
  validateAttachmentFiles
} from '@/lib/occurrences';

const MUNICIPAL_ROLES = ['super_admin', 'admin', 'gestor', 'atendente', 'fiscal', 'equipe', 'equipe_campo'];

const ROLE_LABELS = {
  cidadao: 'Morador',
  prefeitura: 'Prefeitura',
  equipe: 'Equipe de campo',
  sistema: 'Sistema',
};

export default function OccurrenceDetail() {
  const {id} = useParams();
  const {user} = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [autoAddress, setAutoAddress] = useState('');
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [reopenReason, setReopenReason] = useState('');
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState('');

  const isMunicipal = MUNICIPAL_ROLES.includes(user?.role);

  const occurrenceQuery = useQuery({
    queryKey: ['occurrence', id],
    queryFn: () => appApi.entities.Occurrence.filter({id}, '-created_date', 1),
    enabled: !!id,
  });

  const occ = occurrenceQuery.data?.[0];
  const isOwner = !!user?.email && occ?.created_by === user.email;

  const commentsQuery = useQuery({
    queryKey: ['occurrence-comments', id],
    queryFn: () => appApi.entities.OccurrenceComment.filter({occurrence_id: id}, 'created_date', 200),
    enabled: !!occ?.id,
  });

  const supportsQuery = useQuery({
    queryKey: ['occurrence-supports', id],
    queryFn: () => appApi.entities.OccurrenceSupport.filter({occurrence_id: id}, '-created_date', 500),
    enabled: !!occ?.id,
  });

  const departmentsQuery = useQuery({
    queryKey: ['detail-departments'],
    queryFn: () => appApi.entities.Department.list(),
    enabled: isMunicipal,
  });

  const teamsQuery = useQuery({
    queryKey: ['detail-teams'],
    queryFn: () => appApi.entities.Team.list(),
    enabled: isMunicipal,
  });

  const comments = commentsQuery.data || [];
  const supports = supportsQuery.data || [];
  const hasSupported = supports.some(support => support.created_by === user?.email);
  const supportCount = Math.max(occ?.support_count || 0, supports.length);

  const department = departmentsQuery.data?.find(dep => dep.id === occ?.department_id);
  const team = teamsQuery.data?.find(item => item.id === occ?.team_id);

  const timeline = useMemo(() => buildOccurrenceTimeline(occ, comments), [occ, comments]);

  const changeHistory = useMemo(() => {
    return (occ?.change_history || [])
      .filter(item => item?.is_public !== false || isMunicipal)
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }, [occ?.change_history, isMunicipal]);

  useEffect(() => {
    if (occ && !occ.address?.trim() && occ.latitude && occ.longitude) {
      setIsFetchingAddress(true);

      const getAddress = async () => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${occ.latitude}&lon=${occ.longitude}&zoom=18&addressdetails=1&accept-language=pt-br&email=suporte@zeldoria.com`);
          if (!res.ok) throw new Error('Nominatim failed');
          const data = await res.json();

          if (data?.display_name) {
            const parts = [];
            if (data.address) {
              const {road, suburb, neighbourhood, city_district, city, town, village, municipality} = data.address;
              if (road) parts.push(road);
              const bairro = suburb || neighbourhood || city_district;
              if (bairro) parts.push(bairro);
              const cidade = city || town || village || municipality;
              if (cidade) parts.push(cidade);
            }
            setAutoAddress(parts.length > 0 ? parts.join(', ') : data.display_name);
            return;
          }
          throw new Error('No data');
        } catch {
          try {
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${occ.latitude}&longitude=${occ.longitude}&localityLanguage=pt-br`);
            const data = await res.json();
            const loc = data.locality || data.city || '';
            const state = data.principalSubdivision || '';
            setAutoAddress(loc ? `${loc}${state ? `, ${state}` : ''}` : 'Endereço não encontrado');
          } catch (fallbackErr) {
            console.error('Geocoding failed:', fallbackErr);
            setAutoAddress('Erro ao buscar endereço');
          }
        } finally {
          setIsFetchingAddress(false);
        }
      };

      getAddress();
    }
  }, [occ]);

  const invalidateDetail = () => {
    queryClient.invalidateQueries({queryKey: ['occurrence', id]});
    queryClient.invalidateQueries({queryKey: ['occurrence-comments', id]});
    queryClient.invalidateQueries({queryKey: ['occurrence-supports', id]});
    queryClient.invalidateQueries({queryKey: ['my-occurrences']});
    queryClient.invalidateQueries({queryKey: ['notifications']});
  };

  const writeAudit = async ({action, description, oldData = undefined, newData = undefined}) => {
    try {
      await appApi.entities.AuditLog.create({
        user_email: user?.email || 'sistema',
        action,
        entity_type: 'Occurrence',
        entity_id: occ?.id,
        old_data: oldData,
        new_data: newData,
        description,
      });
    } catch (err) {
      console.error('Audit log failed:', err);
    }
  };

  const notifyCitizen = async ({title, message, type = 'status_update'}) => {
    if (!occ?.created_by || occ.created_by === user?.email) return;
    try {
      await appApi.entities.Notification.create({
        user_email: occ.created_by,
        title,
        message,
        type,
        occurrence_id: occ.id,
        priority: 'info',
      });
    } catch (err) {
      console.error('Notification failed:', err);
    }
  };

  const updateOccurrence = async ({data, action, description, notify = false}) => {
    const nextHistory = [
      ...(occ.change_history || []),
      createHistoryEntry({
        action,
        description,
        actorRole: isMunicipal ? 'prefeitura' : 'cidadao',
        oldValue: data.status ? occ.status : undefined,
        newValue: data.status,
      }),
    ];

    await appApi.entities.Occurrence.update(occ.id, {
      ...data,
      change_history: nextHistory,
      last_public_update: new Date().toISOString(),
    });

    await writeAudit({
      action,
      description,
      oldData: {status: occ.status, rating: occ.rating, resolution_confirmed: occ.resolution_confirmed},
      newData: data,
    });

    if (notify) {
      await notifyCitizen({title: 'Atualização no protocolo', message: description});
    }
  };

  const supportMutation = useMutation({
    mutationFn: async () => {
      if (hasSupported) return;
      await appApi.entities.OccurrenceSupport.create({
        occurrence_id: occ.id,
        neighborhood: user?.neighborhood || occ.neighborhood,
      });

      try {
        await appApi.entities.Occurrence.update(occ.id, {support_count: supportCount + 1});
      } catch {
        // Support is stored even when the occurrence itself cannot be denormalized by RLS.
      }

      await writeAudit({
        action: 'occurrence_supported',
        description: `Apoio registrado para o protocolo ${getProtocolNumber(occ)}.`,
        newData: {occurrence_id: occ.id},
      });
    },
    onSuccess: () => {
      toast.success('Apoio registrado.');
      invalidateDetail();
    },
    onError: () => toast.error('Não foi possível registrar o apoio.'),
  });

  const commentMutation = useMutation({
    mutationFn: /** @param {any} payload */ async (payload) => {
      const {eventType = 'citizen_update', message, files} = payload;
      const attachments = [];
      const attachmentTypes = [];

      for (const file of files) {
        const {file_url} = await appApi.integrations.Core.UploadFile({file});
        attachments.push(file_url);
        attachmentTypes.push(file.type);
      }

      const authorRole = isMunicipal ? (['equipe', 'equipe_campo'].includes(user?.role) ? 'equipe' : 'prefeitura') : 'cidadao';
      const visibility = isMunicipal ? 'private' : 'private';

      await appApi.entities.OccurrenceComment.create({
        occurrence_id: occ.id,
        message,
        author_role: authorRole,
        visibility,
        target_user_email: isMunicipal ? occ.created_by : undefined,
        attachments,
        attachment_types: attachmentTypes,
        event_type: eventType,
      });

      const historyDescription = eventType === 'citizen_update'
        ? 'Informações adicionais foram anexadas ao protocolo.'
        : 'Novo comentário registrado no protocolo.';

      try {
        await updateOccurrence({
          data: {
            timeline: [
              ...(occ.timeline || []),
              createTimelineEvent({
                status: occ.status,
                title: eventType === 'citizen_update' ? 'Informações adicionadas' : 'Comentário registrado',
                description: historyDescription,
                actorRole: authorRole,
              }),
            ],
          },
          action: eventType,
          description: historyDescription,
          notify: isMunicipal,
        });
      } catch {
        await writeAudit({
          action: eventType,
          description: historyDescription,
          newData: {occurrence_id: occ.id, attachments: attachments.length},
        });
      }
    },
    onSuccess: () => {
      setCommentText('');
      setSelectedFiles([]);
      toast.success('Informação adicionada ao protocolo.');
      invalidateDetail();
    },
    onError: () => toast.error('Não foi possível enviar a informação.'),
  });

  const actionMutation = useMutation({
    mutationFn: /** @param {any} payload */ async (payload) => {
      const {type} = payload;
      const now = new Date().toISOString();

      if (type === 'confirm_resolution') {
        await updateOccurrence({
          data: {
            resolution_confirmed: true,
            resolution_confirmed_date: now,
            timeline: [
              ...(occ.timeline || []),
              createTimelineEvent({
                status: occ.status,
                title: 'Resolução confirmada',
                description: 'O morador confirmou que o problema foi solucionado.',
                actorRole: 'cidadao',
                createdAt: now,
              }),
            ],
          },
          action: 'resolution_confirmed',
          description: 'Morador confirmou a resolução da ocorrência.',
        });

        await appApi.entities.OccurrenceComment.create({
          occurrence_id: occ.id,
          message: 'O morador confirmou que o problema foi resolvido.',
          author_role: 'cidadao',
          visibility: 'private',
          target_user_email: occ.created_by,
          event_type: 'resolution_confirmation',
        });
        return;
      }

      if (type === 'reopen') {
        if (reopenReason.trim().length < 10) {
          throw new Error('Informe o motivo da reabertura com pelo menos 10 caracteres.');
        }

        await updateOccurrence({
          data: {
            status: 'reaberta',
            resolution_confirmed: false,
            reopened_count: (occ.reopened_count || 0) + 1,
            reopen_reason: reopenReason.trim(),
            timeline: [
              ...(occ.timeline || []),
              createTimelineEvent({
                status: 'reaberta',
                title: 'Ocorrência reaberta',
                description: reopenReason.trim(),
                actorRole: 'cidadao',
                createdAt: now,
              }),
            ],
          },
          action: 'occurrence_reopened',
          description: 'Morador reabriu a ocorrência informando que o problema não foi solucionado.',
          notify: true,
        });

        await appApi.entities.OccurrenceComment.create({
          occurrence_id: occ.id,
          message: reopenReason.trim(),
          author_role: 'cidadao',
          visibility: 'private',
          target_user_email: occ.created_by,
          event_type: 'reopen_request',
        });
        return;
      }

      if (type === 'rate') {
        if (!ratingValue) throw new Error('Selecione uma avaliação de 1 a 5 estrelas.');

        await updateOccurrence({
          data: {
            rating: ratingValue,
            rating_comment: ratingComment.trim(),
            rating_date: now,
          },
          action: 'occurrence_rated',
          description: `Morador avaliou o atendimento com ${ratingValue} estrela${ratingValue > 1 ? 's' : ''}.`,
        });

        await appApi.entities.OccurrenceComment.create({
          occurrence_id: occ.id,
          message: ratingComment.trim() || `Avaliação registrada: ${ratingValue} de 5 estrelas.`,
          author_role: 'cidadao',
          visibility: 'private',
          target_user_email: occ.created_by,
          event_type: 'rating',
        });
      }
    },
    onSuccess: () => {
      setReopenReason('');
      setRatingComment('');
      toast.success('Ação registrada.');
      invalidateDetail();
    },
    onError: (error) => toast.error(error.message || 'Não foi possível completar a ação.'),
  });

  const handleFileSelect = (event) => {
    const {validFiles, errors} = validateAttachmentFiles(event.target.files, selectedFiles.length);
    errors.forEach(error => toast.error(error));
    setSelectedFiles(prev => [...prev, ...validFiles]);
    event.target.value = '';
  };

  const submitComment = () => {
    const message = commentText.trim();
    if (message.length < 5 && selectedFiles.length === 0) {
      toast.error('Escreva uma informação ou anexe um arquivo.');
      return;
    }
    commentMutation.mutate({eventType: 'citizen_update', message: message || 'Anexo enviado pelo morador.', files: selectedFiles});
  };

  if (occurrenceQuery.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (occurrenceQuery.isError) {
    return (
      <StateMessage
        icon={RefreshCw}
        title="Erro ao carregar o protocolo"
        description="Tente novamente em instantes."
        action={<Button variant="outline" onClick={() => occurrenceQuery.refetch()}>Recarregar</Button>}
      />
    );
  }

  if (!occ) {
    return (
      <StateMessage
        icon={AlertCircle}
        title="Protocolo não encontrado"
        description="A ocorrência pode ter sido removida ou você não tem permissão para acessá-la."
        action={<Button asChild variant="outline"><Link to="/minhas-ocorrencias">Voltar</Link></Button>}
      />
    );
  }

  const statusConfig = STATUS_CONFIG[occ.status] || STATUS_CONFIG[normalizeStatus(occ.status)] || STATUS_CONFIG.registrada;
  const categoryConfig = CATEGORIES[occ.category] || {label: occ.category, icon: 'FileText'};
  const IconComponent = icons[categoryConfig.icon] || icons.FileText;
  const address = occ.address || autoAddress;
  const protocol = getProtocolNumber(occ);
  const hasMedia = occ.photos?.length > 0 || occ.videos?.length > 0;
  const departmentName = occ.department_name || department?.name || (occ.department_id ? 'Secretaria definida pela prefeitura' : 'Aguardando triagem');
  const publicResponsible = occ.public_responsible_enabled && occ.public_responsible ? occ.public_responsible : null;
  const publicTeam = occ.team_name || (isMunicipal ? team?.name : null);
  const canOwnerAct = isOwner && !isCancelledStatus(occ.status);
  const canConfirmResolution = canOwnerAct && isResolvedStatus(occ.status) && !occ.resolution_confirmed;
  const canReopen = canOwnerAct && isClosedStatus(occ.status) && !isCancelledStatus(occ.status);
  const canRate = canOwnerAct && isClosedStatus(occ.status);

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-6 pb-32 md:pb-10">
        <div className="mb-5">
          <Link to="/minhas-ocorrencias" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors bg-white px-4 py-2 rounded-2xl shadow-sm border border-primary/20">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
        </div>

        <section className="bg-primary rounded-xl p-6 md:p-8 mb-6 relative overflow-hidden shadow-sm">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[220px]">fact_check</span>
          </div>
          <div className="relative z-10 grid lg:grid-cols-[1fr_auto] gap-5 items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-white/20 text-white">
                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.color.split(' ').find(item => item.startsWith('text-'))?.replace('text-', 'bg-') || 'bg-white'}`} />
                  {statusConfig.label}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-white/20 text-white">
                  <IconComponent className="w-3 h-3" />
                  {categoryConfig.label}
                </span>
              </div>
              <p className="text-white/80 text-[12px] font-black uppercase tracking-widest mb-2">{protocol}</p>
              <h1 className="text-white font-headline-lg text-headline-lg-mobile md:text-headline-lg leading-tight">
                {getOccurrenceTitle(occ)}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm mt-3">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {format(new Date(occ.created_date), "dd MMM yyyy 'às' HH:mm", {locale: ptBR})}
                </span>
                <span className="flex items-center gap-1.5">
                  <Bell className="w-4 h-4" />
                  Notificações pelo painel
                </span>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => supportMutation.mutate()}
              disabled={supportMutation.isPending || hasSupported}
              className="bg-white text-primary hover:bg-white/90 gap-2 rounded-xl font-bold min-w-[150px]"
            >
              {supportMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
              {hasSupported ? 'Apoiado' : 'Apoiar'} · {supportCount}
            </Button>
          </div>
        </section>

        <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)] gap-6">
          <div className="space-y-6">
            <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100 bg-white">
                <CardTitle className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Descrição
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-[14px] font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {occ.description || 'Nenhuma descrição fornecida para esta ocorrência.'}
                </p>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100 bg-white">
                <CardTitle className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  Fotos e vídeos
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {hasMedia ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {(occ.photos || []).map((url, index) => (
                      <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group">
                        <img src={url} alt={`Foto da ocorrência ${index + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </a>
                    ))}
                    {(occ.videos || []).map((url, index) => (
                      <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-900 text-white flex flex-col items-center justify-center gap-2">
                        <Video className="w-8 h-8" />
                        <span className="text-xs font-bold">Vídeo {index + 1}</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 rounded-xl bg-slate-50 border border-dashed border-slate-200">
                    <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-500">Nenhuma mídia anexada ao registro inicial.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100 bg-white z-10 relative">
                <CardTitle className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Endereço e localização
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-5 border-b border-slate-100">
                  <p className="text-[14px] font-bold text-slate-800 leading-snug">
                    {address || (isFetchingAddress ? (
                      <span className="flex items-center gap-2 italic text-slate-500 font-normal">
                        <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        Buscando endereço pelo mapa...
                      </span>
                    ) : (
                      <span className="italic text-slate-500 font-normal">Endereço não informado</span>
                    ))}
                  </p>
                  {occ.neighborhood && <p className="text-[13px] font-medium text-slate-500 mt-1">{occ.neighborhood}</p>}
                </div>
                {occ.latitude && occ.longitude && (
                  <OccurrenceMap occurrences={[occ]} center={[occ.latitude, occ.longitude]} zoom={16} height="260px" />
                )}
              </CardContent>
            </Card>

            <CommentsCard
              comments={comments}
              isLoading={commentsQuery.isLoading}
              commentText={commentText}
              setCommentText={setCommentText}
              selectedFiles={selectedFiles}
              setSelectedFiles={setSelectedFiles}
              fileInputRef={fileInputRef}
              handleFileSelect={handleFileSelect}
              submitComment={submitComment}
              isSubmitting={commentMutation.isPending}
            />
          </div>

          <div className="space-y-6">
            <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100 bg-white">
                <CardTitle className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Dados do atendimento
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 grid gap-3">
                <InfoRow icon={FileText} label="Protocolo" value={protocol} strong />
                <InfoRow icon={Activity} label="Status" value={<StatusBadge status={occ.status} />} />
                <InfoRow icon={IconComponent} label="Categoria" value={<CategoryBadge category={occ.category} />} />
                <InfoRow icon={FileText} label="Subcategoria" value={occ.subcategory || 'Não informada'} />
                <InfoRow icon={Building2} label="Secretaria responsável" value={departmentName} />
                <InfoRow icon={Users} label="Responsável atual" value={publicResponsible || publicTeam || 'Não publicado'} />
                <InfoRow
                  icon={CalendarClock}
                  label="Prazo estimado"
                  value={occ.estimated_deadline ? format(new Date(occ.estimated_deadline), "dd/MM/yyyy 'às' HH:mm", {locale: ptBR}) : 'Aguardando definição'}
                />
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100 bg-white">
                <CardTitle className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Linha do tempo completa
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <Timeline events={timeline} currentStatus={occ.status} />
              </CardContent>
            </Card>

            {(canConfirmResolution || canReopen || canRate || occ.rating) && (
              <CitizenActions
                occ={occ}
                canConfirmResolution={canConfirmResolution}
                canReopen={canReopen}
                canRate={canRate}
                reopenReason={reopenReason}
                setReopenReason={setReopenReason}
                ratingValue={ratingValue}
                setRatingValue={setRatingValue}
                ratingComment={ratingComment}
                setRatingComment={setRatingComment}
                actionMutation={actionMutation}
              />
            )}

            <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100 bg-white">
                <CardTitle className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  Histórico de alterações
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {changeHistory.length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhuma alteração pública registrada além da abertura.</p>
                ) : (
                  <div className="space-y-3">
                    {changeHistory.map((item, index) => (
                      <div key={`${item.action}-${item.created_at}-${index}`} className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[13px] font-bold text-slate-800">{item.description || item.action}</p>
                          {item.created_at && (
                            <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">
                              {format(new Date(item.created_at), 'dd/MM HH:mm')}
                            </span>
                          )}
                        </div>
                        {(item.old_value || item.new_value) && (
                          <p className="text-[12px] text-slate-500 mt-1">
                            {item.old_value ? getStatusLabel(item.old_value) : '-'} -&gt; {item.new_value ? getStatusLabel(item.new_value) : '-'}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function StateMessage({icon: Icon, title, description, action}) {
  return (
    <div className="min-h-screen bg-slate-50/50 flex items-center justify-center px-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center max-w-md">
        <Icon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h1 className="text-lg font-bold text-slate-800">{title}</h1>
        <p className="text-sm text-slate-500 mt-1 mb-5">{description}</p>
        {action}
      </div>
    </div>
  );
}

function InfoRow({icon: Icon, label, value, strong = false}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-100 p-3">
      <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-primary shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{label}</p>
        <div className={`text-[14px] text-slate-700 mt-0.5 ${strong ? 'font-black' : 'font-semibold'}`}>{value}</div>
      </div>
    </div>
  );
}

function Timeline({events, currentStatus}) {
  const normalizedCurrent = normalizeStatus(currentStatus);
  const currentIndex = OCCURRENCE_STATUS_FLOW.indexOf(normalizedCurrent);

  if (events.length === 0) {
    return <p className="text-sm text-slate-500">Nenhum evento registrado.</p>;
  }

  return (
    <div className="space-y-5">
      <div className="relative pl-3">
        <div className="absolute top-4 bottom-4 left-[27px] w-0.5 bg-slate-100 z-0" />
        <div className="space-y-5 relative z-10">
          {events.map((event, index) => {
            const statusIndex = OCCURRENCE_STATUS_FLOW.indexOf(normalizeStatus(event.status));
            const current = statusIndex >= 0 && statusIndex === currentIndex;
            const Icon = event.status === 'concluida' ? CheckCircle2 : event.status === 'reaberta' ? RotateCcw : Activity;
            return (
              <div key={`${event.title}-${event.created_at}-${index}`} className="flex items-start gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-[3px] bg-white transition-all ${
                  current ? 'border-primary bg-primary text-white shadow-md scale-110' : 'border-primary/30 text-primary'
                }`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="pt-0.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className={`text-[14px] font-bold ${current ? 'text-primary' : 'text-slate-800'}`}>
                      {event.title || getStatusLabel(event.status)}
                    </h4>
                    {current && <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-lg">Atual</span>}
                    <Badge variant="outline" className="text-[10px] h-5 bg-white">
                      {ROLE_LABELS[event.actor_role] || event.actor_role || 'Sistema'}
                    </Badge>
                  </div>
                  {event.description && <p className="text-[12px] font-medium text-slate-500 mt-0.5">{event.description}</p>}
                  {event.created_at && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      {format(new Date(event.created_at), "dd/MM/yyyy 'às' HH:mm", {locale: ptBR})}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CommentsCard({
  comments,
  isLoading,
  commentText,
  setCommentText,
  selectedFiles,
  setSelectedFiles,
  fileInputRef,
  handleFileSelect,
  submitComment,
  isSubmitting
}) {
  return (
    <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden">
      <CardHeader className="pb-3 border-b border-slate-100 bg-white">
        <CardTitle className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          Comentários e informações adicionais
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-5">
        <div className="space-y-3">
          <Textarea
            value={commentText}
            onChange={event => setCommentText(event.target.value)}
            placeholder="Adicione informações úteis para a prefeitura..."
            className="min-h-[96px] rounded-xl border-slate-200 resize-none"
            maxLength={1200}
          />
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,application/pdf"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="w-4 h-4" />
              Anexar
            </Button>
            <Button type="button" size="sm" className="gap-2" onClick={submitComment} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar
            </Button>
            <span className="text-[12px] text-slate-500">Até 5 arquivos, 10MB cada.</span>
          </div>

          {selectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <button
                  key={`${file.name}-${index}`}
                  type="button"
                  onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                  className="text-[12px] font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg hover:bg-slate-200"
                >
                  {file.name} x
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 pt-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 rounded-xl bg-slate-50 border border-dashed border-slate-200">
              <MessageSquare className="w-9 h-9 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-500">Nenhum comentário registrado.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map(comment => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CommentItem({comment}) {
  const media = splitMediaUrls(comment.attachments || [], comment.attachment_types || []);
  const role = ROLE_LABELS[comment.author_role] || 'Participante';

  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-[13px] font-bold text-slate-800">{role}</p>
          {comment.created_date && (
            <p className="text-[11px] text-slate-400">
              {formatDistanceToNow(new Date(comment.created_date), {addSuffix: true, locale: ptBR})}
            </p>
          )}
        </div>
        <Badge variant="outline" className="text-[10px] h-5 bg-white">
          {comment.event_type === 'citizen_update' ? 'Atualização' : 'Comentário'}
        </Badge>
      </div>
      <p className="text-[14px] text-slate-600 whitespace-pre-wrap">{comment.message}</p>

      {(media.photos.length > 0 || media.videos.length > 0 || media.attachments.length > 0) && (
        <div className="flex flex-wrap gap-2 mt-3">
          {media.photos.map((url, index) => (
            <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-white">
              <img src={url} alt={`Anexo ${index + 1}`} className="w-full h-full object-cover" />
            </a>
          ))}
          {media.videos.map((url, index) => (
            <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="h-9 px-3 rounded-lg bg-slate-900 text-white flex items-center gap-2 text-xs font-bold">
              <Video className="w-3.5 h-3.5" />
              Vídeo {index + 1}
            </a>
          ))}
          {media.attachments.map((url, index) => (
            <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="h-9 px-3 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center gap-2 text-xs font-bold">
              <Paperclip className="w-3.5 h-3.5" />
              Anexo {index + 1}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function CitizenActions({
  occ,
  canConfirmResolution,
  canReopen,
  canRate,
  reopenReason,
  setReopenReason,
  ratingValue,
  setRatingValue,
  ratingComment,
  setRatingComment,
  actionMutation
}) {
  return (
    <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden">
      <CardHeader className="pb-3 border-b border-slate-100 bg-white">
        <CardTitle className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          Ações do morador
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-5">
        {canConfirmResolution && (
          <div className="rounded-xl border border-green-100 bg-green-50 p-4 space-y-3">
            <p className="text-sm font-bold text-green-800">O problema foi resolvido?</p>
            <Button
              type="button"
              className="w-full gap-2 bg-green-600 hover:bg-green-700"
              onClick={() => actionMutation.mutate({type: 'confirm_resolution'})}
              disabled={actionMutation.isPending}
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirmar resolução
            </Button>
          </div>
        )}

        {canReopen && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 space-y-3">
            <p className="text-sm font-bold text-red-800">Ainda não foi solucionado?</p>
            <Textarea
              value={reopenReason}
              onChange={event => setReopenReason(event.target.value)}
              placeholder="Explique o que ainda precisa ser resolvido..."
              className="min-h-[80px] rounded-xl bg-white border-red-100"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 border-red-200 text-red-700 hover:bg-red-100"
              onClick={() => actionMutation.mutate({type: 'reopen'})}
              disabled={actionMutation.isPending}
            >
              <RotateCcw className="w-4 h-4" />
              Reabrir ocorrência
            </Button>
          </div>
        )}

        {canRate && (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-slate-800">Avaliação do atendimento</p>
              {occ.rating && <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">{occ.rating}/5</Badge>}
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingValue(star)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white transition-colors"
                  aria-label={`Avaliar com ${star} estrela${star > 1 ? 's' : ''}`}
                >
                  <Star className={`w-6 h-6 ${star <= (ratingValue || occ.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
                </button>
              ))}
            </div>
            <Textarea
              value={ratingComment}
              onChange={event => setRatingComment(event.target.value)}
              placeholder={occ.rating_comment || 'Comentário opcional sobre o atendimento...'}
              className="min-h-[70px] rounded-xl bg-white border-slate-200"
            />
            <Button
              type="button"
              className="w-full gap-2"
              onClick={() => actionMutation.mutate({type: 'rate'})}
              disabled={actionMutation.isPending}
            >
              <Star className="w-4 h-4" />
              {occ.rating ? 'Atualizar avaliação' : 'Enviar avaliação'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
