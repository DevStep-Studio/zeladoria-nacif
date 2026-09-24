const env = import.meta.env || {};

const cartoApiKey = env.VITE_CARTO_API_KEY || '';
const customTileUrl = env.VITE_MAP_TILE_URL || '';
const customAttribution = env.VITE_MAP_ATTRIBUTION || '&copy; Provedor Municipal de Mapas';

export const MAP_LAYERS = {
  streets: {
    id: 'streets',
    label: 'Ruas',
    url: customTileUrl || (cartoApiKey ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?api_key=${cartoApiKey}` : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'),
    attribution: customTileUrl ? customAttribution : (cartoApiKey ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>' : '&copy; <a href="https://www.esri.com/" target="_blank" rel="noopener noreferrer">Esri</a> &mdash; OpenStreetMap & GIS Community'),
    maxZoom: 19,
    subdomains: cartoApiKey ? 'abcd' : '',
  },
  satellite: {
    id: 'satellite',
    label: 'Satélite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; <a href="https://www.esri.com/" target="_blank" rel="noopener noreferrer">Esri</a> &mdash; Source: Esri, Maxar, Earthstar Geographics, GIS User Community',
    maxZoom: 19,
    subdomains: '',
  },
  osm_fr: {
    id: 'osm_fr',
    label: 'OSM Padrão',
    url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap France | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 20,
    subdomains: 'abc',
  },
};

export const DEFAULT_MAP_LAYER_ID = 'streets';

export function getMapLayerConfig(layerId = DEFAULT_MAP_LAYER_ID) {
  return MAP_LAYERS[layerId] || MAP_LAYERS.streets;
}
