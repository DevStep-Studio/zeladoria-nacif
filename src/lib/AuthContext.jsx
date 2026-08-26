import React, {createContext, useState, useContext, useEffect} from 'react';
import {appApi} from '@/services/app-api';
import {queryClientInstance} from '@/lib/query-client';

const AuthContext = createContext();

const ROLE_OVERRIDE_KEY = 'zeldoria:user-role-override';
const LOCAL_USER_KEY = 'zeldoria:custom-user-data';

const hasPersistedSession = () => {
  if (typeof window === 'undefined') return false;
  return Boolean(window.localStorage.getItem(LOCAL_USER_KEY) || appApi.auth.hasSession?.());
};

export const SUPER_ADMIN_USER = {
  id: 'super-admin-01',
  email: 'superadmin@zeldoria.gov.br',
  full_name: 'Super Administrador do Sistema',
  role: 'super_admin',
  phone: '(11) 98888-7777',
  postal_code: '01310-100',
  street: 'Avenida Paulista',
  address_number: '1000',
  address_complement: 'Gabinete Central',
  neighborhood: 'Bela Vista',
  city: 'São Paulo',
  state: 'SP',
  last_location_latitude: -23.561684,
  last_location_longitude: -46.655981,
  last_location_address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
  last_location_city: 'São Paulo',
  last_location_state: 'SP',
  last_location_neighborhood: 'Bela Vista',
  last_location_postal_code: '01310-100',
};

export const INVESTOR_USERS = {
  user1: {
    id: 'investor-user-01',
    username: 'user1',
    email: 'user1@zeladoria.com',
    password: 'Z12345',
    full_name: 'Investidor 01 (Acesso Completo)',
    role: 'super_admin',
    is_investor: true,
    investor_badge: 'Investidor 01 • Sessão Confidencial',
    phone: '(11) 99111-0001',
    postal_code: '01310-100',
    street: 'Avenida Paulista',
    address_number: '1000',
    address_complement: 'Suíte Executiva 1',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    last_location_latitude: -23.561684,
    last_location_longitude: -46.655981,
    last_location_address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
    last_location_city: 'São Paulo',
    last_location_state: 'SP',
    last_location_neighborhood: 'Bela Vista',
    last_location_postal_code: '01310-100',
  },
  user2: {
    id: 'investor-user-02',
    username: 'user2',
    email: 'user2@zeladoria.com',
    password: 'Z12345',
    full_name: 'Investidor 02 (Acesso Completo)',
    role: 'super_admin',
    is_investor: true,
    investor_badge: 'Investidor 02 • Sessão Confidencial',
    phone: '(11) 99222-0002',
    postal_code: '01310-100',
    street: 'Avenida Paulista',
    address_number: '1000',
    address_complement: 'Suíte Executiva 2',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    last_location_latitude: -23.561684,
    last_location_longitude: -46.655981,
    last_location_address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
    last_location_city: 'São Paulo',
    last_location_state: 'SP',
    last_location_neighborhood: 'Bela Vista',
    last_location_postal_code: '01310-100',
  },
};

export const CITIZEN_DEMO_USER = {
  id: 'cidadao-demo-01',
  email: 'demo@zeldoria.com',
  full_name: 'Cidadão Exemplo',
  role: 'cidadao',
  phone: '(11) 97777-6666',
  postal_code: '04538-133',
  street: 'Avenida Brigadeiro Faria Lima',
  address_number: '2000',
  address_complement: 'Apto 42',
  neighborhood: 'Itaim Bibi',
  city: 'São Paulo',
  state: 'SP',
  last_location_latitude: -23.5855,
  last_location_longitude: -46.6817,
  last_location_address: 'Av. Brigadeiro Faria Lima, 2000 - Itaim Bibi, São Paulo - SP',
  last_location_city: 'São Paulo',
  last_location_state: 'SP',
  last_location_neighborhood: 'Itaim Bibi',
  last_location_postal_code: '04538-133',
};

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = window.localStorage.getItem(LOCAL_USER_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return hasPersistedSession();
  });
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();
  }, []);

  const persistUser = (userData) => {
    if (!userData) {
      window.localStorage.removeItem(LOCAL_USER_KEY);
      window.localStorage.removeItem(ROLE_OVERRIDE_KEY);
      setUser(null);
      setIsAuthenticated(false);
      return;
    }
    const roleOverride = window.localStorage.getItem(ROLE_OVERRIDE_KEY);
    const finalUser = {
      ...userData,
      role: roleOverride || userData.role || 'cidadao',
    };
    window.localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(finalUser));
    setUser(finalUser);
    setIsAuthenticated(true);
  };

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);

      // If user is already set from local storage, keep it
      const savedLocal = window.localStorage.getItem(LOCAL_USER_KEY);
      if (savedLocal) {
        try {
          const parsed = JSON.parse(savedLocal);
          const roleOverride = window.localStorage.getItem(ROLE_OVERRIDE_KEY);
          setUser({...parsed, role: roleOverride || parsed.role || 'super_admin'});
          setIsAuthenticated(true);
          setIsLoadingAuth(false);
          setIsLoadingPublicSettings(false);
          setAuthChecked(true);
          return;
        } catch {}
      }

      if (appApi.auth.hasSession?.()) {
        await checkUserAuth();
      } else {
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
        setAuthChecked(true);
      }
      setIsLoadingPublicSettings(false);
    } catch (error) {
      console.error('App state check failed:', error);
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = await appApi.auth.me();
      const roleOverride = window.localStorage.getItem(ROLE_OVERRIDE_KEY);
      const savedLocal = window.localStorage.getItem(LOCAL_USER_KEY);
      const localData = savedLocal ? JSON.parse(savedLocal) : {};
      
      const mergedUser = {
        ...localData,
        ...currentUser,
        role: roleOverride || currentUser?.role || localData?.role || 'cidadao',
      };
      persistUser(mergedUser);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      console.error('User auth check failed:', error);
      const savedLocal = window.localStorage.getItem(LOCAL_USER_KEY);
      if (savedLocal) {
        try {
          const parsed = JSON.parse(savedLocal);
          setUser(parsed);
          setIsAuthenticated(true);
        } catch {}
      } else {
        setIsAuthenticated(false);
      }
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const loginWithCredentials = async (identifier, password) => {
    const cleanId = (identifier || '').trim().toLowerCase();
    
    // Check investor 1
    if ((cleanId === 'user1' || cleanId === 'user1@zeladoria.com' || cleanId === 'investor1@zeladoria.com') && password === INVESTOR_USERS.user1.password) {
      window.localStorage.setItem(ROLE_OVERRIDE_KEY, 'super_admin');
      persistUser(INVESTOR_USERS.user1);
      setAuthError(null);
      return INVESTOR_USERS.user1;
    }
    
    // Check investor 2
    if ((cleanId === 'user2' || cleanId === 'user2@zeladoria.com' || cleanId === 'investor2@zeladoria.com') && password === INVESTOR_USERS.user2.password) {
      window.localStorage.setItem(ROLE_OVERRIDE_KEY, 'super_admin');
      persistUser(INVESTOR_USERS.user2);
      setAuthError(null);
      return INVESTOR_USERS.user2;
    }

    // Check citizen demo user
    if (cleanId === 'demo@zeldoria.com' && password === 'zeldoria123') {
      window.localStorage.setItem(ROLE_OVERRIDE_KEY, 'cidadao');
      persistUser(CITIZEN_DEMO_USER);
      setAuthError(null);
      return CITIZEN_DEMO_USER;
    }

    // Check superadmin demo user
    if (cleanId === 'superadmin@zeldoria.gov.br' && password === 'zeldoria123') {
      window.localStorage.setItem(ROLE_OVERRIDE_KEY, 'super_admin');
      persistUser(SUPER_ADMIN_USER);
      setAuthError(null);
      return SUPER_ADMIN_USER;
    }

    // Try backend API provider if configured
    try {
      const session = await appApi.auth.loginViaEmailPassword(identifier, password);
      if (session?.user) {
        persistUser(session.user);
        return session.user;
      }
      return session;
    } catch (err) {
      throw new Error(err.message || 'Credenciais inválidas. Verifique seu login e senha.');
    }
  };

  const loginAsSuperAdmin = () => {
    window.localStorage.setItem(ROLE_OVERRIDE_KEY, 'super_admin');
    persistUser(SUPER_ADMIN_USER);
    setAuthError(null);
    return SUPER_ADMIN_USER;
  };

  const loginAsInvestor = (investorKey = 'user1') => {
    const investor = INVESTOR_USERS[investorKey] || INVESTOR_USERS.user1;
    window.localStorage.setItem(ROLE_OVERRIDE_KEY, 'super_admin');
    persistUser(investor);
    setAuthError(null);
    return investor;
  };

  const loginAsCitizen = () => {
    window.localStorage.setItem(ROLE_OVERRIDE_KEY, 'cidadao');
    persistUser(CITIZEN_DEMO_USER);
    setAuthError(null);
    return CITIZEN_DEMO_USER;
  };

  const switchRole = (newRole) => {
    window.localStorage.setItem(ROLE_OVERRIDE_KEY, newRole);
    setUser(prev => {
      const updated = {...(prev || SUPER_ADMIN_USER), role: newRole};
      window.localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const updateUserData = (partialData) => {
    setUser(prev => {
      const updated = {...(prev || {}), ...partialData};
      window.localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const logout = (shouldRedirect = true) => {
    persistUser(null);
    window.localStorage.removeItem(ROLE_OVERRIDE_KEY);
    window.localStorage.removeItem(LOCAL_USER_KEY);
    queryClientInstance.clear();

    const finish = () => {
      if (shouldRedirect && window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    };

    try {
      const result = appApi.auth.logout();
      if (result?.finally) {
        result.catch(() => {}).finally(finish);
        return;
      }
    } catch {
      // Local logout has already completed; redirect still happens below.
    }

    finish();
  };

  const navigateToLogin = () => {
    window.location.replace('/login');
  };

  return (
    <AuthContext.Provider value={{
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState,
      loginWithCredentials,
      loginAsSuperAdmin,
      loginAsInvestor,
      loginAsCitizen,
      switchRole,
      updateUserData,
      isSuperAdmin: user?.role === 'super_admin' || user?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

