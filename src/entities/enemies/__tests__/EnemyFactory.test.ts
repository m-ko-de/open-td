import { describe, it, expect, beforeEach } from 'vitest';
import { EnemyFactory, EnemyType } from '../EnemyFactory';

describe('EnemyFactory', () => {
  describe('getRandomType', () => {
    it('should only return normal or fast for waves 1-3', () => {
      const types = new Set<EnemyType>();
      for (let i = 0; i < 100; i++) {
        const type = EnemyFactory.getRandomType(1);
        types.add(type);
      }
      expect(types.size).toBeLessThanOrEqual(2);
      expect(Array.from(types).every(t => t === 'normal' || t === 'fast')).toBe(true);
    });

    it('should include tank for waves 4-7', () => {
      const types = new Set<EnemyType>();
      for (let i = 0; i < 100; i++) {
        const type = EnemyFactory.getRandomType(5);
        types.add(type);
      }
      expect(types.has('normal')).toBe(true);
      expect(types.has('fast')).toBe(true);
      expect(types.has('tank')).toBe(true);
    });

    it('should include shielded for waves 8-12', () => {
      const types = new Set<EnemyType>();
      for (let i = 0; i < 200; i++) {
        const type = EnemyFactory.getRandomType(10);
        types.add(type);
      }
      expect(types.has('shielded')).toBe(true);
    });

    it('should include armored for waves 13-18', () => {
      const types = new Set<EnemyType>();
      for (let i = 0; i < 200; i++) {
        const type = EnemyFactory.getRandomType(15);
        types.add(type);
      }
      expect(types.has('armored')).toBe(true);
    });

    it('should include healing for waves 19+', () => {
      const types = new Set<EnemyType>();
      for (let i = 0; i < 200; i++) {
        const type = EnemyFactory.getRandomType(20);
        types.add(type);
      }
      expect(types.has('healing')).toBe(true);
    });
  });

  describe('getWaveComposition', () => {
    it('should return correct number of enemies', () => {
      const composition = EnemyFactory.getWaveComposition(5, 10);
      expect(composition).toHaveLength(10);
    });

    it('should return all normal enemies for boss waves', () => {
      const composition = EnemyFactory.getWaveComposition(10, 15);
      expect(composition.every(type => type === 'normal')).toBe(true);
    });

    it('should include healers on wave 25 (5th wave, non-boss)', () => {
      const composition = EnemyFactory.getWaveComposition(25, 20);
      const healerCount = composition.filter(type => type === 'healing').length;
      expect(healerCount).toBeGreaterThan(0);
    });

    it('should create themed waves on multiples of 5 (non-boss)', () => {
      const composition = EnemyFactory.getWaveComposition(25, 20);
      const healerCount = composition.filter(type => type === 'healing').length;
      expect(healerCount).toBeGreaterThan(0);
      
      // Rest should be tank or armored
      const nonHealers = composition.filter(type => type !== 'healing');
      expect(nonHealers.every(type => type === 'tank' || type === 'armored')).toBe(true);
    });

    it('should respect wave progression limits', () => {
      // Wave 2 should not have shielded/armored/healing
      const composition = EnemyFactory.getWaveComposition(2, 10);
      expect(composition.every(type => 
        type === 'normal' || type === 'fast'
      )).toBe(true);
    });
  });

  describe('createEnemy', () => {
    let mockScene: any;
    let mockPath: any;

    beforeEach(() => {
      mockScene = {
        add: {
          graphics: () => ({
            fillStyle: () => {},
            fillCircle: () => {},
            fillEllipse: () => {},
            fillRect: () => {},
            fillPoints: () => {},
            lineStyle: () => {},
            strokeCircle: () => {},
            strokeEllipse: () => {},
            strokeRect: () => {},
            beginPath: () => {},
            moveTo: () => {},
            lineTo: () => {},
            arc: () => {},
            closePath: () => {},
            fillPath: () => {},
            strokePath: () => {},
            clear: () => {},
            destroy: () => {},
            x: 0,
            y: 0,
            alpha: 1,
          }),
        },
        tweens: {
          add: () => {},
        },
      };

      mockPath = {
        getPoint: () => ({ x: 0, y: 0 }),
      };
    });

    it('should create NormalEnemy for normal type', () => {
      const enemy = EnemyFactory.createEnemy(mockScene, mockPath, 'normal', 1, 1, 1);
      expect(enemy).toBeDefined();
      expect(enemy.constructor.name).toBe('NormalEnemy');
    });

    it('should create FastEnemy for fast type', () => {
      const enemy = EnemyFactory.createEnemy(mockScene, mockPath, 'fast', 1, 1, 1);
      expect(enemy).toBeDefined();
      expect(enemy.constructor.name).toBe('FastEnemy');
    });

    it('should create TankEnemy for tank type', () => {
      const enemy = EnemyFactory.createEnemy(mockScene, mockPath, 'tank', 1, 1, 1);
      expect(enemy).toBeDefined();
      expect(enemy.constructor.name).toBe('TankEnemy');
    });

    it('should create ShieldedEnemy for shielded type', () => {
      const enemy = EnemyFactory.createEnemy(mockScene, mockPath, 'shielded', 1, 1, 1);
      expect(enemy).toBeDefined();
      expect(enemy.constructor.name).toBe('ShieldedEnemy');
    });

    it('should create ArmoredEnemy for armored type', () => {
      const enemy = EnemyFactory.createEnemy(mockScene, mockPath, 'armored', 1, 1, 1);
      expect(enemy).toBeDefined();
      expect(enemy.constructor.name).toBe('ArmoredEnemy');
    });

    it('should create HealingEnemy for healing type', () => {
      const enemy = EnemyFactory.createEnemy(mockScene, mockPath, 'healing', 1, 1, 1);
      expect(enemy).toBeDefined();
      expect(enemy.constructor.name).toBe('HealingEnemy');
    });

    it('should default to NormalEnemy for unknown type', () => {
      const enemy = EnemyFactory.createEnemy(mockScene, mockPath, 'unknown' as EnemyType, 1, 1, 1);
      expect(enemy).toBeDefined();
      expect(enemy.constructor.name).toBe('NormalEnemy');
    });
  });
});
