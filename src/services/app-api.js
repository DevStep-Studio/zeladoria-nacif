import {base44Provider} from '@/services/providers/base44-provider';
import {createRestProvider} from '@/services/providers/rest-provider';

const providerName = import.meta.env.VITE_DATA_PROVIDER || import.meta.env.VITE_APP_API_PROVIDER || 'base44';

const createProvider = () => {
  if (providerName === 'rest') {
    return createRestProvider({
      baseUrl: import.meta.env.VITE_API_URL || import.meta.env.VITE_APP_API_URL,
    });
  }

  return base44Provider;
};

export const appApi = createProvider();
export const appApiProviderName = providerName;
