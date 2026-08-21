import {CATEGORIES, STATUS_CONFIG, normalizeStatus} from '@/lib/constants';

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
export const MAX_CITIZEN_ATTACHMENTS = 5;

export const ACCEPTED_ATTACHMENT_TYPES = [
 'image/jpeg',
 'image/png',
 'image/webp',
 'image/gif',
 'video/mp4',
 'video/webm',
 'video/quicktime',
 'application/pdf',
];

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export function generateProtocolNumber(date = new Date()) {
 const y = date.getFullYear();
 const m = String(date.getMonth() + 1).padStart(2, '0');
 const d = String(date.getDate()).padStart(2, '0');
 const suffix = `${date.getTime().toString(36)}${Math.random().toString(36).slice(2, 5)}`.toUpperCase();
 return `ZEL-${y}${m}${d}-${suffix.slice(-6)}`;
}

export function getProtocolNumber(occurrence) {
 if (occurrence?.protocol_number) return occurrence.protocol_number;
 if (occurrence?.id) return `ZEL-${String(occurrence.id).slice(0, 8).toUpperCase()}`;
 return 'ZEL-000000';
}

export function getOccurrenceTitle(occurrence) {
 return occurrence?.title || occurrence?.description?.substring(0, 60) || 'Ocorrência sem título';
}

export function getCategoryLabel(category) {
 return CATEGORIES[category]?.label || category || 'Categoria não informada';
}

export function getStatusLabel(status) {
 const normalized = normalizeStatus(status);
 return STATUS_CONFIG[status]?.label || STATUS_CONFIG[normalized]?.label || status || 'Registrada';
}

export function estimateDeadline(category, createdDate = new Date()) {
 const base = new Date(createdDate);
 const hoursByCategory = {
  saude_publica: 4,
  vazamento: 8,
  enchente: 6,
  poste_apagado: 24,
  transito: 12,
  buraco_na_rua: 72,
  denuncia: 48,
  vandalismo: 48,
  limpeza_publica: 12,
  matricula_escolar: 72,
  poda_de_arvore: 96,
 };
 base.setHours(base.getHours() + (hoursByCategory[category] || 72));
 return base.toISOString();
}

export function createTimelineEvent({status, title, description, actorRole = 'sistema', createdAt = new Date().toISOString(), public: isPublic = true}) {
 return {
  status,
  title,
  description,
  actor_role: actorRole,
  created_at: createdAt,
  is_public: isPublic,
 };
}

export function createHistoryEntry({action, description, actorRole = 'sistema', oldValue = undefined, newValue = undefined, createdAt = new Date().toISOString(), public: isPublic = true}) {
 return {
  action,
  description,
  actor_role: actorRole,
  old_value: oldValue,
  new_value: newValue,
  created_at: createdAt,
  is_public: isPublic,
 };
}

export function buildOccurrenceTimeline(occurrence, comments = []) {
 if (!occurrence) return [];

 const events = [
  createTimelineEvent({
   status: 'registrada',
   title: 'Ocorrência registrada',
   description: 'Protocolo aberto pelo morador.',
   actorRole: 'cidadao',
   createdAt: occurrence.created_date,
  }),
 ];

 (occurrence.timeline || []).forEach(event => {
  if (event?.is_public === false) return;
  events.push({
   status: event.status || occurrence.status,
   title: event.title || getStatusLabel(event.status || occurrence.status),
   description: event.description || '',
   actor_role: event.actor_role || 'prefeitura',
   created_at: event.created_at || occurrence.updated_date || occurrence.created_date,
   is_public: event.is_public !== false,
  });
 });

 comments
  .filter(comment => ['citizen_update', 'status_response', 'resolution_confirmation', 'reopen_request', 'rating'].includes(comment.event_type))
  .forEach(comment => {
   const labels = {
    citizen_update: 'Informações adicionadas',
    status_response: 'Resposta da prefeitura',
    resolution_confirmation: 'Resolução confirmada',
    reopen_request: 'Reabertura solicitada',
    rating: 'Atendimento avaliado',
   };
   events.push({
    status: occurrence.status,
    title: labels[comment.event_type] || 'Atualização',
    description: comment.message,
    actor_role: comment.author_role || 'cidadao',
    created_at: comment.created_date,
    is_public: comment.visibility !== 'internal',
   });
  });

 if (occurrence.resolved_date) {
  events.push(createTimelineEvent({
   status: 'concluida',
   title: 'Ocorrência concluída',
   description: 'A prefeitura marcou o atendimento como concluído.',
   actorRole: 'prefeitura',
   createdAt: occurrence.resolved_date,
  }));
 }

 const seen = new Set();
 return events
  .filter(event => event.created_at)
  .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  .filter(event => {
   const key = `${event.title}-${event.description}-${event.created_at}`;
   if (seen.has(key)) return false;
   seen.add(key);
   return true;
  });
}

export function validateAttachmentFiles(files, currentCount = 0, maxFiles = MAX_CITIZEN_ATTACHMENTS) {
 const validFiles = [];
 const errors = [];

 Array.from(files || []).forEach(file => {
  if (currentCount + validFiles.length >= maxFiles) {
   errors.push(`Limite de ${maxFiles} anexos por envio atingido.`);
   return;
  }

  if (!ACCEPTED_ATTACHMENT_TYPES.includes(file.type)) {
   errors.push(`${file.name}: formato não permitido.`);
   return;
  }

  if (file.size > MAX_ATTACHMENT_SIZE) {
   errors.push(`${file.name}: tamanho acima de 10MB.`);
   return;
  }

  validFiles.push(file);
 });

 return {validFiles, errors};
}

export function splitMediaUrls(urls = [], types = []) {
 return urls.reduce((acc, url, index) => {
  const type = types[index] || '';
  if (VIDEO_TYPES.includes(type) || /\.(mp4|webm|mov)$/i.test(url)) {
   acc.videos.push(url);
  } else if (IMAGE_TYPES.includes(type) || /\.(jpe?g|png|webp|gif)$/i.test(url)) {
   acc.photos.push(url);
  } else {
   acc.attachments.push(url);
  }
  return acc;
 }, {photos: [], videos: [], attachments: []});
}

export function calculateSpamScore({title = '', description = '', category = '', address = ''}) {
 let score = 0;
 const text = `${title} ${description} ${address}`.trim().toLowerCase();
 if (description.trim().length < 20) score += 2;
 if (!category) score += 2;
 if (/(.)\1{8,}/.test(text)) score += 2;
 if ((text.match(/https?:\/\//g) || []).length > 1) score += 3;
 if (text.split(/\s+/).length < 6) score += 1;
 return score;
}
