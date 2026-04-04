import { AUTH_ROUTE } from '../constants/navigation.js';

export const SESSION_STORAGE_KEY = 'hms.session';

export const readStoredSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const writeStoredSession = (session) => {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
};

export const clearStoredSession = () => {
  localStorage.removeItem(SESSION_STORAGE_KEY);
};

export const readStoredToken = () => {
  return readStoredSession()?.token ?? null;
};

export const redirectToLogin = () => {
  if (typeof window === 'undefined') return;
  if (!window.location.pathname.includes(AUTH_ROUTE.login)) {
    window.location.assign(AUTH_ROUTE.login);
  }
};
