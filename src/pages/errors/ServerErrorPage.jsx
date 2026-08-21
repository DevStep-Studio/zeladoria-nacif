import React from 'react';
import {ServerCrash} from 'lucide-react';
import ErrorPage from '@/pages/errors/ErrorPage';

export default function ServerErrorPage({onRetry}) {
  return (
    <ErrorPage
      code="500"
      icon={ServerCrash}
      title="Erro inesperado"
      description="O sistema encontrou uma falha ao carregar esta tela. Tente novamente ou retorne para uma área estável."
      primaryLabel="Ir para o início"
      primaryTo="/"
      onRetry={onRetry}
    />
  );
}
