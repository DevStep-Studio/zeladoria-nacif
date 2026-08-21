import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import {BRAND} from '@/lib/brand';

export default function ZeladoriaLogo({
 size = 'md',
 variant = 'full',
 theme = 'light',
 to = null,
 className = '',
 textClassName = '',
}) {
 const [imageFailed, setImageFailed] = useState(false);
 const sizes = {
 xs: {icon: 24, logotypeWidth: 92, logotypeHeight: 34, text: 'text-sm', gap: 'gap-1.5'},
 sm: {icon: 32, logotypeWidth: 108, logotypeHeight: 40, text: 'text-base', gap: 'gap-2'},
 md: {icon: 40, logotypeWidth: 132, logotypeHeight: 49, text: 'text-xl', gap: 'gap-2.5'},
 lg: {icon: 56, logotypeWidth: 174, logotypeHeight: 64, text: 'text-2xl', gap: 'gap-3'},
 xl: {icon: 80, logotypeWidth: 228, logotypeHeight: 84, text: 'text-4xl', gap: 'gap-4'},
};
 const s = sizes[size] || sizes.md;
 const isIconOnly = variant === 'icon';
 const isDark = theme === 'dark';
 const textColor = isDark ? 'text-white' : 'text-primary';
 const src = isIconOnly
  ? (isDark ? BRAND.logoSymbolWhite : BRAND.logoSymbol)
  : (isDark ? BRAND.logotypeWhite : BRAND.logotype);
 const dimensions = isIconOnly
  ? {width: s.icon, height: s.icon}
  : {width: s.logotypeWidth, height: s.logotypeHeight};

 const Fallback = () => (
 <div className={`flex items-center ${textColor} ${s.gap}`}>
  <span
   aria-hidden="true"
   className="shrink-0 rounded-full bg-primary text-white font-black flex items-center justify-center"
   style={{width: s.icon, height: s.icon, fontSize: Math.max(12, Math.round(s.icon * 0.45))}}
  >
   Z
  </span>
  {!isIconOnly && (
  <div aria-hidden="true">
  <div className={`font-bold ${s.text} leading-none ${textColor} ${textClassName}`}>
  {BRAND.name}
  </div>
  {(size === 'lg' || size === 'xl') && (
  <div className="text-xs text-muted-foreground font-medium tracking-wider uppercase">Smart City</div>
  )}
  </div>
  )}
 </div>
 );

 const content = (
 <div className={`inline-flex items-center min-w-0 ${className}`}>
 {imageFailed ? (
 <Fallback />
 ) : (
 <img
  src={src}
  alt={BRAND.name}
  width={dimensions.width}
  height={dimensions.height}
  className="block shrink-0 object-contain max-w-full"
  style={{width: dimensions.width, height: dimensions.height}}
  draggable="false"
  onError={() => setImageFailed(true)}
 />
 )}
 </div>
 );

 if (!to) return content;

 return (
 <Link to={to} aria-label={`Ir para ${BRAND.name}`} className="inline-flex items-center min-w-0">
 {content}
 </Link>
 );
}
