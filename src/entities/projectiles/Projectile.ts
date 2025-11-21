import { BaseEnemy } from '../enemies/BaseEnemy';

export class Projectile {
  private sprite: Phaser.GameObjects.Graphics;
  private scene: Phaser.Scene;
  private target: BaseEnemy;
  private damage: number;
  private speed: number = 0.3;
  private x: number;
  private y: number;
  private hasHit: boolean = false;
  private isFrost: boolean = false;
  private slowAmount: number = 0;
  private slowDuration: number = 0;
  private splashRadius: number = 0;
  private allEnemies: BaseEnemy[] = [];

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    target: BaseEnemy,
    damage: number,
    isFrost: boolean = false,
    slowAmount: number = 0,
    slowDuration: number = 0,
    splashRadius: number = 0,
    allEnemies: BaseEnemy[] = []
  ) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.target = target;
    this.damage = damage;
    this.isFrost = isFrost;
    this.slowAmount = slowAmount;
    this.slowDuration = slowDuration;
    this.splashRadius = splashRadius;
    this.allEnemies = allEnemies;

    // Create projectile sprite with glow effect
    this.sprite = scene.add.graphics();
    
    if (isFrost) {
      // Frost projectile - snowflake style
      // Outer glow
      this.sprite.fillStyle(0x88ffff, 0.3);
      this.sprite.fillCircle(0, 0, 8);
      
      // Middle glow
      this.sprite.fillStyle(0x00ffff, 0.6);
      this.sprite.fillCircle(0, 0, 6);
      
      // Core
      this.sprite.fillStyle(0xffffff, 1);
      this.sprite.fillCircle(0, 0, 4);
      
      // Snowflake arms
      this.sprite.lineStyle(2, 0xffffff, 0.8);
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const x2 = Math.cos(angle) * 6;
        const y2 = Math.sin(angle) * 6;
        this.sprite.lineBetween(0, 0, x2, y2);
      }
    } else {
      // Energy projectile - glowing orb
      // Outer glow
      this.sprite.fillStyle(0xff8800, 0.2);
      this.sprite.fillCircle(0, 0, 9);
      
      // Middle glow
      this.sprite.fillStyle(0xffaa00, 0.5);
      this.sprite.fillCircle(0, 0, 7);
      
      // Main body
      this.sprite.fillStyle(0xffff00, 1);
      this.sprite.fillCircle(0, 0, 5);
      
      // Bright core
      this.sprite.fillStyle(0xffffff, 0.9);
      this.sprite.fillCircle(0, 0, 3);
      
      // Spark effect
      this.sprite.fillStyle(0xffffff, 0.7);
      this.sprite.fillCircle(-1, -1, 1.5);
    }
    
    this.sprite.x = x;
    this.sprite.y = y;
  }

  update(delta: number): void {
    if (this.hasHit || this.target.isDead()) {
      this.hasHit = true;
      return;
    }

    // Move towards target
    const targetX = this.target.x;
    const targetY = this.target.y;

    const angle = Math.atan2(targetY - this.y, targetX - this.x);
    const velocityX = Math.cos(angle) * this.speed * delta;
    const velocityY = Math.sin(angle) * this.speed * delta;

    this.x += velocityX;
    this.y += velocityY;

    this.sprite.x = this.x;
    this.sprite.y = this.y;

    // Check if hit target
    const distance = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);

    if (distance < 10) {
      // Apply damage to primary target
      this.target.takeDamage(this.damage);
      if (this.isFrost) {
        this.target.applySlow(this.slowAmount, this.slowDuration);
      }
      
      // Apply splash damage if splash radius is set
      if (this.splashRadius > 0) {
        this.applySplashDamage(this.x, this.y);
      }
      
      this.hasHit = true;
    }
  }

  private applySplashDamage(x: number, y: number): void {
    // Create explosion visual
    const explosion = this.scene.add.graphics();
    explosion.fillStyle(0xff8800, 0.6);
    explosion.fillCircle(x, y, this.splashRadius);
    explosion.lineStyle(3, 0xff6600, 0.8);
    explosion.strokeCircle(x, y, this.splashRadius);
    
    this.scene.tweens.add({
      targets: explosion,
      alpha: 0,
      scale: 1.3,
      duration: 400,
      ease: 'Power2',
      onComplete: () => explosion.destroy()
    });
    
    // Damage all enemies in splash radius
    for (const enemy of this.allEnemies) {
      if (enemy === this.target || enemy.isDead()) continue;
      
      const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
      if (dist <= this.splashRadius) {
        enemy.takeDamage(this.damage);
      }
    }
  }

  shouldDestroy(): boolean {
    return this.hasHit || this.target.isDead();
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
