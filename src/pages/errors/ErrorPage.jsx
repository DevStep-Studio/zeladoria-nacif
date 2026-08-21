import React from 'react';
import {Link} from 'react-router-dom';
import {AlertTriangle, ArrowLeft, Home, RefreshCw} from 'lucide-react';
import {Button} from '@/components/ui/button';
import ZeladoriaLogo from '@/components/shared/ZeladoriaLogo';

export default function ErrorPage({
  code,
  title,
  description,
  icon: Icon = AlertTriangle,
  primaryLabel = 'Ir para o início',
  primaryTo = '/',
  secondaryLabel = 'Voltar',
  onSecondary,
  onRetry,
}) {
  const hasRetry = typeof onRetry === 'function';

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="mb-8 flex items-center justify-between gap-4">
          <ZeladoriaLogo size="sm" to="/" />
          {code && <span className="text-sm font-black tracking-widest text-slate-300">{code}</span>}
        </div>

        <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-normal text-slate-900 sm:text-3xl">{title}</h1>
          <p className="text-sm leading-6 text-slate-500 sm:text-base">{description}</p>
        </div>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          <Button asChild className="h-11 rounded-xl bg-primary text-white hover:bg-primary/90">
            <Link to={primaryTo}>
              <Home className="h-4 w-4" />
              {primaryLabel}
            </Link>
          </Button>

          {hasRetry ? (
            <Button type="button" variant="outline" onClick={onRetry} className="h-11 rounded-xl">
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={onSecondary || (() => window.history.back())} className="h-11 rounded-xl">
              <ArrowLeft className="h-4 w-4" />
              {secondaryLabel}
            </Button>
          )}
        </div>
      </section>
    </main>
  );
}
