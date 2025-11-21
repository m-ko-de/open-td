import { BaseTower } from './BaseTower';
import { Enemy } from '../enemies/Enemy';
import { Projectile } from '../projectiles/Projectile';

/**
 * StrongTower - Heavy damage tower with slow fire rate
 */
export class StrongTower extends BaseTower {
  constructor(scene: Phaser.Scene, x: number, y: number, buildCost: number) {
    super(scene, x, y, 'strong', buildCost);
  }

  protected createSprite(): void {
    this.sprite = this.scene.add.graphics();
    
    // Steam-punk tower base
    // Base platform
    this.sprite.fillStyle(0x4a4a4a, 1);
    this.sprite.fillRoundedRect(-18, 10, 36, 8, 2);
    
    // Main tower body (magenta/purple)
    this.sprite.fillStyle(0xff00ff, 1);
    this.sprite.fillRoundedRect(-12, -8, 24, 18, 3);
    
    // Darker shade for depth
    this.sprite.fillStyle(0xaa00aa, 1);
    this.sprite.fillRect(8, -8, 4, 18);
    
    // Top cannon/weapon part
    this.sprite.fillStyle(0x2a2a2a, 1);
    this.sprite.fillRoundedRect(-8, -15, 16, 7, 2);
    
    // Barrel/weapon detail
    this.sprite.fillStyle(0x3a3a3a, 1);
    this.sprite.fillRect(-3, -18, 6, 8);
    
    // Energy core/gem in center
    this.sprite.fillStyle(0xffff00, 0.8);
    this.sprite.fillCircle(0, 0, 4);
    this.sprite.lineStyle(1, 0xffffff, 0.6);
    this.sprite.strokeCircle(0, 0, 4);
    
    // Bolts/rivets
    this.sprite.fillStyle(0x666666, 1);
    [-8, 8].forEach(x => {
      [-4, 4].forEach(y => {
        this.sprite.fillCircle(x, y, 1.5);
      });
    });
    
    // Outer border glow
    this.sprite.lineStyle(2, 0xffffff, 0.3);
    this.sprite.strokeRoundedRect(-12, -8, 24, 18, 3);
    
    this.sprite.x = this.x;
    this.sprite.y = this.y;
  }

  protected fireAtTarget(target: Enemy, _allEnemies: Enemy[]): void {
    new Projectile(this.scene, this.x, this.y, target, this.damage, false);
  }
}
