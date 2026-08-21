import React from 'react';
import {UserX} from 'lucide-react';
import ErrorPage from '@/pages/errors/ErrorPage';

const UserNotRegisteredError = () => {
 return (
 <ErrorPage
 code="403"
 icon={UserX}
 title="Usuário não cadastrado"
 description="Esta conta ainda não está liberada para acessar o sistema. Verifique se entrou com o e-mail correto ou solicite a ativação ao administrador."
 primaryLabel="Ir para login"
 primaryTo="/login"
 />
 );
};

export default UserNotRegisteredError;
