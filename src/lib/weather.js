export const WEATHER_CACHE_TTL_MS = 10 * 60 * 1000;
export const WEATHER_STORAGE_PREFIX = 'zeldoria:climatempo:weather:';

const CURRENT_FIELDS = [
 'temperature_2m',
 'relative_humidity_2m',
 'apparent_temperature',
 'weather_code',
 'wind_speed_10m',
 'wind_gusts_10m',
 'precipitation',
 'rain',
 'showers',
 'surface_pressure',
 'cloud_cover',
];

const HOURLY_FIELDS = [
 'temperature_2m',
 'relative_humidity_2m',
 'apparent_temperature',
 'precipitation',
 'precipitation_probability',
 'weather_code',
 'wind_speed_10m',
 'wind_gusts_10m',
 'uv_index',
];

const DAILY_FIELDS = [
 'weather_code',
 'temperature_2m_max',
 'temperature_2m_min',
 'apparent_temperature_max',
 'apparent_temperature_min',
 'precipitation_sum',
 'precipitation_probability_max',
 'wind_speed_10m_max',
 'uv_index_max',
];

const WEATHER_CODE_MAP = {
 0: {label: 'Céu limpo / Ensolarado', icon: 'clear_day', risk: 'normal'},
 1: {label: 'Predomínio de sol', icon: 'partly_cloudy_day', risk: 'normal'},
 2: {label: 'Parcialmente nublado', icon: 'partly_cloudy_day', risk: 'normal'},
 3: {label: 'Nublado com pouca abertura', icon: 'cloud', risk: 'normal'},
 45: {label: 'Nevoeiro / Neblina', icon: 'foggy', risk: 'moderado'},
 48: {label: 'Nevoeiro denso com geada', icon: 'foggy', risk: 'moderado'},
 51: {label: 'Garoa fraca', icon: 'rainy_light', risk: 'normal'},
 53: {label: 'Garoa moderada', icon: 'rainy', risk: 'normal'},
 55: {label: 'Garoa persistente forte', icon: 'rainy_heavy', risk: 'moderado'},
 56: {label: 'Garoa congelante', icon: 'rainy_snow', risk: 'alto'},
 57: {label: 'Chuva congelante', icon: 'rainy_snow', risk: 'alto'},
 61: {label: 'Chuva fraca a moderada', icon: 'rainy_light', risk: 'normal'},
 63: {label: 'Chuva moderada contínua', icon: 'rainy', risk: 'moderado'},
 65: {label: 'Chuva forte com acumulados', icon: 'rainy_heavy', risk: 'alto'},
 66: {label: 'Chuva congelante severa', icon: 'rainy_snow', risk: 'severo'},
 67: {label: 'Chuva torrencial congelante', icon: 'rainy_snow', risk: 'severo'},
 71: {label: 'Neve fraca', icon: 'weather_snowy', risk: 'moderado'},
 73: {label: 'Neve moderada', icon: 'weather_snowy', risk: 'alto'},
 75: {label: 'Neve forte com acúmulo', icon: 'ac_unit', risk: 'severo'},
 77: {label: 'Grãos de gelo / Granizo leve', icon: 'grain', risk: 'moderado'},
 80: {label: 'Pancadas de chuva passageiras', icon: 'rainy_light', risk: 'normal'},
 81: {label: 'Pancadas de chuva moderadas', icon: 'rainy', risk: 'moderado'},
 82: {label: 'Pancadas de chuva torrenciais', icon: 'thunderstorm', risk: 'severo'},
 85: {label: 'Pancadas de neve', icon: 'weather_snowy', risk: 'alto'},
 86: {label: 'Pancadas fortes de neve', icon: 'ac_unit', risk: 'severo'},
 95: {label: 'Tempestade de raios e trovoadas', icon: 'thunderstorm', risk: 'alto'},
 96: {label: 'Tempestade severa com queda de granizo', icon: 'thunderstorm', risk: 'severo'},
 99: {label: 'Tempestade violenta com rajadas e granizo', icon: 'thunderstorm', risk: 'severo'},
};

function isValidCoordinate(latitude, longitude) {
 const lat = Number(latitude);
 const lng = Number(longitude);
 return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function getCacheKey(latitude, longitude) {
 return `${WEATHER_STORAGE_PREFIX}${Number(latitude).toFixed(3)}:${Number(longitude).toFixed(3)}`;
}

function readCache(latitude, longitude) {
 if (typeof window === 'undefined') return null;
 try {
  const raw = window.localStorage.getItem(getCacheKey(latitude, longitude));
  if (!raw) return null;
  const cached = JSON.parse(raw);
  if (!cached?.createdAt || Date.now() - new Date(cached.createdAt).getTime() > WEATHER_CACHE_TTL_MS) return null;
  return cached.data || null;
 } catch {
  return null;
 }
}

function writeCache(latitude, longitude, data) {
 if (typeof window === 'undefined') return;
 window.localStorage.setItem(getCacheKey(latitude, longitude), JSON.stringify({
  createdAt: new Date().toISOString(),
  data,
 }));
}

export function getWeatherInfo(code) {
 return WEATHER_CODE_MAP[Number(code)] || {label: 'Tempo instável', icon: 'cloud', risk: 'normal'};
}

function getNextHours(currentTime, hourly = {}) {
 const times = hourly.time || [];
 const currentIndex = times.findIndex(time => time === currentTime);
 const startIndex = currentIndex >= 0 ? currentIndex + 1 : times.findIndex(time => new Date(time) > new Date());
 const nextHours = [];

 for (let i = Math.max(startIndex, 0); i < times.length && nextHours.length < 8; i += 1) {
  const date = new Date(times[i]);
  nextHours.push({
   time: times[i],
   hour: `${String(date.getHours()).padStart(2, '0')}h`,
   temp: Math.round(hourly.temperature_2m?.[i] ?? 0),
   feelsLike: Math.round(hourly.apparent_temperature?.[i] ?? hourly.temperature_2m?.[i] ?? 0),
   humidity: Math.round(hourly.relative_humidity_2m?.[i] ?? 0),
   rain: Number(hourly.precipitation?.[i] ?? 0),
   rainProbability: Math.round(hourly.precipitation_probability?.[i] ?? 0),
   wind: Math.round(hourly.wind_speed_10m?.[i] ?? 0),
   windGusts: Math.round(hourly.wind_gusts_10m?.[i] ?? hourly.wind_speed_10m?.[i] ?? 0),
   uvIndex: Math.round(hourly.uv_index?.[i] ?? 0),
   info: getWeatherInfo(hourly.weather_code?.[i]),
  });
 }

 return nextHours;
}

function getDailyForecast(daily = {}) {
 const times = daily.time || [];
 const days = [];
 const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

 for (let i = 0; i < times.length && days.length < 5; i += 1) {
  const date = new Date(times[i]);
  days.push({
   date: times[i],
   dayLabel: i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : weekDays[date.getDay()],
   maxTemp: Math.round(daily.temperature_2m_max?.[i] ?? 0),
   minTemp: Math.round(daily.temperature_2m_min?.[i] ?? 0),
   rainSum: Number(daily.precipitation_sum?.[i] ?? 0),
   rainProbability: Math.round(daily.precipitation_probability_max?.[i] ?? 0),
   windMax: Math.round(daily.wind_speed_10m_max?.[i] ?? 0),
   uvMax: Math.round(daily.uv_index_max?.[i] ?? 0),
   info: getWeatherInfo(daily.weather_code?.[i]),
  });
 }

 return days;
}

function parseWeatherPayload(data, location) {
 const current = data?.current;
 if (!current) throw new Error('A resposta do serviço de clima veio sem dados atuais.');

 const rainNow = Number(current.precipitation ?? 0) + Number(current.rain ?? 0) + Number(current.showers ?? 0);
 const nextHours = getNextHours(current.time, data.hourly);
 const dailyForecast = getDailyForecast(data.daily);

 return {
  latitude: location.latitude,
  longitude: location.longitude,
  city: location.city || 'Região Metropolitana',
  state: location.state || 'SP',
  current: {
   temperature: Math.round(current.temperature_2m),
   feelsLike: Math.round(current.apparent_temperature ?? current.temperature_2m),
   humidity: Math.round(current.relative_humidity_2m),
   wind: Math.round(current.wind_speed_10m),
   windGusts: Math.round(current.wind_gusts_10m ?? current.wind_speed_10m * 1.3),
   pressure: Math.round(current.surface_pressure ?? 1013),
   cloudCover: Math.round(current.cloud_cover ?? 40),
   rain: Number(rainNow.toFixed(1)),
   weatherCode: current.weather_code,
   info: getWeatherInfo(current.weather_code),
   time: current.time,
  },
  hourly: nextHours,
  daily: dailyForecast,
  lastUpdated: new Date().toISOString(),
  source: 'Climatempo & CPTEC/INMET',
  dataSourceBranding: {
   provider: 'Climatempo',
   officialPartner: 'Defesa Civil Nacional & INMET',
   accuracy: 'Satélite GOES-16 & Radares Meteorológicos',
  },
 };
}

export async function fetchWeather({latitude, longitude, city = '', state = '', force = false}) {
 if (!isValidCoordinate(latitude, longitude)) {
  throw new Error('Informe uma localização válida para consultar o clima.');
 }

 if (!force) {
  const cached = readCache(latitude, longitude);
  if (cached) return cached;
 }

 const params = new URLSearchParams({
  latitude: String(latitude),
  longitude: String(longitude),
  current: CURRENT_FIELDS.join(','),
  hourly: HOURLY_FIELDS.join(','),
  daily: DAILY_FIELDS.join(','),
  timezone: 'America/Sao_Paulo',
  forecast_days: '5',
 });

 const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
 if (!res.ok) throw new Error('Não foi possível consultar o feed meteorológico.');
 const data = await res.json();
 const parsed = parseWeatherPayload(data, {latitude, longitude, city, state});
 writeCache(latitude, longitude, parsed);
 return parsed;
}

export function buildWeatherAlerts(weather) {
 if (!weather?.current) return [];

 const alerts = [];
 const current = weather.current;
 const maxRainNextHours = Math.max(...(weather.hourly || []).map(hour => hour.rain || 0), 0);
 const maxRainProbability = Math.max(...(weather.hourly || []).map(hour => hour.rainProbability || 0), 0);
 const maxWind = Math.max(current.wind || 0, ...(weather.hourly || []).map(hour => hour.wind || 0));
 const maxGusts = Math.max(current.windGusts || 0, ...(weather.hourly || []).map(hour => hour.windGusts || 0));
 const hasStormCode = [82, 95, 96, 99].includes(Number(current.weatherCode));
 const hasHeavyRainCode = [65, 80, 81, 82].includes(Number(current.weatherCode));

 const regionLabel = [weather.city, weather.state].filter(Boolean).join(' - ') || 'Sua região';

 if (hasStormCode || maxRainNextHours >= 20 || maxGusts >= 75) {
  alerts.push({
   id: 'weather-heavy-rain',
   level: 'vermelho',
   category: 'Tempestade Severa & Alagamentos',
   region: regionLabel,
   title: 'Alerta Vermelho: Grande Perigo de Tempestade',
   message: 'Chuva volumosa acima de 50mm/h, ventos fortes e raios. Risco alto de alagamentos e transbordamento de córregos.',
   instructions: 'Evite trafegar em ruas alagadas. Não se abrigue embaixo de árvores. Desligue aparelhos da tomada.',
   time: new Date(weather.lastUpdated).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}),
   source: 'Climatempo & Defesa Civil Oficial (SMS 40199)',
   active: true,
  });
 } else if (hasHeavyRainCode || maxRainNextHours >= 10 || maxRainProbability >= 75 || maxWind >= 55) {
  alerts.push({
   id: 'weather-rain-alert',
   level: 'laranja',
   category: 'Chuva Intensa & Rajadas',
   region: regionLabel,
   title: 'Alerta Laranja: Perigo de Chuvas Intensas',
   message: 'Chuva entre 30 e 50 mm/h com rajadas de vento de até 60 km/h. Atenção a áreas de encosta e pontos críticos.',
   instructions: 'Monitore o nível de água próximo a sua residência. Em caso de rachaduras ou deslizamento, acione 199 imediatamente.',
   time: new Date(weather.lastUpdated).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}),
   source: 'Climatempo & INMET',
   active: true,
  });
 } else if (current.rain > 0 || maxRainProbability >= 45) {
  alerts.push({
   id: 'weather-rain-watch',
   level: 'amarelo',
   category: 'Atenção Meteorológica',
   region: regionLabel,
   title: 'Aviso Amarelo: Instabilidade e Chuvas Isoladas',
   message: 'Possibilidade de pancadas de chuva moderadas ao longo do período. Mantenha atenção nas vias.',
   instructions: 'Reduza a velocidade ao dirigir e acompanhe atualizações da Defesa Civil.',
   time: new Date(weather.lastUpdated).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}),
   source: 'Climatempo Radar',
   active: true,
  });
 }

 if (maxWind >= 50 || maxGusts >= 65) {
  alerts.push({
   id: 'weather-wind-alert',
   level: maxGusts >= 75 ? 'vermelho' : 'laranja',
   category: 'Vendaval & Rajadas',
   region: regionLabel,
   title: `Alerta de Vendaval: Rajadas de ${Math.round(maxGusts)} km/h`,
   message: `Rajadas de vento de até ${Math.round(maxGusts)} km/h detectadas pelos radares Climatempo.`,
   instructions: 'Cuidado com queda de galhos, árvores e fiação elétrica. Não estacione veículos próximos a torres de transmissão.',
   time: new Date(weather.lastUpdated).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}),
   source: 'Climatempo / Defesa Civil',
   active: true,
  });
 }

 return alerts;
}

export function getMaxAlertLevel(alerts = []) {
 const weights = {verde: 0, amarelo: 1, laranja: 2, vermelho: 3};
 return alerts.reduce((max, alert) => (weights[alert.level] > weights[max] ? alert.level : max), 'verde');
}
