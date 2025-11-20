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
      const response = await fetch('/config.json');
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
