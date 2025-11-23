// __mocks__/PersistenceManager.ts
import { vi } from 'vitest';

const localStorageMock = (() => {
  let store: Record<string, any> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => { const keys = Object.keys(store); return keys[index] || null; },
  };
})();

if (typeof global !== 'undefined') {
  Object.defineProperty(global, 'localStorage', { value: localStorageMock });
}

export class PersistenceManager {
  static instance: PersistenceManager;
  storagePrefix = 'opentd_';
  private serverUrl: string | null = null;

  static getInstance(): PersistenceManager {
    if (!PersistenceManager.instance) {
      PersistenceManager.instance = new PersistenceManager();
    }
    return PersistenceManager.instance;
  }

  setLocal = vi.fn((key: string, value: any) => {
    let serialized;
    if (key === 'authToken') {
      serialized = typeof value === 'string' ? value : String(value);
      localStorage.setItem(this.storagePrefix + key, serialized);
      // Track session state for AuthManager
      localStorage.setItem(this.storagePrefix + 'authToken', serialized);
    } else if (key === 'currentUser') {
      try {
        serialized = JSON.stringify(value);
      } catch {
        serialized = value;
      }
      localStorage.setItem(this.storagePrefix + key, serialized);
      // Track session state for AuthManager
      localStorage.setItem(this.storagePrefix + 'currentUser', serialized);
    } else {
      try {
        serialized = JSON.stringify(value);
      } catch {
        serialized = value;
      }
      localStorage.setItem(this.storagePrefix + key, serialized);
    }
  });

  getLocal = vi.fn((key: string) => {
    // Always get session state from localStorage
    const raw = localStorage.getItem(this.storagePrefix + key);
    if (raw === null) {
      if (key === 'users') return {};
      if (key === 'passwordSalt') return 'salt';
      return null;
    }
    if (key === 'authToken') {
      return raw;
    }
    if (key === 'currentUser') {
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    }
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  });

  removeLocal = vi.fn((key: string) => {
    localStorage.removeItem(this.storagePrefix + key);
    if (key === 'authToken') {
      localStorage.removeItem(this.storagePrefix + 'authToken');
    }
    if (key === 'currentUser') {
      localStorage.removeItem(this.storagePrefix + 'currentUser');
    }
  });

  getServerUrl = vi.fn(() => this.serverUrl);

  setServerUrl = vi.fn((url: string) => {
    this.serverUrl = url;
    localStorage.setItem(this.storagePrefix + 'serverUrl', url);
  });
}

export function clearMockStorage() {
  localStorage.clear();
}
