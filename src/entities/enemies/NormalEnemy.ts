import { BaseEnemy } from './BaseEnemy';
import { ConfigManager } from '../../client/ConfigManager';

export class NormalEnemy extends BaseEnemy {
  protected getEnemyConfig(): any {
    const config = ConfigManager.getInstance().getConfig();
    return config.enemies.normal;
  }

  protected createSprite(color: number, size: number): void {
    // Kleines Monster (Normal)
    const colorObj = Phaser.Display.Color.IntegerToColor(color);
    const lighterColor = Phaser.Display.Color.GetColor(
      Math.min(255, Math.floor(colorObj.red * 1.3)),
      Math.min(255, Math.floor(colorObj.green * 1.3)),
      Math.min(255, Math.floor(colorObj.blue * 1.3))
    );
    const darkerColor = Phaser.Display.Color.GetColor(
      Math.floor(colorObj.red * 0.6),
      Math.floor(colorObj.green * 0.6),
      Math.floor(colorObj.blue * 0.6)
    );

    // Shadow
    this.sprite.fillStyle(0x000000, 0.3);
    this.sprite.fillEllipse(0, size * 1.2, size * 1.3, size * 0.5);

    // Body (rounded blob shape)
    this.sprite.fillStyle(color, 1);
    this.sprite.fillCircle(0, 0, size);
    this.sprite.fillEllipse(0, size * 0.3, size * 0.9, size * 0.8);

    // Highlight
    this.sprite.fillStyle(lighterColor, 0.7);
    this.sprite.fillCircle(-size * 0.3, -size * 0.4, size * 0.5);

    // Monster eyes (angry)
    this.sprite.fillStyle(0xffff00, 1);
    this.sprite.fillCircle(-size * 0.3, -size * 0.2, size * 0.35);
    this.sprite.fillCircle(size * 0.3, -size * 0.2, size * 0.35);

    this.sprite.fillStyle(0xff0000, 1);
    this.sprite.fillCircle(-size * 0.3, -size * 0.15, size * 0.2);
    this.sprite.fillCircle(size * 0.3, -size * 0.15, size * 0.2);

    // Eye shine
    this.sprite.fillStyle(0xffffff, 0.8);
    this.sprite.fillCircle(-size * 0.25, -size * 0.25, size * 0.1);
    this.sprite.fillCircle(size * 0.35, -size * 0.25, size * 0.1);

    // Monster mouth/teeth
    this.sprite.fillStyle(0x000000, 1);
    this.sprite.fillEllipse(0, size * 0.4, size * 0.5, size * 0.3);
    this.sprite.fillStyle(0xffffff, 1);
    this.sprite.fillRect(-size * 0.2, size * 0.25, size * 0.15, size * 0.25);
    this.sprite.fillRect(size * 0.05, size * 0.25, size * 0.15, size * 0.25);

    // Little horns
    this.sprite.fillStyle(darkerColor, 1);
    this.sprite.beginPath();
    this.sprite.moveTo(-size * 0.7, -size * 0.3);
    this.sprite.lineTo(-size * 0.5, -size * 0.8);
    this.sprite.lineTo(-size * 0.3, -size * 0.4);
    this.sprite.closePath();
    this.sprite.fillPath();

    this.sprite.beginPath();
    this.sprite.moveTo(size * 0.7, -size * 0.3);
    this.sprite.lineTo(size * 0.5, -size * 0.8);
    this.sprite.lineTo(size * 0.3, -size * 0.4);
    this.sprite.closePath();
    this.sprite.fillPath();

    // Outline
    this.sprite.lineStyle(2, 0x000000, 1);
    this.sprite.strokeCircle(0, 0, size);
  }
}
