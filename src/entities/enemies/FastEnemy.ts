import { BaseEnemy } from './BaseEnemy';
import { ConfigManager } from '../../config/ConfigManager';

export class FastEnemy extends BaseEnemy {
  protected getEnemyConfig(): any {
    const config = ConfigManager.getInstance().getConfig();
    return config.enemies.fast;
  }

  protected createSprite(color: number, size: number): void {
    // Kleiner Geist (Fast)

    // Shadow
    this.sprite.fillStyle(0x000000, 0.2);
    this.sprite.fillEllipse(0, size * 1.2, size * 1.0, size * 0.4);

    // Ghost body (semi-transparent)
    this.sprite.fillStyle(color, 0.8);
    this.sprite.beginPath();
    this.sprite.arc(0, 0, size, 0, Math.PI, true);
    this.sprite.lineTo(size * 0.6, size * 0.9);
    this.sprite.lineTo(size * 0.3, size * 0.6);
    this.sprite.lineTo(0, size * 0.9);
    this.sprite.lineTo(-size * 0.3, size * 0.6);
    this.sprite.lineTo(-size * 0.6, size * 0.9);
    this.sprite.closePath();
    this.sprite.fillPath();

    // Glow effect
    this.sprite.fillStyle(0xffffff, 0.4);
    this.sprite.fillCircle(-size * 0.3, -size * 0.3, size * 0.6);

    // Ghost eyes (hollow/spooky)
    this.sprite.fillStyle(0x000000, 1);
    this.sprite.fillCircle(-size * 0.3, -size * 0.1, size * 0.3);
    this.sprite.fillCircle(size * 0.3, -size * 0.1, size * 0.3);

    // Inner glow in eyes
    this.sprite.fillStyle(color, 0.6);
    this.sprite.fillCircle(-size * 0.3, -size * 0.1, size * 0.15);
    this.sprite.fillCircle(size * 0.3, -size * 0.1, size * 0.15);

    // Spooky mouth
    this.sprite.fillStyle(0x000000, 1);
    this.sprite.fillCircle(0, size * 0.3, size * 0.25);

    // Ethereal outline
    this.sprite.lineStyle(2, 0x000000, 0.6);
    this.sprite.strokeCircle(0, -size * 0.2, size * 0.9);
  }
}
