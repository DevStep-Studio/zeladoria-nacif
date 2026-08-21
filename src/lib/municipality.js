const env = import.meta.env || {};

const toNumber = (value, fallback) => {
 const parsed = Number(value);
 return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoolean = (value, fallback = false) => {
 if (value === undefined || value === null || value === '') return fallback;
 return ['true', '1', 'yes', 'sim'].includes(String(value).toLowerCase());
};

const defaultLat = toNumber(env.VITE_MUNICIPALITY_CENTER_LAT, -22.7166);
const defaultLng = toNumber(env.VITE_MUNICIPALITY_CENTER_LNG, -43.5553);

export const MUNICIPALITY_CONFIG = {
 name: env.VITE_MUNICIPALITY_NAME || 'Queimados',
 state: env.VITE_MUNICIPALITY_STATE || 'RJ',
 center: [defaultLat, defaultLng],
 defaultZoom: toNumber(env.VITE_MUNICIPALITY_DEFAULT_ZOOM, 13),
 enforceBounds: toBoolean(env.VITE_MUNICIPALITY_ENFORCE_BOUNDS, false),
 bounds: {
  north: toNumber(env.VITE_MUNICIPALITY_BOUND_NORTH, -22.62),
  south: toNumber(env.VITE_MUNICIPALITY_BOUND_SOUTH, -22.82),
  east: toNumber(env.VITE_MUNICIPALITY_BOUND_EAST, -43.46),
  west: toNumber(env.VITE_MUNICIPALITY_BOUND_WEST, -43.68),
 },
 sensitiveCategories: ['denuncia'],
};

export const DEFAULT_MAP_CENTER = MUNICIPALITY_CONFIG.center;

export function isValidCoordinate(latitude, longitude) {
 const lat = Number(latitude);
 const lng = Number(longitude);
 return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function isInsideMunicipality(latitude, longitude) {
 if (!isValidCoordinate(latitude, longitude)) return false;
 const lat = Number(latitude);
 const lng = Number(longitude);
 const {north, south, east, west} = MUNICIPALITY_CONFIG.bounds;
 return lat <= north && lat >= south && lng <= east && lng >= west;
}

export function resolveMunicipalCoordinates(latitude, longitude) {
 if (isValidCoordinate(latitude, longitude)) {
  return [Number(latitude), Number(longitude)];
 }
 return DEFAULT_MAP_CENTER;
}

export function getCoordinateValidationMessage(latitude, longitude) {
 if (!isValidCoordinate(latitude, longitude)) {
  return 'A localização informada é inválida. Revise o ponto no mapa ou permita o uso da sua localização.';
 }
 if (MUNICIPALITY_CONFIG.enforceBounds && !isInsideMunicipality(latitude, longitude)) {
  return `A ocorrência precisa estar dentro do território de ${MUNICIPALITY_CONFIG.name}.`;
 }
 return null;
}

export function getPublicOccurrencePosition(occurrence, privacyMode = false) {
 const [lat, lng] = resolveMunicipalCoordinates(occurrence?.latitude, occurrence?.longitude);
 if (!privacyMode || !MUNICIPALITY_CONFIG.sensitiveCategories.includes(occurrence?.category)) {
  return [lat, lng];
 }
 return [Number(lat.toFixed(3)), Number(lng.toFixed(3))];
}
