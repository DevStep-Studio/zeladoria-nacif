import React from 'react';
import {ShieldAlert} from 'lucide-react';
import ErrorPage from '@/pages/errors/ErrorPage';

export default function UnauthorizedPage({
  title = 'Acesso restrito',
  description = 'Seu perfil não tem permissão para acessar esta área do sistema.',
  primaryLabel = 'Ir para o início',
  primaryTo = '/',
}) {
  return (
    <ErrorPage
      code="403"
      icon={ShieldAlert}
      title={title}
      description={description}
      primaryLabel={primaryLabel}
      primaryTo={primaryTo}
    />
  );
}
