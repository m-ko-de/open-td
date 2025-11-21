import { BaseEnemy } from './BaseEnemy';

export class HealingEnemy extends BaseEnemy {
  private healRadius: number = 100;
  private healAmount: number = 5; // HP per second
  private healCooldown: number = 1000; // Heal every 1 second
  private lastHealTime: number = 0;
  private healIndicator: Phaser.GameObjects.Graphics | null = null;
  private pulseAnimation: number = 0;

  constructor(
    scene: Phaser.Scene,
    path: Phaser.Curves.Path,
    wave: number,
    playerCount: number = 1,
    playerLevel: number = 1
  ) {
    super(scene, path, wave, playerCount, playerLevel);

    // Create heal indicator
    this.healIndicator = scene.add.graphics();
  }

  protected getEnemyConfig(): any {
    return {
      baseHealth: 40,
      speedMultiplier: 0.8, // Slower, support unit
      baseGold: 20, // High reward - priority target!
      goldPerWave: 4,
      xpReward: 20,
      color: '0x51cf66', // Green
      size: 11,
    };
  }

  protected createSprite(color: number, size: number): void {
    // Healer enemy with medical cross

    // Shadow
    this.sprite.fillStyle(0x000000, 0.3);
    this.sprite.fillEllipse(0, size * 1.2, size * 1.3, size * 0.5);

    // Main body (rounded, friendly appearance)
    this.sprite.fillStyle(color, 1);
    this.sprite.fillCircle(0, 0, size);

    // Lighter green for depth
    this.sprite.fillStyle(0x8ce99a, 0.7);
    this.sprite.fillCircle(-size * 0.3, -size * 0.3, size * 0.6);

    // Medical cross (prominent)
    const crossColor = 0xffffff;
    const crossWidth = size * 0.3;
    const crossHeight = size * 0.8;

    this.sprite.fillStyle(crossColor, 1);
    // Vertical bar
    this.sprite.fillRect(-crossWidth / 2, -crossHeight / 2, crossWidth, crossHeight);
    // Horizontal bar
    this.sprite.fillRect(-crossHeight / 2, -crossWidth / 2, crossHeight, crossWidth);

    // Red cross detail
    this.sprite.fillStyle(0xff6b6b, 1);
    this.sprite.fillRect(-crossWidth / 4, -crossHeight / 2.5, crossWidth / 2, crossHeight / 1.5);
    this.sprite.fillRect(-crossHeight / 2.5, -crossWidth / 4, crossHeight / 1.5, crossWidth / 2);

    // Gentle eyes
    this.sprite.fillStyle(0x2f9e44, 1);
    this.sprite.fillCircle(-size * 0.4, -size * 0.1, size * 0.2);
    this.sprite.fillCircle(size * 0.4, -size * 0.1, size * 0.2);

    // Eye highlights
    this.sprite.fillStyle(0xffffff, 0.8);
    this.sprite.fillCircle(-size * 0.35, -size * 0.15, size * 0.1);
    this.sprite.fillCircle(size * 0.45, -size * 0.15, size * 0.1);

    // Caring smile
    this.sprite.lineStyle(2, 0x2f9e44, 1);
    this.sprite.beginPath();
    this.sprite.arc(0, size * 0.3, size * 0.4, 0, Math.PI, false);
    this.sprite.strokePath();

    // Outline
    this.sprite.lineStyle(2, 0x2b8a3e, 1);
    this.sprite.strokeCircle(0, 0, size);
  }

  protected onUpdate(delta: number, allEnemies?: BaseEnemy[]): void {
    const currentTime = Date.now();

    // Pulse animation for heal indicator
    this.pulseAnimation += delta * 0.003;
    if (this.pulseAnimation > Math.PI * 2) {
      this.pulseAnimation -= Math.PI * 2;
    }

    // Update heal indicator
    this.updateHealIndicator();

    // Heal nearby allies
    if (currentTime - this.lastHealTime > this.healCooldown && allEnemies) {
      this.lastHealTime = currentTime;
      this.healNearbyAllies(allEnemies, delta);
    }
  }

  private healNearbyAllies(allEnemies: BaseEnemy[], _delta: number): void {
    let healedCount = 0;

    for (const enemy of allEnemies) {
      if (enemy === this || enemy.isDead()) continue;

      const distance = Phaser.Math.Distance.Between(
        this.x,
        this.y,
        enemy.x,
        enemy.y
      );

      if (distance <= this.healRadius) {
        const currentHealth = enemy.getHealth();
        const maxHealth = enemy.getMaxHealth();

        if (currentHealth < maxHealth) {
          // Heal the enemy (we need to add a heal method to BaseEnemy)
          const healValue = Math.min(this.healAmount, maxHealth - currentHealth);
          (enemy as any).health = Math.min(maxHealth, currentHealth + healValue);
          enemy['updateHealthBar']();

          // Visual feedback - healing particle
          this.createHealParticle(enemy.x, enemy.y);
          healedCount++;
        }
      }
    }

    // If we healed someone, create visual effect
    if (healedCount > 0) {
      this.createHealWave();
    }
  }

  private createHealParticle(targetX: number, targetY: number): void {
    if (!this.scene) return;

    const particle = this.scene.add.graphics();
    particle.fillStyle(0x51cf66, 0.8);
    particle.fillCircle(0, 0, 3);
    particle.setPosition(this.sprite.x, this.sprite.y);

    this.scene.tweens.add({
      targets: particle,
      x: targetX,
      y: targetY,
      alpha: 0,
      duration: 400,
      ease: 'Cubic.Out',
      onComplete: () => particle.destroy(),
    });
  }

  private createHealWave(): void {
    if (!this.scene) return;

    const wave = this.scene.add.graphics();
    wave.lineStyle(2, 0x51cf66, 0.6);
    wave.strokeCircle(this.sprite.x, this.sprite.y, 5);

    this.scene.tweens.add({
      targets: wave,
      alpha: 0,
      duration: 600,
      onUpdate: () => {
        wave.clear();
        wave.lineStyle(2, 0x51cf66, wave.alpha * 0.6);
        const radius = 5 + (1 - wave.alpha) * this.healRadius;
        wave.strokeCircle(this.sprite.x, this.sprite.y, radius);
      },
      onComplete: () => wave.destroy(),
    });
  }

  private updateHealIndicator(): void {
    if (!this.healIndicator) return;

    this.healIndicator.clear();

    // Pulsing heal aura
    const pulseSize = 5 + Math.sin(this.pulseAnimation) * 2;

    this.healIndicator.lineStyle(1, 0x51cf66, 0.3 + Math.sin(this.pulseAnimation) * 0.2);
    this.healIndicator.strokeCircle(this.sprite.x, this.sprite.y, this.healRadius * 0.3);

    // Healing icon above enemy
    const x = this.sprite.x;
    const y = this.sprite.y - 22;

    this.healIndicator.fillStyle(0x51cf66, 0.8);
    // Plus sign
    this.healIndicator.fillRect(x - pulseSize, y - 1, pulseSize * 2, 2);
    this.healIndicator.fillRect(x - 1, y - pulseSize, 2, pulseSize * 2);
  }

  protected updatePosition(): void {
    super.updatePosition();
  }

  destroy(): void {
    if (this.healIndicator) {
      this.healIndicator.destroy();
      this.healIndicator = null;
    }
    super.destroy();
  }
}
