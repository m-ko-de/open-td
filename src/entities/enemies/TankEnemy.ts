import { BaseEnemy } from './BaseEnemy';
import { ConfigManager } from '../../config/ConfigManager';

export class TankEnemy extends BaseEnemy {
  protected getEnemyConfig(): any {
    const config = ConfigManager.getInstance().getConfig();
    return config.enemies.tank;
  }

  protected createSprite(color: number, size: number): void {
    // Schweres Monster (Tank)
    const colorObj = Phaser.Display.Color.IntegerToColor(color);
    const darkerColor = Phaser.Display.Color.GetColor(
      Math.floor(colorObj.red * 0.5),
      Math.floor(colorObj.green * 0.5),
      Math.floor(colorObj.blue * 0.5)
    );

    // Shadow
    this.sprite.fillStyle(0x000000, 0.4);
    this.sprite.fillEllipse(0, size * 1.3, size * 1.6, size * 0.6);

    // Wide body base
    this.sprite.fillStyle(color, 1);
    this.sprite.fillEllipse(0, size * 0.2, size * 1.2, size * 1.0);

    // Upper body/head
    this.sprite.fillCircle(0, -size * 0.3, size * 0.9);

    // Armor plates
    this.sprite.fillStyle(darkerColor, 1);
    this.sprite.fillRect(-size * 0.8, -size * 0.2, size * 0.3, size * 0.8);
    this.sprite.fillRect(size * 0.5, -size * 0.2, size * 0.3, size * 0.8);
    this.sprite.fillRect(-size * 0.4, size * 0.5, size * 0.8, size * 0.3);

    // Spikes on shoulders
    this.sprite.fillStyle(0x444444, 1);
    this.sprite.beginPath();
    this.sprite.moveTo(-size * 1.0, -size * 0.5);
    this.sprite.lineTo(-size * 0.8, -size * 1.0);
    this.sprite.lineTo(-size * 0.6, -size * 0.5);
    this.sprite.closePath();
    this.sprite.fillPath();

    this.sprite.beginPath();
    this.sprite.moveTo(size * 1.0, -size * 0.5);
    this.sprite.lineTo(size * 0.8, -size * 1.0);
    this.sprite.lineTo(size * 0.6, -size * 0.5);
    this.sprite.closePath();
    this.sprite.fillPath();

    // Menacing eyes
    this.sprite.fillStyle(0xff0000, 1);
    this.sprite.fillRect(-size * 0.45, -size * 0.4, size * 0.3, size * 0.15);
    this.sprite.fillRect(size * 0.15, -size * 0.4, size * 0.3, size * 0.15);

    // Eye glow
    this.sprite.fillStyle(0xff6600, 0.6);
    this.sprite.fillRect(-size * 0.5, -size * 0.45, size * 0.4, size * 0.25);
    this.sprite.fillRect(size * 0.1, -size * 0.45, size * 0.4, size * 0.25);

    // Large teeth/tusks
    this.sprite.fillStyle(0xeeeeee, 1);
    this.sprite.beginPath();
    this.sprite.moveTo(-size * 0.4, -size * 0.1);
    this.sprite.lineTo(-size * 0.5, size * 0.4);
    this.sprite.lineTo(-size * 0.3, size * 0.1);
    this.sprite.closePath();
    this.sprite.fillPath();

    this.sprite.beginPath();
    this.sprite.moveTo(size * 0.4, -size * 0.1);
    this.sprite.lineTo(size * 0.5, size * 0.4);
    this.sprite.lineTo(size * 0.3, size * 0.1);
    this.sprite.closePath();
    this.sprite.fillPath();

    // Heavy outline
    this.sprite.lineStyle(3, 0x000000, 1);
    this.sprite.strokeEllipse(0, size * 0.2, size * 1.2, size * 1.0);
    this.sprite.strokeCircle(0, -size * 0.3, size * 0.9);
  }
}
