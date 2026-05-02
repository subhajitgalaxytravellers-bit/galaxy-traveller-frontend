const AUTH_CHANGED_EVENT = 'auth:changed';

const isBrowser = () => typeof window !== 'undefined';

const decodeBase64Url = (value = '') => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  return atob(padded);
};

const parseJwtPayload = (token = '') => {
  try {
    const parts = String(token).split('.');
    if (parts.length < 2) return null;
    return JSON.parse(decodeBase64Url(parts[1]));
  } catch {
    return null;
  }
};

export const getTokenExpiryMs = (token = '') => {
  const payload = parseJwtPayload(token);
  const exp = Number(payload?.exp || 0);
  return exp > 0 ? exp * 1000 : null;
};

export const isTokenExpired = (token = '') => {
  const expiresAt = getTokenExpiryMs(token);
  if (!expiresAt) return false;
  return Date.now() >= expiresAt;
};

const emitAuthChanged = (reason = 'updated') => {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT, { detail: { reason } }));
};

export const clearAuth = (reason = 'logout') => {
  if (!isBrowser()) return;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  emitAuthChanged(reason);
};

export const setAuth = ({ token, user }) => {
  if (!isBrowser()) return;
  if (token) {
    localStorage.setItem('token', token);
  }
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  }
  emitAuthChanged('login');
};

export const getValidToken = () => {
  if (!isBrowser()) return '';
  const token = localStorage.getItem('token') || '';
  if (!token) return '';
  if (isTokenExpired(token)) {
    clearAuth('expired');
    return '';
  }
  return token;
};

export const isAuthenticated = () => !!getValidToken();

export const subscribeAuthChanges = (handler) => {
  if (!isBrowser() || typeof handler !== 'function') return () => {};

  const onCustom = () => handler();
  const onStorage = (event) => {
    if (event.key === 'token' || event.key === 'user') {
      handler();
    }
  };

  window.addEventListener(AUTH_CHANGED_EVENT, onCustom);
  window.addEventListener('storage', onStorage);

  return () => {
    window.removeEventListener(AUTH_CHANGED_EVENT, onCustom);
    window.removeEventListener('storage', onStorage);
  };
};

export const isAuthErrorResponse = (status, message = '') => {
  if (status === 401 || status === 403) return true;
  const text = String(message || '').toLowerCase();
  return text.includes('token') && (text.includes('expired') || text.includes('invalid'));
};
