export const LOCATION_STORAGE_KEY = 'zeldoria:last-valid-location';
export const LOW_ACCURACY_THRESHOLD_METERS = 1000;
export const GEOLOCATION_TIMEOUT_MS = 12000;
export const GEOCODING_TIMEOUT_MS = 10000;

const BRAZIL_STATE_CODES = {
 acre: 'AC',
 alagoas: 'AL',
 amapa: 'AP',
 amazonas: 'AM',
 bahia: 'BA',
 ceara: 'CE',
 'distrito federal': 'DF',
 'espirito santo': 'ES',
 goias: 'GO',
 maranhao: 'MA',
 'mato grosso': 'MT',
 'mato grosso do sul': 'MS',
 'minas gerais': 'MG',
 para: 'PA',
 paraiba: 'PB',
 parana: 'PR',
 pernambuco: 'PE',
 piaui: 'PI',
 'rio de janeiro': 'RJ',
 'rio grande do norte': 'RN',
 'rio grande do sul': 'RS',
 rondonia: 'RO',
 roraima: 'RR',
 'santa catarina': 'SC',
 'sao paulo': 'SP',
 sergipe: 'SE',
 tocantins: 'TO',
};

const removeAccents = (value = '') => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const compact = (value = '') => String(value || '').trim().replace(/\s+/g, ' ');

export function normalizeCep(value = '') {
 return String(value || '').replace(/\D/g, '').slice(0, 8);
}

export function maskCep(value = '') {
 const cep = normalizeCep(value);
 if (cep.length <= 5) return cep;
 return `${cep.slice(0, 5)}-${cep.slice(5)}`;
}

export function isValidCep(value = '') {
 return normalizeCep(value).length === 8;
}

export function normalizeState(value = '') {
 const raw = compact(value).toUpperCase();
 if (/^[A-Z]{2}$/.test(raw)) return raw;
 const key = removeAccents(value).toLowerCase();
 return BRAZIL_STATE_CODES[key] || raw;
}

export function getStateFromName(value = '') {
 return normalizeState(value);
}

function isValidCoordinate(latitude, longitude) {
 const lat = Number(latitude);
 const lng = Number(longitude);
 return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

async function fetchJsonWithTimeout(url, timeoutMs = GEOCODING_TIMEOUT_MS) {
 const controller = new AbortController();
 const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
 try {
  const res = await fetch(url, {signal: controller.signal});
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
 } finally {
  window.clearTimeout(timeout);
 }
}

function locationFromNominatim(data, fallback = {}) {
 const address = data?.address || {};
 const city = compact(address.city || address.town || address.village || address.municipality || address.county || fallback.city);
 const neighborhood = compact(address.suburb || address.neighbourhood || address.quarter || address.city_district || fallback.neighborhood);
 const state = normalizeState(address.state_code || address.state || fallback.state);
 const postalCode = maskCep(address.postcode || fallback.postalCode);
 const road = compact(address.road || address.pedestrian || address.footway || address.residential || fallback.street);
 const houseNumber = compact(address.house_number || fallback.number);
 const streetLine = compact([road, houseNumber].filter(Boolean).join(', '));
 const addressParts = [streetLine, neighborhood, city, state].filter(Boolean);

 return {
  latitude: Number(data?.lat ?? fallback.latitude),
  longitude: Number(data?.lon ?? fallback.longitude),
  accuracy: fallback.accuracy ?? null,
  address: addressParts.join(' - ') || compact(data?.display_name || fallback.address),
  street: road,
  neighborhood,
  city,
  state,
  postalCode,
  source: fallback.source || 'device',
  updatedAt: fallback.updatedAt || new Date().toISOString(),
  lowAccuracy: Boolean(fallback.lowAccuracy),
 };
}

export async function reverseGeocode(latitude, longitude, options = {}) {
 if (!isValidCoordinate(latitude, longitude)) {
  throw new Error('Coordenadas inválidas.');
 }

 const params = new URLSearchParams({
  format: 'jsonv2',
  lat: String(latitude),
  lon: String(longitude),
  zoom: '18',
  addressdetails: '1',
  'accept-language': 'pt-BR',
 });

 const data = await fetchJsonWithTimeout(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`);
 return locationFromNominatim(data, {
  latitude,
  longitude,
  accuracy: options.accuracy,
  source: options.source || 'device',
  lowAccuracy: options.lowAccuracy,
 });
}

export async function geocodeAddress(query, fallback = {}) {
 const cleanedQuery = compact(query);
 if (!cleanedQuery) throw new Error('Informe cidade e estado para localizar a região.');

 const params = new URLSearchParams({
  format: 'jsonv2',
  q: cleanedQuery,
  limit: '1',
  countrycodes: 'br',
  addressdetails: '1',
  'accept-language': 'pt-BR',
 });

 const data = await fetchJsonWithTimeout(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
 const first = Array.isArray(data) ? data[0] : null;
 if (!first || !isValidCoordinate(first.lat, first.lon)) {
  throw new Error('Não foi possível localizar a cidade informada.');
 }

 return locationFromNominatim(first, {
  ...fallback,
  latitude: Number(first.lat),
  longitude: Number(first.lon),
  source: fallback.source || 'manual',
 });
}

export async function fetchAddressByCep(value) {
 const cep = normalizeCep(value);
 if (!isValidCep(cep)) {
  throw new Error('Informe um CEP com 8 dígitos.');
 }

 const data = await fetchJsonWithTimeout(`https://viacep.com.br/ws/${cep}/json/`);
 if (data?.erro) {
  throw new Error('CEP não encontrado.');
 }

 return {
  postalCode: maskCep(data.cep || cep),
  street: compact(data.logradouro),
  neighborhood: compact(data.bairro),
  city: compact(data.localidade),
  state: normalizeState(data.uf),
  ibge: data.ibge,
 };
}

export async function resolveManualLocation({postalCode = '', city = '', state = '', street = '', neighborhood = ''}) {
 let cepAddress = null;
 if (postalCode) {
  cepAddress = await fetchAddressByCep(postalCode);
 }

 const resolvedCity = compact(cepAddress?.city || city);
 const resolvedState = normalizeState(cepAddress?.state || state);
 const resolvedStreet = compact(cepAddress?.street || street);
 const resolvedNeighborhood = compact(cepAddress?.neighborhood || neighborhood);

 if (!resolvedCity || !resolvedState) {
  throw new Error('Informe cidade e estado para localizar sua região.');
 }

 const query = [resolvedStreet, resolvedNeighborhood, resolvedCity, resolvedState, 'Brasil']
  .filter(Boolean)
  .join(', ');

 const geocoded = await geocodeAddress(query, {
  postalCode: cepAddress?.postalCode || maskCep(postalCode),
  city: resolvedCity,
  state: resolvedState,
  street: resolvedStreet,
  neighborhood: resolvedNeighborhood,
  source: cepAddress ? 'manual_cep' : 'manual',
 });

 return {
  ...geocoded,
  postalCode: cepAddress?.postalCode || geocoded.postalCode || maskCep(postalCode),
  city: resolvedCity || geocoded.city,
  state: resolvedState || geocoded.state,
  street: resolvedStreet || geocoded.street,
  neighborhood: resolvedNeighborhood || geocoded.neighborhood,
  source: cepAddress ? 'manual_cep' : 'manual',
  updatedAt: new Date().toISOString(),
 };
}

export function getProfileLocation(user) {
 if (!user) return null;
 const latitude = user.last_location_latitude;
 const longitude = user.last_location_longitude;
 if (!isValidCoordinate(latitude, longitude)) return null;

 return {
  latitude: Number(latitude),
  longitude: Number(longitude),
  accuracy: user.last_location_accuracy ?? null,
  address: user.last_location_address || `${user.street || ''} ${user.address_number || ''}`.trim() || '',
  neighborhood: user.last_location_neighborhood || user.neighborhood || '',
  city: user.last_location_city || user.city || '',
  state: normalizeState(user.last_location_state || user.state || ''),
  postalCode: maskCep(user.last_location_postal_code || user.postal_code || ''),
  source: user.last_location_source || 'registered_address',
  updatedAt: user.last_location_updated_at || user.updated_date || new Date().toISOString(),
  lowAccuracy: Number(user.last_location_accuracy) > LOW_ACCURACY_THRESHOLD_METERS,
  isRegisteredAddress: true,
 };
}

export async function resolveRegisteredUserLocation(user) {
 if (!user) return null;
 const direct = getProfileLocation(user);
 if (direct) return direct;

 const street = user.street || '';
 const neighborhood = user.neighborhood || '';
 const city = user.city || '';
 const state = user.state || '';
 const postalCode = user.postal_code || '';

 if ((city && state) || postalCode) {
  try {
   const resolved = await resolveManualLocation({
    postalCode,
    street,
    neighborhood,
    city,
    state,
   });
   return {
    ...resolved,
    source: 'registered_address',
    isRegisteredAddress: true,
   };
  } catch (err) {
   console.warn('Could not geocode user registered address:', err);
  }
 }
 return null;
}

export function loadStoredLocation() {
 if (typeof window === 'undefined') return null;
 try {
  const raw = window.localStorage.getItem(LOCATION_STORAGE_KEY);
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  if (!isValidCoordinate(parsed?.latitude, parsed?.longitude)) return null;
  return {
   ...parsed,
   latitude: Number(parsed.latitude),
   longitude: Number(parsed.longitude),
   state: normalizeState(parsed.state || ''),
   postalCode: maskCep(parsed.postalCode || ''),
  };
 } catch {
  return null;
 }
}

export function saveStoredLocation(location) {
 if (typeof window === 'undefined' || !location) return;
 if (!isValidCoordinate(location.latitude, location.longitude)) return;
 window.localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
}

export function locationToUserPayload(location) {
 return {
  last_location_latitude: location.latitude,
  last_location_longitude: location.longitude,
  last_location_accuracy: location.accuracy ?? null,
  last_location_address: location.address || '',
  last_location_neighborhood: location.neighborhood || '',
  last_location_city: location.city || '',
  last_location_state: location.state || '',
  last_location_postal_code: normalizeCep(location.postalCode || ''),
  last_location_source: location.source || 'device',
  last_location_updated_at: location.updatedAt || new Date().toISOString(),
 };
}

export function getLocationLabel(location) {
 if (!location) return 'Localização não definida';
 const parts = [location.street, location.neighborhood, location.city, location.state].filter(Boolean);
 return parts.length ? parts.join(' - ') : (location.address || 'Localização aproximada');
}
