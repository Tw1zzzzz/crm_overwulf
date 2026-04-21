import axios from 'axios';
import { buildApiUrl, getApiBaseUrl } from './runtimeConfig';

const shouldRewritePath = (value: string) => {
  return (
    value.startsWith('/api') ||
    value.startsWith('/uploads') ||
    value === '/health' ||
    value === '/health-check'
  );
};

const apiBaseUrl = getApiBaseUrl();

if (apiBaseUrl) {
  axios.defaults.baseURL = apiBaseUrl;

  const originalFetch = window.fetch.bind(window);

  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string' && shouldRewritePath(input)) {
      return originalFetch(buildApiUrl(input), init);
    }

    if (input instanceof URL && shouldRewritePath(input.pathname)) {
      return originalFetch(buildApiUrl(`${input.pathname}${input.search}`), init);
    }

    if (input instanceof Request && shouldRewritePath(new URL(input.url).pathname)) {
      const requestUrl = new URL(input.url);
      return originalFetch(new Request(buildApiUrl(`${requestUrl.pathname}${requestUrl.search}`), input), init);
    }

    return originalFetch(input, init);
  }) as typeof window.fetch;
}
