import { BaseTower } from './BaseTower';
import { BaseEnemy } from '../enemies/BaseEnemy';
import { Projectile } from '../projectiles/Projectile';
import { ConfigManager } from '../../config/ConfigManager';

/**
 * SplashTower - Deals area damage to multiple enemies
 */
export class SplashTower extends BaseTower {
  private splashRadius: number;

  constructor(scene: Phaser.Scene, x: number, y: number, buildCost: number) {
    super(scene, x, y, 'splash', buildCost);

    const config = ConfigManager.getInstance().getConfig().towers.splash;
    this.splashRadius = config.splashRadius || 50;
  }

  protected createSprite(): void {
    this.sprite = this.scene.add.graphics();
    
    // Mortar-style tower
    // Base platform
    this.sprite.fillStyle(0x4a4a4a, 1);
    this.sprite.fillRoundedRect(-20, 10, 40, 8, 2);
    
    // Wide mortar body (brown/gray)
    this.sprite.fillStyle(0x8b7355, 1);
    this.sprite.fillEllipse(0, 0, 28, 24);
    
    // Darker shading
    this.sprite.fillStyle(0x6b5345, 1);
    this.sprite.fillEllipse(6, 0, 10, 24);
    
    // Barrel opening at top
    this.sprite.fillStyle(0x2a2a2a, 1);
    this.sprite.fillEllipse(0, -12, 16, 8);
    
    // Explosion symbol/warning stripes
    this.sprite.fillStyle(0xff6600, 1);
    this.sprite.fillTriangle(-8, 4, 0, -4, 8, 4);
    
    // Border
    this.sprite.lineStyle(2, 0x000000, 0.8);
    this.sprite.strokeEllipse(0, 0, 28, 24);
    
    // Bolts
    this.sprite.fillStyle(0x666666, 1);
    [-10, 10].forEach(x => {
      this.sprite.fillCircle(x, 8, 2);
    });
    
    this.sprite.x = this.x;
    this.sprite.y = this.y;
  }

  protected fireAtTarget(target: BaseEnemy, allEnemies: BaseEnemy[]): any {
    if (target.isDead()) return null;
    
    // Create splash projectile
    return new Projectile(this.scene, this.x, this.y, target, this.damage, false, 0, 0, this.splashRadius, allEnemies);
  }

  upgrade(): number {
    const cost = super.upgrade();
    
    // Increase splash radius with upgrades
    this.splashRadius = Math.round(this.splashRadius * 1.1);
    
    return cost;
  }
}
