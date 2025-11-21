import { BaseTower } from './BaseTower';
import { BaseEnemy } from '../enemies/BaseEnemy';
import { BurnEffect } from '../effects/BurnEffect';
import { ConfigManager } from '../../config/ConfigManager';

/**
 * FireTower - Applies burning damage over time to enemies
 */
export class FireTower extends BaseTower {
  private burnDamagePerSecond: number;
  private burnDuration: number;

  constructor(scene: Phaser.Scene, x: number, y: number, buildCost: number) {
    super(scene, x, y, 'fire', buildCost);

    const config = ConfigManager.getInstance().getConfig().towers.fire;
    this.burnDamagePerSecond = config.burnDamagePerSecond || 5;
    this.burnDuration = config.burnDuration || 5000;
  }

  protected createSprite(): void {
    this.sprite = this.scene.add.graphics();
    
    // Base platform
    this.sprite.fillStyle(0x4a4a4a, 1);
    this.sprite.fillRoundedRect(-18, 10, 36, 8, 2);
    
    // Main tower body (orange-red for fire)
    this.sprite.fillStyle(0xff6600, 1);
    this.sprite.fillRoundedRect(-12, -8, 24, 18, 3);
    
    // Darker shade for depth
    this.sprite.fillStyle(0xcc4400, 1);
    this.sprite.fillRect(8, -8, 4, 18);
    
    // Top cannon/weapon part
    this.sprite.fillStyle(0x2a2a2a, 1);
    this.sprite.fillRoundedRect(-8, -15, 16, 7, 2);
    
    // Barrel/weapon detail
    this.sprite.fillStyle(0x3a3a3a, 1);
    this.sprite.fillRect(-3, -18, 6, 8);
    
    // Energy core/gem in center (fire glow)
    this.sprite.fillStyle(0xff4400, 0.8);
    this.sprite.fillCircle(0, 0, 4);
    this.sprite.lineStyle(1, 0xffaa00, 0.8);
    this.sprite.strokeCircle(0, 0, 4);
    
    // Bolts/rivets
    this.sprite.fillStyle(0x666666, 1);
    [-8, 8].forEach(x => {
      [-4, 4].forEach(y => {
        this.sprite.fillCircle(x, y, 1.5);
      });
    });
    
    // Outer border glow
    this.sprite.lineStyle(2, 0xff8800, 0.5);
    this.sprite.strokeRoundedRect(-12, -8, 24, 18, 3);
    
    this.sprite.x = this.x;
    this.sprite.y = this.y;
  }

  protected fireAtTarget(target: BaseEnemy, _allEnemies: BaseEnemy[]): void {
    if (target.isDead()) return;
    
    // Apply burn effect to target
    this.applyBurn(target);
    
    // Visual feedback - create fire particle effect
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0xff6600, 0.8);
    graphics.fillCircle(this.x, this.y, 8);
    
    this.scene.tweens.add({
      targets: graphics,
      alpha: 0,
      scale: 2,
      duration: 300,
      onComplete: () => graphics.destroy()
    });
  }

  private applyBurn(enemy: BaseEnemy): void {
    // Create burn effect on enemy - BurnEffect handles its own lifecycle
    new BurnEffect(enemy, this.burnDamagePerSecond, this.burnDuration);
  }

  upgrade(): number {
    const cost = super.upgrade();
    
    // Increase burn damage with upgrades
    this.burnDamagePerSecond = Math.round(this.burnDamagePerSecond * 1.3);
    
    return cost;
  }
}
