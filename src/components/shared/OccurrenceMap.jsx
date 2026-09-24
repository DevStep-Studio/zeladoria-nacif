import React, {useState, useEffect, useMemo, useRef, useCallback} from 'react';
import {MapContainer, TileLayer, Marker, Popup, useMap} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {Link} from 'react-router-dom';
import {Plus, Minus, LocateFixed, Layers, ExternalLink, MapPin, AlertCircle, Home as HomeIcon} from 'lucide-react';
import StatusBadge from './StatusBadge';
import CategoryBadge from './CategoryBadge';
import {STATUS_CONFIG, CATEGORIES} from '@/lib/constants';
import {DEFAULT_MAP_CENTER, MUNICIPALITY_CONFIG, getPublicOccurrencePosition, isValidCoordinate} from '@/lib/municipality';
import {getProtocolNumber} from '@/lib/occurrences';
import {MAP_LAYERS, DEFAULT_MAP_LAYER_ID} from '@/lib/mapConfig';

// Fix Leaflet default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Cache for marker icons to avoid recreating DOM on re-render
const iconCache = new Map();

function getMarkerIcon(status, isSelected = false) {
  const cacheKey = `${status || 'default'}_${isSelected ? 'sel' : 'norm'}`;
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey);
  }

  const color = STATUS_CONFIG[status]?.markerColor || '#0284c7';
  const size = isSelected ? 34 : 26;
  const half = size / 2;

  const icon = L.divIcon({
    className: 'custom-occurrence-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 3px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 3px 10px rgba(0,0,0,0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.15s ease;
      ">
        <div style="width: 6px; height: 6px; background: #ffffff; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [half, half],
    popupAnchor: [0, -half - 4],
  });

  iconCache.set(cacheKey, icon);
  return icon;
}

function getHomeMarkerIcon() {
  const cacheKey = 'home_marker_icon';
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey);
  }

  const icon = L.divIcon({
    className: 'custom-home-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: #0f172a;
        border: 3px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 3px 12px rgba(15, 23, 42, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  });

  iconCache.set(cacheKey, icon);
  return icon;
}

// Map Controller for resize invalidation and view synchronization
function MapController({center, zoom, onMapReady}) {
  const map = useMap();
  const prevCenterRef = useRef(null);

  useEffect(() => {
    if (onMapReady) onMapReady(map);

    // Multiple invalidation passes to handle CSS animations and container mounting
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 400);

    // ResizeObserver for dynamic layout changes (collapsing sidebars, responsive shifts)
    let resizeObserver = null;
    const container = map.getContainer();
    if (typeof ResizeObserver !== 'undefined' && container) {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(container);
    }

    const handleWindowResize = () => map.invalidateSize();
    window.addEventListener('resize', handleWindowResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', handleWindowResize);
      if (resizeObserver && container) resizeObserver.unobserve(container);
    };
  }, [map, onMapReady]);

  useEffect(() => {
    if (!center || !isValidCoordinate(center[0], center[1])) return;

    const [lat, lng] = center;
    const prev = prevCenterRef.current;
    
    if (!prev || prev[0] !== lat || prev[1] !== lng) {
      prevCenterRef.current = [lat, lng];
      map.flyTo([lat, lng], zoom || map.getZoom(), {
        duration: 0.7,
        easeLinearity: 0.25,
      });
    }
  }, [center, zoom, map]);

  return null;
}

export default function OccurrenceMap({
  occurrences = [],
  center = DEFAULT_MAP_CENTER,
  zoom = MUNICIPALITY_CONFIG.defaultZoom,
  height = '400px',
  onMarkerClick = null,
  privacyMode = false,
  showControls = true,
  showLayersSwitch = true,
  showRecenterButton = true,
  homeMarker = null,
  className = '',
}) {
  const [activeLayerId, setActiveLayerId] = useState(DEFAULT_MAP_LAYER_ID);
  const [tileError, setTileError] = useState(false);
  const mapInstanceRef = useRef(null);

  const safeCenter = useMemo(() => {
    if (Array.isArray(center) && center.length === 2 && isValidCoordinate(center[0], center[1])) {
      return [Number(center[0]), Number(center[1])];
    }
    return DEFAULT_MAP_CENTER;
  }, [center]);

  const activeLayer = useMemo(() => {
    return MAP_LAYERS[activeLayerId] || MAP_LAYERS.streets;
  }, [activeLayerId]);

  const handleZoomIn = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  }, []);

  const handleRecenter = useCallback(() => {
    if (mapInstanceRef.current && safeCenter) {
      mapInstanceRef.current.flyTo(safeCenter, zoom, {duration: 0.8});
    }
  }, [safeCenter, zoom]);

  const toggleLayer = useCallback(() => {
    setTileError(false);
    setActiveLayerId(prev => (prev === 'streets' ? 'satellite' : 'streets'));
  }, []);

  const handleTileError = useCallback(() => {
    if (activeLayerId !== 'osm_fr') {
      // Fallback to OSM France if primary tile server faces temporary network trouble
      setActiveLayerId('osm_fr');
    } else {
      setTileError(true);
    }
  }, [activeLayerId]);

  return (
    <div
      style={{height}}
      className={`relative z-0 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm flex flex-col ${className}`}
    >
      <MapContainer
        center={safeCenter}
        zoom={zoom}
        zoomControl={false}
        style={{height: '100%', width: '100%'}}
        scrollWheelZoom
      >
        <TileLayer
          key={activeLayer.id}
          attribution={activeLayer.attribution}
          url={activeLayer.url}
          subdomains={activeLayer.subdomains || 'abc'}
          maxZoom={activeLayer.maxZoom || 19}
          eventHandlers={{
            tileerror: handleTileError,
          }}
        />

        <MapController
          center={safeCenter}
          zoom={zoom}
          onMapReady={map => {
            mapInstanceRef.current = map;
          }}
        />

        {/* Optional Home / Start Point Marker */}
        {homeMarker && isValidCoordinate(homeMarker.latitude, homeMarker.longitude) && (
          <Marker
            position={[Number(homeMarker.latitude), Number(homeMarker.longitude)]}
            icon={getHomeMarkerIcon()}
          >
            <Popup className="zeladoria-map-popup">
              <div className="p-1 min-w-[180px] space-y-1">
                <div className="flex items-center gap-1.5 text-primary font-bold text-xs uppercase tracking-wider">
                  <HomeIcon className="w-3.5 h-3.5" />
                  <span>Ponto de Partida</span>
                </div>
                <p className="text-xs font-semibold text-slate-800">
                  {homeMarker.label || homeMarker.address || 'Seu endereço cadastrado'}
                </p>
                {homeMarker.neighborhood && (
                  <p className="text-[11px] text-slate-500">{homeMarker.neighborhood}</p>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Occurrence Markers */}
        {occurrences.map(occ => {
          const hasCoordinates = isValidCoordinate(occ?.latitude, occ?.longitude);
          if (!hasCoordinates) return null;

          const position = getPublicOccurrencePosition(occ, privacyMode);
          const hideAddress = privacyMode && MUNICIPALITY_CONFIG.sensitiveCategories.includes(occ.category);
          const protocol = getProtocolNumber(occ);
          const categoryMeta = CATEGORIES[occ.category];

          return (
            <Marker
              key={occ.id || `${occ.latitude}-${occ.longitude}-${protocol}`}
              position={position}
              icon={getMarkerIcon(occ.status)}
              eventHandlers={{
                click: () => onMarkerClick?.(occ),
              }}
            >
              <Popup className="zeladoria-map-popup">
                <div className="min-w-[210px] max-w-[260px] p-1 space-y-2 text-slate-800">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                    <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                      {protocol}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {occ.created_date ? new Date(occ.created_date).toLocaleDateString('pt-BR') : ''}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2">
                      {occ.title || occ.description?.substring(0, 50) || 'Ocorrência registrada'}
                    </h4>
                    {categoryMeta && (
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                        {categoryMeta.label}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-1.5 flex-wrap">
                    <StatusBadge status={occ.status} />
                    <CategoryBadge category={occ.category} />
                  </div>

                  <div className="text-[11px] text-slate-600 flex items-start gap-1 pt-1 border-t border-slate-100">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="leading-tight">
                      {hideAddress ? (
                        <span className="italic text-slate-500">Localização aproximada (privacidade)</span>
                      ) : (
                        occ.address || occ.neighborhood || 'Endereço registrado'
                      )}
                    </span>
                  </div>

                  <div className="pt-1">
                    <Link
                      to={`/ocorrencias/${occ.id}`}
                      className="inline-flex items-center justify-center w-full gap-1.5 h-7 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold transition-colors shadow-sm"
                    >
                      <span>Ver detalhes</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Custom Clean Map Controls */}
      {showControls && (
        <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1.5 select-none">
          {/* Zoom Buttons */}
          <div className="bg-white/95 backdrop-blur-sm rounded-lg border border-slate-200/90 shadow-md flex flex-col overflow-hidden">
            <button
              type="button"
              onClick={handleZoomIn}
              title="Aproximar mapa"
              aria-label="Aproximar mapa"
              className="w-8 h-8 flex items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors active:bg-slate-200"
            >
              <Plus className="w-4 h-4" />
            </button>
            <div className="h-[1px] bg-slate-200/80 w-full" />
            <button
              type="button"
              onClick={handleZoomOut}
              title="Afastar mapa"
              aria-label="Afastar mapa"
              className="w-8 h-8 flex items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors active:bg-slate-200"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          {/* Recenter Button */}
          {showRecenterButton && (
            <button
              type="button"
              onClick={handleRecenter}
              title="Recentralizar mapa"
              aria-label="Recentralizar mapa"
              className="w-8 h-8 rounded-lg bg-white/95 backdrop-blur-sm border border-slate-200/90 shadow-md flex items-center justify-center text-slate-700 hover:text-primary hover:bg-slate-100 transition-colors active:bg-slate-200"
            >
              <LocateFixed className="w-4 h-4" />
            </button>
          )}

          {/* Layer Switcher (Ruas / Satélite) */}
          {showLayersSwitch && (
            <button
              type="button"
              onClick={toggleLayer}
              title={`Alternar para visão de ${activeLayerId === 'streets' ? 'Satélite' : 'Ruas'}`}
              aria-label="Alternar camada de mapa"
              className="w-8 h-8 rounded-lg bg-white/95 backdrop-blur-sm border border-slate-200/90 shadow-md flex items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors active:bg-slate-200"
            >
              <Layers className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Fallback Banner if network tile error occurs */}
      {tileError && (
        <div className="absolute bottom-3 left-3 z-[1000] bg-amber-50 text-amber-800 text-xs px-2.5 py-1.5 rounded-lg border border-amber-200 shadow-sm flex items-center gap-1.5 max-w-[85%]">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Servidor de mapa operando em modo de contingência.</span>
        </div>
      )}
    </div>
  );
}
