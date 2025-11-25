import { SettingsManager } from '../scenes/components/SettingsManager';
import en from './locales/en.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import es from './locales/es.json';

export type Lang = 'en' | 'de' | 'fr' | 'es';

export const LANGUAGES: Lang[] = ['en', 'de', 'fr', 'es'];

export const translations: Record<Lang, Record<string, string>> = {
  en: en as any,
  de: de as any,
  fr: fr as any,
  es: es as any,
};

let current: Lang = 'en';

// Simple EventTarget to notify listeners about language changes
const languageChangeTarget = new EventTarget();

function detectDefaultLanguage(): Lang {
  try {
    const settings = SettingsManager.load();
    const lang = (settings && (settings.language as Lang)) || (navigator?.language || 'en');
    const short = (typeof lang === 'string' && lang.split('-')[0]) || 'en';
    if ((LANGUAGES as string[]).includes(short)) return short as Lang;
  } catch (e) {
    // ignore
  }
  return 'en';
}

current = detectDefaultLanguage();

export function getLanguage(): Lang {
  return current;
}

export function setLanguage(lang: Lang) {
  if (current === lang) return;
  current = lang;
  // Persist to settings
  try {
    const settings = SettingsManager.load();
    settings.language = lang;
    SettingsManager.save(settings);
  } catch (e) {
    // ignore
  }
  languageChangeTarget.dispatchEvent(new CustomEvent('languagechange', { detail: { lang } }));
}

export function onLanguageChange(handler: (lang: Lang) => void) {
  const fn = (e: Event) => handler((e as CustomEvent).detail.lang as Lang);
  languageChangeTarget.addEventListener('languagechange', fn);
  return () => languageChangeTarget.removeEventListener('languagechange', fn);
}

export function t(key: string, placeholders?: Record<string, string | number>): string {
  const langMap = translations[current] || translations['en'];
  let v = (langMap as any)[key] || (translations['en'] as any)[key] || key;
  if (placeholders) {
    Object.keys(placeholders).forEach((k) => {
      v = v.replace(new RegExp(`\{\{\s*${k}\s*\}\}`, 'g'), String(placeholders[k]));
    });
  }
  return v;
}

export function getAvailableLanguages(): { code: Lang; label: string }[] {
  const labels: Record<Lang, string> = { en: 'English', de: 'Deutsch', fr: 'Français', es: 'Español' };
  return (LANGUAGES as Lang[]).map((l) => ({ code: l, label: labels[l] }));
}

export default { t, setLanguage, getLanguage, getAvailableLanguages, onLanguageChange };
