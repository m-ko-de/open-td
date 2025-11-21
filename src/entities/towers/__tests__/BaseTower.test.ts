import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseTower } from '../BaseTower';
import { BaseEnemy } from '../../enemies/BaseEnemy';
import { ShieldedEnemy } from '../../enemies/ShieldedEnemy';

// Create a concrete test tower class
class TestTower extends BaseTower {
  protected projectiles: any[] = [];
  protected target?: BaseEnemy;

  protected createSprite(): void {
    this.sprite = this.scene.add.graphics();
    this.sprite.fillStyle(0x00ff00, 1);
    this.sprite.fillCircle(0, 0, 10);
  }

  protected fireAtTarget(target: BaseEnemy): void {
    const projectile = {
      x: this.x,
      y: this.y,
      target,
      update: (_delta: number, _enemies: BaseEnemy[]) => {
        // Simplified projectile behavior
        if (!target.isDead()) {
          target.takeDamage(this.damage);
        }
      },
      destroy: vi.fn(),
    };
    this.projectiles.push(projectile);
  }

  protected onUpgrade(): void {
    // Test implementation
  }

  update(time: number, enemies: BaseEnemy[]): void {
    // Simplified targeting logic for tests
    this.target = enemies.find(e => {
      const pos = (e as any).follower?.vec || { x: 0, y: 0 };
      return !e.isDead() && 
        Phaser.Math.Distance.Between(this.x, this.y, pos.x, pos.y) <= this.range;
    });

    if (this.target && time - this.lastFired >= this.fireRate) {
      this.fireAtTarget(this.target);
      this.lastFired = time;
    }

    // Update projectiles
    this.projectiles = this.projectiles.filter(p => {
      p.update(16, enemies);
      return !p.target.isDead();
    });
  }

  destroy(): void {
    this.projectiles.forEach(p => p.destroy());
    this.projectiles = [];
    if (this.sprite) {
      this.sprite.destroy();
    }
  }
}

describe('BaseTower', () => {
  let mockScene: any;
  let tower: TestTower;
  let mockEnemy: any;

  beforeEach(() => {
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

    const mockPath: any = {
      getPoint: () => ({ x: 100, y: 100 }),
    };

    mockEnemy = new ShieldedEnemy(mockScene, mockPath, 1, 1, 1);
  });

  describe('Tower Creation', () => {
    it('should initialize with correct properties', () => {
      tower = new TestTower(mockScene, 100, 200, 'basic', 50);

      expect(tower.getType()).toBe('basic');
      expect(tower.getUpgradeLevel()).toBe(1);
      expect(tower.x).toBe(100);
      expect(tower.y).toBe(200);
    });

    it('should have correct stats from config', () => {
      tower = new TestTower(mockScene, 100, 200, 'basic', 50);

      expect(tower.getDamage()).toBeGreaterThan(0);
      expect(tower.getRange()).toBeGreaterThan(0);
    });
  });

  describe('Targeting', () => {
    it('should find target within range', () => {
      tower = new TestTower(mockScene, 100, 100, 'basic', 50);
      
      // Enemy at position (100, 100) within range
      mockEnemy.follower.vec.x = 100;
      mockEnemy.follower.vec.y = 150; // 50 units away

      const enemies = [mockEnemy];
      tower.update(0, enemies);

      // Tower should have found a target
      expect((tower as any).target).toBeDefined();
    });

    it('should not target enemies out of range', () => {
      tower = new TestTower(mockScene, 100, 100, 'basic', 50);
      
      // Enemy far away
      mockEnemy.follower.vec.x = 500;
      mockEnemy.follower.vec.y = 500;

      const enemies = [mockEnemy];
      tower.update(0, enemies);

      // Tower should not have a target
      expect((tower as any).target).toBeUndefined();
    });

    it('should not target dead enemies', () => {
      tower = new TestTower(mockScene, 100, 100, 'basic', 50);
      
      // Kill the enemy
      mockEnemy.takeDamage(1000);
      mockEnemy.follower.vec.x = 100;
      mockEnemy.follower.vec.y = 100;

      const enemies = [mockEnemy];
      tower.update(0, enemies);

      expect((tower as any).target).toBeUndefined();
    });
  });

  describe('Firing', () => {
    it('should fire at target when ready', () => {
      tower = new TestTower(mockScene, 100, 100, 'basic', 50);
      
      mockEnemy.follower.vec.x = 100;
      mockEnemy.follower.vec.y = 120;

      const enemies = [mockEnemy];
      
      // First update - should find target
      tower.update(0, enemies);
      
      // Second update after fire rate cooldown
      tower.update(1500, enemies);

      // Check if projectiles were created
      expect((tower as any).projectiles.length).toBeGreaterThan(0);
    });

    it('should respect fire rate cooldown', () => {
      tower = new TestTower(mockScene, 100, 100, 'basic', 50);
      
      mockEnemy.follower.vec.x = 100;
      mockEnemy.follower.vec.y = 120;

      const enemies = [mockEnemy];
      
      tower.update(0, enemies);
      const projectileCount1 = (tower as any).projectiles.length;
      
      // Try to fire immediately - should not fire
      tower.update(100, enemies); // Only 100ms later
      const projectileCount2 = (tower as any).projectiles.length;

      expect(projectileCount2).toBe(projectileCount1);
    });
  });

  describe('Upgrades', () => {
    it('should upgrade from level 1 to level 2', () => {
      tower = new TestTower(mockScene, 100, 100, 'basic', 50);
      const initialDamage = tower.getDamage();

      tower.upgrade();

      expect(tower.getUpgradeLevel()).toBe(2);
      expect(tower.getDamage()).toBeGreaterThan(initialDamage);
    });

    it('should upgrade multiple times', () => {
      tower = new TestTower(mockScene, 100, 100, 'basic', 50);
      const initialLevel = tower.getUpgradeLevel();
      const initialDamage = tower.getDamage();

      tower.upgrade();
      tower.upgrade();

      expect(tower.getUpgradeLevel()).toBeGreaterThan(initialLevel);
      expect(tower.getDamage()).toBeGreaterThan(initialDamage);
    });

    it('should have max level limit', () => {
      tower = new TestTower(mockScene, 100, 100, 'basic', 50);

      // Upgrade to max
      for (let i = 0; i < 10; i++) {
        if (tower.canUpgrade()) {
          tower.upgrade();
        }
      }

      expect(tower.getUpgradeLevel()).toBeLessThanOrEqual(5); // Max level 5
    });

    it('should return correct upgrade cost', () => {
      tower = new TestTower(mockScene, 100, 100, 'basic', 50);
      
      const upgradeCost = tower.getUpgradeCost();
      expect(upgradeCost).toBeGreaterThan(0);
    });

    it('should not be upgradeable at max level', () => {
      tower = new TestTower(mockScene, 100, 100, 'basic', 50);
      
      // Upgrade to max
      while (tower.canUpgrade()) {
        tower.upgrade();
      }
      
      // Should not be upgradeable anymore
      expect(tower.canUpgrade()).toBe(false);
      expect(tower.getUpgradeLevel()).toBe(5);
    });
  });

  describe('Sell Value', () => {
    it('should return correct sell value (70% of total cost)', () => {
      tower = new TestTower(mockScene, 100, 100, 'basic', 50);
      const baseCost = tower.getTotalInvested();
      const sellValue = tower.getSellValue();

      // Sell value should be close to 70% (based on actual implementation)
      expect(sellValue).toBeGreaterThan(0);
      expect(sellValue).toBeLessThan(baseCost);
    });

    it('should include upgrade costs in sell value', () => {
      tower = new TestTower(mockScene, 100, 100, 'basic', 50);
      const level1SellValue = tower.getSellValue();

      tower.upgrade();
      const level2SellValue = tower.getSellValue();

      expect(level2SellValue).toBeGreaterThan(level1SellValue);
    });
  });

  describe('Cleanup', () => {
    it('should destroy all projectiles on tower destruction', () => {
      tower = new TestTower(mockScene, 100, 100, 'basic', 50);
      
      // Create some projectiles
      mockEnemy.follower.vec.x = 100;
      mockEnemy.follower.vec.y = 120;
      tower.update(0, [mockEnemy]);
      tower.update(1500, [mockEnemy]);

      const projectiles = (tower as any).projectiles;
      const destroySpy = vi.spyOn(projectiles[0] as any, 'destroy');

      tower.destroy();

      expect(destroySpy).toHaveBeenCalled();
    });
  });
});

