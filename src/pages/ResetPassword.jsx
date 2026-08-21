import React, {useState} from"react";
import {Link, useSearchParams} from"react-router-dom";
import {base44} from"@/api/base44Client";
import {Button} from"@/components/ui/button";
import {Input} from"@/components/ui/input";
import {Label} from"@/components/ui/label";
import {ArrowRight, Lock, Loader2} from"lucide-react";
import AuthLayout from"@/components/AuthLayout";

export default function ResetPassword() {
 const [searchParams] = useSearchParams();
 const resetToken = searchParams.get("token");

 const [newPassword, setNewPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [error, setError] = useState("");
 const [loading, setLoading] = useState(false);

 const handleSubmit = async (e) => {
 e.preventDefault();
 setError("");
 if (newPassword !== confirmPassword) {
 setError("As senhas não coincidem");
 return;
}
 setLoading(true);
 try {
 await base44.auth.resetPassword({resetToken, newPassword});
 window.location.href ="/login";
} catch (err) {
 setError(err.message ||"Falha ao redefinir a senha");
} finally {
 setLoading(false);
}
};

 if (!resetToken) {
 return (
 <AuthLayout
 title="Link inválido" subtitle="Este link de redefinição está ausente ou inválido" footer={
 <Link to="/forgot-password" className="font-bold text-primary hover:underline">
 Solicitar novo link
 </Link>
}
 >
 <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-[13px] leading-5 text-red-600">
 O link utilizado parece estar incompleto. Solicite um novo e-mail de redefinição de senha.
 </p>
 </AuthLayout>
 );
}

 return (
 <AuthLayout
 title="Nova senha" subtitle="Digite sua nova senha abaixo">
 {error && (
 <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[13px] font-medium text-red-600">
 {error}
 </div>
 )}
 <form onSubmit={handleSubmit} className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="password" className="text-[12px] font-bold text-slate-900">Nova senha *</Label>
 <div className="relative">
 <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
 <Input
 id="password" type="password" autoComplete="new-password"autoFocus
 placeholder="••••••••" value={newPassword}
 onChange={(e) => setNewPassword(e.target.value)}
 className="h-10 rounded-xl border-slate-200 bg-white pl-10 pr-3 text-[13px] shadow-none placeholder:text-slate-400 focus-visible:ring-primary/30"required
 />
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="confirm" className="text-[12px] font-bold text-slate-900">Confirmar senha *</Label>
 <div className="relative">
 <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
 <Input
 id="confirm" type="password" autoComplete="new-password" placeholder="••••••••" value={confirmPassword}
 onChange={(e) => setConfirmPassword(e.target.value)}
 className="h-10 rounded-xl border-slate-200 bg-white pl-10 pr-3 text-[13px] shadow-none placeholder:text-slate-400 focus-visible:ring-primary/30"required
 />
 </div>
 </div>
 <Button type="submit" className="h-10 w-full rounded-xl bg-primary text-[13px] font-bold text-white shadow-sm shadow-primary/20 hover:bg-primary/90" disabled={loading}>
 {loading ? (
 <>
 <Loader2 className="h-4 w-4 animate-spin" />
 Redefinindo...
 </>
 ) : (
 <>
 Redefinir senha
 <ArrowRight className="h-4 w-4" />
 </>
 )}
 </Button>
 </form>
 </AuthLayout>
 );
}
