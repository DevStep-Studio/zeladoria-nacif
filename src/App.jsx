import {Toaster} from"@/components/ui/toaster"
import {QueryClientProvider} from '@tanstack/react-query'
import {queryClientInstance} from '@/lib/query-client'
import {BrowserRouter as Router, Route, Routes, Navigate} from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import {AuthProvider, useAuth} from '@/lib/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleProtectedPage from '@/components/RoleProtectedPage';

import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

import CitizenLayout from '@/components/layout/CitizenLayout';
import AdminLayout from '@/components/layout/AdminLayout';

import Home from '@/pages/Home';
import NewOccurrence from '@/pages/NewOccurrence';
import MyOccurrences from '@/pages/MyOccurrences';
import OccurrenceDetail from '@/pages/OccurrenceDetail';
import Profile from '@/pages/Profile';

import AdminDashboard from '@/pages/admin/Dashboard';
import AdminOccurrences from '@/pages/admin/AdminOccurrences';
import AdminTeams from '@/pages/admin/AdminTeams';
import AdminDepartments from '@/pages/admin/AdminDepartments';
import OperationsCenter from '@/pages/admin/OperationsCenter';
import ExecutiveDashboard from '@/pages/admin/ExecutiveDashboard';
import AdminHealth from '@/pages/admin/AdminHealth';
import AdminEducation from '@/pages/admin/AdminEducation';
import SmartCityOps from '@/pages/admin/SmartCityOps';
import Transparency from '@/pages/Transparency';
import TeamApp from '@/pages/TeamApp';
import HealthModule from '@/pages/HealthModule';
import EducationModule from '@/pages/EducationModule';
import ParticipacaoPopular from '@/pages/ParticipacaoPopular';
import DefesaCivil from '@/pages/DefesaCivil';
import UnauthorizedPage from '@/pages/errors/UnauthorizedPage';
import ServerErrorPage from '@/pages/errors/ServerErrorPage';

const FIELD_TEAM_ROLES = ['admin', 'gestor', 'fiscal', 'equipe_campo', 'equipe'];

const AuthenticatedApp = () => {
 const {isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin} = useAuth();

 if (isLoadingPublicSettings || isLoadingAuth) {
 return (
 <div className="fixed inset-0 flex items-center justify-center bg-background">
 <div className="flex flex-col items-center gap-3">
 <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
 <p className="text-sm text-muted-foreground font-medium">Carregando...</p>

 </div>
 </div>
 );
}

 if (authError) {
 if (authError.type === 'user_not_registered') {
 return <UserNotRegisteredError />;
} else if (authError.type === 'auth_required') {
 const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].includes(window.location.pathname);
 if (!isAuthPage) {
 navigateToLogin();
 return null;
}
}
}

 return (
 <Routes>
 <Route path="/login" element={<Login />} />
 <Route path="/register" element={<Register />} />
 <Route path="/forgot-password" element={<ForgotPassword />} />
 <Route path="/reset-password" element={<ResetPassword />} />
 <Route path="/403" element={<UnauthorizedPage />} />
 <Route path="/500" element={<ServerErrorPage onRetry={() => window.location.reload()} />} />

 <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
 {/* Citizen routes */}
 <Route element={<CitizenLayout />}>
 <Route path="/" element={<Home />} />
 <Route path="/nova-ocorrencia" element={<NewOccurrence />} />
 <Route path="/minhas-ocorrencias" element={<MyOccurrences />} />
 <Route path="/ocorrencia/:id" element={<OccurrenceDetail />} />
 <Route path="/perfil" element={<Profile />} />
 </Route>

 {/* Admin routes */}
 <Route element={<AdminLayout />}>
 <Route path="/admin" element={<AdminDashboard />} />
 <Route path="/admin/ocorrencias" element={<AdminOccurrences />} />
 <Route path="/admin/equipes" element={<AdminTeams />} />
 <Route path="/admin/secretarias" element={<AdminDepartments />} />
 <Route path="/admin/operacoes" element={<OperationsCenter />} />
 <Route path="/admin/ordens-servico" element={<OperationsCenter />} />
 <Route path="/admin/executivo" element={<ExecutiveDashboard />} />
 <Route path="/admin/saude" element={<AdminHealth />} />
 <Route path="/admin/educacao" element={<AdminEducation />} />
 <Route path="/admin/smart-ops" element={<SmartCityOps />} />
 </Route>

 {/* Field team route */}
 <Route path="/app-equipe" element={
 <RoleProtectedPage roles={FIELD_TEAM_ROLES}>
 <TeamApp />
 </RoleProtectedPage>
 } />

 {/* Public routes */}
 <Route element={<CitizenLayout />}>
 <Route path="/transparencia" element={<Transparency />} />
 <Route path="/saude-publica" element={<HealthModule />} />
 <Route path="/matricula-escolar" element={<EducationModule />} />
 <Route path="/participacao" element={<ParticipacaoPopular />} />
 <Route path="/defesa-civil" element={<DefesaCivil />} />
 </Route>
 </Route>

 <Route path="*" element={<PageNotFound />} />
 </Routes>
 );
};

function App() {
 return (
 <AuthProvider>
 <QueryClientProvider client={queryClientInstance}>
 <Router>
 <ErrorBoundary>
 <AuthenticatedApp />
 </ErrorBoundary>
 </Router>
 <Toaster />
 </QueryClientProvider>
 </AuthProvider>
 )
}

export default App
