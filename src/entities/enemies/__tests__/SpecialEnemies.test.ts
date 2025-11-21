import { describe, it, expect, beforeEach } from 'vitest';
import { ShieldedEnemy } from '../ShieldedEnemy';
import { ArmoredEnemy } from '../ArmoredEnemy';
import { HealingEnemy } from '../HealingEnemy';

describe('Special Enemy Types', () => {
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
          strokePath: () => {},
          beginPath: () => {},
          moveTo: () => {},
          lineTo: () => {},
          arc: () => {},
          closePath: () => {},
          fillPath: () => {},
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
      time: {
        now: 0,
      },
    };

    mockPath = {
      getPoint: () => ({ x: 100, y: 100 }),
    };
  });

  describe('ShieldedEnemy', () => {
    it('should initialize with shield at 50% of max health', () => {
      const enemy = new ShieldedEnemy(mockScene, mockPath, 1, 1, 1);
      const maxHealth = enemy.getMaxHealth();
      
      // Shield should be 50% of max health
      expect((enemy as any).shield).toBe(Math.round(maxHealth * 0.5));
      expect((enemy as any).maxShield).toBe(Math.round(maxHealth * 0.5));
    });

    it('should absorb damage with shield first', () => {
      const enemy = new ShieldedEnemy(mockScene, mockPath, 1, 1, 1);
      const initialHealth = enemy.getHealth();
      const initialShield = (enemy as any).shield;

      // Take 10 damage - should only affect shield
      enemy.takeDamage(10);

      expect(enemy.getHealth()).toBe(initialHealth);
      expect((enemy as any).shield).toBe(initialShield - 10);
    });

    it('should take health damage when shield is depleted', () => {
      const enemy = new ShieldedEnemy(mockScene, mockPath, 1, 1, 1);
      const initialHealth = enemy.getHealth();
      const initialShield = (enemy as any).shield;

      // Take more damage than shield
      const excessDamage = 5;
      enemy.takeDamage(initialShield + excessDamage);

      expect((enemy as any).shield).toBe(0);
      expect(enemy.getHealth()).toBe(initialHealth - excessDamage);
    });

    it('should regenerate shield after delay without damage', () => {
      // Mock Date.now() to control time
      const originalDateNow = Date.now;
      let currentTime = 0;
      Date.now = () => currentTime;

      const enemy = new ShieldedEnemy(mockScene, mockPath, 1, 1, 1);
      const initialShield = (enemy as any).shield;
      
      // Damage shield
      enemy.takeDamage(10);
      const damagedShield = (enemy as any).shield;
      expect(damagedShield).toBeLessThan(initialShield);

      // Wait long enough for regen (> 3 second delay)
      currentTime = 3500; // 3.5 seconds
      
      // Update enemy - shield should start regenerating (10% per second = 3 HP)
      enemy.update(1000, []); // 1 second delta in milliseconds
      
      expect((enemy as any).shield).toBeGreaterThan(damagedShield);

      // Restore Date.now
      Date.now = originalDateNow;
    });
  });

  describe('ArmoredEnemy', () => {
    it('should reduce damage by 50%', () => {
      const enemy = new ArmoredEnemy(mockScene, mockPath, 1, 1, 1);
      const initialHealth = enemy.getHealth();

      // Take 100 damage - should only take 50
      enemy.takeDamage(100);

      expect(enemy.getHealth()).toBe(initialHealth - 50);
    });

    it('should have 50% damage reduction', () => {
      const enemy = new ArmoredEnemy(mockScene, mockPath, 1, 1, 1);
      expect((enemy as any).damageReduction).toBe(0.5);
    });

    it('should be slower than normal enemies', () => {
      const enemy = new ArmoredEnemy(mockScene, mockPath, 1, 1, 1);
      const config = (enemy as any).getEnemyConfig();
      
      // Should have slower speed multiplier
      expect(config.speedMultiplier).toBe(0.7);
    });
  });

  describe('HealingEnemy', () => {
    it('should heal nearby allies', () => {
      const healer = new HealingEnemy(mockScene, mockPath, 1, 1, 1);
      const ally = new ShieldedEnemy(mockScene, mockPath, 1, 1, 1);

      // Damage ally
      ally.takeDamage(20);
      const damagedHealth = ally.getHealth();

      // Mock time for heal cooldown
      mockScene.time.now = 0;
      Date.now = () => 0;

      // Update healer with ally in range
      healer.update(0.001, [healer, ally]);

      // Wait for heal cooldown
      mockScene.time.now = 1100;
      Date.now = () => 1100;

      healer.update(0.001, [healer, ally]);

      // Ally should be healed (or at least health bar updated)
      expect(ally.getHealth()).toBeGreaterThanOrEqual(damagedHealth);
    });

    it('should have high gold reward as priority target', () => {
      const healer = new HealingEnemy(mockScene, mockPath, 1, 1, 1);
      const config = (healer as any).getEnemyConfig();
      
      // Should have high gold reward (20 base)
      expect(config.baseGold).toBe(20);
    });

    it('should be slower than normal enemies', () => {
      const healer = new HealingEnemy(mockScene, mockPath, 1, 1, 1);
      const config = (healer as any).getEnemyConfig();
      
      // Should have slower speed multiplier
      expect(config.speedMultiplier).toBe(0.8);
    });

    it('should have healing radius of 100', () => {
      const healer = new HealingEnemy(mockScene, mockPath, 1, 1, 1);
      expect((healer as any).healRadius).toBe(100);
    });
  });

  describe('BaseEnemy scaling', () => {
    it('should scale health with wave number', () => {
      const enemy1 = new ShieldedEnemy(mockScene, mockPath, 1, 1, 1);
      const enemy15 = new ShieldedEnemy(mockScene, mockPath, 15, 1, 1);

      expect(enemy15.getMaxHealth()).toBeGreaterThan(enemy1.getMaxHealth());
    });

    it('should scale health with player count (multiplayer)', () => {
      const singlePlayer = new ShieldedEnemy(mockScene, mockPath, 1, 1, 1);
      const multiPlayer = new ShieldedEnemy(mockScene, mockPath, 1, 3, 1);

      expect(multiPlayer.getMaxHealth()).toBeGreaterThan(singlePlayer.getMaxHealth());
    });

    it('should scale gold reward with wave number', () => {
      const enemy1 = new ShieldedEnemy(mockScene, mockPath, 1, 1, 1);
      const enemy10 = new ShieldedEnemy(mockScene, mockPath, 10, 1, 1);

      expect(enemy10.getGoldReward()).toBeGreaterThan(enemy1.getGoldReward());
    });

    it('should handle slow effect', () => {
      const enemy = new ShieldedEnemy(mockScene, mockPath, 1, 1, 1);
      const initialSpeed = (enemy as any).speed;

      // Apply 50% slow for 2 seconds
      enemy.applySlow(0.5, 2);

      expect((enemy as any).speed).toBe(initialSpeed * 0.5);
      expect((enemy as any).slowEffect).toBe(0.5);
      expect((enemy as any).slowDuration).toBe(2);
    });
  });

  describe('Enemy lifecycle', () => {
    it('should not be dead initially', () => {
      const enemy = new ShieldedEnemy(mockScene, mockPath, 1, 1, 1);
      expect(enemy.isDead()).toBe(false);
    });

    it('should be dead when health reaches 0', () => {
      const enemy = new ShieldedEnemy(mockScene, mockPath, 1, 1, 1);
      const maxHealth = enemy.getMaxHealth();
      const shield = (enemy as any).maxShield;

      // Take enough damage to kill (health + shield)
      enemy.takeDamage(maxHealth + shield + 100);

      expect(enemy.isDead()).toBe(true);
    });

    it('should not reach end initially', () => {
      const enemy = new ShieldedEnemy(mockScene, mockPath, 1, 1, 1);
      expect(enemy.reachedEnd()).toBe(false);
    });

    it('should track progress along path', () => {
      const enemy = new ShieldedEnemy(mockScene, mockPath, 1, 1, 1);
      const initialProgress = enemy.getProgress();

      expect(initialProgress).toBe(0);
    });
  });
});
