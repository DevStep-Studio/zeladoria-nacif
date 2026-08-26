import React, {useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {useAuth, INVESTOR_USERS} from '@/lib/AuthContext';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Checkbox} from '@/components/ui/checkbox';
import ZeladoriaLogo from '@/components/shared/ZeladoriaLogo';
import {ArrowRight, Eye, EyeOff, Loader2, Lock, User, ShieldCheck, UserRoundCheck, ShieldAlert, KeyRound, Sparkles} from 'lucide-react';

const REMEMBERED_EMAIL_KEY = 'zeladoria:remembered-email';

export default function Login() {
 const {loginWithCredentials, loginAsSuperAdmin, loginAsCitizen, loginAsInvestor} = useAuth();
 const navigate = useNavigate();
 const [identifier, setIdentifier] = useState('');
 const [password, setPassword] = useState('');
 const [rememberMe, setRememberMe] = useState(true);
 const [showPassword, setShowPassword] = useState(false);
 const [error, setError] = useState('');
 const [loading, setLoading] = useState(false);

 useEffect(() => {
  const rememberedEmail = window.localStorage.getItem(REMEMBERED_EMAIL_KEY);
  if (rememberedEmail) setIdentifier(rememberedEmail);
 }, []);

 const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
   const user = await loginWithCredentials(identifier, password);
   if (rememberMe) {
    window.localStorage.setItem(REMEMBERED_EMAIL_KEY, identifier);
   } else {
    window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
   }
   
   if (user?.role === 'super_admin' || user?.role === 'admin') {
    navigate('/admin');
   } else {
    navigate('/');
   }
  } catch (err) {
   setError(err.message || 'E-mail, usuário ou senha inválidos.');
  } finally {
   setLoading(false);
  }
 };

 const handleSuperAdminDirect = () => {
  loginAsSuperAdmin();
  navigate('/admin');
 };

 const handleCitizenDirect = () => {
  loginAsCitizen();
  navigate('/');
 };

 const fillInvestorCredentials = (investorKey) => {
  const inv = INVESTOR_USERS[investorKey];
  if (!inv) return;
  setIdentifier(inv.email);
  setPassword(inv.password);
  setError('');
 };



 return (
  <div className="min-h-screen bg-white text-slate-950 lg:grid lg:grid-cols-[minmax(0,45%)_minmax(0,55%)]">
   <section className="relative flex min-h-screen flex-col px-6 py-8 sm:px-10 lg:px-12 xl:px-14">
    <div className="shrink-0">
     <ZeladoriaLogo size="sm" to="/" />
    </div>

    <div className="flex flex-1 items-center justify-center py-6">
     <div className="w-full max-w-[360px]">
      <div className="mb-5">
       <h1 className="text-[28px] font-extrabold leading-tight tracking-normal text-slate-950">
        Bem-vindo de volta
       </h1>
       <p className="mt-2 text-[13px] leading-5 text-slate-500">
        Entre na sua conta para acessar seus chamados e serviços.
       </p>
      </div>

      {/* Acesso rápido Super Admin em destaque */}
      <div className="mb-5 rounded-2xl border-2 border-primary/25 bg-primary/5 p-3.5 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Acesso Imediato</span>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            onClick={handleSuperAdminDirect}
            className="w-full h-10 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold gap-2 shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Entrar como Super Admin (Painel Completo)
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCitizenDirect}
            className="w-full h-9 rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold gap-2"
          >
            <UserRoundCheck className="w-4 h-4 text-primary" />
            Entrar como Cidadão (App Cidadão)
          </Button>
        </div>
      </div>

      {error && (
       <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[13px] font-medium text-red-600">
        {error}
       </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
       <div className="space-y-2">
        <Label htmlFor="identifier" className="text-[12px] font-bold text-slate-900">
         E-mail ou Usuário *
        </Label>
        <div className="relative">
         <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
         <Input
          id="identifier"
          type="text"
          autoComplete="username"
          placeholder="ex: user1 ou seu@email.com"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="h-10 rounded-xl border-slate-200 bg-white pl-10 pr-3 text-[13px] shadow-none placeholder:text-slate-400 focus-visible:ring-primary/30"
          required
         />
        </div>
       </div>

       <div className="space-y-2">
        <Label htmlFor="password" className="text-[12px] font-bold text-slate-900">
         Senha *
        </Label>
        <div className="relative">
         <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
         <Input
          id="password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-10 rounded-xl border-slate-200 bg-white px-10 text-[13px] shadow-none placeholder:text-slate-400 focus-visible:ring-primary/30"
          required
         />
         <button
          type="button"
          onClick={() => setShowPassword((visible) => !visible)}
          className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-slate-400 transition-colors hover:text-slate-600"
          aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
         >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
         </button>
        </div>
       </div>

       <div className="flex items-center justify-between gap-3 pt-1">
        <label htmlFor="remember-me" className="flex cursor-pointer items-center gap-2 text-[12px] font-medium text-slate-500">
         <Checkbox
          id="remember-me"
          checked={rememberMe}
          onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
          className="h-3.5 w-3.5 rounded-[3px] border-primary data-[state=checked]:bg-primary data-[state=checked]:text-white [&_svg]:h-3 [&_svg]:w-3"
         />
         Lembrar de mim
        </label>
        <Link to="/forgot-password" className="text-[12px] font-bold text-primary hover:underline">
         Esqueci a senha
        </Link>
       </div>

       <Button
        type="submit"
        className="mt-2 h-10 w-full rounded-xl bg-primary text-[13px] font-bold text-white shadow-sm shadow-primary/20 hover:bg-primary/90"
        disabled={loading}
       >
        {loading ? (
         <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Entrando...
         </>
        ) : (
         <>
          Acessar Sistema
          <ArrowRight className="h-4 w-4" />
         </>
        )}
       </Button>
      </form>

      <p className="mt-5 text-center text-[12px] text-slate-400">
       Não tem conta?{' '}
       <Link to="/register" className="font-bold text-primary hover:underline">
        Criar conta grátis
       </Link>
      </p>

      <div className="my-3 flex items-center gap-3 text-[11px] font-medium text-slate-300">
       <div className="h-px flex-1 bg-slate-100" />
       <span>ou preenchimento rápido para investidores</span>
       <div className="h-px flex-1 bg-slate-100" />
      </div>

      <div className="grid grid-cols-2 gap-2">
       <Button
        type="button"
        variant="outline"
        onClick={() => fillInvestorCredentials('user1')}
        className="h-9 w-full rounded-xl border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 shadow-none hover:bg-slate-100 hover:text-primary gap-1 truncate"
       >
        <KeyRound className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        user1@zeladoria.com
       </Button>
       <Button
        type="button"
        variant="outline"
        onClick={() => fillInvestorCredentials('user2')}
        className="h-9 w-full rounded-xl border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 shadow-none hover:bg-slate-100 hover:text-primary gap-1 truncate"
       >
        <KeyRound className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        user2@zeladoria.com
       </Button>
      </div>

     </div>
    </div>

    <footer className="flex shrink-0 items-center justify-between gap-4 text-[11px] text-slate-300">
     <span>© 2026 Zeladoria Cidades</span>
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
