import {createHttpClient} from '@/services/http-client';

const ACCESS_TOKEN_KEY = 'zeladoria:access-token';
const USER_KEY = 'zeladoria:custom-user-data';

const ENTITY_NAMES = [
  'AuditLog',
  'CivilDefenseAlert',
  'CivilDefenseShelter',
  'Department',
  'EmergencyContact',
  'HealthAppointment',
  'HealthDoctor',
  'Notification',
  'Occurrence',
  'OccurrenceComment',
  'OccurrenceSupport',
  'PublicPoll',
  'School',
  'SchoolEnrollment',
  'Team',
  'User',
];

const getStoredUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const saved = window.localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const setStoredUser = (user) => {
  if (typeof window === 'undefined') return;
  if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  else window.localStorage.removeItem(USER_KEY);
};

export function createRestProvider({baseUrl}) {
  const http = createHttpClient({
    baseUrl,
    getToken: () => (typeof window === 'undefined' ? null : window.localStorage.getItem(ACCESS_TOKEN_KEY)),
  });

  const entities = ENTITY_NAMES.reduce((acc, entityName) => {
    acc[entityName] = {
      list: (sort, limit) => http.request(`/entities/${entityName}`, {query: {sort, limit}}),
      filter: (filters, sort, limit) => http.request(`/entities/${entityName}/filter`, {
        method: 'POST',
        body: {filters, sort, limit},
      }),
      create: (data) => http.request(`/entities/${entityName}`, {method: 'POST', body: data}),
      update: (id, data) => http.request(`/entities/${entityName}/${id}`, {method: 'PATCH', body: data}),
      delete: (id) => http.request(`/entities/${entityName}/${id}`, {method: 'DELETE'}),
    };
    return acc;
  }, {});

  return {
    auth: {
      get user() {
        return getStoredUser();
      },
      hasSession: () => Boolean(typeof window !== 'undefined' && window.localStorage.getItem(ACCESS_TOKEN_KEY)),
      me: async () => {
        const user = await http.request('/auth/me');
        setStoredUser(user);
        return user;
      },
      loginViaEmailPassword: async (email, password) => {
        const session = await http.request('/auth/login', {method: 'POST', body: {email, password}});
        if (session?.access_token && typeof window !== 'undefined') {
          window.localStorage.setItem(ACCESS_TOKEN_KEY, session.access_token);
        }
        if (session?.user) setStoredUser(session.user);
        return session;
      },
      register: (data) => http.request('/auth/register', {method: 'POST', body: data}),
      verifyOtp: (data) => http.request('/auth/verify-otp', {method: 'POST', body: data}),
      setToken: (token) => {
        if (typeof window !== 'undefined') window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
      },
      resendOtp: (email) => http.request('/auth/resend-otp', {method: 'POST', body: {email}}),
      loginWithProvider: (provider, redirectTo = '/') => {
        const redirectUrl = encodeURIComponent(`${window.location.origin}${redirectTo}`);
        window.location.assign(`${baseUrl}/auth/${provider}?redirect_to=${redirectUrl}`);
      },
      resetPasswordRequest: (email) => http.request('/auth/reset-password/request', {method: 'POST', body: {email}}),
      resetPassword: (data) => http.request('/auth/reset-password', {method: 'POST', body: data}),
      updateMe: async (data) => {
        const user = await http.request('/auth/me', {method: 'PATCH', body: data});
        setStoredUser(user);
        return user;
      },
      logout: async () => {
        try {
          await http.request('/auth/logout', {method: 'POST'});
        } finally {
          if (typeof window !== 'undefined') window.localStorage.removeItem(ACCESS_TOKEN_KEY);
          setStoredUser(null);
        }
      },
    },
    entities,
    integrations: {
      Core: {
        UploadFile: ({file}) => {
          const body = new FormData();
          body.append('file', file);
          return http.request('/files', {method: 'POST', body});
        },
        InvokeLLM: ({prompt}) => http.request('/ai/invoke', {method: 'POST', body: {prompt}}),
      },
    },
  };
}
