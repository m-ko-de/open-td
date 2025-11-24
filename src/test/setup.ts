import { vi } from 'vitest';

// Mock ConfigManager globally
vi.mock('../client/ConfigManager', () => ({
  ConfigManager: {
    getInstance: () => ({
      getConfig: () => ({
        multiplayer: {
          enemyScaling: {
            healthPerPlayer: 0.3
          }
        },
        enemies: {
          normal: {
            baseHealth: 50,
            speedMultiplier: 1.0,
            baseGold: 10,
            goldPerWave: 2,
            xpReward: 3,
            color: '0xff0000',
            size: 15
          },
          fast: {
            baseHealth: 30,
            speedMultiplier: 1.5,
            baseGold: 8,
            goldPerWave: 1,
            xpReward: 2,
            color: '0x00ff00',
            size: 12
          },
          tank: {
            baseHealth: 100,
            speedMultiplier: 0.6,
            baseGold: 20,
            goldPerWave: 4,
            xpReward: 5,
            color: '0x8800ff',
            size: 20
          },
          shielded: {
            baseHealth: 60,
            speedMultiplier: 1.0,
            baseGold: 12,
            goldPerWave: 2,
            xpReward: 4,
            color: '0x0088ff',
            size: 12
          },
          armored: {
            baseHealth: 80,
            speedMultiplier: 0.7,
            baseGold: 15,
            goldPerWave: 3,
            xpReward: 4,
            color: '0x888888',
            size: 14
          },
          healing: {
            baseHealth: 40,
            speedMultiplier: 0.8,
            baseGold: 20,
            goldPerWave: 4,
            xpReward: 5,
            color: '0x00ff88',
            size: 11
          },
          baseSpeed: 0.00012,
          healthScaling: {
            waveInterval: 10,
            waveMultiplier: 1.015,
            levelMultiplier: 1.10
          }
        },
        towers: {
          basic: {
            name: 'Basic Tower',
            cost: 50,
            damage: 10,
            range: 100,
            fireRate: 1000,
            type: 'basic'
          },
          fast: {
            name: 'Fast Tower',
            cost: 60,
            damage: 5,
            range: 90,
            fireRate: 500,
            type: 'fast'
          },
          strong: {
            name: 'Strong Tower',
            cost: 80,
            damage: 25,
            range: 110,
            fireRate: 1500,
            type: 'strong'
          },
          frost: {
            name: 'Frost Tower',
            cost: 70,
            damage: 5,
            range: 95,
            fireRate: 800,
            type: 'frost',
            slowEffect: 0.5,
            slowDuration: 2000
          },
          fire: {
            name: 'Fire Tower',
            cost: 90,
            damage: 0,
            range: 100,
            fireRate: 1200,
            type: 'fire',
            burnDamagePerSecond: 10,
            burnDuration: 3000
          },
          splash: {
            name: 'Splash Tower',
            cost: 120,
            damage: 15,
            range: 105,
            fireRate: 1800,
            type: 'splash',
            splashRadius: 50
          },
          sniper: {
            name: 'Sniper Tower',
            cost: 150,
            damage: 60,
            range: 250,
            fireRate: 3000,
            type: 'sniper',
            armorPenetration: 0.7
          }
        },
        towerUpgrades: {
          level2: {
            damageMultiplier: 1.5,
            fireRateMultiplier: 0.85,
            costMultiplier: 1.5
          },
          level3: {
            damageMultiplier: 2.0,
            fireRateMultiplier: 0.7,
            costMultiplier: 2.0
          },
          sellRefundPercent: 0.9
        }
      }),
      getTowerConfig: (type: string) => {
        const towers: any = {
          basic: {
            name: 'Basic Tower',
            cost: 50,
            damage: 10,
            range: 100,
            fireRate: 1000,
            type: 'basic'
          },
          fast: {
            name: 'Fast Tower',
            cost: 60,
            damage: 5,
            range: 90,
            fireRate: 500,
            type: 'fast'
          },
          strong: {
            name: 'Strong Tower',
            cost: 80,
            damage: 25,
            range: 110,
            fireRate: 1500,
            type: 'strong'
          },
          frost: {
            name: 'Frost Tower',
            cost: 70,
            damage: 5,
            range: 95,
            fireRate: 800,
            type: 'frost',
            slowEffect: 0.5,
            slowDuration: 2000
          },
          fire: {
            name: 'Fire Tower',
            cost: 90,
            damage: 0,
            range: 100,
            fireRate: 1200,
            type: 'fire',
            burnDamagePerSecond: 10,
            burnDuration: 3000
          },
          splash: {
            name: 'Splash Tower',
            cost: 120,
            damage: 15,
            range: 105,
            fireRate: 1800,
            type: 'splash',
            splashRadius: 50
          },
          sniper: {
            name: 'Sniper Tower',
            cost: 150,
            damage: 60,
            range: 250,
            fireRate: 3000,
            type: 'sniper',
            armorPenetration: 0.7
          }
        };
        return towers[type];
      },
      loaded: true,
    }),
  },
}));

// Mock Phaser globally
(global as any).Phaser = {
  Scene: class Scene {
    constructor(_config?: any) {}
    init(_data?: any) {}
    preload() {}
    create() {}
    update(_time?: number, _delta?: number) {}
  },
  Game: class Game {
    constructor(_config: any) {}
  },
  Math: {
    Vector2: class Vector2 {
      x: number = 0;
      y: number = 0;
      constructor(x?: number, y?: number) {
        this.x = x || 0;
        this.y = y || 0;
      }
    },
    Distance: {
      Between: (x1: number, y1: number, x2: number, y2: number) => 
        Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2),
    },
  },
  Geom: {
    Circle: class {
      constructor(public x: number, public y: number, public radius: number) {}
      static Contains = () => true;
    },
  },
  Display: {
    Color: {
      IntegerToColor: (color: number) => ({
        red: (color >> 16) & 0xFF,
        green: (color >> 8) & 0xFF,
        blue: color & 0xFF,
      }),
      GetColor: (r: number, g: number, b: number) => 
        (r << 16) | (g << 8) | b,
    },
  },
};

// Mock window for browser-dependent code
if (typeof window === 'undefined') {
  (global as any).window = {
    innerWidth: 800,
    innerHeight: 600,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
}
