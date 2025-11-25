import { PersistenceManager } from '../../client/PersistenceManager';

/**
 * Represents the configuration options for the game.
 *
 * @property soundEnabled - Indicates whether sound effects are enabled.
 * @property musicEnabled - Indicates whether background music is enabled.
 * @property difficulty - The difficulty level of the game (e.g., "easy", "medium", "hard").
 */
import { Lang } from '@/client/i18n';

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  difficulty: string;
  autoRestartOnError?: boolean;
  language?: Lang;
}

/**
 * Manages game settings by providing methods to save, load, and retrieve settings.
 * Utilizes the `PersistenceManager` to persist settings data.
 *
 * @remarks
 * - Settings are stored under a static storage key.
 * - Default settings are provided and merged with loaded settings.
 *
 * @example
 * ```typescript
 * const currentSettings = SettingsManager.getSettings();
 * SettingsManager.save({ ...currentSettings, soundEnabled: false });
 * ```
 *
 * @public
 */
export class SettingsManager {
  
  private static defaultSettings: GameSettings = {
    soundEnabled: true,
    musicEnabled: true,
    difficulty: 'normal',
    autoRestartOnError: true,
    language: 'en',
  };

  static save(settings: GameSettings): void {
    // Use PersistenceManager for settings
    // @ts-ignore
    // eslint-disable-next-line
    // Use correct import for PersistenceManager
    // Import at top of file
    PersistenceManager.getInstance().saveSettings(settings);
  }

  static load(): GameSettings {
    // Use PersistenceManager for settings
    // @ts-ignore
    // eslint-disable-next-line
    // Use correct import for PersistenceManager
    const saved = PersistenceManager.getInstance().loadSettings();
    if (saved) {
      try {
        return { ...this.defaultSettings, ...saved };
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
    return { ...this.defaultSettings };
  }

  static getSettings(): GameSettings {
    return this.load();
  }
}
