import React, {useState} from 'react';
import {createPortal} from 'react-dom';
import {AlertTriangle, MapPin, Shield, Phone, Loader2, X, CheckCircle2} from 'lucide-react';
import {appApi} from '@/services/app-api';
import {toast} from 'sonner';
import {createHistoryEntry, createTimelineEvent, estimateDeadline, generateProtocolNumber} from '@/lib/occurrences';
import {MUNICIPALITY_CONFIG, getCoordinateValidationMessage, isValidCoordinate, resolveMunicipalCoordinates} from '@/lib/municipality';

const SOS_OPTIONS = [
 {id: 'defesa_civil', label: 'Defesa Civil', icon: Shield, color: 'bg-blue-600', number: '199'},
 {id: 'guarda', label: 'Guarda Municipal', icon: Shield, color: 'bg-green-600', number: '153'},
 {id: 'bombeiros', label: 'Bombeiros', icon: AlertTriangle, color: 'bg-red-600', number: '193'},
 {id: 'samu', label: 'SAMU', icon: Phone, color: 'bg-orange-600', number: '192'},
];

export default function SOSButton() {
 const [open, setOpen] = useState(false);
 const [sending, setSending] = useState(false);
 const [sent, setSent] = useState(false);
 const [location, setLocation] = useState(null);

 const getLocation = () => new Promise((res) => {
 navigator.geolocation?.getCurrentPosition(
 (p) => res({lat: p.coords.latitude, lng: p.coords.longitude}),
 () => res(null)
 );
});

 const sendAlert = async (type) => {
 setSending(true);
 const loc = await getLocation();
 setLocation(loc);
 const now = new Date();
 const protocolNumber = generateProtocolNumber(now);
 const locationMessage = loc ? getCoordinateValidationMessage(loc.lat, loc.lng) : null;
 const hasDeviceLocation = loc && isValidCoordinate(loc.lat, loc.lng) && !locationMessage;
 const [latitude, longitude] = hasDeviceLocation
 ? [loc.lat, loc.lng]
 : resolveMunicipalCoordinates(null, null);
 await appApi.entities.Occurrence.create({
 title:`ALERTA SOS - ${SOS_OPTIONS.find(o => o.id === type)?.label}`,
 description:`Alerta SOS enviado pelo cidadão. Tipo: ${type}. Localização: ${hasDeviceLocation ?`${loc.lat.toFixed(5)},${loc.lng.toFixed(5)}`: `não disponível, fallback municipal em ${MUNICIPALITY_CONFIG.name}`}`,
 category: 'denuncia',
 priority: 'urgente',
 status: 'registrada',
 protocol_number: protocolNumber,
 municipality_name: MUNICIPALITY_CONFIG.name,
 location_source: hasDeviceLocation ? 'device' : 'municipality_fallback',
 estimated_deadline: estimateDeadline('denuncia', now),
 timeline: [
 createTimelineEvent({
 status: 'registrada',
 title: 'Alerta SOS registrado',
 description: `Protocolo ${protocolNumber} aberto pelo botão SOS.`,
 actorRole: 'cidadao',
 createdAt: now.toISOString(),
 }),
 ],
 change_history: [
 createHistoryEntry({
 action: 'sos_created',
 description: 'Alerta SOS registrado pelo cidadão.',
 actorRole: 'cidadao',
 createdAt: now.toISOString(),
 }),
 ],
 latitude,
 longitude,
});
 setSending(false);
 setSent(true);
 toast.success(`Alerta SOS enviado: ${protocolNumber}`);
 setTimeout(() => {setSent(false); setOpen(false);}, 3000);
};

 return createPortal(
 <>
 {/* Floating SOS button */}
 <button
 onClick={() => setOpen(true)}
 aria-label="Abrir botão SOS"
 className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-4 md:bottom-8 md:left-8 z-[99999] w-16 h-16 rounded-full bg-red-600 text-white shadow-[0_10px_40px_-10px_rgba(220,38,38,0.8)] flex items-center justify-center font-bold text-sm border-4 border-white active:scale-95 hover:scale-105 transition-all animate-pulse-slow">
 <span className="text-[15px] font-black tracking-wider">SOS</span>
 </button>

 {/* Modal */}
 {open && (
 <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
 <div className="bg-card rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
 {/* Header */}
 <div className="bg-red-600 p-5 text-white relative">
 <button onClick={() => setOpen(false)} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
 <X className="w-4 h-4" />
 </button>
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
 <AlertTriangle className="w-6 h-6" />
 </div>
 <div>
 <h2 className="text-lg font-black">BOTÃO SOS</h2>
 <p className="text-xs text-red-100">Emergência Municipal</p>
 </div>
 </div>
 </div>

 <div className="p-5">
 {sent ? (
 <div className="text-center py-4 space-y-3">
 <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
 <CheckCircle2 className="w-8 h-8 text-green-600" />
 </div>
 <p className="font-bold text-green-700">Alerta Enviado!</p>
 <p className="text-sm text-muted-foreground">As autoridades foram notificadas com sua localização.</p>
 </div>
 ) : (
 <>
 <p className="text-sm text-muted-foreground mb-3">Para risco imediato, ligue para o órgão competente. O registro no app não substitui chamada telefônica de emergência.</p>
 <p className="text-sm font-semibold text-slate-700 mb-4">Selecione o tipo de emergência:</p>
 <div className="grid grid-cols-2 gap-3 mb-4">
 {SOS_OPTIONS.map(opt => (
 <button key={opt.id} onClick={() => sendAlert(opt.id)} disabled={sending}
 className={`${opt.color} text-white rounded-xl p-3 flex flex-col items-center gap-2 font-semibold text-sm disabled:opacity-60 transition-all active:scale-95 shadow-lg`}>
 {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <opt.icon className="w-5 h-5" />}
 {opt.label}
 <span className="text-xs font-bold opacity-80">{opt.number}</span>
 </button>
 ))}
 </div>
 <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted text-xs text-muted-foreground">
 <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
 Sua localização será compartilhada automaticamente
 </div>
 </>
 )}
 </div>
 </div>
 </div>
 )}
 </>,
 document.body
 );
}
