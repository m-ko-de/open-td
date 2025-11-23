import { BaseTower } from './BaseTower';
import { BaseEnemy } from '../enemies/BaseEnemy';
import { ConfigManager } from '../../config/ConfigManager';

/**
 * SniperTower - Long range, high damage with armor penetration
 * Instant hit (no projectile), prioritizes strongest enemies
 */
export class SniperTower extends BaseTower {
  private armorPenetration: number;

  constructor(scene: Phaser.Scene, x: number, y: number, buildCost: number) {
    super(scene, x, y, 'sniper', buildCost);

    const config = ConfigManager.getInstance().getConfig().towers.sniper;
    this.armorPenetration = config.armorPenetration || 0.5;
  }

  protected createSprite(): void {
    this.sprite = this.scene.add.graphics();
    
    // Tactical sniper tower design
    // Base platform
    this.sprite.fillStyle(0x3a3a3a, 1);
    this.sprite.fillRoundedRect(-18, 10, 36, 8, 2);
    
    // Main body (tactical dark green)
    this.sprite.fillStyle(0x2d4f1f, 1);
    this.sprite.fillRoundedRect(-10, -6, 20, 16, 2);
    
    // Scope mount
    this.sprite.fillStyle(0x1a1a1a, 1);
    this.sprite.fillRect(-4, -14, 8, 8);
    
    // Scope lens
    this.sprite.fillStyle(0x4444ff, 0.7);
    this.sprite.fillCircle(0, -10, 4);
    this.sprite.lineStyle(1, 0xffffff, 0.5);
    this.sprite.strokeCircle(0, -10, 4);
    
    // Long barrel
    this.sprite.fillStyle(0x2a2a2a, 1);
    this.sprite.fillRect(-2, -24, 4, 12);
    
    // Muzzle
    this.sprite.fillStyle(0x1a1a1a, 1);
    this.sprite.fillCircle(0, -24, 3);
    
    // Crosshair detail
    this.sprite.lineStyle(1, 0xff0000, 0.6);
    this.sprite.beginPath();
    this.sprite.moveTo(-6, 0);
    this.sprite.lineTo(6, 0);
    this.sprite.moveTo(0, -6);
    this.sprite.lineTo(0, 6);
    this.sprite.strokePath();
    
    // Bipod/support legs
    this.sprite.fillStyle(0x3a3a3a, 1);
    this.sprite.fillRect(-12, 8, 3, 4);
    this.sprite.fillRect(9, 8, 3, 4);
    
    this.sprite.x = this.x;
    this.sprite.y = this.y;
  }

  /**
   * Sniper prioritizes strongest enemies (highest health)
   */
  protected calculateTargetValue(enemy: BaseEnemy): number {
    return enemy.getHealth();
  }

  protected fireAtTarget(target: BaseEnemy, _allEnemies: BaseEnemy[]): any {
    if (target.isDead()) return null;
    
    // Instant damage with armor penetration
    const finalDamage = this.damage * (1 + this.armorPenetration);
    target.takeDamage(finalDamage);
    
    // Visual effect - tracer line
    const graphics = this.scene.add.graphics();
    graphics.lineStyle(2, 0xffff00, 0.8);
    graphics.beginPath();
    graphics.moveTo(this.x, this.y);
    graphics.lineTo(target.x, target.y);
    graphics.strokePath();
    
    // Muzzle flash
    const flash = this.scene.add.graphics();
    flash.fillStyle(0xffff00, 0.9);
    flash.fillCircle(this.x, this.y - 20, 6);
    
    // Fade out effects
    this.scene.tweens.add({
      targets: [graphics, flash],
      alpha: 0,
      duration: 150,
      onComplete: () => {
        graphics.destroy();
        flash.destroy();
      }
    });
    
    return null;
  }

  upgrade(): number {
    const cost = super.upgrade();
    
    // Increase armor penetration with upgrades
    this.armorPenetration = Math.min(0.9, this.armorPenetration + 0.1);
    
    return cost;
  }
}
