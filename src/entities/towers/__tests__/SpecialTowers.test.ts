import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FrostTower } from '../FrostTower';
import { FireTower } from '../FireTower';
import { SplashTower } from '../SplashTower';
import { SniperTower } from '../SniperTower';

describe('Special Tower Types', () => {
  let mockScene: any;

  beforeEach(() => {
    // Phaser.Geom is already setup in global setup, no need to override
    mockScene = {
      add: {
        graphics: () => ({
          fillStyle: vi.fn().mockReturnThis(),
          fillCircle: vi.fn().mockReturnThis(),
          fillEllipse: vi.fn().mockReturnThis(),
          fillRect: vi.fn().mockReturnThis(),
          fillRoundedRect: vi.fn().mockReturnThis(),
          fillTriangle: vi.fn().mockReturnThis(),
          fillPoints: vi.fn().mockReturnThis(),
          lineStyle: vi.fn().mockReturnThis(),
          strokeCircle: vi.fn().mockReturnThis(),
          strokeRect: vi.fn().mockReturnThis(),
          strokeRoundedRect: vi.fn().mockReturnThis(),
          strokeEllipse: vi.fn().mockReturnThis(),
          strokePath: vi.fn().mockReturnThis(),
          beginPath: vi.fn().mockReturnThis(),
          moveTo: vi.fn().mockReturnThis(),
          lineTo: vi.fn().mockReturnThis(),
          closePath: vi.fn().mockReturnThis(),
          fillPath: vi.fn().mockReturnThis(),
          clear: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          on: vi.fn().mockReturnThis(),
          destroy: vi.fn().mockReturnThis(),
          x: 0,
          y: 0,
          alpha: 1,
        }),
        container: () => ({
          add: vi.fn(),
          setPosition: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
        }),
        text: () => ({
          setOrigin: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setText: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
        }),
      },
      tweens: {
        add: vi.fn(),
      },
      time: {
        now: 0,
      },
    };
  });

  describe('FrostTower', () => {
    it('should create FrostTower with correct type', () => {
      const tower = new FrostTower(mockScene, 100, 100, 70);
      
      expect(tower.getType()).toBe('frost');
    });

    it('should be configured as frost type', () => {
      const tower = new FrostTower(mockScene, 100, 100, 70);
      
      // Frost tower should have correct properties
      expect(tower.getRange()).toBeGreaterThan(0);
      expect(tower.getDamage()).toBeDefined();
    });

    it('should deal low damage but apply slow', () => {
      const tower = new FrostTower(mockScene, 100, 100, 70);
      
      // Frost tower has low damage (5) but applies slow
      expect(tower.getDamage()).toBeLessThan(10);
    });
  });

  describe('FireTower', () => {
    it('should create FireTower with correct type', () => {
      const tower = new FireTower(mockScene, 100, 100, 90);
      
      expect(tower.getType()).toBe('fire');
    });

    it('should have burn effect configuration', () => {
      const tower = new FireTower(mockScene, 100, 100, 90);
      
      expect((tower as any).burnDamagePerSecond).toBeDefined();
      expect((tower as any).burnDuration).toBeDefined();
    });

    it('should have zero direct damage', () => {
      const tower = new FireTower(mockScene, 100, 100, 90);
      
      // Fire tower deals damage over time, not direct damage
      expect(tower.getDamage()).toBe(0);
    });

    it('should have burn damage configured', () => {
      const tower = new FireTower(mockScene, 100, 100, 90);
      
      // Fire tower should have burn DPS > 0
      expect((tower as any).burnDamagePerSecond).toBeGreaterThan(0);
    });
  });

  describe('SplashTower', () => {
    it('should create SplashTower with correct type', () => {
      const tower = new SplashTower(mockScene, 100, 100, 120);
      
      expect(tower.getType()).toBe('splash');
    });

    it('should have splash radius configuration', () => {
      const tower = new SplashTower(mockScene, 100, 100, 120);
      
      expect((tower as any).splashRadius).toBeDefined();
      expect((tower as any).splashRadius).toBeGreaterThan(0);
    });

    it('should have area damage capability', () => {
      const tower = new SplashTower(mockScene, 100, 100, 120);
      
      // Splash tower should have meaningful radius
      expect((tower as any).splashRadius).toBeGreaterThan(30);
    });

    it('should have moderate damage', () => {
      const tower = new SplashTower(mockScene, 100, 100, 120);
      
      // Splash towers have moderate damage for balance
      expect(tower.getDamage()).toBeGreaterThan(10);
      expect(tower.getDamage()).toBeLessThan(30);
    });
  });

  describe('SniperTower', () => {
    it('should create SniperTower with correct type', () => {
      const tower = new SniperTower(mockScene, 100, 100, 150);
      
      expect(tower.getType()).toBe('sniper');
    });

    it('should have high damage', () => {
      const tower = new SniperTower(mockScene, 100, 100, 150);
      
      // Sniper has high single-target damage
      expect(tower.getDamage()).toBeGreaterThan(50);
    });

    it('should have long range', () => {
      const tower = new SniperTower(mockScene, 100, 100, 150);
      
      // Sniper has longest range
      expect(tower.getRange()).toBeGreaterThan(200);
    });

    it('should have armor penetration', () => {
      const tower = new SniperTower(mockScene, 100, 100, 150);
      
      expect((tower as any).armorPenetration).toBeDefined();
      expect((tower as any).armorPenetration).toBeGreaterThan(0);
    });

    it('should have significant armor penetration', () => {
      const tower = new SniperTower(mockScene, 100, 100, 150);
      
      // Sniper should penetrate at least 50% of armor
      expect((tower as any).armorPenetration).toBeGreaterThan(0.5);
    });
  });

  describe('Tower Comparisons', () => {
    it('should have different ranges', () => {
      const frost = new FrostTower(mockScene, 100, 100, 70);
      const fire = new FireTower(mockScene, 100, 100, 90);
      const splash = new SplashTower(mockScene, 100, 100, 120);
      const sniper = new SniperTower(mockScene, 100, 100, 150);

      // Sniper should have longest range
      expect(sniper.getRange()).toBeGreaterThan(frost.getRange());
      expect(sniper.getRange()).toBeGreaterThan(fire.getRange());
      expect(sniper.getRange()).toBeGreaterThan(splash.getRange());
    });

    it('should have varied damage values', () => {
      const frost = new FrostTower(mockScene, 100, 100, 70);
      const fire = new FireTower(mockScene, 100, 100, 90);
      const splash = new SplashTower(mockScene, 100, 100, 120);
      const sniper = new SniperTower(mockScene, 100, 100, 150);

      const damages = [
        frost.getDamage(),
        fire.getDamage(),
        splash.getDamage(),
        sniper.getDamage(),
      ];

      // Sniper should have highest direct damage
      expect(sniper.getDamage()).toBe(Math.max(...damages));
      
      // Fire has 0 direct damage (burn only)
      expect(fire.getDamage()).toBe(0);
      
      // Frost has low damage (control tower)
      expect(frost.getDamage()).toBeLessThan(splash.getDamage());
    });

    it('should have different special abilities', () => {
      const frost = new FrostTower(mockScene, 100, 100, 70);
      const fire = new FireTower(mockScene, 100, 100, 90);
      const splash = new SplashTower(mockScene, 100, 100, 120);
      const sniper = new SniperTower(mockScene, 100, 100, 150);

      // Each tower should be properly instantiated
      expect(frost).toBeDefined();
      expect(fire).toBeDefined();
      expect(splash).toBeDefined();
      expect(sniper).toBeDefined();
    });
  });
});

