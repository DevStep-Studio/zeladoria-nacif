import React, {useState, useEffect} from 'react';
import {useNavigate, Link} from 'react-router-dom';
import {appApi} from '@/services/app-api';
import {useAuth} from '@/lib/AuthContext';
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Label} from "@/components/ui/label";
import {Heart, GraduationCap, AlertTriangle, Camera, MapPin, Loader2, icons} from 'lucide-react';
import {toast} from "sonner";
import {CITIZEN_OCCURRENCE_CATEGORIES} from '@/lib/constants';
import {
  calculateSpamScore,
  createHistoryEntry,
  createTimelineEvent,
  estimateDeadline,
  generateProtocolNumber,
  validateAttachmentFiles
} from '@/lib/occurrences';
import {
  MUNICIPALITY_CONFIG,
  getCoordinateValidationMessage,
  isValidCoordinate,
  resolveMunicipalCoordinates
} from '@/lib/municipality';

const SPECIAL_CATEGORIES = {
  saude_publica: {
    path: '/saude-publica', 
    label: 'Saúde Pública', 
    icon: Heart, 
    desc: 'Consultas e médicos disponíveis',
    color: 'bg-rose-50 hover:bg-rose-100 text-rose-700',
    iconColor: 'text-rose-500'
  },
  matricula_escolar: {
    path: '/matricula-escolar', 
    label: 'Matrícula Escolar', 
    icon: GraduationCap, 
    desc: 'Vagas nas escolas municipais',
    color: 'bg-blue-50 hover:bg-blue-100 text-blue-700',
    iconColor: 'text-blue-500'
  },
};

export default function NewOccurrence() {
  const navigate = useNavigate();
  const {user} = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [form, setForm] = useState({title: '', description: '', category: '', address: '', photos: [], latitude: null, longitude: null});
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [autoFilled, setAutoFilled] = useState({ title: true, desc: true });

  useEffect(() => {
    if (form.category) {
      const catLabel = CITIZEN_OCCURRENCE_CATEGORIES.find(c => c.id === form.category)?.label || '';
      const shortAddress = form.address ? form.address.split(',')[0] : '';
      const defaultTitle = `Problema com ${catLabel}` + (shortAddress ? ` - ${shortAddress}` : '');
      const defaultDesc = `Gostaria de relatar um problema de ${catLabel}${form.address ? ` no endereço: ${form.address}` : ' nesta localização'}. Solicito verificação e providências da equipe responsável.`;

      setForm(prev => {
        const next = { ...prev };
        if (next.title === '' || autoFilled.title) {
          next.title = defaultTitle;
        }
        if (next.description === '' || autoFilled.desc) {
          next.description = defaultDesc;
        }
        return next;
      });
    }
  }, [form.category, form.address]);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const locationMessage = getCoordinateValidationMessage(pos.coords.latitude, pos.coords.longitude);
        if (!locationMessage) {
          setForm(prev => ({...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude}));
        }
      },
      () => {}
    );
  }, []);

  const handlePhotoCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const {validFiles, errors} = validateAttachmentFiles([file], form.photos.length, 5);
    errors.forEach(error => toast.error(error));
    if (validFiles.length === 0) {
      e.target.value = '';
      return;
    }

    setUploadingPhoto(true);
    try {
      const {file_url} = await appApi.integrations.Core.UploadFile({file});
      setForm(prev => ({...prev, photos: [...prev.photos, file_url]}));
    } catch (err) {
      toast.error('Erro ao enviar foto. Tente novamente.');
      setUploadingPhoto(false);
      e.target.value = '';
      return;
    }
    setUploadingPhoto(false);
    e.target.value = '';
    
    if (navigator.geolocation) {
      setFetchingLocation(true);
      toast.loading('Buscando endereço da foto...', {id: 'geo-toast'});
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const locationMessage = getCoordinateValidationMessage(lat, lon);
          if (locationMessage) {
            toast.error(locationMessage, {id: 'geo-toast'});
            setFetchingLocation(false);
            return;
          }

          setForm(prev => ({...prev, latitude: lat, longitude: lon}));
          
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=pt-br`);
            const data = await res.json();
            if (data && data.display_name) {
              const parts = [];
              if (data.address) {
                const { road, suburb, neighbourhood, city_district, city, town, village, municipality } = data.address;
                if (road) parts.push(road);
                const bairro = suburb || neighbourhood || city_district;
                if (bairro) parts.push(bairro);
                const cidade = city || town || village || municipality;
                if (cidade) parts.push(cidade);
              }
              const finalAddress = parts.length > 0 ? parts.join(', ') : data.display_name;
              setForm(prev => ({...prev, address: finalAddress}));
              toast.success('Endereço preenchido automaticamente!', {id: 'geo-toast'});
            } else {
              toast.dismiss('geo-toast');
            }
          } catch (err) {
            toast.error('Erro ao buscar endereço.', {id: 'geo-toast'});
          } finally {
            setFetchingLocation(false);
          }
        },
        () => {
          toast.error('Permissão de localização negada.', {id: 'geo-toast'});
          setFetchingLocation(false);
        }
      );
    }
  };

  const validate = () => {
    if (!form.category) {toast.error('Selecione uma categoria'); return false;}
    if (!form.title.trim()) {toast.error('Digite um título'); return false;}
    if (!form.description.trim()) {toast.error('Descreva o problema'); return false;}
    if (form.description.trim().length < 20) {toast.error('Descreva o problema com pelo menos 20 caracteres'); return false;}
    if (isValidCoordinate(form.latitude, form.longitude)) {
      const locationMessage = getCoordinateValidationMessage(form.latitude, form.longitude);
      if (locationMessage) {
        toast.error(locationMessage);
        return false;
      }
    }
    const spamScore = calculateSpamScore(form);
    if (spamScore >= 5) {
      toast.error('Revise o relato antes de enviar. Muitos envios repetitivos ou links podem ser bloqueados.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const now = new Date();
      const protocolNumber = generateProtocolNumber(now);
      const [latitude, longitude] = resolveMunicipalCoordinates(form.latitude, form.longitude);
      const hasDeviceLocation = isValidCoordinate(form.latitude, form.longitude);
      const payload = {
        ...form,
        latitude,
        longitude,
        status: 'registrada',
        priority: 'media',
        protocol_number: protocolNumber,
        municipality_name: MUNICIPALITY_CONFIG.name,
        location_source: hasDeviceLocation ? 'device' : 'municipality_fallback',
        estimated_deadline: estimateDeadline(form.category, now),
        support_count: 0,
        spam_score: calculateSpamScore(form),
        last_public_update: now.toISOString(),
        timeline: [
          createTimelineEvent({
            status: 'registrada',
            title: 'Ocorrência registrada',
            description: `Protocolo ${protocolNumber} aberto pelo cidadão.${hasDeviceLocation ? '' : ` Localização enviada para triagem no ponto central de ${MUNICIPALITY_CONFIG.name}.`}`,
            actorRole: 'cidadao',
            createdAt: now.toISOString(),
          }),
        ],
        change_history: [
          createHistoryEntry({
            action: 'created',
            description: 'Ocorrência registrada pelo cidadão.',
            actorRole: 'cidadao',
            createdAt: now.toISOString(),
          }),
        ],
      };

      const created = await appApi.entities.Occurrence.create(payload);
      await appApi.entities.AuditLog.create({
        user_email: user?.email || 'cidadao',
        action: 'occurrence_created',
        entity_type: 'Occurrence',
        entity_id: created?.id,
        new_data: {protocol_number: protocolNumber, category: form.category, status: 'registrada', location_source: hasDeviceLocation ? 'device' : 'municipality_fallback'},
        description: `Ocorrência ${protocolNumber} registrada pelo cidadão.`,
      });
      toast.success(`Ocorrência registrada: ${protocolNumber}`);
      setTimeout(() => navigate(created?.id ? `/ocorrencia/${created.id}` : '/minhas-ocorrencias'), 1000);
    } catch(err) {
      toast.error('Erro ao registrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="w-full max-w-max-width mx-auto px-margin-mobile md:px-container-padding py-8 pb-32 md:pb-12">
        
        {/* Hero Banner */}
        <section className="bg-primary rounded-xl p-8 mb-8 relative overflow-hidden flex flex-col justify-center min-h-[160px] shadow-sm">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[200px]">add_location</span>
          </div>
          
          <div className="relative z-10 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-white font-label-sm text-label-sm opacity-80">
              <Link to="/" className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                <span className="material-symbols-outlined text-sm">arrow_back</span>
              </Link>
              <span>Início</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="font-bold">Nova Ocorrência</span>
            </div>
            
            <div className="flex justify-between items-end mt-4">
              <div>
                <h1 className="text-white font-headline-lg text-headline-lg-mobile md:text-headline-lg mb-1">Nova Ocorrência</h1>
                <p className="text-white font-body-sm text-body-sm opacity-90">Identificou um problema? Ajude a melhorar a cidade.</p>
              </div>
              <Link to="/" className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors text-white">
                <span className="material-symbols-outlined">home</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Special Categories Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {Object.entries(SPECIAL_CATEGORIES).map(([key, cfg]) => (
            <button key={key} type="button" onClick={() => navigate(cfg.path)}
              className={`${cfg.color} p-4 rounded-[20px] transition-all flex items-center gap-4 text-left shadow-sm hover:shadow-md`}>
              <div className={`w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm ${cfg.iconColor}`}>
                <cfg.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-[16px] leading-tight mb-0.5">{cfg.label}</h3>
                <p className="text-[13px] opacity-80 leading-snug">{cfg.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-slate-200 mb-20">
          <h2 className="text-[22px] font-bold text-slate-900 mb-1.5 leading-tight">Nova Ocorrência</h2>
          <p className="text-slate-600 text-[15px] mb-8">Registre um problema na sua cidade</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Category Selection */}
            <div className="space-y-3">
              <Label className="text-[14px] font-bold text-slate-900">Categoria *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {CITIZEN_OCCURRENCE_CATEGORIES.map((cat) => {
                  const isSelected = form.category === cat.id;
                  const IconComp = icons[cat.icon] || AlertTriangle;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setForm(prev => ({...prev, category: cat.id}))}
                      aria-label={`Selecionar categoria ${cat.label}`}
                      aria-pressed={isSelected}
                      className={`min-h-[104px] flex flex-col items-center justify-center gap-2.5 p-3 sm:p-4 rounded-[12px] border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary active:scale-[0.98] ${isSelected ? cat.selected : cat.button}`}
                    >
                      <span className={`w-11 h-11 rounded-full flex items-center justify-center ${cat.iconBox}`}>
                        <IconComp className="w-5 h-5" strokeWidth={isSelected ? 2.5 : 2} />
                      </span>
                      <span className="text-[12px] font-bold leading-tight text-center text-balance">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title Input */}
            <div className="space-y-2">
              <Label className="text-[14px] font-bold text-slate-900">Título *</Label>
              <Input 
                placeholder="Ex: Buraco grande na Rua Principal" 
                value={form.title} 
                onChange={(e) => {
                  setForm(prev => ({...prev, title: e.target.value}));
                  setAutoFilled(prev => ({...prev, title: false}));
                }} 
                className="h-12 rounded-[12px] border-slate-200 bg-white focus-visible:ring-primary focus-visible:border-primary text-[15px] placeholder:text-slate-400"
              />
            </div>

            {/* Description Textarea */}
            <div className="space-y-2">
              <Label className="text-[14px] font-bold text-slate-900">Descrição *</Label>
              <Textarea 
                placeholder="Descreva o problema com detalhes..." 
                value={form.description} 
                onChange={(e) => {
                  setForm(prev => ({...prev, description: e.target.value}));
                  setAutoFilled(prev => ({...prev, desc: false}));
                }} 
                className="min-h-[100px] rounded-[12px] border-slate-200 bg-white focus-visible:ring-primary focus-visible:border-primary text-[15px] placeholder:text-slate-400 resize-none p-4" 
              />
            </div>

            {/* Photo Capture */}
            <div className="space-y-3">
              <Label className="text-[14px] font-bold text-slate-900">Foto do Problema</Label>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {form.photos.map((url, i) => (
                  <div key={i} className="relative w-24 h-24 shrink-0 rounded-[12px] border border-slate-200 overflow-hidden shadow-sm">
                    <img src={url} alt={`Foto ${i}`} className="w-full h-full object-cover" />
                  </div>
                ))}
                <label className="flex flex-col items-center justify-center w-24 h-24 shrink-0 rounded-[12px] border-2 border-dashed border-primary/40 bg-primary/5 text-primary cursor-pointer hover:bg-primary/10 transition-colors">
                  {uploadingPhoto ? <Loader2 className="w-6 h-6 mb-1 animate-spin" /> : <Camera className="w-6 h-6 mb-1" />}
                  <span className="text-[10px] font-bold uppercase tracking-wide">{uploadingPhoto ? 'Enviando' : 'Tirar Foto'}</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" capture="environment" className="hidden" onChange={handlePhotoCapture} disabled={uploadingPhoto} />
                </label>
              </div>
              <p className="text-[12px] text-slate-500">Formatos aceitos: JPG, PNG, WEBP ou GIF. Máximo de 10MB por arquivo.</p>
            </div>

            {/* Address Input */}
            <div className="space-y-2">
              <Label className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
                Localização (Opcional) {fetchingLocation && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                <Input 
                  placeholder="Endereço aproximado" 
                  value={form.address} 
                  onChange={(e) => setForm(prev => ({...prev, address: e.target.value}))} 
                  className="pl-11 h-12 rounded-[12px] border-slate-200 bg-white focus-visible:ring-primary focus-visible:border-primary text-[15px] placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={loading || uploadingPhoto} 
              className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-[16px] rounded-[12px] mt-2 transition-colors">
              {loading ? 'Enviando...' : 'Enviar Ocorrência'}
            </Button>

          </form>
        </div>

      </div>
    </div>
  );
}
