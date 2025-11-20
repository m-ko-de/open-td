import { BurnEffect } from './BurnEffect';
import { ConfigManager } from '../config/ConfigManager';

/**
 * Fire Tower - Applies burning damage over time to enemies
 */
export class FireTower extends Phaser.GameObjects.Container {
  public x: number;
  public y: number;
  private range: number;
  private fireRate: number;
  private burnDamagePerSecond: number;
  private burnDuration: number;
  private lastFireTime: number = 0;
  private rangeCircle: Phaser.GameObjects.Graphics;
  private sprite: Phaser.GameObjects.Sprite;
  public upgradeLevel: number = 1;
  private buildCost: number;

  constructor(scene: Phaser.Scene, x: number, y: number, cost: number) {
    super(scene, x, y);
    this.x = x;
    this.y = y;
    this.buildCost = cost;

    const config = ConfigManager.getInstance().getConfig().towers.fire;
    this.range = config.range;
    this.fireRate = config.fireRate;
    this.burnDamagePerSecond = config.burnDamagePerSecond || 5;
    this.burnDuration = config.burnDuration || 5000;

    // Create range circle (hidden by default)
    this.rangeCircle = scene.add.graphics();
    this.rangeCircle.lineStyle(2, 0xff6600, 0.5);
    this.rangeCircle.strokeCircle(x, y, this.range);
    this.rangeCircle.setVisible(false);

    // Create fire tower sprite
    this.sprite = scene.add.sprite(0, 0, 'towers', 3); // Frame 3 for fire tower
    this.sprite.setDisplaySize(40, 40);
    this.sprite.setTint(0xff6600); // Orange-red tint for fire tower
    this.add(this.sprite);

    scene.add.existing(this);
  }

  update(time: number, enemies: any[]): void {
    // Check if we can fire
    if (time - this.lastFireTime < this.fireRate) {
      return;
    }

    // Find enemies in range
    const enemiesInRange = enemies.filter((enemy) => {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
      return distance <= this.range && enemy.isAlive();
    });

    if (enemiesInRange.length === 0) return;

    // Target the first enemy in range
    const target = enemiesInRange[0];
    this.applyBurn(target);
    this.lastFireTime = time;

    // Visual feedback - flash the sprite
    this.sprite.setTint(0xffff00);
    this.scene.time.delayedCall(100, () => {
      this.sprite.setTint(0xff6600);
    });
  }

  private applyBurn(enemy: any): void {
    // Check if enemy already has a burn effect
    if (!enemy.burnEffect) {
      enemy.burnEffect = new BurnEffect(enemy, this.burnDamagePerSecond, this.burnDuration);
      
      // Add visual indicator for burning enemy
      if (!enemy.burnIndicator) {
        enemy.burnIndicator = this.scene.add.graphics();
        enemy.burnIndicator.fillStyle(0xff6600, 0.6);
        enemy.burnIndicator.fillCircle(enemy.x, enemy.y, 12);
      }
    } else {
      // Refresh existing burn effect
      enemy.burnEffect.refresh();
    }
  }

  showRange(): void {
    this.rangeCircle.setVisible(true);
  }

  hideRange(): void {
    this.rangeCircle.setVisible(false);
  }

  upgrade(): void {
    if (this.upgradeLevel >= 3) return;

    this.upgradeLevel++;
    const upgradeConfig = ConfigManager.getInstance().getUpgradeConfig();
    
    if (this.upgradeLevel === 2) {
      this.burnDamagePerSecond *= upgradeConfig.level2.damageMultiplier;
      this.fireRate /= upgradeConfig.level2.fireRateMultiplier;
      this.sprite.setDisplaySize(45, 45);
    } else if (this.upgradeLevel === 3) {
      this.burnDamagePerSecond *= upgradeConfig.level3.damageMultiplier;
      this.fireRate /= upgradeConfig.level3.fireRateMultiplier;
      this.sprite.setDisplaySize(50, 50);
      this.sprite.setTint(0xff0000); // Brighter red for max level
    }
  }

  getUpgradeCost(): number {
    const upgradeConfig = ConfigManager.getInstance().getUpgradeConfig();
    const baseCost = this.buildCost;
    
    switch (this.upgradeLevel) {
      case 1:
        return Math.round(baseCost * upgradeConfig.level2.costMultiplier);
      case 2:
        return Math.round(baseCost * upgradeConfig.level3.costMultiplier);
      default:
        return 0;
    }
  }

  canUpgrade(): boolean {
    return this.upgradeLevel < 3;
  }

  getUpgradeLevel(): number {
    return this.upgradeLevel;
  }

  getSellValue(): number {
    const upgradeConfig = ConfigManager.getInstance().getUpgradeConfig();
    let totalCost = this.buildCost;
    
    if (this.upgradeLevel >= 2) {
      totalCost += Math.round(this.buildCost * upgradeConfig.level2.costMultiplier);
    }
    if (this.upgradeLevel >= 3) {
      totalCost += Math.round(this.buildCost * upgradeConfig.level3.costMultiplier);
    }
    
    return Math.round(totalCost * (upgradeConfig.sellRefundPercent / 100));
  }

  destroy(): void {
    this.rangeCircle.destroy();
    super.destroy();
  }
}
