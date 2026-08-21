import React from 'react';
import {SearchX} from 'lucide-react';
import {useLocation} from 'react-router-dom';
import {useAuth} from '@/lib/AuthContext';
import ErrorPage from '@/pages/errors/ErrorPage';

export default function NotFoundPage() {
  const location = useLocation();
  const {isAuthenticated, user} = useAuth();
  const isAdmin = ['super_admin', 'admin', 'gestor', 'atendente', 'fiscal'].includes(user?.role);
  const destination = isAuthenticated && isAdmin ? '/admin' : '/';

  return (
    <ErrorPage
      code="404"
      icon={SearchX}
      title="Página não encontrada"
      description={`Não existe uma página publicada para "${location.pathname}". Verifique o endereço ou volte para uma área válida do sistema.`}
      primaryLabel={isAdmin ? 'Ir para o painel' : 'Ir para o início'}
      primaryTo={destination}
    />
  );
}
