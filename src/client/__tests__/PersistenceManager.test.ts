import { beforeEach, describe, vi } from 'vitest';
import { PersistenceManager } from '../PersistenceManager';
import { it, expect } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch
global.fetch = vi.fn();

describe('PersistenceManager', () => {

  let persistenceManager: PersistenceManager;

  beforeEach(() => {
    localStorageMock.clear();
    persistenceManager = PersistenceManager.getInstance();
  });

  it('should use localStorage for local mode', () => {
    persistenceManager["storageMode"] = "local";
    localStorage.setItem('opentd_test', 'value');
    expect(localStorage.getItem('opentd_test')).toBe('value');
  });

  it('should save and load serverUrl in hybrid mode', () => {
    localStorage.setItem('opentd_serverUrl', 'http://localhost');
    persistenceManager["detectStorageMode"]();
    expect(persistenceManager["serverUrl"]).toBe('http://localhost');
    expect(persistenceManager["storageMode"]).toBe('hybrid');
  });

  it('should default to local mode if no serverUrl', () => {
    localStorage.removeItem('opentd_serverUrl');
    persistenceManager["detectStorageMode"]();
    expect(persistenceManager["storageMode"]).toBe('local');
  });
})
