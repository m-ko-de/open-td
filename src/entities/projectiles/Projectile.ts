import { BaseEnemy } from '../enemies/BaseEnemy';

export class Projectile {
  private sprite: Phaser.GameObjects.Graphics;
  private scene: Phaser.Scene;
  private target: BaseEnemy;
  private damage: number;
  private speed: number = 0.3;
  private x: number;
  private y: number;
  private rotation: number = 0;
  private hasHit: boolean = false;
  private isFrost: boolean = false;
  private slowAmount: number = 0;
  private slowDuration: number = 0;
  private splashRadius: number = 0;
  private allEnemies: BaseEnemy[] = [];
  private trailParticles: Phaser.GameObjects.Graphics[] = [];

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
      // Energy projectile - directional arrow/bolt
      // Outer glow
      this.sprite.fillStyle(0xff8800, 0.3);
      this.sprite.fillCircle(0, 0, 10);
      
      // Middle glow
      this.sprite.fillStyle(0xffaa00, 0.6);
      this.sprite.fillCircle(0, 0, 7);
      
      // Arrow shape pointing right (will rotate to direction)
      this.sprite.fillStyle(0xffff00, 1);
      if (this.sprite.beginPath) {
        this.sprite.beginPath();
        this.sprite.moveTo(8, 0);  // Arrow tip
        this.sprite.lineTo(-4, -4); // Top back
        this.sprite.lineTo(-2, 0);  // Middle back
        this.sprite.lineTo(-4, 4);  // Bottom back
        this.sprite.closePath();
        this.sprite.fillPath();
      } else {
        // Fallback for test environment
        this.sprite.fillCircle(0, 0, 5);
      }
      
      // Bright core
      this.sprite.fillStyle(0xffffff, 0.9);
      this.sprite.fillCircle(0, 0, 3);
      
      // Front glow
      this.sprite.fillStyle(0xffffff, 0.6);
      this.sprite.fillCircle(4, 0, 2);
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
    this.rotation = angle;
    const velocityX = Math.cos(angle) * this.speed * delta;
    const velocityY = Math.sin(angle) * this.speed * delta;

    this.x += velocityX;
    this.y += velocityY;

    this.sprite.x = this.x;
    this.sprite.y = this.y;
    if (this.sprite.setRotation) {
      this.sprite.setRotation(this.rotation);
    }
    
    // Create enhanced trail particles (more frequent, longer lasting)
    if (Math.random() < 0.6 && this.scene.tweens?.add) {
      const trail = this.scene.add.graphics();
      const color = this.isFrost ? 0x00ffff : 0xffaa00;
      const size = this.isFrost ? 4 : 5;
      
      // Create gradient trail effect
      trail.fillStyle(color, 0.6);
      trail.fillCircle(0, 0, size);
      trail.fillStyle(color, 0.3);
      trail.fillCircle(0, 0, size * 1.5);
      
      trail.x = this.x;
      trail.y = this.y;
      if (trail.setRotation) trail.setRotation(this.rotation);
      if (trail.setDepth) trail.setDepth(90);
      
      this.trailParticles.push(trail);
      
      this.scene.tweens.add({
        targets: trail,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.8,
        duration: 400,
        ease: 'Power2',
        onComplete: () => {
          const index = this.trailParticles.indexOf(trail);
          if (index > -1) this.trailParticles.splice(index, 1);
          trail.destroy();
        }
      });
    }

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
    // Screen shake on explosion
    if (this.scene.cameras?.main?.shake) {
      this.scene.cameras.main.shake(150, 0.003);
    }
    
    // Create explosion visual with multiple layers
    if (this.scene.tweens?.add) {
      const explosion = this.scene.add.graphics();
      explosion.fillStyle(0xff8800, 0.8);
      explosion.fillCircle(0, 0, this.splashRadius * 0.6);
      explosion.fillStyle(0xff6600, 0.6);
      explosion.fillCircle(0, 0, this.splashRadius);
      explosion.lineStyle(3, 0xffaa00, 0.9);
      explosion.strokeCircle(0, 0, this.splashRadius);
      explosion.x = x;
      explosion.y = y;
      
      this.scene.tweens.add({
        targets: explosion,
        alpha: 0,
        scale: 1.5,
        duration: 400,
        ease: 'Power2',
        onComplete: () => explosion.destroy()
      });
      
      // Explosion particles
      for (let i = 0; i < 12; i++) {
        const particle = this.scene.add.graphics();
        const size = 3 + Math.random() * 4;
        particle.fillStyle(i % 2 === 0 ? 0xff6600 : 0xff8800, 0.8);
        particle.fillCircle(0, 0, size);
        particle.x = x;
        particle.y = y;
        if (particle.setDepth) particle.setDepth(98);
        
        const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.3;
        const speed = this.splashRadius * (0.8 + Math.random() * 0.6);
        
        this.scene.tweens.add({
          targets: particle,
          x: x + Math.cos(angle) * speed,
          y: y + Math.sin(angle) * speed,
          alpha: 0,
          scale: 0.3,
          duration: 300 + Math.random() * 300,
          ease: 'Power2',
          onComplete: () => particle.destroy()
        });
      }
    }
    
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
    
    // Clean up any remaining trail particles
    for (const trail of this.trailParticles) {
      trail.destroy();
    }
    this.trailParticles = [];
  }
}
