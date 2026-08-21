import React, {useState, useEffect, useMemo} from 'react';
import {Link} from 'react-router-dom';
import {motion} from 'framer-motion';
import {appApi} from '@/services/app-api';
import {useAuth} from '@/lib/AuthContext';
import {useQuery} from '@tanstack/react-query';
import {ArrowRight, PlusCircle, Globe, Heart, GraduationCap, Vote, Shield, Search, SlidersHorizontal, X, Home as HomeIcon, LocateFixed, Edit2} from 'lucide-react';
import {Button} from "@/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import OccurrenceMap from '@/components/shared/OccurrenceMap';
import {CATEGORIES, PUBLIC_STATUS_OPTIONS} from '@/lib/constants';
import OccurrenceCard from '@/components/citizen/OccurrenceCard';
import {DEFAULT_MAP_CENTER, MUNICIPALITY_CONFIG, isValidCoordinate} from '@/lib/municipality';
import {useUserLocation} from '@/hooks/use-user-location';
import {getProtocolNumber} from '@/lib/occurrences';
import {getLocationLabel, getProfileLocation, resolveRegisteredUserLocation} from '@/lib/location';

const QUICK_SERVICES = [
 {path: '/saude-publica', icon: Heart, label: 'Saúde', description: 'Consultas e atendimentos', card: 'bg-[#ff6f24] text-white', iconColor: 'text-white'},
 {path: '/matricula-escolar', icon: GraduationCap, label: 'Educação', description: 'Matrículas escolares', card: 'bg-[#8068f0] text-white', iconColor: 'text-white'},
 {path: '/defesa-civil', icon: Shield, label: 'Defesa Civil', description: 'Alertas e prevenção', card: 'bg-[#c8fb45] text-slate-950', iconColor: 'text-slate-950'},
 {path: '/participacao', icon: Vote, label: 'Participação', description: 'Sugestões públicas', card: 'bg-[#12b8a6] text-white', iconColor: 'text-white'},
 {path: '/transparencia', icon: Globe, label: 'Transparência', description: 'Dados municipais', card: 'bg-[#f43f5e] text-white', iconColor: 'text-white'},
 {path: '/nova-ocorrencia', icon: PlusCircle, label: 'Outro serviço', description: 'Registrar solicitação', card: 'bg-[#111827] text-white', iconColor: 'text-white'},
];

export default function Home() {
  const {user} = useAuth();
  const [mapCenter, setMapCenter] = useState(DEFAULT_MAP_CENTER);
  const [userHomeLoc, setUserHomeLoc] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('recent');
  const {location} = useUserLocation({autoRequest: false, persistToProfile: false});

  // Always resolve and center based on client's registered address
  useEffect(() => {
    const resolveInitialHomeLocation = async () => {
      // 1. Direct profile coordinates
      const direct = getProfileLocation(user);
      if (direct && isValidCoordinate(direct.latitude, direct.longitude)) {
        setUserHomeLoc(direct);
        setMapCenter([direct.latitude, direct.longitude]);
        return;
      }

      // 2. Geocode registered address if text is available
      if (user?.street || user?.postal_code || (user?.city && user?.state)) {
        const resolved = await resolveRegisteredUserLocation(user);
        if (resolved && isValidCoordinate(resolved.latitude, resolved.longitude)) {
          setUserHomeLoc(resolved);
          setMapCenter([resolved.latitude, resolved.longitude]);
          return;
        }
      }

      // 3. Fallback to location hook or default
      if (location && isValidCoordinate(location.latitude, location.longitude)) {
        setUserHomeLoc(location);
        setMapCenter([location.latitude, location.longitude]);
      }
    };

    resolveInitialHomeLocation();
  }, [user, location]);

  const registeredAddressLabel = useMemo(() => {
    if (userHomeLoc) {
      return getLocationLabel(userHomeLoc);
    }
    if (user?.street || user?.city) {
      return [user.street, user.address_number, user.neighborhood, user.city, user.state].filter(Boolean).join(' - ');
    }
    return null;
  }, [userHomeLoc, user]);

  const handleRecenter = () => {
    if (userHomeLoc && isValidCoordinate(userHomeLoc.latitude, userHomeLoc.longitude)) {
      setMapCenter([userHomeLoc.latitude, userHomeLoc.longitude]);
    }
  };

  const {data: occurrences = [], isLoading} = useQuery({
    queryKey: ['occurrences'],
    queryFn: () => appApi.entities.Occurrence.list('-created_date', 100),
  });

  const filtered = occurrences.filter(o => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && o.category !== categoryFilter) return false;
    const query = searchTerm.trim().toLowerCase();
    if (query) {
      const categoryLabel = CATEGORIES[o.category]?.label || '';
      const searchable = [
        getProtocolNumber(o),
        o.title,
        o.description,
        o.address,
        o.neighborhood,
        categoryLabel,
      ].filter(Boolean).join(' ').toLowerCase();
      if (!searchable.includes(query)) return false;
    }
    return true;
  }).sort((a, b) => {
    const left = new Date(a.created_date).getTime();
    const right = new Date(b.created_date).getTime();
    return sortOrder === 'oldest' ? left - right : right - left;
  });

  const selectedStatus = PUBLIC_STATUS_OPTIONS.find(([key]) => key === statusFilter)?.[1]?.label;
  const selectedCategory = CATEGORIES[categoryFilter]?.label;
  const activeFilters = [
    searchTerm.trim() ? {key: 'search', label: searchTerm.trim(), onClear: () => setSearchTerm('')} : null,
    selectedStatus ? {key: 'status', label: selectedStatus, onClear: () => setStatusFilter('all')} : null,
    selectedCategory ? {key: 'category', label: selectedCategory, onClear: () => setCategoryFilter('all')} : null,
  ].filter(Boolean);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCategoryFilter('all');
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-full">
      {/* Esquerda: Mapa Fixo no Desktop com Ponto de Partida Residencial */}
      <div className="lg:w-[45%] h-[42vh] lg:h-[calc(100vh-65px)] lg:fixed lg:top-[65px] lg:left-0 p-3 lg:p-4 lg:pr-2 lg:pb-4 z-0 relative flex flex-col">
        {/* Banner do Endereço Residencial do Cadastro */}
        <div className="mb-2 bg-white/95 backdrop-blur-md rounded-xl p-2.5 px-3 border border-slate-200/80 shadow-sm flex items-center justify-between gap-2 shrink-0 z-10">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <HomeIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider font-bold text-primary">Ponto de Partida</p>
              <p className="text-xs font-semibold text-slate-800 truncate" title={registeredAddressLabel || 'Endereço cadastrado'}>
                {registeredAddressLabel || 'Endereço do cadastro'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRecenter}
              title="Recentralizar no meu endereço"
              className="h-7 px-2 text-[11px] text-primary hover:bg-primary/10 gap-1 font-semibold"
            >
              <LocateFixed className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Recentralizar</span>
            </Button>
            <Link
              to="/perfil"
              title="Alterar endereço residencial"
              className="h-7 px-2 rounded-md hover:bg-slate-100 flex items-center text-[11px] font-medium text-slate-500 hover:text-slate-900"
            >
              <Edit2 className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="flex-1 rounded-xl overflow-hidden relative shadow-sm border border-slate-200">
          <OccurrenceMap
            occurrences={filtered}
            center={mapCenter}
            height="100%"
            zoom={MUNICIPALITY_CONFIG.defaultZoom}
            privacyMode
          />
        </div>
      </div>

      {/* Direita: Conteúdo interativo */}
      <div className="lg:w-[55%] lg:ml-[45%] flex flex-col bg-slate-50 p-4 lg:p-8 lg:pt-5">
        {/* Ação principal */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>
          <section className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-primary/15 bg-primary/10 text-primary">
                  <PlusCircle className="h-4 w-4" />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-normal text-slate-950">Registrar ocorrência</h1>
                  <p className="mt-0.5 text-sm text-slate-500">Comunique problemas urbanos à prefeitura.</p>
                </div>
              </div>
              <Button asChild className="h-10 shrink-0 rounded-md bg-primary px-4 text-sm font-bold text-white shadow-sm hover:bg-primary/90">
                <Link to="/nova-ocorrencia">
                  Abrir solicitação
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </section>
        </motion.div>

        {/* Serviços */}
        <motion.div
          initial="hidden" animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
          }}
          className="mb-5"
        >
          <section>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-slate-950">Serviços municipais</h2>
                <p className="mt-0.5 text-xs text-slate-500">Acesso rápido aos módulos.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-7 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
              {QUICK_SERVICES.map(({path, icon: Icon, label, description, card, iconColor}) => (
                <motion.div
                  key={path}
                  variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } }}
                  className="pb-5 pr-5"
                >
                  <Link
                    to={path}
                    className={`group relative block min-h-[160px] rounded-[20px] p-5 shadow-sm transition-transform hover:-translate-y-0.5 active:translate-y-0 ${card}`}
                  >
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                    <div className="mt-12 max-w-[78%]">
                      <h3 className="text-[17px] font-bold leading-tight">{label}</h3>
                      <p className="mt-2 text-sm leading-4 opacity-85">{description}</p>
                    </div>
                    <span className="absolute -bottom-5 -right-5 flex h-[72px] w-[72px] items-center justify-center rounded-full border-[10px] border-slate-50 bg-white text-slate-950 shadow-sm">
                      <ArrowRight className="h-7 w-7 -rotate-45 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        </motion.div>

        {/* Lista e Filtros */}
        <section className="flex flex-1 flex-col">
          <div className="mb-5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950">
                  Ocorrências recentes
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">{filtered.length}</span>
                </h2>
                <p className="mt-0.5 text-sm font-medium text-slate-500">
                  Busque e filtre protocolos públicos.
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <span>Ordenar</span>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="h-9 w-[132px] rounded-md border-slate-200 bg-white text-sm font-bold text-slate-700 shadow-none focus:ring-1 focus:ring-primary/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-slate-200 shadow-lg">
                    <SelectItem value="recent">Mais recentes</SelectItem>
                    <SelectItem value="oldest">Mais antigas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2 p-3 xl:grid-cols-[minmax(0,1fr)_190px_230px]">
              <label className="flex h-11 items-center gap-3 rounded-md border border-slate-200 bg-white px-3 focus-within:border-primary/40">
                <Search className="h-4.5 w-4.5 shrink-0 text-primary" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar por protocolo, rua ou categoria"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
                />
              </label>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 rounded-md border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-none focus:ring-1 focus:ring-primary/30">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-slate-200 shadow-lg">
                  <SelectItem value="all" className="text-sm">Todos os status</SelectItem>
                  {PUBLIC_STATUS_OPTIONS.map(([key, val]) => (
                    <SelectItem key={key} value={key} className="text-sm">{val.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-11 rounded-md border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-none focus:ring-1 focus:ring-primary/30">
                  <div className="flex min-w-0 items-center gap-2">
                    <SlidersHorizontal className="h-4.5 w-4.5 shrink-0 text-primary" />
                    <SelectValue placeholder="Todas as categorias" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-lg border-slate-200 shadow-lg">
                  <SelectItem value="all" className="text-sm">Todas as categorias</SelectItem>
                  {Object.entries(CATEGORIES).map(([key, val]) => (
                    <SelectItem key={key} value={key} className="text-sm">{val.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {activeFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-3 py-3">
                {activeFilters.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={filter.onClear}
                    className="inline-flex h-8 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-600 hover:border-primary/30 hover:text-primary"
                  >
                    <X className="h-3 w-3 text-primary" />
                    {filter.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={clearFilters}
                  className="h-8 px-2 text-xs font-semibold text-slate-500 hover:text-primary"
                >
                  Limpar
                </button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4 pb-6">
              {filtered.slice(0, 20).map((occ, i) => (
                <motion.div
                  key={occ.id}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, type: 'spring', stiffness: 200, damping: 25, delay: i < 4 ? i * 0.1 : 0 }}
                >
                  <OccurrenceCard occurrence={occ} privacyMode embedded />
                </motion.div>
              ))}
              {filtered.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
                  <p className="text-slate-500 font-medium">Nenhuma ocorrência encontrada com estes filtros.</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
