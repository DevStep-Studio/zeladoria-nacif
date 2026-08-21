export const CATEGORIES = {
 limpeza_publica: {
  label: 'Limpeza Pública',
  icon: 'Trash2',
  color: 'text-emerald-700 bg-emerald-50 border-emerald-100',
  button: 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300',
  selected: 'border-emerald-600 bg-emerald-100 text-emerald-900 ring-2 ring-emerald-500/20',
  iconBox: 'bg-emerald-100 text-emerald-700',
 },
 poste_apagado: {
  label: 'Poste Apagado',
  icon: 'Lightbulb',
  color: 'text-yellow-700 bg-yellow-50 border-yellow-100',
  button: 'border-yellow-200 bg-yellow-50 text-yellow-900 hover:bg-yellow-100 hover:border-yellow-300',
  selected: 'border-yellow-500 bg-yellow-100 text-yellow-950 ring-2 ring-yellow-500/25',
  iconBox: 'bg-yellow-100 text-yellow-700',
 },
 buraco_na_rua: {
  label: 'Buraco na Rua',
  icon: 'Wrench',
  color: 'text-orange-800 bg-orange-50 border-orange-100',
  button: 'border-orange-200 bg-orange-50 text-orange-900 hover:bg-orange-100 hover:border-orange-300',
  selected: 'border-orange-600 bg-orange-100 text-orange-950 ring-2 ring-orange-500/20',
  iconBox: 'bg-orange-100 text-orange-700',
 },
 vazamento: {
  label: 'Vazamento',
  icon: 'Droplets',
  color: 'text-sky-700 bg-sky-50 border-sky-100',
  button: 'border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100 hover:border-sky-300',
  selected: 'border-sky-600 bg-sky-100 text-sky-950 ring-2 ring-sky-500/20',
  iconBox: 'bg-sky-100 text-sky-700',
 },
 poda_de_arvore: {
  label: 'Poda de Árvore',
  icon: 'TreePine',
  color: 'text-green-800 bg-green-50 border-green-100',
  button: 'border-green-200 bg-green-50 text-green-900 hover:bg-green-100 hover:border-green-300',
  selected: 'border-green-700 bg-green-100 text-green-950 ring-2 ring-green-600/20',
  iconBox: 'bg-green-100 text-green-800',
 },
 denuncia: {
  label: 'Denúncia',
  icon: 'ShieldAlert',
  color: 'text-red-700 bg-red-50 border-red-100',
  button: 'border-red-200 bg-red-50 text-red-900 hover:bg-red-100 hover:border-red-300',
  selected: 'border-red-600 bg-red-100 text-red-950 ring-2 ring-red-500/20',
  iconBox: 'bg-red-100 text-red-700',
 },
 saude_publica: {label: 'Saúde Pública', icon: 'Heart', color: 'text-pink-600 bg-pink-50 border-pink-100'},
 matricula_escolar: {label: 'Matrícula Escolar', icon: 'GraduationCap', color: 'text-indigo-600 bg-indigo-50 border-indigo-100'},
 transito: {
  label: 'Trânsito',
  icon: 'Car',
  color: 'text-violet-700 bg-violet-50 border-violet-100',
  button: 'border-violet-200 bg-violet-50 text-violet-900 hover:bg-violet-100 hover:border-violet-300',
  selected: 'border-violet-600 bg-violet-100 text-violet-950 ring-2 ring-violet-500/20',
  iconBox: 'bg-violet-100 text-violet-700',
 },
 enchente: {
  label: 'Enchente/Alagamento',
  icon: 'Waves',
  color: 'text-blue-800 bg-blue-50 border-blue-100',
  button: 'border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-100 hover:border-blue-300',
  selected: 'border-blue-700 bg-blue-100 text-blue-950 ring-2 ring-blue-600/20',
  iconBox: 'bg-blue-100 text-blue-800',
 },
 vandalismo: {
  label: 'Vandalismo',
  icon: 'Hammer',
  color: 'text-zinc-700 bg-zinc-100 border-zinc-200',
  button: 'border-zinc-200 bg-zinc-50 text-zinc-800 hover:bg-zinc-100 hover:border-zinc-300',
  selected: 'border-zinc-700 bg-zinc-100 text-zinc-950 ring-2 ring-zinc-500/20',
  iconBox: 'bg-zinc-100 text-zinc-700',
 },
};

export const CITIZEN_OCCURRENCE_CATEGORY_IDS = [
 'limpeza_publica',
 'poste_apagado',
 'buraco_na_rua',
 'vazamento',
 'poda_de_arvore',
 'denuncia',
 'transito',
 'enchente',
 'vandalismo',
];

export const CITIZEN_OCCURRENCE_CATEGORIES = CITIZEN_OCCURRENCE_CATEGORY_IDS.map(id => ({
 id,
 ...CATEGORIES[id],
}));

export const OCCURRENCE_STATUS_FLOW = [
 'registrada',
 'recebida',
 'em_triagem',
 'encaminhada',
 'aguardando_vistoria',
 'programada',
 'em_execucao',
 'aguardando_material',
 'concluida',
 'nao_procedente',
 'duplicada',
 'cancelada',
 'reaberta',
];

export const LEGACY_STATUS_MAP = {
 aberto: 'registrada',
 em_analise: 'em_triagem',
 equipe_enviada: 'em_execucao',
 resolvido: 'concluida',
};

export const STATUS_CONFIG = {
 registrada: {label: 'Registrada', color: 'bg-sky-100 text-sky-700 border-sky-200', markerColor: '#0284c7'},
 recebida: {label: 'Recebida', color: 'bg-blue-100 text-blue-700 border-blue-200', markerColor: '#2563eb'},
 em_triagem: {label: 'Em triagem', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', markerColor: '#ca8a04'},
 encaminhada: {label: 'Encaminhada', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', markerColor: '#4f46e5'},
 aguardando_vistoria: {label: 'Aguardando vistoria', color: 'bg-orange-100 text-orange-700 border-orange-200', markerColor: '#ea580c'},
 programada: {label: 'Programada', color: 'bg-violet-100 text-violet-700 border-violet-200', markerColor: '#7c3aed'},
 em_execucao: {label: 'Em execução', color: 'bg-cyan-100 text-cyan-700 border-cyan-200', markerColor: '#0891b2'},
 aguardando_material: {label: 'Aguardando material', color: 'bg-amber-100 text-amber-700 border-amber-200', markerColor: '#d97706'},
 concluida: {label: 'Concluída', color: 'bg-green-100 text-green-700 border-green-200', markerColor: '#16a34a'},
 nao_procedente: {label: 'Não procedente', color: 'bg-slate-100 text-slate-700 border-slate-200', markerColor: '#64748b'},
 duplicada: {label: 'Duplicada', color: 'bg-purple-100 text-purple-700 border-purple-200', markerColor: '#9333ea'},
 cancelada: {label: 'Cancelada', color: 'bg-zinc-100 text-zinc-700 border-zinc-200', markerColor: '#71717a'},
 reaberta: {label: 'Reaberta', color: 'bg-red-100 text-red-700 border-red-200', markerColor: '#dc2626'},
 aberto: {label: 'Registrada', color: 'bg-sky-100 text-sky-700 border-sky-200', markerColor: '#0284c7', legacy: true},
 em_analise: {label: 'Em triagem', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', markerColor: '#ca8a04', legacy: true},
 equipe_enviada: {label: 'Em execução', color: 'bg-cyan-100 text-cyan-700 border-cyan-200', markerColor: '#0891b2', legacy: true},
 resolvido: {label: 'Concluída', color: 'bg-green-100 text-green-700 border-green-200', markerColor: '#16a34a', legacy: true},
};

export const PUBLIC_STATUS_OPTIONS = Object.entries(STATUS_CONFIG)
 .filter(([, value]) => !value.legacy);

export const STATUS_GROUPS = {
 abertas: {
 label: 'Abertas',
 statuses: ['registrada', 'recebida', 'em_triagem', 'reaberta', 'aberto'],
},
 andamento: {
 label: 'Em andamento',
 statuses: ['encaminhada', 'aguardando_vistoria', 'programada', 'em_execucao', 'aguardando_material', 'em_analise', 'equipe_enviada'],
},
 concluidas: {
 label: 'Concluídas',
 statuses: ['concluida', 'nao_procedente', 'duplicada', 'resolvido'],
},
 canceladas: {
 label: 'Canceladas',
 statuses: ['cancelada'],
},
};

export const CLOSED_STATUSES = ['concluida', 'nao_procedente', 'duplicada', 'cancelada', 'resolvido'];
export const RESOLVED_STATUSES = ['concluida', 'resolvido'];
export const CANCELLED_STATUSES = ['cancelada'];

export function normalizeStatus(status) {
 return LEGACY_STATUS_MAP[status] || status || 'registrada';
}

export function getStatusGroup(status) {
 const normalized = normalizeStatus(status);
 if (CANCELLED_STATUSES.includes(normalized)) return 'canceladas';
 if (['concluida', 'nao_procedente', 'duplicada'].includes(normalized)) return 'concluidas';
 if (['encaminhada', 'aguardando_vistoria', 'programada', 'em_execucao', 'aguardando_material'].includes(normalized)) return 'andamento';
 return 'abertas';
}

export function isClosedStatus(status) {
 return CLOSED_STATUSES.includes(status) || CLOSED_STATUSES.includes(normalizeStatus(status));
}

export function isResolvedStatus(status) {
 return RESOLVED_STATUSES.includes(status) || RESOLVED_STATUSES.includes(normalizeStatus(status));
}

export function isCancelledStatus(status) {
 return CANCELLED_STATUSES.includes(status) || CANCELLED_STATUSES.includes(normalizeStatus(status));
}

export const PRIORITY_CONFIG = {
 baixa: {label: 'Baixa', color: 'bg-slate-100 text-slate-600', score: 1},
 media: {label: 'Média', color: 'bg-yellow-100 text-yellow-700', score: 2},
 alta: {label: 'Alta', color: 'bg-orange-100 text-orange-700', score: 3},
 urgente: {label: 'Urgente', color: 'bg-red-100 text-red-700', score: 4},
 critica: {label: 'Crítica', color: 'bg-red-900 text-red-100', score: 5},
};

// SLA por categoria em horas
export const SLA_CONFIG = {
 limpeza_publica: {atendimento: 4, resolucao: 12, label: '12h'},
 poste_apagado: {atendimento: 8, resolucao: 24, label: '24h'},
 buraco_na_rua: {atendimento: 24, resolucao: 72, label: '72h'},
 vazamento: {atendimento: 2, resolucao: 8, label: '8h'},
 poda_de_arvore: {atendimento: 24, resolucao: 96, label: '96h'},
 denuncia: {atendimento: 4, resolucao: 48, label: '48h'},
 saude_publica: {atendimento: 1, resolucao: 4, label: '4h'},
 matricula_escolar: {atendimento: 24, resolucao: 72, label: '72h'},
 transito: {atendimento: 2, resolucao: 12, label: '12h'},
 enchente: {atendimento: 0.5, resolucao: 6, label: '6h'},
 vandalismo: {atendimento: 8, resolucao: 48, label: '48h'},
};

// Calcula status SLA de uma ocorrência
export function calcSlaStatus(occurrence) {
 if (!occurrence || isClosedStatus(occurrence.status)) return {status: 'ok', label: 'Concluído', hoursLeft: null};
 const sla = SLA_CONFIG[occurrence.category];
 if (!sla) return {status: 'ok', label: '-', hoursLeft: null};
 const created = new Date(occurrence.created_date);
 const now = new Date();
 const hoursElapsed = (now.getTime() - created.getTime()) / 3600000;
 const hoursLeft = sla.resolucao - hoursElapsed;
 if (hoursLeft < 0) return {status: 'vencido', label:`${Math.abs(Math.floor(hoursLeft))}h atrasado`, hoursLeft};
 if (hoursLeft < sla.resolucao * 0.2) return {status: 'critico', label:`${Math.floor(hoursLeft)}h restantes`, hoursLeft};
 if (hoursLeft < sla.resolucao * 0.5) return {status: 'alerta', label:`${Math.floor(hoursLeft)}h restantes`, hoursLeft};
 return {status: 'ok', label:`${Math.floor(hoursLeft)}h restantes`, hoursLeft};
}

// Motor de priorização por IA (heurística inteligente)
export function calcSmartPriority(occurrence, allOccurrences = []) {
 let score = 0;
 const cat = occurrence.category;
 // Base por categoria
 const catScores = {
 saude_publica: 5, vazamento: 5, enchente: 5, buraco_na_rua: 4,
 poste_apagado: 3, transito: 3, denuncia: 3, limpeza_publica: 2,
 poda_de_arvore: 2, vandalismo: 2, matricula_escolar: 1,
};
 score += (catScores[cat] || 2);
 // Recorrência no bairro
 if (occurrence.neighborhood) {
 const sameBairro = allOccurrences.filter(o =>
 o.neighborhood === occurrence.neighborhood && o.category === cat && o.id !== occurrence.id
 ).length;
 score += Math.min(sameBairro, 3);
}
 // Tempo sem resolução
 const hoursOld = (new Date().getTime() - new Date(occurrence.created_date).getTime()) / 3600000;
 if (hoursOld > 72) score += 2;
 else if (hoursOld > 24) score += 1;
 // Mapeia score para prioridade
 if (score >= 9) return 'critica';
 if (score >= 7) return 'urgente';
 if (score >= 5) return 'alta';
 if (score >= 3) return 'media';
 return 'baixa';
}
