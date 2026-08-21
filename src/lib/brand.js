const baseUrl = import.meta.env.BASE_URL || '/';
const publicUrl = import.meta.env.VITE_PUBLIC_APP_URL || import.meta.env.VITE_BASE44_APP_BASE_URL || '';

export const BRAND = {
 name: 'Zeladoria Cidades',
 title: 'Zeladoria Cidades',
 description: 'Sistema municipal de zeladoria, alertas, ocorrências e serviços públicos.',
 logoSymbol: `${baseUrl}images/brand/logo.png`,
 logoSymbolWhite: `${baseUrl}images/brand/logo-white.png`,
 logotype: `${baseUrl}images/brand/logotipo.png`,
 logotypeWhite: `${baseUrl}images/brand/logotipo-white.png`,
 favicon16: `${baseUrl}images/brand/favicon-16.png`,
 favicon32: `${baseUrl}images/brand/favicon-32.png`,
 appleTouchIcon: `${baseUrl}images/brand/apple-touch-icon.png`,
 icon192: `${baseUrl}images/brand/icon-192.png`,
 icon512: `${baseUrl}images/brand/icon-512.png`,
 get shareImage() {
  if (!publicUrl) return `${baseUrl}images/brand/icon-512.png`;
  return `${publicUrl.replace(/\/$/, '')}${baseUrl}images/brand/icon-512.png`;
 },
};
