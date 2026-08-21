import React, {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  CloudRain,
  Droplets,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Wind,
  Radio,
  Send,
  Bell,
  CheckCircle2,
  Compass,
  Info
} from 'lucide-react';
import {toast} from 'sonner';
import {appApi} from '@/services/app-api';
import {useAuth} from '@/lib/AuthContext';
import {createTimelineEvent, generateProtocolNumber} from '@/lib/occurrences';
import {MUNICIPALITY_CONFIG, isValidCoordinate, resolveMunicipalCoordinates} from '@/lib/municipality';
import {getLocationLabel, maskCep, normalizeState} from '@/lib/location';
import {buildWeatherAlerts, fetchWeather, getMaxAlertLevel} from '@/lib/weather';
import {useUserLocation} from '@/hooks/use-user-location';

const ALERT_LEVELS = {
  verde: { label: 'Normal', color: 'bg-emerald-500', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200', desc: 'Condições meteorológicas estáveis sem riscos identificados.' },
  amarelo: { label: 'Atenção', color: 'bg-amber-400', textColor: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200', desc: 'Possibilidade de chuvas e instabilidade. Mantenha acompanhamento.' },
  laranja: { label: 'Alerta / Perigo', color: 'bg-orange-500', textColor: 'text-orange-700', bgColor: 'bg-orange-50 border-orange-200', desc: 'Risco moderado a alto de chuvas volumosas, rajadas ou alagamentos pontuais.' },
  vermelho: { label: 'Emergência / Grande Perigo', color: 'bg-red-600', textColor: 'text-red-700', bgColor: 'bg-red-50 border-red-200', desc: 'Risco severo à vida e patrimônio. Siga imediatamente as ordens da Defesa Civil.' },
};

const DEFAULT_EMERGENCY_CONTACTS = [
  { name: 'Defesa Civil Municipal', number: '199', type: 'defesa_civil', description: 'Emergências, desastres e áreas de risco' },
  { name: 'Corpo de Bombeiros', number: '193', type: 'bombeiros', description: 'Resgates, afogamentos e incêndios' },
  { name: 'SAMU', number: '192', type: 'samu', description: 'Socorro médico e ambulância urgente' },
  { name: 'Guarda Civil Municipal', number: '153', type: 'guarda', description: 'Segurança e apoio comunitário' },
  { name: 'Polícia Militar', number: '190', type: 'policia', description: 'Emergência policial' },
];

const CONTACT_STYLES = {
  defesa_civil: {icon: Shield, color: 'bg-blue-600'},
  bombeiros: {icon: AlertTriangle, color: 'bg-red-600'},
  samu: {icon: Phone, color: 'bg-orange-600'},
  guarda: {icon: ShieldCheck, color: 'bg-emerald-700'},
  policia: {icon: ShieldAlert, color: 'bg-indigo-700'},
};

function normalizeText(value = '') {
 return String(value || '').trim().toLowerCase();
}

function matchesLocation(item, location) {
 if (!item) return false;
 if (!location?.city && !location?.state) return true;
 const itemState = normalizeState(item.state || '');
 const locationState = normalizeState(location.state || '');
 const itemCity = normalizeText(item.city);
 const locationCity = normalizeText(location.city);

 if (itemState && locationState && itemState !== locationState) return false;
 if (itemCity && locationCity && itemCity !== locationCity) return false;
 return true;
}

function isActiveByDate(item) {
 const now = new Date();
 if (item.active === false) return false;
 if (item.starts_at && new Date(item.starts_at) > now) return false;
 if (item.ends_at && new Date(item.ends_at) < now) return false;
 return true;
}

function mapDbAlert(alert) {
 return {
  id: alert.id,
  level: alert.level || 'amarelo',
  category: alert.category || 'Alerta Oficial',
  region: alert.region || [alert.city, alert.state].filter(Boolean).join(' - ') || 'Região cadastrada',
  title: alert.title || 'Alerta da Defesa Civil',
  message: alert.message || alert.title || 'Alerta ativo emitido pela Defesa Civil.',
  instructions: alert.instructions || 'Siga as recomendações de segurança e em caso de perigo ligue 199.',
  time: alert.updated_date
    ? new Date(alert.updated_date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})
    : '',
  active: alert.active !== false,
  source: alert.source || 'Defesa Civil Municipal (SMS 40199)',
 };
}

export default function DefesaCivil() {
  const {user, isSuperAdmin} = useAuth();
  const queryClient = useQueryClient();
  const {
    location,
    status: locationStatus,
    message: locationMessage,
    error: locationError,
    warning: locationWarning,
    isLoading: locationLoading,
    requestLocation,
    setManualLocation,
  } = useUserLocation({autoRequest: true, persistToProfile: true});

  const [loading, setLoading] = useState(false);
  const [expandedAlert, setExpandedAlert] = useState(null);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');
  const [manualForm, setManualForm] = useState({postalCode: '', city: '', state: ''});
  const [manualSaving, setManualSaving] = useState(false);
  
  // SMS 40199 state
  const [smsCep, setSmsCep] = useState(user?.postal_code ? maskCep(user.postal_code) : '');
  const [smsSubscribed, setSmsSubscribed] = useState(false);

  // Broadcast alert (Super Admin)
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    category: 'Alagamento & Tempestade',
    level: 'laranja',
    region: '',
    message: '',
    instructions: 'Evite áreas alagadas, fique longe de encostas e ligue 199 em emergências.',
  });
  const [broadcastLoading, setBroadcastLoading] = useState(false);

  const {data: dbAlerts = []} = useQuery({
    queryKey: ['civil-defense-alerts'],
    queryFn: async () => {
      try {
        return await appApi.entities.CivilDefenseAlert.list('-created_date', 100);
      } catch (error) {
        return [];
      }
    },
  });

  const {data: shelters = []} = useQuery({
    queryKey: ['civil-defense-shelters'],
    queryFn: async () => {
      try {
        return await appApi.entities.CivilDefenseShelter.list('name', 100);
      } catch (error) {
        return [];
      }
    },
  });

  const {data: contacts = []} = useQuery({
    queryKey: ['emergency-contacts'],
    queryFn: async () => {
      try {
        return await appApi.entities.EmergencyContact.list('sort_order', 100);
      } catch (error) {
        return [];
      }
    },
  });

  const loadWeather = async (targetLocation = location, force = false) => {
    if (!targetLocation || !isValidCoordinate(targetLocation.latitude, targetLocation.longitude)) {
      setWeather(null);
      setWeatherError('Informe seu endereço ou permita localização para consultar a previsão Climatempo.');
      return;
    }

    setWeatherLoading(true);
    setWeatherError('');
    try {
      const nextWeather = await fetchWeather({
        latitude: targetLocation.latitude,
        longitude: targetLocation.longitude,
        city: targetLocation.city,
        state: targetLocation.state,
        force,
      });
      setWeather(nextWeather);

      // Dispatch alert notification to notification center if severe
      if (nextWeather) {
        const generatedAlerts = buildWeatherAlerts(nextWeather);
        const severe = generatedAlerts.find(a => a.level === 'vermelho' || a.level === 'laranja');
        if (severe && user?.email) {
          try {
            await appApi.entities.Notification.create({
              user_email: user.email,
              title: `[DEFESA CIVIL] ${severe.title}`,
              message: severe.message,
              type: 'defesa_civil_alert',
              read: false,
            });
            queryClient.invalidateQueries({queryKey: ['notifications']});
          } catch {}
        }
      }
    } catch (error) {
      console.error(error);
      setWeather(null);
      setWeatherError(error?.message || 'Não foi possível consultar os radares meteorológicos.');
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    if (location?.latitude && location?.longitude) {
      loadWeather(location);
    }
  }, [location?.latitude, location?.longitude]);

  const weatherAlerts = useMemo(() => buildWeatherAlerts(weather), [weather]);
  const activeDbAlerts = useMemo(() => (
    dbAlerts
      .filter(alert => isActiveByDate(alert) && matchesLocation(alert, location))
      .map(mapDbAlert)
  ), [dbAlerts, location]);

  const activeAlerts = useMemo(() => [...activeDbAlerts, ...weatherAlerts], [activeDbAlerts, weatherAlerts]);
  const maxLevel = getMaxAlertLevel(activeAlerts);
  const levelData = ALERT_LEVELS[maxLevel];

  const matchingShelters = useMemo(() => (
    shelters.filter(shelter => shelter.active !== false && matchesLocation(shelter, location))
  ), [shelters, location]);

  const matchingContacts = useMemo(() => {
    const dbContacts = contacts.filter(contact => contact.active !== false && matchesLocation(contact, location));
    return dbContacts.length > 0 ? dbContacts : DEFAULT_EMERGENCY_CONTACTS;
  }, [contacts, location]);

  const handleSmsSubscribe = (e) => {
    e.preventDefault();
    if (!smsCep) return;
    setSmsSubscribed(true);
    toast.success(`Cadastro efetuado! Você receberá alertas SMS 40199 e notificações da Defesa Civil para o CEP ${smsCep}.`);
  };

  const handleBroadcastAlert = async (e) => {
    e.preventDefault();
    if (!broadcastForm.title || !broadcastForm.message) {
      toast.error('Preencha título e mensagem do alerta.');
      return;
    }

    setBroadcastLoading(true);
    try {
      const region = broadcastForm.region || location?.city || 'Toda a Cidade';
      
      // 1. Create civil defense alert entity
      await appApi.entities.CivilDefenseAlert.create({
        title: broadcastForm.title,
        message: broadcastForm.message,
        instructions: broadcastForm.instructions,
        level: broadcastForm.level,
        category: broadcastForm.category,
        region,
        city: location?.city || 'São Paulo',
        state: location?.state || 'SP',
        active: true,
        source: `Defesa Civil - Operador (${user?.full_name || 'Gabinete'})`,
      });

      // 2. Dispatch notification to user's notification center
      if (user?.email) {
        await appApi.entities.Notification.create({
          user_email: user.email,
          title: `[ALERTA OFICIAL ${broadcastForm.level.toUpperCase()}] ${broadcastForm.title}`,
          message: `${broadcastForm.message} - ${broadcastForm.instructions}`,
          type: 'defesa_civil_alert',
          read: false,
        });
      }

      queryClient.invalidateQueries({queryKey: ['civil-defense-alerts']});
      queryClient.invalidateQueries({queryKey: ['notifications']});

      toast.success('Alerta emitido e transmitido para as notificações da população!');
      setBroadcastOpen(false);
      setBroadcastForm({
        title: '',
        category: 'Alagamento & Tempestade',
        level: 'laranja',
        region: '',
        message: '',
        instructions: 'Evite áreas alagadas, fique longe de encostas e ligue 199 em emergências.',
      });
    } catch (err) {
      console.error(err);
      toast.error('Erro ao transmitir alerta.');
    } finally {
      setBroadcastLoading(false);
    }
  };

  const reportEmergency = async () => {
    setLoading(true);
    try {
      const currentLocation = location || await requestLocation({force: false});
      const [latitude, longitude] = currentLocation && isValidCoordinate(currentLocation.latitude, currentLocation.longitude)
        ? [currentLocation.latitude, currentLocation.longitude]
        : resolveMunicipalCoordinates(null, null);
      const now = new Date();
      const protocolNumber = generateProtocolNumber(now);

      await appApi.entities.Occurrence.create({
        title: 'EMERGÊNCIA DEFESA CIVIL (ALERTA CRÍTICO)',
        description: `Chamado prioritário aberto pelo cidadão na central da Defesa Civil. Endereço: ${getLocationLabel(currentLocation)}`,
        category: 'denuncia',
        priority: 'urgente',
        status: 'registrada',
        protocol_number: protocolNumber,
        municipality_name: MUNICIPALITY_CONFIG.name,
        latitude,
        longitude,
        neighborhood: currentLocation?.neighborhood || undefined,
        address: currentLocation?.address || undefined,
        timeline: [
          createTimelineEvent({
            status: 'registrada',
            title: 'Emergência acionada na Defesa Civil',
            description: `Protocolo ${protocolNumber} gerado em caráter de urgência.`,
            actorRole: 'cidadao',
            createdAt: now.toISOString(),
          }),
        ],
      });

      toast.success(`Chamado de emergência registrado: ${protocolNumber}. Uma equipe foi notificada.`);
    } catch (error) {
      toast.error('Não foi possível registrar o chamado. Em perigo imediato, disque 199 ou 193.');
    } finally {
      setLoading(false);
    }
  };

  const locationTitle = location ? getLocationLabel(location) : 'Localização não definida';
  const rainProbability = Math.max(...(weather?.hourly || []).map(hour => hour.rainProbability || 0), 0);
  const lastWeatherUpdate = weather?.lastUpdated
    ? new Date(weather.lastUpdated).toLocaleString('pt-BR', {dateStyle: 'short', timeStyle: 'short'})
    : null;

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-8 pb-32 md:pb-12 space-y-6">
        
        {/* Header Oficial Defesa Civil */}
        <section className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-2xl p-6 md:p-8 relative overflow-hidden flex flex-col justify-center min-h-[170px] shadow-sm text-white">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
            <Shield className="w-64 h-64 text-white" strokeWidth={1.25} />
          </div>
          <div className="relative z-10 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-white/85 text-xs font-semibold">
              <Link to="/" className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                ←
              </Link>
              <span>Início</span>
              <span>/</span>
              <span className="font-bold">Defesa Civil & Clima Oficial</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mt-2 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Defesa Civil & Monitoramento</h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold border border-white/30">
                    Ao Vivo
                  </span>
                </div>
                <p className="text-white/90 text-sm mt-1 max-w-xl">
                  Alertas em tempo real, radares meteorológicos confiáveis e orientações de prevenção para seu endereço.
                </p>
              </div>

              {/* Botão de Transmissão para Super Admin */}
              {isSuperAdmin && (
                <Button
                  onClick={() => setBroadcastOpen(o => !o)}
                  className="bg-slate-950 text-white hover:bg-slate-900 font-bold text-xs gap-2 rounded-xl h-10 shadow-md shrink-0 border border-amber-400/30"
                >
                  <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
                  {broadcastOpen ? 'Fechar Emissão' : 'Transmitir Alerta à População'}
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Painel do Operador Super Admin (Emissão de Alerta) */}
        {isSuperAdmin && broadcastOpen && (
          <Card className="border-2 border-amber-500 bg-slate-950 text-white shadow-xl rounded-2xl animate-in fade-in">
            <CardHeader className="pb-3 border-b border-slate-800">
              <CardTitle className="text-base flex items-center gap-2 text-amber-400">
                <Radio className="w-5 h-5 text-amber-400" />
                Painel do Super Admin: Transmissão de Alerta de Emergência
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleBroadcastAlert} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-bold text-slate-300">Título do Alerta *</Label>
                    <Input
                      placeholder="Ex: Risco Alto de Alagamento na Região Central"
                      value={broadcastForm.title}
                      onChange={(e) => setBroadcastForm(p => ({...p, title: e.target.value}))}
                      className="h-10 bg-slate-900 border-slate-700 text-white text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-300">Nível de Risco *</Label>
                    <Select
                      value={broadcastForm.level}
                      onValueChange={(val) => setBroadcastForm(p => ({...p, level: val}))}
                    >
                      <SelectTrigger className="h-10 bg-slate-900 border-slate-700 text-white text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="amarelo">Amarelo (Atenção)</SelectItem>
                        <SelectItem value="laranja">Laranja (Perigo)</SelectItem>
                        <SelectItem value="vermelho">Vermelho (Grande Perigo / Emergência)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-300">Categoria do Evento</Label>
                    <Input
                      value={broadcastForm.category}
                      onChange={(e) => setBroadcastForm(p => ({...p, category: e.target.value}))}
                      placeholder="Ex: Alagamento, Deslizamento, Vendaval"
                      className="h-10 bg-slate-900 border-slate-700 text-white text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-300">Bairros / Região Afetada</Label>
                    <Input
                      value={broadcastForm.region}
                      onChange={(e) => setBroadcastForm(p => ({...p, region: e.target.value}))}
                      placeholder="Ex: Zona Leste, Centro e Várzeas"
                      className="h-10 bg-slate-900 border-slate-700 text-white text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-300">Descrição do Alerta *</Label>
                  <Textarea
                    rows={2}
                    value={broadcastForm.message}
                    onChange={(e) => setBroadcastForm(p => ({...p, message: e.target.value}))}
                    placeholder="Descreva a previsão de risco e volume estimado de chuva..."
                    className="bg-slate-900 border-slate-700 text-white text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-300">Instruções de Segurança à População</Label>
                  <Input
                    value={broadcastForm.instructions}
                    onChange={(e) => setBroadcastForm(p => ({...p, instructions: e.target.value}))}
                    className="h-10 bg-slate-900 border-slate-700 text-white text-sm"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setBroadcastOpen(false)} className="border-slate-700 text-slate-300">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={broadcastLoading} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-2">
                    {broadcastLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Disparar Alerta nas Notificações
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Banner de Status Nível de Alerta Atual */}
        <div className={`rounded-2xl p-5 border ${levelData.bgColor} shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4`}>
          <div className="flex items-center gap-4 min-w-0">
            <div className={`w-14 h-14 rounded-2xl ${levelData.color} flex items-center justify-center shadow-md shrink-0`}>
              <AlertTriangle className="w-7 h-7 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-slate-900">Defesa Civil: Nível {levelData.label}</h2>
                <Badge className={`${levelData.bgColor} ${levelData.textColor} border font-bold text-xs px-2.5 py-0.5`}>
                  Oficial
                </Badge>
              </div>
              <p className="text-sm text-slate-700 font-medium">{levelData.desc}</p>
              <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">{locationLoading ? 'Sincronizando com seu endereço...' : locationTitle}</span>
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" className="gap-2 bg-white shadow-sm shrink-0" onClick={() => loadWeather(location, true)} disabled={locationLoading || weatherLoading}>
            {weatherLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Atualizar Radares
          </Button>
        </div>

        {/* Grid Principal: Clima Confiável Climatempo (Esq) + Alertas e Notificações (Dir) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Coluna Esquerda: Clima ao Vivo Climatempo & Previsão */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Card Climatempo & CPTEC/INMET */}
            <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
              <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 text-white relative">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-extrabold text-[11px] uppercase tracking-wider">
                        Fonte: Climatempo & CPTEC / INMET
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mt-2">{weather?.city || location?.city || 'Sua Cidade'} - {weather?.state || location?.state || 'SP'}</h3>
                    <p className="text-xs text-blue-100 mt-0.5">Radares Meteorológicos GOES-16 & Estações em Tempo Real</p>
                  </div>
                  <div className="text-right">
                    <span className="material-symbols-outlined text-[68px] text-blue-100 drop-shadow-sm leading-none" style={{fontVariationSettings: "'FILL' 1"}}>
                      {weather?.current?.info?.icon || 'cloud'}
                    </span>
                  </div>
                </div>

                {weather && (
                  <div className="mt-4 flex items-baseline gap-4">
                    <span className="text-6xl font-black tracking-tight">{weather.current.temperature}°</span>
                    <div>
                      <p className="text-lg font-bold text-white">{weather.current.info.label}</p>
                      <p className="text-xs text-blue-100">Sensação térmica: <strong>{weather.current.feelsLike}°C</strong></p>
                    </div>
                  </div>
                )}

                {/* Métricas Avançadas Climatempo */}
                {weather && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 border-t border-blue-400/30 pt-4 text-white">
                    <div className="bg-white/10 rounded-xl p-2.5">
                      <div className="flex items-center gap-1.5 text-blue-200 text-xs mb-1">
                        <Droplets className="w-3.5 h-3.5" /> Umidade
                      </div>
                      <p className="text-sm font-bold">{weather.current.humidity}%</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-2.5">
                      <div className="flex items-center gap-1.5 text-blue-200 text-xs mb-1">
                        <Wind className="w-3.5 h-3.5" /> Vento & Rajadas
                      </div>
                      <p className="text-sm font-bold">{weather.current.wind} km/h <span className="text-[10px] text-blue-200">({weather.current.windGusts} km/h)</span></p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-2.5">
                      <div className="flex items-center gap-1.5 text-blue-200 text-xs mb-1">
                        <CloudRain className="w-3.5 h-3.5" /> Chuva / mm
                      </div>
                      <p className="text-sm font-bold">{weather.current.rain} mm <span className="text-[10px] text-blue-200">({rainProbability}%)</span></p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-2.5">
                      <div className="flex items-center gap-1.5 text-blue-200 text-xs mb-1">
                        <Sun className="w-3.5 h-3.5" /> Índice UV
                      </div>
                      <p className="text-sm font-bold">{weather.hourly?.[0]?.uvIndex ?? 4} <span className="text-[10px] text-blue-200">Moderado</span></p>
                    </div>
                  </div>
                )}

                {lastWeatherUpdate && (
                  <p className="text-[11px] text-blue-200 mt-4 text-right">
                    Última sincronização com satélite: {lastWeatherUpdate}
                  </p>
                )}
              </div>

              {/* Previsão Hora a Hora */}
              {weather?.hourly && (
                <div className="p-5 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <CloudRain className="w-4 h-4 text-blue-600" /> Próximas Horas (Climatempo Forecast)
                  </p>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {weather.hourly.map(hour => (
                      <div key={hour.time} className="text-center rounded-xl bg-slate-50 border border-slate-100 p-2.5">
                        <p className="text-[11px] font-semibold text-slate-500">{hour.hour}</p>
                        <span className="material-symbols-outlined text-[24px] text-blue-600 my-1">{hour.info.icon}</span>
                        <p className="text-[13px] font-bold text-slate-800">{hour.temp}°</p>
                        <p className="text-[10px] text-blue-600 font-semibold">{hour.rainProbability}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Previsão dos Próximos 5 Dias */}
              {weather?.daily && (
                <div className="p-5 bg-slate-50/50">
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-blue-600" /> Tendência para os Próximos Dias
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {weather.daily.map(day => (
                      <div key={day.date} className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm text-center">
                        <p className="text-xs font-bold text-slate-700">{day.dayLabel}</p>
                        <span className="material-symbols-outlined text-[24px] text-amber-500 my-1">{day.info.icon}</span>
                        <div className="flex justify-center items-center gap-2 text-xs font-bold">
                          <span className="text-slate-900">{day.maxTemp}°</span>
                          <span className="text-slate-400 font-medium">{day.minTemp}°</span>
                        </div>
                        <p className="text-[10px] text-blue-600 font-medium mt-1">{day.rainProbability}% chuva</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Lista de Alertas Ativos da Região */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Alertas Ativos & Notificações Oficiais ({activeAlerts.length})
                </h3>
              </div>

              <div className="space-y-3">
                {activeAlerts.length === 0 ? (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 text-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                    <p className="font-bold text-slate-800 text-sm">Nenhum alerta crítico ativo no momento</p>
                    <p className="text-xs text-slate-500 mt-1">Sua região está sob condições normais de tempo e segurança.</p>
                  </div>
                ) : (
                  activeAlerts.map(alert => {
                    const lvl = ALERT_LEVELS[alert.level] || ALERT_LEVELS.amarelo;
                    const isExp = expandedAlert === alert.id;
                    return (
                      <article key={alert.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 transition-all hover:shadow-md">
                        <button
                          type="button"
                          className="w-full flex items-start gap-4 text-left focus:outline-none"
                          onClick={() => setExpandedAlert(isExp ? null : alert.id)}
                        >
                          <div className={`w-12 h-12 rounded-xl ${lvl.color} flex items-center justify-center shrink-0 shadow-sm`}>
                            <AlertTriangle className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <Badge className={`${lvl.bgColor} ${lvl.textColor} font-bold text-[10px] uppercase`}>
                                {lvl.label}
                              </Badge>
                              <span className="text-slate-300">·</span>
                              <span className="text-xs font-semibold text-slate-600">{alert.category || 'Alerta Meteorológico'}</span>
                              <span className="text-slate-300">·</span>
                              <span className="text-xs font-medium text-slate-500">{alert.region}</span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900">{alert.title || alert.message}</h4>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{alert.message}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-xs text-slate-400 font-semibold">{alert.time}</span>
                            <span className="text-xs text-primary font-bold">{isExp ? 'Menos' : 'Ver mais'}</span>
                          </div>
                        </button>

                        {isExp && (
                          <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                            <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700 space-y-1">
                              <p className="font-bold text-slate-900">Orientações de Segurança:</p>
                              <p>{alert.instructions || 'Mantenha distância de postes e árvores. Não atravesse trechos alagados.'}</p>
                              <p className="text-[11px] text-slate-500 pt-1">Fonte Oficial: {alert.source}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={reportEmergency}
                                disabled={loading}
                                className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white font-bold gap-1.5 rounded-xl"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Abrir Chamado de Emergência
                              </Button>
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })
                )}
              </div>
            </div>

            {/* Abrigos Municipais */}
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange-600" />
                Pontos de Apoio e Abrigos Municipais
              </h3>
              <div className="space-y-3">
                {matchingShelters.length === 0 ? (
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 text-xs text-slate-600">
                    Nenhum abrigo municipal em regime de acolhimento emergencial na sua área neste momento.
                  </div>
                ) : (
                  matchingShelters.map(shelter => {
                    const capacity = Number(shelter.capacity || 0);
                    const occupied = Number(shelter.occupied || 0);
                    const occupancy = capacity > 0 ? Math.min((occupied / capacity) * 100, 100) : 0;
                    return (
                      <article key={shelter.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">{shelter.name}</h4>
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" /> {shelter.address || [shelter.neighborhood, shelter.city].filter(Boolean).join(' - ')}
                            </p>
                            {shelter.phone && <p className="text-xs text-slate-500 mt-1">Contato: {shelter.phone}</p>}
                          </div>
                          <Badge className="text-[10px] px-2.5 font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Pronto Atendimento
                          </Badge>
                        </div>
                        {capacity > 0 && (
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-slate-500">Ocupação Atual</span>
                              <span className="font-bold text-slate-700">{occupied} / {capacity} vagas</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${occupancy > 80 ? 'bg-red-500' : 'bg-orange-500'}`} style={{width: `${occupancy}%`}} />
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Coluna Direita: SMS 40199 + Contatos de Emergência + Guias */}
          <div className="space-y-6">
            
            {/* Card SMS 40199 Defesa Civil */}
            <Card className="border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-sm overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-amber-950 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-orange-600" />
                  Alerta SMS 40199 Oficial
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-1">
                <p className="text-xs text-amber-900 leading-relaxed">
                  Cadastre seu CEP para receber os alertas oficiais da Defesa Civil por SMS e notificação no app em caso de temporais e alagamentos.
                </p>

                {smsSubscribed ? (
                  <div className="rounded-xl bg-emerald-100 text-emerald-800 p-3 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Inscrição ativa para o CEP {smsCep}!
                  </div>
                ) : (
                  <form onSubmit={handleSmsSubscribe} className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="00000-000"
                        value={smsCep}
                        onChange={(e) => setSmsCep(maskCep(e.target.value))}
                        className="h-9 bg-white border-amber-200 text-xs"
                        required
                      />
                      <Button type="submit" size="sm" className="h-9 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shrink-0">
                        Ativar
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Contatos de Emergência */}
            <Card className="border border-slate-200 rounded-2xl shadow-sm bg-white">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-red-600" />
                  Telefones de Emergência (Discagem Rápida)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                {matchingContacts.map(contact => {
                  const style = CONTACT_STYLES[contact.type] || CONTACT_STYLES.defesa_civil;
                  const Icon = style.icon;
                  return (
                    <a
                      key={`${contact.name}-${contact.number}`}
                      href={`tel:${contact.number}`}
                      className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3 hover:bg-slate-100 hover:border-slate-300 transition-all"
                    >
                      <div className={`w-10 h-10 rounded-xl ${style.color} flex items-center justify-center text-white shrink-0 shadow-sm`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-xs text-slate-900">{contact.name}</p>
                          <span className="text-xs font-black text-primary px-2 py-0.5 bg-primary/10 rounded-md">
                            {contact.number}
                          </span>
                        </div>
                        {contact.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate">{contact.description}</p>
                        )}
                      </div>
                    </a>
                  );
                })}
              </CardContent>
            </Card>

            {/* Guias Rápidos de Autoproteção */}
            <Card className="border border-slate-200 rounded-2xl shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  Orientações da Defesa Civil
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-600 space-y-3 pt-1">
                <div className="border-l-2 border-orange-500 pl-3 py-0.5">
                  <p className="font-bold text-slate-800">Em caso de Alagamento:</p>
                  <p className="text-slate-500 mt-0.5">Nunca enfrente correntezas de carro ou a pé. Desconecte eletrodomésticos da tomada.</p>
                </div>
                <div className="border-l-2 border-red-500 pl-3 py-0.5">
                  <p className="font-bold text-slate-800">Encostas e Barrancos:</p>
                  <p className="text-slate-500 mt-0.5">Observe trincas no solo, árvores inclinadas ou água barrenta e evacue imediatamente para local seguro.</p>
                </div>
                <div className="border-l-2 border-blue-500 pl-3 py-0.5">
                  <p className="font-bold text-slate-800">Tempestades com Raios:</p>
                  <p className="text-slate-500 mt-0.5">Evite descampados, praias e não se abrigue sob árvores isoladas ou estruturas metálicas.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}
