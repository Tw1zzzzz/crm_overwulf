type DesktopRuntimeConfig = {
  apiBaseUrl?: string;
};

declare global {
  interface Window {
    CRMATLANT_DESKTOP_CONFIG?: DesktopRuntimeConfig;
  }
}

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const normalizeApiBaseUrl = (value?: string) => {
  const normalized = value?.trim();
  return normalized ? trimTrailingSlash(normalized) : '';
};

export const getApiBaseUrl = () => {
  const fromVite = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);
  if (fromVite) return fromVite;

  const fromRuntimeConfig = normalizeApiBaseUrl(window.CRMATLANT_DESKTOP_CONFIG?.apiBaseUrl);
  if (fromRuntimeConfig) return fromRuntimeConfig;

  const fromLocalStorage = normalizeApiBaseUrl(localStorage.getItem('crmApiBaseUrl') || undefined);
  if (fromLocalStorage) return fromLocalStorage;

  return '';
};

export const buildApiUrl = (path: string) => {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) return path;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${apiBaseUrl}${normalizedPath}`;
};

export const isDesktopShell = () => {
  return window.location.protocol === 'overwolf-extension:' || Boolean(window.CRMATLANT_DESKTOP_CONFIG?.apiBaseUrl);
};
