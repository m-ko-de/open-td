import { BaseEnemy } from './BaseEnemy';

export class ArmoredEnemy extends BaseEnemy {
  private damageReduction: number = 0.5; // 50% damage reduction
  private armorPlating: Phaser.GameObjects.Graphics | null = null;

  constructor(
    scene: Phaser.Scene,
    path: Phaser.Curves.Path,
    wave: number,
    playerCount: number = 1,
    playerLevel: number = 1
  ) {
    super(scene, path, wave, playerCount, playerLevel);

    // Create armor plating indicator
    this.armorPlating = scene.add.graphics();
    this.updateArmorIndicator();
  }

  protected getEnemyConfig(): any {
    return {
      baseHealth: 80,
      speedMultiplier: 0.7, // Slower due to heavy armor
      baseGold: 15,
      goldPerWave: 3,
      xpReward: 15,
      color: '0x868e96', // Gray
      size: 14,
    };
  }

  protected createSprite(color: number, size: number): void {
    // Heavily armored enemy

    // Shadow
    this.sprite.fillStyle(0x000000, 0.4);
    this.sprite.fillEllipse(0, size * 1.3, size * 1.4, size * 0.6);

    // Main body
    this.sprite.fillStyle(color, 1);
    this.sprite.fillCircle(0, 0, size);

    // Metallic armor plates
    const plateColor = 0x495057;
    const lightMetallic = 0xadb5bd;
    const darkMetallic = 0x343a40;

    // Front armor plate
    this.sprite.fillStyle(plateColor, 1);
    this.sprite.fillRect(-size * 0.7, -size * 0.5, size * 1.4, size);

    // Rivets on armor
    this.sprite.fillStyle(darkMetallic, 1);
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        this.sprite.fillCircle(i * size * 0.5, j * size * 0.3, size * 0.1);
      }
    }

    // Shoulder plates
    this.sprite.fillStyle(plateColor, 1);
    this.sprite.fillRect(-size * 1.1, -size * 0.7, size * 0.5, size * 0.8);
    this.sprite.fillRect(size * 0.6, -size * 0.7, size * 0.5, size * 0.8);

    // Metallic highlights
    this.sprite.fillStyle(lightMetallic, 0.6);
    this.sprite.fillRect(-size * 0.6, -size * 0.4, size * 0.3, size * 0.2);
    this.sprite.fillRect(size * 0.3, -size * 0.4, size * 0.3, size * 0.2);

    // Visor/eyes (glowing through helmet)
    this.sprite.fillStyle(0xff6b6b, 1);
    this.sprite.fillRect(-size * 0.45, -size * 0.2, size * 0.3, size * 0.15);
    this.sprite.fillRect(size * 0.15, -size * 0.2, size * 0.3, size * 0.15);

    // Eye glow
    this.sprite.fillStyle(0xff8787, 0.5);
    this.sprite.fillRect(-size * 0.5, -size * 0.25, size * 0.4, size * 0.25);
    this.sprite.fillRect(size * 0.1, -size * 0.25, size * 0.4, size * 0.25);

    // Heavy outline
    this.sprite.lineStyle(3, 0x212529, 1);
    this.sprite.strokeCircle(0, 0, size);
    this.sprite.strokeRect(-size * 0.7, -size * 0.5, size * 1.4, size);
  }

  protected onTakeDamage(damage: number): number {
    // Check if attacker has armor penetration (sniper towers)
    // For now, apply flat damage reduction
    const reducedDamage = damage * (1 - this.damageReduction);

    // Visual feedback - armor spark effect
    if (this.scene) {
      const spark = this.scene.add.graphics();
      spark.fillStyle(0xffd43b, 1);
      spark.fillCircle(this.sprite.x, this.sprite.y - 10, 3);
      
      this.scene.tweens.add({
        targets: spark,
        alpha: 0,
        y: spark.y - 20,
        duration: 300,
        onComplete: () => spark.destroy(),
      });
    }

    return reducedDamage;
  }

  private updateArmorIndicator(): void {
    if (!this.armorPlating) return;

    this.armorPlating.clear();

    // Armor icon above enemy
    const x = this.sprite.x;
    const y = this.sprite.y - 22;
    const size = 4;

    this.armorPlating.fillStyle(0x868e96, 0.8);
    this.armorPlating.beginPath();
    this.armorPlating.moveTo(x, y - size);
    this.armorPlating.lineTo(x - size, y);
    this.armorPlating.lineTo(x - size, y + size);
    this.armorPlating.lineTo(x + size, y + size);
    this.armorPlating.lineTo(x + size, y);
    this.armorPlating.closePath();
    this.armorPlating.fillPath();
  }

  protected updatePosition(): void {
    super.updatePosition();
    this.updateArmorIndicator();
  }

  destroy(): void {
    if (this.armorPlating) {
      this.armorPlating.destroy();
      this.armorPlating = null;
    }
    super.destroy();
  }
}
