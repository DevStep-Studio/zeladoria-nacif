import React, {useEffect, useRef, useState} from 'react';
import {useAuth} from '@/lib/AuthContext';
import {appApi} from '@/services/app-api';
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {User, LogOut, Save, Loader2, Camera, Trash2, Mail, Phone, MapPin, Home, AlertCircle, Shield, ShieldCheck} from 'lucide-react';
import {toast} from "sonner";
import {fetchAddressByCep, isValidCep, maskCep, normalizeCep, normalizeState, resolveManualLocation} from '@/lib/location';

const MAX_PROFILE_PHOTO_SIZE = 5 * 1024 * 1024;
const ACCEPTED_PROFILE_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function getInitialForm(user) {
 return {
  full_name: user?.full_name || '',
  email: user?.email || '',
  phone: user?.phone || '',
  postal_code: maskCep(user?.postal_code || ''),
  street: user?.street || '',
  address_number: user?.address_number || '',
  address_complement: user?.address_complement || '',
  neighborhood: user?.neighborhood || '',
  city: user?.city || '',
  state: user?.state || '',
  profile_photo_url: user?.profile_photo_url || '',
 };
}

function sanitizeProfilePayload(form, profilePhotoUrl) {
 return {
  full_name: form.full_name.trim(),
  phone: form.phone.trim(),
  postal_code: normalizeCep(form.postal_code),
  street: form.street.trim(),
  address_number: form.address_number.trim(),
  address_complement: form.address_complement.trim(),
  neighborhood: form.neighborhood.trim(),
  city: form.city.trim(),
  state: normalizeState(form.state),
  profile_photo_url: profilePhotoUrl || '',
 };
}

export default function Profile() {
 const {user, checkUserAuth, logout, switchRole, updateUserData} = useAuth();
 const [form, setForm] = useState(() => getInitialForm(user));
 const [saving, setSaving] = useState(false);
 const [cepLoading, setCepLoading] = useState(false);
 const [cepError, setCepError] = useState('');
 const [pendingPhotoFile, setPendingPhotoFile] = useState(null);
 const [previewUrl, setPreviewUrl] = useState('');
 const [photoRemoved, setPhotoRemoved] = useState(false);
 const numberInputRef = useRef(null);
 const photoInputRef = useRef(null);
 const lastFetchedCepRef = useRef('');

 useEffect(() => {
  setForm(getInitialForm(user));
  setPhotoRemoved(false);
  setPendingPhotoFile(null);
  setPreviewUrl('');
  lastFetchedCepRef.current = normalizeCep(user?.postal_code || '');
 }, [user]);

 useEffect(() => {
  return () => {
   if (previewUrl) URL.revokeObjectURL(previewUrl);
  };
 }, [previewUrl]);

 useEffect(() => {
  const cep = normalizeCep(form.postal_code);
  if (!cep) {
   setCepError('');
   return;
  }

  if (cep.length < 8) {
   setCepError('CEP incompleto. Use o formato 00000-000.');
   return;
  }

  if (!isValidCep(cep) || cep === lastFetchedCepRef.current) return;

  const timeout = window.setTimeout(async () => {
   setCepLoading(true);
   setCepError('');
   try {
    const address = await fetchAddressByCep(cep);
    lastFetchedCepRef.current = cep;
    setForm(prev => ({
     ...prev,
     postal_code: address.postalCode,
     street: address.street || prev.street,
     neighborhood: address.neighborhood || prev.neighborhood,
     city: address.city || prev.city,
     state: address.state || prev.state,
    }));
    window.setTimeout(() => numberInputRef.current?.focus(), 50);
   } catch (error) {
    setCepError(error?.message || 'Não foi possível consultar o CEP.');
   } finally {
    setCepLoading(false);
   }
  }, 450);

  return () => window.clearTimeout(timeout);
 }, [form.postal_code]);

 const updateField = (field, value) => {
  setForm(prev => ({...prev, [field]: value}));
 };

 const handlePhotoChange = (event) => {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;

  if (!ACCEPTED_PROFILE_PHOTO_TYPES.includes(file.type)) {
   toast.error('Use uma foto JPG, PNG ou WEBP.');
   return;
  }

  if (file.size > MAX_PROFILE_PHOTO_SIZE) {
   toast.error('A foto deve ter no máximo 5MB.');
   return;
  }

  if (previewUrl) URL.revokeObjectURL(previewUrl);
  setPendingPhotoFile(file);
  setPreviewUrl(URL.createObjectURL(file));
  setPhotoRemoved(false);
 };

 const handleRemovePhoto = () => {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  setPendingPhotoFile(null);
  setPreviewUrl('');
  setPhotoRemoved(true);
  setForm(prev => ({...prev, profile_photo_url: ''}));
 };

 const validate = () => {
  if (!form.full_name.trim()) {
   toast.error('Informe seu nome completo.');
   return false;
  }

  const cep = normalizeCep(form.postal_code);
  if (form.postal_code && !isValidCep(cep)) {
   setCepError('CEP incompleto ou inválido.');
   toast.error('Revise o CEP antes de salvar.');
   return false;
  }

  if (cepError) {
   toast.error('Corrija o CEP antes de salvar.');
   return false;
  }

  return true;
 };

 const handleSave = async (event) => {
  event.preventDefault();
  if (!validate()) return;

  setSaving(true);
  try {
   let profilePhotoUrl = photoRemoved ? '' : form.profile_photo_url;

   if (pendingPhotoFile) {
    const {file_url} = await appApi.integrations.Core.UploadFile({file: pendingPhotoFile});
    profilePhotoUrl = file_url;
   }

   const payload = sanitizeProfilePayload(form, profilePhotoUrl);
   
   // Resolve coordinates for the updated address so home map is immediately synced
   let locationData = {};
   if (payload.city && payload.state) {
     try {
       const resolved = await resolveManualLocation({
         postalCode: payload.postal_code,
         street: payload.street,
         neighborhood: payload.neighborhood,
         city: payload.city,
         state: payload.state,
       });
       if (resolved?.latitude && resolved?.longitude) {
         locationData = {
           last_location_latitude: resolved.latitude,
           last_location_longitude: resolved.longitude,
           last_location_address: resolved.address || `${payload.street}, ${payload.address_number} - ${payload.neighborhood}, ${payload.city} - ${payload.state}`,
           last_location_city: payload.city,
           last_location_state: payload.state,
           last_location_neighborhood: payload.neighborhood,
           last_location_postal_code: payload.postal_code,
           last_location_source: 'registered_address',
         };
       }
     } catch (locErr) {
       console.warn('Could not geocode updated profile address:', locErr);
     }
   }

   const fullPayload = {...payload, ...locationData};
   updateUserData(fullPayload);

   try {
     await appApi.auth.updateMe(fullPayload);
     await checkUserAuth();
   } catch {}

   setPendingPhotoFile(null);
   setPhotoRemoved(false);
   if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
   }
   toast.success('Perfil e endereço atualizados com sucesso.');
  } catch (error) {
   console.error(error);
   toast.error(error?.message || 'Não foi possível salvar o perfil.');
  } finally {
   setSaving(false);
  }
 };

 const displayPhoto = previewUrl || (!photoRemoved && form.profile_photo_url);

 return (
  <div className="min-h-screen bg-slate-50/50">
   <div className="w-full max-w-4xl mx-auto px-4 md:px-6 py-6 pb-32 md:pb-10 space-y-5">
    <section className="bg-primary rounded-xl p-6 md:p-8 relative overflow-hidden min-h-[150px] flex flex-col justify-center shadow-sm">
     <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
      <User className="w-44 h-44 text-white" strokeWidth={1.25} />
     </div>
     <div className="relative z-10">
      <div className="flex items-center gap-2 text-white/85 font-label-sm text-label-sm mb-4">
       <User className="w-4 h-4" />
       <span>Área do cidadão</span>
      </div>
      <h1 className="text-white font-headline-lg text-headline-lg-mobile md:text-headline-lg leading-tight">Meu Perfil</h1>
      <p className="text-white/90 text-sm md:text-base mt-1">Mantenha seus dados e endereço atualizados para o mapa da Home e atendimentos.</p>
     </div>
    </section>

    {/* Painel de Acesso / Modo Super Admin */}
    <Card className="border-2 border-slate-900 bg-slate-900 text-white shadow-md rounded-xl">
     <CardHeader className="pb-3 border-b border-slate-800 flex flex-row items-center justify-between">
      <CardTitle className="text-base flex items-center gap-2 text-white">
       <Shield className="w-5 h-5 text-emerald-400" />
       Controle de Nível de Acesso & Visualização
      </CardTitle>
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
       Perfil Atual: {user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'admin' ? 'Administrador' : 'Cidadão'}
      </span>
     </CardHeader>
     <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
       <p className="text-sm font-bold text-slate-200">Alternar modo de visualização do sistema</p>
       <p className="text-xs text-slate-400 mt-1">
        Como Super Admin você tem acesso a todos os painéis, operações de campo, triagens e módulos municipais.
       </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
       <Button
         type="button"
         size="sm"
         onClick={() => {
           switchRole('super_admin');
           toast.success('Modo Super Admin ativado.');
         }}
         className={`${user?.role === 'super_admin' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'} text-xs font-bold gap-1.5 h-9 rounded-xl`}
       >
         <ShieldCheck className="w-4 h-4" />
         Super Admin
       </Button>
       <Button
         type="button"
         size="sm"
         onClick={() => {
           switchRole('cidadao');
           toast.success('Modo Cidadão ativado.');
         }}
         className={`${user?.role === 'cidadao' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'} text-xs font-bold gap-1.5 h-9 rounded-xl`}
       >
         <User className="w-4 h-4" />
         Cidadão
       </Button>
      </div>
     </CardContent>
    </Card>

    <form onSubmit={handleSave} className="space-y-5">
     <Card className="border border-slate-200 shadow-sm rounded-xl">
      <CardHeader className="pb-3 border-b border-slate-100">
       <CardTitle className="text-base flex items-center gap-2">
        <Camera className="w-4 h-4 text-primary" />
        Foto do perfil
       </CardTitle>
      </CardHeader>
      <CardContent className="p-5 flex flex-col sm:flex-row gap-5 sm:items-center">
       <div className="w-28 h-28 rounded-full bg-primary/10 border border-primary/20 overflow-hidden flex items-center justify-center shrink-0">
        {displayPhoto ? (
         <img src={displayPhoto} alt="Foto do perfil" className="w-full h-full object-cover" />
        ) : (
         <User className="w-10 h-10 text-primary" />
        )}
       </div>
       <div className="flex-1 min-w-0 space-y-3">
        <div>
         <p className="text-sm font-semibold text-slate-800">Imagem circular no app</p>
         <p className="text-xs text-slate-500 mt-1">JPG, PNG ou WEBP, até 5MB. A pré-visualização só é salva após confirmar o formulário.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
         <Button type="button" variant="outline" className="gap-2" onClick={() => photoInputRef.current?.click()} disabled={saving}>
          <Camera className="w-4 h-4" />
          Alterar foto
         </Button>
         <Button type="button" variant="outline" className="gap-2 text-destructive hover:text-destructive" onClick={handleRemovePhoto} disabled={saving || (!displayPhoto && !pendingPhotoFile)}>
          <Trash2 className="w-4 h-4" />
          Remover
         </Button>
        </div>
        <input
         ref={photoInputRef}
         type="file"
         accept="image/jpeg,image/png,image/webp"
         className="hidden"
         onChange={handlePhotoChange}
        />
       </div>
      </CardContent>
     </Card>

     <Card className="border border-slate-200 shadow-sm rounded-xl">
      <CardHeader className="pb-3 border-b border-slate-100">
       <CardTitle className="text-base flex items-center gap-2">
        <User className="w-4 h-4 text-primary" />
        Dados pessoais
       </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-5">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5 md:col-span-2">
         <Label htmlFor="full_name" className="text-sm">Nome completo</Label>
         <Input
          id="full_name"
          value={form.full_name}
          onChange={(e) => updateField('full_name', e.target.value)}
          autoComplete="name"
          className="h-11"
          required
         />
        </div>
        <div className="space-y-1.5">
         <Label htmlFor="email" className="text-sm">E-mail</Label>
         <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input id="email" value={form.email} className="h-11 pl-9 bg-slate-50" disabled />
         </div>
        </div>
        <div className="space-y-1.5">
         <Label htmlFor="phone" className="text-sm">Telefone</Label>
         <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
           id="phone"
           value={form.phone}
           onChange={(e) => updateField('phone', e.target.value)}
           placeholder="(00) 00000-0000"
           autoComplete="tel"
           className="h-11 pl-9"
          />
         </div>
        </div>
       </div>

       <div className="pt-2">
        <div className="flex items-center gap-2 mb-3">
         <MapPin className="w-4 h-4 text-primary" />
         <h2 className="text-sm font-bold text-slate-900">Endereço</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="space-y-1.5">
          <Label htmlFor="postal_code" className="text-sm">CEP</Label>
          <div className="relative">
           <Input
            id="postal_code"
            value={form.postal_code}
            onChange={(e) => updateField('postal_code', maskCep(e.target.value))}
            placeholder="00000-000"
            inputMode="numeric"
            autoComplete="postal-code"
            className="h-11 pr-9"
          />
           {cepLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />}
          </div>
          {cepError && (
           <p className="text-xs text-destructive flex items-start gap-1">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            {cepError}
           </p>
          )}
         </div>
         <div className="space-y-1.5 md:col-span-3">
          <Label htmlFor="street" className="text-sm">Logradouro</Label>
          <Input id="street" value={form.street} onChange={(e) => updateField('street', e.target.value)} autoComplete="address-line1" className="h-11" />
         </div>
         <div className="space-y-1.5">
          <Label htmlFor="address_number" className="text-sm">Número</Label>
          <Input ref={numberInputRef} id="address_number" value={form.address_number} onChange={(e) => updateField('address_number', e.target.value)} autoComplete="address-line2" className="h-11" />
         </div>
         <div className="space-y-1.5">
          <Label htmlFor="address_complement" className="text-sm">Complemento</Label>
          <Input id="address_complement" value={form.address_complement} onChange={(e) => updateField('address_complement', e.target.value)} className="h-11" />
         </div>
         <div className="space-y-1.5">
          <Label htmlFor="neighborhood" className="text-sm">Bairro</Label>
          <Input id="neighborhood" value={form.neighborhood} onChange={(e) => updateField('neighborhood', e.target.value)} className="h-11" />
         </div>
         <div className="space-y-1.5">
          <Label htmlFor="city" className="text-sm">Cidade</Label>
          <Input id="city" value={form.city} onChange={(e) => updateField('city', e.target.value)} autoComplete="address-level2" className="h-11" />
         </div>
         <div className="space-y-1.5 md:col-span-1">
          <Label htmlFor="state" className="text-sm">Estado</Label>
          <Input id="state" value={form.state} onChange={(e) => updateField('state', e.target.value.toUpperCase().slice(0, 2))} placeholder="UF" autoComplete="address-level1" className="h-11" />
         </div>
        </div>
       </div>
      </CardContent>
     </Card>

     <div className="flex flex-col sm:flex-row gap-3">
      <Button type="submit" disabled={saving || cepLoading} className="h-12 flex-1 gap-2 font-bold">
       {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
       {saving ? 'Salvando...' : 'Salvar perfil'}
      </Button>
      <Button type="button" variant="outline" className="h-12 sm:w-48 gap-2 text-destructive hover:text-destructive" onClick={() => logout()} disabled={saving}>
       <LogOut className="w-4 h-4" />
       Sair da conta
      </Button>
     </div>
    </form>

    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
     <Home className="w-4 h-4 text-primary shrink-0" />
     Os dados são vinculados ao usuário autenticado e carregados novamente ao abrir a tela.
    </div>
   </div>
  </div>
 );
}
