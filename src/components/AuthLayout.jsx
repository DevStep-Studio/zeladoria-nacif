import React from 'react';
import ZeladoriaLogo from '@/components/shared/ZeladoriaLogo';

export default function AuthLayout({title, subtitle, footer = null, children}) {
 return (
  <div className="min-h-screen bg-white text-slate-950 lg:grid lg:grid-cols-[minmax(0,45%)_minmax(0,55%)]">
   <section className="relative flex min-h-screen flex-col px-6 py-8 sm:px-10 lg:px-12 xl:px-14">
    <div className="shrink-0">
     <ZeladoriaLogo size="sm" to="/" />
    </div>

    <div className="flex flex-1 items-center justify-center py-10">
     <div className="w-full max-w-[342px]">
      <div className="mb-5">
       <h1 className="text-[28px] font-extrabold leading-tight tracking-normal text-slate-950">
        {title}
       </h1>
       {subtitle && (
        <p className="mt-2 text-[13px] leading-5 text-slate-500">
         {subtitle}
        </p>
       )}
      </div>

      {children}

      {footer && (
       <p className="mt-6 text-center text-[12px] text-slate-400">
        {footer}
       </p>
      )}
     </div>
    </div>

    <footer className="flex shrink-0 items-center justify-between gap-4 text-[11px] text-slate-300">
     <span>© 2026 Zeldoria</span>
     <div className="flex items-center gap-5">
      <span>Privacidade</span>
      <span>Termos</span>
     </div>
    </footer>
   </section>

   <aside className="relative hidden min-h-screen overflow-hidden bg-primary lg:block">
    <img
     src="/images/login.png"
     alt=""
     className="absolute inset-0 h-full w-full object-cover"
     draggable="false"
    />

    <div className="absolute right-9 top-7">
     <ZeladoriaLogo size="sm" theme="dark" to="/" />
    </div>

    <div className="absolute bottom-14 right-10 max-w-[270px] text-right text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.22)]">
     <p className="text-[42px] font-extrabold leading-[0.95] tracking-normal">
      Cuide da
      <span className="block font-light">sua</span>
      cidade
     </p>
    </div>
   </aside>
  </div>
 );
}
