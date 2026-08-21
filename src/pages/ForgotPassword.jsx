import React, {useState} from"react";
import {Link} from"react-router-dom";
import {appApi} from '@/services/app-api';
import {Button} from"@/components/ui/button";
import {Input} from"@/components/ui/input";
import {Label} from"@/components/ui/label";
import {ArrowLeft, ArrowRight, Loader2, Mail} from"lucide-react";
import AuthLayout from"@/components/AuthLayout";

export default function ForgotPassword() {
 const [email, setEmail] = useState("");
 const [loading, setLoading] = useState(false);
 const [sent, setSent] = useState(false);

 const handleSubmit = async (e) => {
 e.preventDefault();
 setLoading(true);
 try {
 await appApi.auth.resetPasswordRequest(email);
} catch {
 // Always show success regardless
} finally {
 setLoading(false);
 setSent(true);
}
};

 return (
 <AuthLayout
 title="Redefinir senha" subtitle="Enviaremos um link para redefinir" footer={
 <Link to="/login" className="font-bold text-primary hover:underline">
 <ArrowLeft className="mr-1 inline h-3 w-3" />Voltar para o login
 </Link>
}
 >
 {sent ? (
 <p className="rounded-xl border border-primary/10 bg-primary/5 px-4 py-3 text-center text-[13px] leading-5 text-slate-600">
 Se houver uma conta com esse e-mail, você receberá um link de redefinição em breve.
 </p>
 ) : (
 <form onSubmit={handleSubmit} className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="email" className="text-[12px] font-bold text-slate-900">Endereço de e-mail *</Label>
 <div className="relative">
 <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
 <Input
 id="email" type="email" autoComplete="email"autoFocus
 placeholder="seu@email.com" value={email}
 onChange={(e) => setEmail(e.target.value)}
 className="h-10 rounded-xl border-slate-200 bg-white pl-10 pr-3 text-[13px] shadow-none placeholder:text-slate-400 focus-visible:ring-primary/30"required
 />
 </div>
 </div>
 <Button type="submit" className="h-10 w-full rounded-xl bg-primary text-[13px] font-bold text-white shadow-sm shadow-primary/20 hover:bg-primary/90" disabled={loading}>
 {loading ? (
 <>
 <Loader2 className="h-4 w-4 animate-spin" />
 Enviando...
 </>
 ) : (
 <>
 Enviar link de redefinição
 <ArrowRight className="h-4 w-4" />
 </>
 )}
 </Button>
 </form>
 )}
 </AuthLayout>
 );
}
