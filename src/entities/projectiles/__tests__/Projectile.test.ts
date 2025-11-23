import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Projectile } from '../Projectile';
import { BaseEnemy } from '../../enemies/BaseEnemy';

describe('Projectile', () => {
  let mockScene: any;
  let mockTarget: BaseEnemy;
  let mockEnemies: BaseEnemy[];
  let projectile: Projectile | null = null;

  beforeEach(() => {
    // Mock Phaser scene with graphics and tweens
    const mockGraphics = {
      x: 0,
      y: 0,
      fillStyle: vi.fn().mockReturnThis(),
      fillCircle: vi.fn().mockReturnThis(),
      lineStyle: vi.fn().mockReturnThis(),
      lineBetween: vi.fn().mockReturnThis(),
      strokeCircle: vi.fn().mockReturnThis(),
      destroy: vi.fn()
    };

    mockScene = {
      add: {
        graphics: vi.fn(() => mockGraphics)
      },
      tweens: {
        add: vi.fn()
      }
    };

    // Mock target enemy with writable x, y properties
    mockTarget = Object.assign({}, {
      isDead: vi.fn(() => false),
      takeDamage: vi.fn(),
      applySlow: vi.fn()
    }, {
      x: 200,
      y: 200
    }) as any;

    // Mock other enemies for splash tests
    mockEnemies = [
      { x: 180, y: 200, isDead: vi.fn(() => false), takeDamage: vi.fn() } as any,
      { x: 220, y: 200, isDead: vi.fn(() => false), takeDamage: vi.fn() } as any,
      { x: 300, y: 300, isDead: vi.fn(() => false), takeDamage: vi.fn() } as any
    ];

    projectile = null;
  });

  describe('Projectile Creation', () => {
    it('should create a standard projectile', () => {
      projectile = new Projectile(mockScene, 100, 100, mockTarget, 10);
      
      expect(mockScene.add.graphics).toHaveBeenCalled();
      expect(projectile).toBeDefined();
    });

    it('should create a frost projectile with snowflake effect', () => {
      projectile = new Projectile(mockScene, 100, 100, mockTarget, 5, true, 0.5, 2000);
      
      expect(mockScene.add.graphics).toHaveBeenCalled();
      expect(projectile).toBeDefined();
    });

    it('should create a splash projectile', () => {
      projectile = new Projectile(
        mockScene,
        100,
        100,
        mockTarget,
        15,
        false,
        0,
        0,
        50,
        mockEnemies
      );
      
      expect(mockScene.add.graphics).toHaveBeenCalled();
      expect(projectile).toBeDefined();
    });
  });

  describe('Projectile Movement', () => {
    it('should move towards target', () => {
      projectile = new Projectile(mockScene, 100, 100, mockTarget, 10);
      const graphics = mockScene.add.graphics.mock.results[0].value;
      
      const initialX = graphics.x;
      const initialY = graphics.y;
      
      projectile.update(16); // ~60fps delta
      
      // Projectile should have moved
      expect(graphics.x).not.toBe(initialX);
      expect(graphics.y).not.toBe(initialY);
    });

    it('should move in direction of target', () => {
      projectile = new Projectile(mockScene, 100, 100, mockTarget, 10);
      const graphics = mockScene.add.graphics.mock.results[0].value;
      
      projectile.update(16);
      
      // Should move towards target (200, 200) from start (100, 100)
      // Both x and y should increase
      expect(graphics.x).toBeGreaterThan(100);
      expect(graphics.y).toBeGreaterThan(100);
    });

    it('should not move if target is dead', () => {
      mockTarget.isDead = vi.fn(() => true);
      projectile = new Projectile(mockScene, 100, 100, mockTarget, 10);
      const graphics = mockScene.add.graphics.mock.results[0].value;
      
      projectile.update(16);
      
      // Should not move
      expect(graphics.x).toBe(100);
      expect(graphics.y).toBe(100);
    });

    it('should stop moving after hitting target', () => {
      // Target close enough to hit
      const closeTarget = {
        x: 108,
        y: 108,
        isDead: vi.fn(() => false),
        takeDamage: vi.fn(),
        applySlow: vi.fn()
      } as any;
      
      projectile = new Projectile(mockScene, 100, 100, closeTarget, 10);
      const graphics = mockScene.add.graphics.mock.results[0].value;
      
      // Move until hit
      for (let i = 0; i < 10 && !projectile.shouldDestroy(); i++) {
        projectile.update(16);
      }
      
      const xAfterHit = graphics.x;
      const yAfterHit = graphics.y;
      
      projectile.update(16); // Update again
      
      // Should not move further after hit
      expect(graphics.x).toBe(xAfterHit);
      expect(graphics.y).toBe(yAfterHit);
    });
  });

  describe('Damage Application', () => {
    it('should apply damage when hitting target', () => {
      const closeTarget = {
        x: 108,
        y: 108,
        isDead: vi.fn(() => false),
        takeDamage: vi.fn(),
        applySlow: vi.fn()
      } as any;
      
      projectile = new Projectile(mockScene, 100, 100, closeTarget, 25);
      
      // Update until hit
      for (let i = 0; i < 20 && !projectile.shouldDestroy(); i++) {
        projectile.update(1);
      }
      
      expect(closeTarget.takeDamage).toHaveBeenCalledWith(25);
    });

    it('should apply slow effect with frost projectile', () => {
      const closeTarget = {
        x: 108,
        y: 108,
        isDead: vi.fn(() => false),
        takeDamage: vi.fn(),
        applySlow: vi.fn()
      } as any;
      
      projectile = new Projectile(mockScene, 100, 100, closeTarget, 5, true, 0.5, 2000);
      
      // Update until hit
      for (let i = 0; i < 20 && !projectile.shouldDestroy(); i++) {
        projectile.update(1);
      }
      
      expect(closeTarget.takeDamage).toHaveBeenCalledWith(5);
      expect(closeTarget.applySlow).toHaveBeenCalledWith(0.5, 2000);
    });

    it('should not apply slow effect with standard projectile', () => {
      const closeTarget = {
        x: 108,
        y: 108,
        isDead: vi.fn(() => false),
        takeDamage: vi.fn(),
        applySlow: vi.fn()
      } as any;
      
      projectile = new Projectile(mockScene, 100, 100, closeTarget, 10);
      
      // Update until hit
      for (let i = 0; i < 20 && !projectile.shouldDestroy(); i++) {
        projectile.update(1);
      }
      
      expect(closeTarget.takeDamage).toHaveBeenCalledWith(10);
      expect(closeTarget.applySlow).not.toHaveBeenCalled();
    });

    it('should apply damage only once', () => {
      const closeTarget = {
        x: 105,
        y: 105,
        isDead: vi.fn(() => false),
        takeDamage: vi.fn(),
        applySlow: vi.fn()
      } as any;
      
      projectile = new Projectile(mockScene, 100, 100, closeTarget, 10);;
      projectile.update(100);
      projectile.update(100);
      projectile.update(100);
      
      // Should only be called once despite multiple updates
      expect(closeTarget.takeDamage).toHaveBeenCalledTimes(1);
    });
  });

  describe('Splash Damage', () => {
    it('should apply splash damage to nearby enemies', () => {
      const splashTarget = {
        x: 200,
        y: 200,
        isDead: vi.fn(() => false),
        takeDamage: vi.fn(),
        applySlow: vi.fn()
      } as any;
      
      projectile = new Projectile(
        mockScene,
        195,
        195,
        splashTarget,
        15,
        false,
        0,
        0,
        50,
        mockEnemies
      );
      
      // Update until hit
      for (let i = 0; i < 30 && !projectile.shouldDestroy(); i++) {
        projectile.update(1);
      }
      
      // Primary target
      expect(splashTarget.takeDamage).toHaveBeenCalledWith(15);
      
      // Enemies within splash radius (180,200 and 220,200)
      expect(mockEnemies[0].takeDamage).toHaveBeenCalledWith(15);
      expect(mockEnemies[1].takeDamage).toHaveBeenCalledWith(15);
      
      // Enemy outside splash radius (300,300)
      expect(mockEnemies[2].takeDamage).not.toHaveBeenCalled();
    });

    it('should not damage dead enemies with splash', () => {
      const splashTarget = {
        x: 200,
        y: 200,
        isDead: vi.fn(() => false),
        takeDamage: vi.fn(),
        applySlow: vi.fn()
      } as any;
      mockEnemies[0].isDead = vi.fn(() => true);
      
      projectile = new Projectile(
        mockScene,
        195,
        195,
        splashTarget,
        15,
        false,
        0,
        0,
        50,
        mockEnemies
      );
      
      // Update until hit
      for (let i = 0; i < 30 && !projectile.shouldDestroy(); i++) {
        projectile.update(1);
      }
      
      // Dead enemy should not take splash damage
      expect(mockEnemies[0].takeDamage).not.toHaveBeenCalled();
      // Alive enemy should take splash damage
      expect(mockEnemies[1].takeDamage).toHaveBeenCalledWith(15);
    });

    it('should create explosion visual effect', () => {
      const closeTarget = {
        x: 108,
        y: 108,
        isDead: vi.fn(() => false),
        takeDamage: vi.fn(),
        applySlow: vi.fn()
      } as any;
      
      projectile = new Projectile(
        mockScene,
        100,
        100,
        closeTarget,
        15,
        false,
        0,
        0,
        50,
        mockEnemies
      );
      
      // Update until hit
      for (let i = 0; i < 20 && !projectile.shouldDestroy(); i++) {
        projectile.update(1);
      }
      
      // Should create explosion graphics (1 projectile + 1 explosion base + 12 explosion particles + random trail particles)
      expect(mockScene.add.graphics).toHaveBeenCalled(); 
      expect(mockScene.add.graphics.mock.calls.length).toBeGreaterThanOrEqual(14); // At least explosion
      expect(mockScene.tweens.add).toHaveBeenCalled();
    });

    it('should not apply splash damage without splash radius', () => {
      const splashTarget = {
        x: 200,
        y: 200,
        isDead: vi.fn(() => false),
        takeDamage: vi.fn(),
        applySlow: vi.fn()
      } as any;
      
      projectile = new Projectile(
        mockScene,
        192,
        192,
        splashTarget,
        15,
        false,
        0,
        0,
        0, // No splash radius
        mockEnemies
      );
      
      // Update until hit
      for (let i = 0; i < 30 && !projectile.shouldDestroy(); i++) {
        projectile.update(1);
      }
      
      // Only primary target should take damage
      expect(splashTarget.takeDamage).toHaveBeenCalledWith(15);
      expect(mockEnemies[0].takeDamage).not.toHaveBeenCalled();
      expect(mockEnemies[1].takeDamage).not.toHaveBeenCalled();
    });
  });

  describe('Projectile Lifecycle', () => {
    it('should be marked for destruction after hitting target', () => {
      const closeTarget = {
        x: 108,
        y: 108,
        isDead: vi.fn(() => false),
        takeDamage: vi.fn(),
        applySlow: vi.fn()
      } as any;
      
      projectile = new Projectile(mockScene, 100, 100, closeTarget, 10);
      
      expect(projectile.shouldDestroy()).toBe(false);
      
      // Update until hit
      for (let i = 0; i < 20 && !projectile.shouldDestroy(); i++) {
        projectile.update(1);
      }
      
      expect(projectile.shouldDestroy()).toBe(true);
    });

    it('should be marked for destruction if target dies', () => {
      mockTarget.isDead = vi.fn(() => true);
      projectile = new Projectile(mockScene, 100, 100, mockTarget, 10);
      
      expect(projectile.shouldDestroy()).toBe(true);
    });

    it('should destroy graphics when destroyed', () => {
      projectile = new Projectile(mockScene, 100, 100, mockTarget, 10);
      const graphics = mockScene.add.graphics.mock.results[0].value;
      
      projectile.destroy();
      
      expect(graphics.destroy).toHaveBeenCalled();
    });

    it('should not move after being marked for destruction', () => {
      const closeTarget = {
        x: 108,
        y: 108,
        isDead: vi.fn(() => false),
        takeDamage: vi.fn(),
        applySlow: vi.fn()
      } as any;
      
      projectile = new Projectile(mockScene, 100, 100, closeTarget, 10);
      const graphics = mockScene.add.graphics.mock.results[0].value;
      
      // Move until hit
      for (let i = 0; i < 10 && !projectile.shouldDestroy(); i++) {
        projectile.update(16);
      }
      const xAfterHit = graphics.x;
      
      projectile.update(16); // Try to update again
      
      expect(graphics.x).toBe(xAfterHit);
    });
  });

  describe('Edge Cases', () => {
    it('should handle target at exact same position', () => {
      const sameTarget = {
        x: 100,
        y: 100,
        isDead: vi.fn(() => false),
        takeDamage: vi.fn(),
        applySlow: vi.fn()
      } as any;
      
      projectile = new Projectile(mockScene, 100, 100, sameTarget, 10);
      
      // Update - should hit immediately since at same position
      projectile.update(1);
      
      expect(sameTarget.takeDamage).toHaveBeenCalledWith(10);
    });

    it('should handle very small delta time', () => {
      projectile = new Projectile(mockScene, 100, 100, mockTarget, 10);
      const graphics = mockScene.add.graphics.mock.results[0].value;
      
      projectile.update(0.1);
      
      // Should still move, just very slightly
      expect(graphics.x).toBeGreaterThanOrEqual(100);
      expect(graphics.y).toBeGreaterThanOrEqual(100);
    });

    it('should handle large delta time', () => {
      projectile = new Projectile(mockScene, 100, 100, mockTarget, 10);
      const graphics = mockScene.add.graphics.mock.results[0].value;
      
      projectile.update(1000);
      
      // Should move but not overshoot unreasonably
      expect(graphics.x).toBeLessThan(500);
      expect(graphics.y).toBeLessThan(500);
    });

    it('should handle negative damage values', () => {
      const closeTarget = {
        x: 108,
        y: 108,
        isDead: vi.fn(() => false),
        takeDamage: vi.fn(),
        applySlow: vi.fn()
      } as any;
      
      projectile = new Projectile(mockScene, 100, 100, closeTarget, -5);
      
      // Update until hit
      for (let i = 0; i < 20 && !projectile.shouldDestroy(); i++) {
        projectile.update(1);
      }
      
      // Should still call takeDamage (even with negative value)
      expect(closeTarget.takeDamage).toHaveBeenCalledWith(-5);
    });
  });

  describe('Frost and Splash Combination', () => {
    it('should apply both frost and splash effects', () => {
      const frostSplashTarget = {
        x: 200,
        y: 200,
        isDead: vi.fn(() => false),
        takeDamage: vi.fn(),
        applySlow: vi.fn()
      } as any;
      
      projectile = new Projectile(
        mockScene,
        192,
        192,
        frostSplashTarget,
        10,
        true, // Frost
        0.6,
        3000,
        50, // Splash radius
        mockEnemies
      );
      
      // Update until hit
      for (let i = 0; i < 30 && !projectile.shouldDestroy(); i++) {
        projectile.update(1);
      }
      
      // Primary target should get damage and slow
      expect(frostSplashTarget.takeDamage).toHaveBeenCalledWith(10);
      expect(frostSplashTarget.applySlow).toHaveBeenCalledWith(0.6, 3000);
      
      // Nearby enemies should get splash damage (but not slow)
      expect(mockEnemies[0].takeDamage).toHaveBeenCalledWith(10);
      expect(mockEnemies[1].takeDamage).toHaveBeenCalledWith(10);
    });
  });
});
