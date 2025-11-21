import { BaseTower } from './BaseTower';
import { BaseEnemy } from '../enemies/BaseEnemy';
import { Projectile } from '../projectiles/Projectile';

/**
 * FastTower - Machine gun tower with rapid fire
 */
export class FastTower extends BaseTower {
  constructor(scene: Phaser.Scene, x: number, y: number, buildCost: number) {
    super(scene, x, y, 'fast', buildCost);
  }

  protected createSprite(): void {
    this.sprite = this.scene.add.graphics();
    
    // MG-Turm in militärischem Grau/Grün
    // Base platform
    this.sprite.fillStyle(0x3a3a3a, 1);
    this.sprite.fillRoundedRect(-18, 10, 36, 8, 2);
    
    // Main turret body - military olive green
    this.sprite.fillStyle(0x556b2f, 1);
    this.sprite.fillRoundedRect(-14, -6, 28, 16, 2);
    
    // Darker side for depth
    this.sprite.fillStyle(0x3d4f1f, 1);
    this.sprite.fillRect(10, -6, 4, 16);
    
    // Ammo belt/drum on side
    this.sprite.fillStyle(0x8b7355, 1);
    this.sprite.fillRoundedRect(-16, 0, 6, 8, 1);
    this.sprite.lineStyle(1, 0x000000, 0.5);
    this.sprite.strokeRoundedRect(-16, 0, 6, 8, 1);
    
    // Dual barrels (MG style)
    this.sprite.fillStyle(0x2a2a2a, 1);
    this.sprite.fillRect(-3, -18, 2, 14);
    this.sprite.fillRect(1, -18, 2, 14);
    
    // Muzzle flash indicators at barrel tips
    this.sprite.fillStyle(0xff6600, 0.3);
    this.sprite.fillCircle(-2, -18, 3);
    this.sprite.fillCircle(2, -18, 3);
    
    // Central support structure
    this.sprite.fillStyle(0x2a2a2a, 1);
    this.sprite.fillRect(-2, -6, 4, 6);
    
    // Tactical lights
    this.sprite.fillStyle(0x00ff00, 0.6);
    this.sprite.fillCircle(-10, -2, 2);
    this.sprite.fillCircle(10, -2, 2);
    
    // Bolts
    this.sprite.fillStyle(0x666666, 1);
    [-10, 10].forEach(x => {
      this.sprite.fillCircle(x, 4, 1.5);
    });
    
    // Shell ejection port
    this.sprite.fillStyle(0x1a1a1a, 1);
    this.sprite.fillRoundedRect(8, -2, 4, 6, 1);
    
    this.sprite.x = this.x;
    this.sprite.y = this.y;
  }

  protected fireAtTarget(target: BaseEnemy, _allEnemies: BaseEnemy[]): void {
    new Projectile(this.scene, this.x, this.y, target, this.damage, false);
  }
}
