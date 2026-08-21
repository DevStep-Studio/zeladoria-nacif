export class ApiError extends Error {
  constructor(message, {status = 500, details = null} = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

const buildUrl = (baseUrl, path, query = {}) => {
  if (!baseUrl) {
    throw new ApiError('Configure VITE_API_URL para usar o provider REST.', {status: 500});
  }

  const url = new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
};

export function createHttpClient({baseUrl, getToken}) {
  const request = async (path, {method = 'GET', body, query, headers} = {}) => {
    const token = getToken?.();
    const isFormData = body instanceof FormData;
    const response = await fetch(buildUrl(baseUrl, path, query), {
      method,
      headers: {
        ...(isFormData ? {} : {'Content-Type': 'application/json'}),
        ...(token ? {Authorization: `Bearer ${token}`} : {}),
        ...headers,
      },
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    });

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await response.json() : await response.text();

    if (!response.ok) {
      const message = typeof payload === 'object' && payload?.message ? payload.message : 'Erro na comunicação com o servidor.';
      throw new ApiError(message, {status: response.status, details: payload});
    }

    return payload;
  };

  return {request};
}
