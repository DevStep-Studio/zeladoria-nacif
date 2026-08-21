import React from 'react';
import {MapContainer, TileLayer, Marker, Popup, useMap} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import StatusBadge from './StatusBadge';
import CategoryBadge from './CategoryBadge';
import {STATUS_CONFIG} from '@/lib/constants';
import {DEFAULT_MAP_CENTER, MUNICIPALITY_CONFIG, getPublicOccurrencePosition, isValidCoordinate} from '@/lib/municipality';

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
 iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
 iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
 shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function createIcon(status) {
 const color = STATUS_CONFIG[status]?.markerColor || '#6b7280';
 return L.divIcon({
 className: 'custom-marker',
 html:`<div style="width:28px;height:28px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
 iconSize: [28, 28],
 iconAnchor: [14, 14],
});
}

function MapUpdater({center}) {
 const map = useMap();
 React.useEffect(() => {
 if (center) map.setView(center, map.getZoom());
}, [center, map]);
 return null;
}

export default function OccurrenceMap({
 occurrences = [],
 center = DEFAULT_MAP_CENTER,
 zoom = MUNICIPALITY_CONFIG.defaultZoom,
 height = '400px',
 onMarkerClick = null,
 privacyMode = false,
}) {
 const safeCenter = isValidCoordinate(center?.[0], center?.[1]) ? center : DEFAULT_MAP_CENTER;

 return (
 <div style={{height}} className="rounded-xl overflow-hidden border border-border shadow-sm">
 <MapContainer center={safeCenter} zoom={zoom} style={{height: '100%', width: '100%'}} scrollWheelZoom>
 <TileLayer
 attribution='&copy; OpenStreetMap'
 url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
 <MapUpdater center={safeCenter} />
 {occurrences.map((occ) => {
 const hasCoordinates = isValidCoordinate(occ.latitude, occ.longitude);
 const position = hasCoordinates ? getPublicOccurrencePosition(occ, privacyMode) : null;
 const hideAddress = privacyMode && MUNICIPALITY_CONFIG.sensitiveCategories.includes(occ.category);

 return hasCoordinates ? (
 <Marker
 key={occ.id}
 position={position}
 icon={createIcon(occ.status)}
 eventHandlers={{click: () => onMarkerClick?.(occ)}}
 >
 <Popup>
 <div className="space-y-1 min-w-[160px]">
 <p className="font-semibold text-sm">{occ.title || occ.description?.substring(0, 40)}</p>
 <div className="flex gap-1 flex-wrap">
 <StatusBadge status={occ.status} />
 <CategoryBadge category={occ.category} />
 </div>
 {hideAddress ? (
 <p className="text-xs text-muted-foreground">Localização aproximada por privacidade</p>
 ) : occ.address && <p className="text-xs text-muted-foreground">{occ.address}</p>}
 </div>
 </Popup>
 </Marker>
 ) : null;
 })}
 </MapContainer>
 </div>
 );
}
