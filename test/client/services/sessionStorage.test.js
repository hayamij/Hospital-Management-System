import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearDoctorRecordsState,
  clearStoredSession,
  DOCTOR_RECORDS_STATE_STORAGE_KEY,
  readDoctorRecordsState,
  readStoredSession,
  readStoredToken,
  redirectToLogin,
  SESSION_STORAGE_KEY,
  writeDoctorRecordsState,
  writeStoredSession,
} from '../../../client/src/services/sessionStorage.js';

const createLocalStorageMock = () => {
  const store = new Map();

  return {
    getItem: vi.fn((key) => (store.has(key) ? store.get(key) : null)),
    setItem: vi.fn((key, value) => {
      store.set(key, String(value));
    }),
    removeItem: vi.fn((key) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
  };
};

const originalWindow = globalThis.window;
const originalLocalStorage = globalThis.localStorage;

const setWindowLocation = (pathname = '/') => {
  const assign = vi.fn();
  globalThis.window = {
    location: {
      pathname,
      assign,
    },
  };
  return assign;
};

describe('sessionStorage service', () => {
  let localStorageMock;

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorageMock = createLocalStorageMock();
    globalThis.localStorage = localStorageMock;
    setWindowLocation('/');
  });

  afterAll(() => {
    if (typeof originalWindow === 'undefined') {
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }

    if (typeof originalLocalStorage === 'undefined') {
      delete globalThis.localStorage;
    } else {
      globalThis.localStorage = originalLocalStorage;
    }
  });

  it('writes and reads session payload', () => {
    const session = { token: 'token-1', role: 'patient', userProfile: { id: 'pat-1' } };

    writeStoredSession(session);

    expect(localStorageMock.setItem).toHaveBeenCalledWith(SESSION_STORAGE_KEY, JSON.stringify(session));
    expect(readStoredSession()).toEqual(session);
    expect(readStoredToken()).toBe('token-1');
  });

  it('returns null for missing or invalid session payload', () => {
    expect(readStoredSession()).toBeNull();

    localStorageMock.setItem(SESSION_STORAGE_KEY, '{invalid-json');
    expect(readStoredSession()).toBeNull();
  });

  it('clears stored session', () => {
    localStorageMock.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'token-2' }));

    clearStoredSession();

    expect(localStorageMock.removeItem).toHaveBeenCalledWith(SESSION_STORAGE_KEY);
    expect(readStoredSession()).toBeNull();
  });

  it('redirects to login when not already on login path', () => {
    const assign = setWindowLocation('/patient/dashboard');

    redirectToLogin();

    expect(assign).toHaveBeenCalledWith('/login');
  });

  it('does not redirect when already on login path', () => {
    const assign = setWindowLocation('/login');

    redirectToLogin();

    expect(assign).not.toHaveBeenCalled();
  });

  it('is safe when window is unavailable', () => {
    delete globalThis.window;

    expect(() => redirectToLogin()).not.toThrow();
  });

  it('writes and reads doctor records state', () => {
    const state = { patientId: 'pat-77' };

    writeDoctorRecordsState(state);

    expect(localStorageMock.setItem).toHaveBeenCalledWith(DOCTOR_RECORDS_STATE_STORAGE_KEY, JSON.stringify(state));
    expect(readDoctorRecordsState()).toEqual(state);
  });

  it('clears doctor records state safely', () => {
    localStorageMock.setItem(DOCTOR_RECORDS_STATE_STORAGE_KEY, JSON.stringify({ patientId: 'pat-1' }));

    clearDoctorRecordsState();

    expect(localStorageMock.removeItem).toHaveBeenCalledWith(DOCTOR_RECORDS_STATE_STORAGE_KEY);
    expect(readDoctorRecordsState()).toBeNull();
  });
});
