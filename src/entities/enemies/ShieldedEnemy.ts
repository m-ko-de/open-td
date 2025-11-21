import { BaseEnemy } from './BaseEnemy';

export class ShieldedEnemy extends BaseEnemy {
  private shield: number;
  private maxShield: number;
  private shieldRegenDelay: number = 3000; // 3 seconds without taking damage
  private lastDamageTime: number = 0;
  private shieldIndicator: Phaser.GameObjects.Graphics | null = null;

  constructor(
    scene: Phaser.Scene,
    path: Phaser.Curves.Path,
    wave: number,
    playerCount: number = 1,
    playerLevel: number = 1
  ) {
    super(scene, path, wave, playerCount, playerLevel);

    // Shield is 50% of max health
    this.maxShield = Math.round(this.maxHealth * 0.5);
    this.shield = this.maxShield;

    // Create shield indicator
    this.shieldIndicator = scene.add.graphics();
    this.updateShieldIndicator();
  }

  protected getEnemyConfig(): any {
    return {
      baseHealth: 60,
      speedMultiplier: 1.0,
      baseGold: 12,
      goldPerWave: 2,
      xpReward: 12,
      color: '0x4dabf7', // Blue
      size: 12,
    };
  }

  protected createSprite(color: number, size: number): void {
    // Shielded enemy with energy barrier

    // Shadow
    this.sprite.fillStyle(0x000000, 0.3);
    this.sprite.fillEllipse(0, size * 1.2, size * 1.3, size * 0.5);

    // Core body (smaller, protected)
    this.sprite.fillStyle(color, 1);
    this.sprite.fillCircle(0, 0, size * 0.8);

    // Shield emitters (four points)
    this.sprite.fillStyle(0x74c0fc, 1);
    this.sprite.fillCircle(0, -size, size * 0.3);
    this.sprite.fillCircle(0, size, size * 0.3);
    this.sprite.fillCircle(-size, 0, size * 0.3);
    this.sprite.fillCircle(size, 0, size * 0.3);

    // Energy lines connecting emitters
    this.sprite.lineStyle(2, 0xa5d8ff, 0.8);
    this.sprite.beginPath();
    this.sprite.moveTo(0, -size);
    this.sprite.lineTo(size, 0);
    this.sprite.lineTo(0, size);
    this.sprite.lineTo(-size, 0);
    this.sprite.closePath();
    this.sprite.strokePath();

    // Core eye/sensor
    this.sprite.fillStyle(0x1971c2, 1);
    this.sprite.fillCircle(0, 0, size * 0.4);

    // Glowing core
    this.sprite.fillStyle(0xffffff, 0.6);
    this.sprite.fillCircle(0, 0, size * 0.2);

    // Outline
    this.sprite.lineStyle(2, 0x0c8599, 1);
    this.sprite.strokeCircle(0, 0, size * 0.8);
  }

  protected onUpdate(delta: number, _allEnemies?: BaseEnemy[]): void {
    // Shield regeneration if not damaged recently
    const currentTime = Date.now();
    if (this.shield < this.maxShield && currentTime - this.lastDamageTime > this.shieldRegenDelay) {
      // Regenerate 10% of max shield per second
      this.shield = Math.min(this.maxShield, this.shield + (this.maxShield * 0.1 * delta));
    }

    this.updateShieldIndicator();
  }

  protected onTakeDamage(damage: number): number {
    this.lastDamageTime = Date.now();

    if (this.shield > 0) {
      // Shield absorbs damage
      const shieldDamage = Math.min(this.shield, damage);
      this.shield -= shieldDamage;
      const remainingDamage = damage - shieldDamage;

      // Visual feedback - shield flash
      if (this.shieldIndicator) {
        this.scene.tweens.add({
          targets: this.shieldIndicator,
          alpha: 0.3,
          duration: 100,
          yoyo: true,
        });
      }

      return remainingDamage;
    }

    return damage;
  }

  private updateShieldIndicator(): void {
    if (!this.shieldIndicator) return;

    this.shieldIndicator.clear();

    if (this.shield > 0) {
      const size = 16;
      const shieldPercent = this.shield / this.maxShield;

      // Shield bubble effect
      this.shieldIndicator.lineStyle(2, 0x4dabf7, 0.6 * shieldPercent);
      this.shieldIndicator.strokeCircle(this.sprite.x, this.sprite.y, size);

      // Shield strength indicator (hexagon)
      const hexPoints: number[] = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const x = this.sprite.x + Math.cos(angle) * size * shieldPercent;
        const y = this.sprite.y + Math.sin(angle) * size * shieldPercent;
        hexPoints.push(x, y);
      }

      this.shieldIndicator.fillStyle(0x4dabf7, 0.2 * shieldPercent);
      this.shieldIndicator.fillPoints(hexPoints, true);
    }
  }

  protected updateHealthBar(): void {
    super.updateHealthBar();

    // Add shield bar above health bar
    if (this.shield > 0) {
      const width = 30;
      const height = 3;
      const x = this.sprite.x - width / 2;
      const y = this.sprite.y - 30;

      const shieldWidth = (this.shield / this.maxShield) * width;
      this.healthBar.fillStyle(0x4dabf7, 0.8);
      this.healthBar.fillRect(x, y, shieldWidth, height);
    }
  }

  destroy(): void {
    if (this.shieldIndicator) {
      this.shieldIndicator.destroy();
      this.shieldIndicator = null;
    }
    super.destroy();
  }
}
