export interface GameConfig {
  game: {
    title: string;
    version: string;
    startGold: number;
    startLives: number;
    autoWaveDelay: number;
  };
  multiplayer: {
    enabled: boolean;
    serverPort: number;
    maxPlayers: number;
    enemyScaling: {
      countPerPlayer: number;
      healthPerPlayer: number;
    };
    resourceSharing: {
      gold: 'shared' | 'individual';
      lives: 'shared' | 'individual';
    };
    roomSettings: {
      maxRooms: number;
      roomCodeLength: number;
      autoStartDelay: number;
    };
  };
  towers: {
    [key: string]: {
      name: string;
      cost: number;
      damage: number;
      range: number;
      fireRate: number;
      type: string;
      slowEffect?: number;
      slowDuration?: number;
      burnDamagePerSecond?: number;
      burnDuration?: number;
      splashRadius?: number;
      armorPenetration?: number;
      requiresResearch?: boolean;
    };
  };
  towerUpgrades: {
    level2: {
      damageMultiplier: number;
      fireRateMultiplier: number;
      costMultiplier: number;
    };
    level3: {
      damageMultiplier: number;
      fireRateMultiplier: number;
      costMultiplier: number;
    };
    sellRefundPercent: number;
  };
  enemies: {
    normal: EnemyTypeConfig;
    fast: EnemyTypeConfig;
    tank: EnemyTypeConfig;
    boss: BossConfig;
    baseSpeed: number;
    healthScaling: {
      waveInterval: number;
      waveMultiplier: number;
      levelMultiplier: number;
    };
  };
  waves: {
    bossInterval: number;
    difficulty: {
      [key: string]: {
        baseEnemies: number;
        enemyMultiplier: number;
      };
    };
    spawnDelay: {
      base: number;
      reduction: number;
      minimum: number;
    };
    bossSpawnDelay: number;
    waveCompleteBonus: {
      baseGold: number;
      goldPerWave: number;
      baseXp: number;
      xpPerWave: number;
      xpMultiplier: number;
    };
  };
  research: {
    xpPerLevel: number;
    unlocks: {
      [key: string]: {
        level: number;
        name: string;
        description: string;
        cost: number;
      };
    };
  };
  ui: {
    colors: {
      background: string;
      path: string;
      gold: string;
      health: string;
    };
    positions: {
      towerButtonY: number;
      upgradeButtonY: number;
    };
  };
}

interface EnemyTypeConfig {
  baseHealth: number;
  speedMultiplier: number;
  baseGold: number;
  goldPerWave: number;
  xpReward: number;
  color: string;
  size: number;
}

interface BossConfig {
  baseHealth: number;
  speedMultiplier: number;
  baseGold: number;
  goldPerWave: number;
  baseXp: number;
  xpPerWave: number;
}

export class ConfigManager {
  private static instance: ConfigManager;
  private config!: GameConfig;
  private loaded: boolean = false;

  private constructor() {}

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  async load(): Promise<void> {
    if (this.loaded) {
      return;
    }

    try {
      // Resolve config path relative to the application's base URL.
      // When built with Vite the `import.meta.env.BASE_URL` is set to the base.
      // Fallback to `document.baseURI` or `window.location.href` for runtime resolution
      // so hosting in a subdirectory (e.g. GitHub Pages `/open-td/`) works.
      let base: string | undefined;
      try {
        // import.meta may not be available or typed in some test environments.
        // Use a ts-ignore on the access so the compiler doesn't error on `import.meta`.
        // @ts-ignore
        const maybeBase = (import.meta as any)?.env?.BASE_URL;
        if (maybeBase) {
          base = maybeBase;
        }
      } catch (e) {
        base = undefined;
      }

      if (!base) {
        if (typeof document !== 'undefined' && document.baseURI) {
          base = document.baseURI;
        } else if (typeof window !== 'undefined' && window.location) {
          base = window.location.href;
        } else {
          base = '/';
        }
      }

      let configUrl: string;
      try {
        // Ensure the base is treated as a directory. `new URL('.', base)` returns
        // the directory portion (always ending with '/'), which avoids cases where
        // a base without a trailing slash is interpreted as a filename.
        if (typeof base === 'string') {
          // Parse the base and, when it looks like a directory but misses a trailing
          // slash (e.g. 'https://example.com/open-td'), append a slash so URL
          // resolution treats it as a directory. If the last path segment looks
          // like a filename (contains a dot), don't append the slash.
          const parsed = new URL(base);
          const pathname = parsed.pathname || '';
          const segments = pathname.split('/').filter(Boolean);
          const lastSeg = segments.length ? segments[segments.length - 1] : '';
          if (!pathname.endsWith('/') && lastSeg && !lastSeg.includes('.')) {
            parsed.pathname = pathname + '/';
          }
          const baseDir = new URL('.', parsed.toString()).toString();
          configUrl = new URL('config.json', baseDir).toString();
        } else {
          configUrl = new URL('config.json', base as any).toString();
        }
      } catch (e) {
        // Fallback for environments with non-standard URL implementations
        if (typeof base === 'string') {
          if (base.endsWith('/')) {
            configUrl = base + 'config.json';
          } else {
            configUrl = base + '/config.json';
          }
        } else {
          configUrl = '/config.json';
        }
      }
      const response = await fetch(configUrl);
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.statusText}`);
      }
      this.config = await response.json();
      this.loaded = true;
      console.log('Game configuration loaded successfully');
    } catch (error) {
      console.error('Failed to load game configuration:', error);
      throw error;
    }
  }

  getConfig(): GameConfig {
    if (!this.loaded) {
      throw new Error('Configuration not loaded. Call load() first.');
    }
    return this.config;
  }

  // Convenience methods for common configs
  getTowerConfig(type: string) {
    return this.config.towers[type];
  }

  getEnemyConfig(type: 'normal' | 'fast' | 'tank' | 'boss') {
    return this.config.enemies[type];
  }

  getWaveConfig() {
    return this.config.waves;
  }

  getGameConfig() {
    return this.config.game;
  }

  getResearchConfig() {
    return this.config.research;
  }

  getUpgradeConfig() {
    return this.config.towerUpgrades;
  }

  isLoaded(): boolean {
    return this.loaded;
  }
}
