/**
 * SettingsManager - Handles settings persistence
 */
export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  difficulty: string;
}

export class SettingsManager {
  private static readonly STORAGE_KEY = 'openTD_settings';
  
  private static defaultSettings: GameSettings = {
    soundEnabled: true,
    musicEnabled: true,
    difficulty: 'normal',
  };

  static save(settings: GameSettings): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
  }

  static load(): GameSettings {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        return { ...this.defaultSettings, ...JSON.parse(saved) };
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
