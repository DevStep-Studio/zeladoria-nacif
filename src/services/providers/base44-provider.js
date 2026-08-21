import {base44} from '@/api/base44Client';
import {appParams} from '@/lib/app-params';

const hasStoredBase44Token = () => {
  if (typeof window === 'undefined') return false;
  return Boolean(
    appParams.token ||
    window.localStorage.getItem('base44_access_token') ||
    window.localStorage.getItem('token')
  );
};

export const base44Provider = {
  auth: {
    get user() {
      return base44.auth.user;
    },
    hasSession: hasStoredBase44Token,
    me: (...args) => base44.auth.me(...args),
    register: (...args) => base44.auth.register(...args),
    verifyOtp: (...args) => base44.auth.verifyOtp(...args),
    setToken: (...args) => base44.auth.setToken(...args),
    resendOtp: (...args) => base44.auth.resendOtp(...args),
    loginWithProvider: (...args) => base44.auth.loginWithProvider(...args),
    loginViaEmailPassword: (...args) => base44.auth.loginViaEmailPassword(...args),
    resetPasswordRequest: (...args) => base44.auth.resetPasswordRequest(...args),
    resetPassword: (...args) => base44.auth.resetPassword(...args),
    updateMe: (...args) => base44.auth.updateMe(...args),
    logout: (...args) => base44.auth.logout(...args),
  },
  entities: base44.entities,
  integrations: base44.integrations,
};
