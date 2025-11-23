import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingsManager } from '../components/SettingsManager';
// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => { const keys = Object.keys(store); return keys[index] || null; },
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock PersistenceManager
interface MockPersistence {
  _settings: { soundEnabled: boolean; musicEnabled: boolean; difficulty: string };
  saveSettings: any;
  loadSettings: any;
}

const mockPersistence: MockPersistence = {
  _settings: { soundEnabled: true, musicEnabled: true, difficulty: 'normal' },
  saveSettings: vi.fn(function(settings: { soundEnabled: boolean; musicEnabled: boolean; difficulty: string }) {
    mockPersistence._settings = { ...settings };
  }),
  loadSettings: vi.fn(function(): { soundEnabled: boolean; musicEnabled: boolean; difficulty: string } {
    return { ...mockPersistence._settings };
  }),
};

vi.mock('../../client/PersistenceManager', () => ({
  PersistenceManager: {
    getInstance: () => mockPersistence,
  },
}));

describe('SettingsManager', () => {
  beforeEach(() => {
    mockPersistence.saveSettings.mockClear();
    mockPersistence.loadSettings.mockClear();
  });

  describe('load and save', () => {
    it('should return default settings when no saved data exists', () => {
      const settings = SettingsManager.load();
      expect(settings.soundEnabled).toBe(true);
      expect(settings.musicEnabled).toBe(true);
      expect(settings.difficulty).toBe('normal');
    });

    it('should save and load settings', () => {
      const settings = {
        soundEnabled: false,
        musicEnabled: false,
        difficulty: 'hard',
      };

      SettingsManager.save(settings);
      const loaded = SettingsManager.load();

      expect(loaded.soundEnabled).toBe(false);
      expect(loaded.musicEnabled).toBe(false);
      expect(loaded.difficulty).toBe('hard');
    });

    it('should preserve settings across multiple saves', () => {
      SettingsManager.save({ soundEnabled: false, musicEnabled: true, difficulty: 'easy' });
      SettingsManager.save({ soundEnabled: false, musicEnabled: false, difficulty: 'medium' });

      const loaded = SettingsManager.load();
      expect(loaded.musicEnabled).toBe(false);
      expect(loaded.difficulty).toBe('medium');
    });
  });

  describe('getSettings', () => {
    it('should get current settings', () => {
      SettingsManager.save({ soundEnabled: true, musicEnabled: false, difficulty: 'hard' });
      
      const settings = SettingsManager.getSettings();
      expect(settings.soundEnabled).toBe(true);
      expect(settings.musicEnabled).toBe(false);
      expect(settings.difficulty).toBe('hard');
    });
  });

  describe('error handling', () => {
    it('should return default settings on parse error', () => {
      localStorage.setItem('gameSettings', 'invalid json');
      const settings = SettingsManager.load();
      
      expect(settings.soundEnabled).toBe(true); // default value
    });
  });
});
