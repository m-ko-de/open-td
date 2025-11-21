import { BaseEnemy } from '../enemies/BaseEnemy';
import { ConfigManager } from '../../config/ConfigManager';

/**
 * BaseTower - Abstract base class for all tower types
 * Handles common tower functionality like targeting, upgrades, and rendering
 */
export abstract class BaseTower {
  // Identification
  public id?: string; // Server-assigned ID for multiplayer
  protected towerType: string;

  // Visual elements
  protected sprite!: Phaser.GameObjects.Graphics;
  protected scene: Phaser.Scene;
  protected rangeCircle: Phaser.GameObjects.Graphics;
  protected showRange: boolean = false;
  protected upgradeLevelText: Phaser.GameObjects.Text;

  // Position
  public x: number;
  public y: number;

  // Stats
  protected range: number;
  protected damage: number;
  protected fireRate: number;
  protected baseDamage: number;
  protected baseFireRate: number;
  
  // Upgrade system
  protected upgradeLevel: number = 1;
  protected buildCost: number;
  protected totalInvested: number;
  
  // Firing system
  protected lastFired: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, type: string, buildCost: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.towerType = type;
    this.buildCost = buildCost;
    this.totalInvested = buildCost;

    // Load tower config
    const config = ConfigManager.getInstance().getTowerConfig(type);
    
    if (!config) {
      throw new Error(`Tower config not found for type: ${type}`);
    }

    // Set tower properties from config
    this.range = config.range;
    this.baseDamage = config.damage;
    this.baseFireRate = config.fireRate;
    this.damage = this.baseDamage;
    this.fireRate = this.baseFireRate;

    // Create sprite (must be implemented by subclass)
    this.createSprite();

    // Create upgrade level indicator
    this.upgradeLevelText = this.scene.add.text(this.x, this.y - 30, '1', {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(100);

    // Create range indicator
    this.rangeCircle = scene.add.graphics();
    this.updateRangeCircle();

    // Make tower interactive
    this.sprite.setInteractive(
      new Phaser.Geom.Circle(0, 0, 20),
      Phaser.Geom.Circle.Contains
    );

    this.sprite.on('pointerover', () => {
      this.showRange = true;
      this.updateRangeCircle();
    });

    this.sprite.on('pointerout', () => {
      this.showRange = false;
      this.updateRangeCircle();
    });
  }

  /**
   * Abstract method to create tower sprite - must be implemented by subclasses
   */
  protected abstract createSprite(): void;

  /**
   * Abstract method to fire at target - must be implemented by subclasses
   */
  protected abstract fireAtTarget(target: BaseEnemy, allEnemies: BaseEnemy[]): void;

  /**
   * Find the best target within range
   */
  protected findTarget(enemies: BaseEnemy[]): BaseEnemy | null {
    let bestTarget: BaseEnemy | null = null;
    let bestValue = -1;

    for (const enemy of enemies) {
      if (enemy.isDead()) continue;

      const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
      
      if (distance <= this.range) {
        const value = this.calculateTargetValue(enemy);
        if (value > bestValue) {
          bestValue = value;
          bestTarget = enemy;
        }
      }
    }

    return bestTarget;
  }

  /**
   * Calculate target priority value (can be overridden by subclasses)
   */
  protected calculateTargetValue(enemy: BaseEnemy): number {
    // Default: target enemy with most progress
    return enemy.getProgress();
  }

  /**
   * Update tower logic
   */
  update(time: number, enemies: BaseEnemy[]): void {
    if (time - this.lastFired < this.fireRate) {
      return;
    }

    const target = this.findTarget(enemies);
    
    if (target) {
      this.fireAtTarget(target, enemies);
      this.lastFired = time;
    }
  }

  /**
   * Upgrade the tower
   */
  upgrade(): number {
    const upgradeCost = this.getUpgradeCost();
    
    this.upgradeLevel++;
    this.totalInvested += upgradeCost;
    
    // Increase damage and fire rate
    this.damage = Math.round(this.baseDamage * Math.pow(1.2, this.upgradeLevel - 1));
    this.fireRate = Math.round(this.baseFireRate * Math.pow(0.9, this.upgradeLevel - 1));
    
    // Update level text
    this.upgradeLevelText.setText(this.upgradeLevel.toString());
    
    return upgradeCost;
  }

  /**
   * Check if tower can be upgraded
   */
  canUpgrade(): boolean {
    return this.upgradeLevel < 5; // Max level 5
  }

  /**
   * Calculate upgrade cost
   */
  getUpgradeCost(): number {
    return Math.round(this.buildCost * Math.pow(1.5, this.upgradeLevel - 1));
  }

  /**
   * Calculate sell value
   */
  getSellValue(): number {
    return Math.round(this.totalInvested * 0.7);
  }

  /**
   * Update range circle visibility
   */
  protected updateRangeCircle(): void {
    this.rangeCircle.clear();
    
    if (this.showRange) {
      this.rangeCircle.lineStyle(2, 0xffffff, 0.5);
      this.rangeCircle.strokeCircle(this.x, this.y, this.range);
      this.rangeCircle.fillStyle(0xffffff, 0.1);
      this.rangeCircle.fillCircle(this.x, this.y, this.range);
    }
  }

  /**
   * Show range indicator
   */
  setShowRange(show: boolean): void {
    this.showRange = show;
    this.updateRangeCircle();
  }

  /**
   * Destroy tower and cleanup
   */
  destroy(): void {
    this.sprite.destroy();
    this.rangeCircle.destroy();
    this.upgradeLevelText.destroy();
  }

  // Getters
  getSprite(): Phaser.GameObjects.Graphics { return this.sprite; }
  getRange(): number { return this.range; }
  getDamage(): number { return this.damage; }
  getUpgradeLevel(): number { return this.upgradeLevel; }
  getType(): string { return this.towerType; }
  getTotalInvested(): number { return this.totalInvested; }
}
