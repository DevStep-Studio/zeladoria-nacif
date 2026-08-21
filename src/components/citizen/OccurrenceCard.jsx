import React, {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight, MapPin, Clock, icons} from 'lucide-react';
import {format} from 'date-fns';
import {ptBR} from 'date-fns/locale';
import {STATUS_CONFIG, CATEGORIES} from '@/lib/constants';
import {getProtocolNumber} from '@/lib/occurrences';
import {MUNICIPALITY_CONFIG} from '@/lib/municipality';

export default function OccurrenceCard({occurrence, privacyMode = false, embedded = false}) {
  const occ = occurrence;
  const statusConfig = STATUS_CONFIG[occ.status] || STATUS_CONFIG.registrada;
  const categoryConfig = CATEGORIES[occ.category] || {label: occ.category};
  const hideAddress = privacyMode && MUNICIPALITY_CONFIG.sensitiveCategories.includes(occ.category);
  
  const colorClass = statusConfig.color.split(' ').find(c => c.startsWith('text-')) || 'text-slate-500';
  const dotColor = colorClass.replace('text-', 'bg-');
  const IconComponent = icons[categoryConfig.icon] || icons.FileText;

  const [autoAddress, setAutoAddress] = useState('');
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);

  useEffect(() => {
    if (occ && !hideAddress && !occ.address?.trim() && occ.latitude && occ.longitude) {
      setIsFetchingAddress(true);
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${occ.latitude}&lon=${occ.longitude}&zoom=18&addressdetails=1&accept-language=pt-br`)
        .then(res => res.json())
        .then(data => {
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
            setAutoAddress(finalAddress);
          } else {
            setAutoAddress('Endereço não encontrado');
          }
        })
        .catch(err => {
          console.error(err);
          setAutoAddress('Erro ao buscar endereço');
        })
        .finally(() => setIsFetchingAddress(false));
    }
  }, [occ, hideAddress]);

  const addressLabel = hideAddress
    ? 'Localização aproximada por privacidade'
    : occ.address || autoAddress || (isFetchingAddress ? 'Buscando endereço' : 'Endereço não informado');

  if (embedded) {
    return (
      <Link to={`/ocorrencia/${occ.id}`} className="block outline-none group">
        <article className="rounded-[18px] border border-transparent bg-white p-5 shadow-sm transition-colors duration-200 hover:border-primary/70">
          <div className="flex items-center gap-5">
            {occ.photos?.[0] ? (
              <img
                src={occ.photos[0]}
                alt="Foto"
                className="h-[74px] w-[74px] shrink-0 rounded-md border border-slate-100 object-cover"
              />
            ) : (
              <div className="flex h-[74px] w-[74px] shrink-0 items-center justify-center rounded-md bg-primary/5 text-primary">
                <MapPin className="h-7 w-7" strokeWidth={1.6} />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h3 className="min-w-0 text-base font-bold leading-snug text-slate-950 transition-colors group-hover:text-primary">
                  {occ.title || occ.description?.substring(0, 50) || 'Ocorrência sem título'}
                </h3>
                <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-bold ${statusConfig.color}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                  {statusConfig.label}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">
                  <IconComponent className="h-3 w-3" />
                  {categoryConfig.label}
                </span>
              </div>

              <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-slate-500">
                <span className="font-semibold text-slate-500">{getProtocolNumber(occ)}</span>
                <span className="hidden h-px w-8 bg-primary/40 sm:inline-block" />
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{addressLabel}</span>
                </span>
              </div>
            </div>

            <div className="hidden shrink-0 text-right sm:block">
              <p className="text-sm font-bold text-slate-600">{format(new Date(occ.created_date), "dd MMM", {locale: ptBR})}</p>
              <p className="mt-2 text-xs font-medium text-slate-400">Atualizado</p>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link to={`/ocorrencia/${occ.id}`} className="block outline-none group">
      <article className={`bg-white transition-colors duration-200 hover:bg-slate-50 ${embedded ? '' : 'rounded-lg border border-slate-200 shadow-sm hover:border-primary/30'}`}>
       <div className="flex gap-3 p-4 sm:gap-4">
        {occ.photos?.[0] ? (
          <img
            src={occ.photos[0]}
            alt="Foto" className="h-16 w-16 shrink-0 rounded-md border border-slate-200 object-cover sm:h-20 sm:w-20" />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 sm:h-20 sm:w-20">
             <MapPin className="h-6 w-6 text-slate-300" strokeWidth={1.5} />
          </div>
        )}
        
        <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
          <div>
            <div className="mb-1.5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="mb-1 text-[11px] font-bold uppercase leading-none tracking-wider text-slate-400">
                  {getProtocolNumber(occ)}
                </p>
                <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-slate-950 transition-colors group-hover:text-primary">
                  {occ.title || occ.description?.substring(0, 50) || 'Ocorrência sem título'}
                </h3>
              </div>
              <span className="hidden shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-500 md:inline-flex">
                <Clock className="h-3 w-3" />
                {format(new Date(occ.created_date), "dd MMM", {locale: ptBR})}
              </span>
            </div>
            
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-bold ${statusConfig.color}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                {statusConfig.label}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                <IconComponent className="h-3 w-3" />
                {categoryConfig.label}
              </span>
            </div>
          </div>

          <div className="mt-1">
            {hideAddress ? (
              <span className="flex max-w-full items-center gap-1.5 truncate text-[12px] font-medium text-slate-500">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="truncate">Localização aproximada por privacidade</span>
              </span>
            ) : occ.address ? (
              <span className="flex max-w-full items-center gap-1.5 truncate text-[12px] font-medium text-slate-500">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{occ.address}</span>
              </span>
            ) : autoAddress ? (
              <span className="flex max-w-full items-center gap-1.5 truncate text-[12px] font-medium text-slate-500">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{autoAddress}</span>
              </span>
            ) : isFetchingAddress ? (
              <span className="flex items-center gap-1.5 text-[12px] font-medium italic text-slate-400">
                <span className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Buscando...
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[12px] font-medium italic text-slate-400">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                Endereço não informado
              </span>
            )}
          </div>
        </div>
        <div className="hidden items-center self-center text-slate-300 transition-colors group-hover:text-primary sm:flex">
          <ArrowRight className="h-4 w-4" />
        </div>
       </div>
      </article>
    </Link>
  );
}
