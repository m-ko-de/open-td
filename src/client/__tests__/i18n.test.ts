import { describe, it, expect, beforeEach } from 'vitest';
import { t, setLanguage, getLanguage, getAvailableLanguages } from '../i18n';
import { SettingsManager } from '../../scenes/components/SettingsManager';

// Mock localStorage for tests that rely on PersistenceManager
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('i18n', () => {
  beforeEach(() => {
    setLanguage('en');
  });

  it('returns default English strings', () => {
    expect(getLanguage()).toBe('en');
    expect(t('menu.burger')).toBe('Menu');
    expect(t('menu.close')).toBe('Close');
  });

  it('switches languages', () => {
    setLanguage('de');
    expect(getLanguage()).toBe('de');
    expect(t('menu.burger')).toBe('Menü');
    setLanguage('fr');
    expect(t('menu.burger')).toBe('Menu');
  });

  it('persists language in settings', () => {
    setLanguage('es');
    const settings = SettingsManager.load();
    expect(settings.language).toBe('es');
  });

  it('supports placeholders', () => {
    setLanguage('en');
    const text = t('tower.sell_refund', { value: '50G', pct: '90%' });
    expect(text).toContain('50G');
    expect(text).toContain('90%');
  });

  it('returns available languages', () => {
    const langs = getAvailableLanguages();
    expect(langs.length).toBeGreaterThanOrEqual(4);
    expect(langs.map(l => l.code)).toEqual(expect.arrayContaining(['en', 'de', 'fr', 'es']));
  });
});
