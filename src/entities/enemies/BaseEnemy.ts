import { ConfigManager } from '../../config/ConfigManager';

export abstract class BaseEnemy {
  protected sprite: Phaser.GameObjects.Graphics;
  protected scene: Phaser.Scene;
  protected follower: { t: number; vec: Phaser.Math.Vector2 };
  protected path: Phaser.Curves.Path;
  protected health: number;
  protected maxHealth: number;
  protected speed: number;
  protected baseSpeed: number;
  protected goldReward: number;
  protected xpReward: number;
  protected healthBar: Phaser.GameObjects.Graphics;
  protected slowEffect: number = 0; // 0 = no slow, 1 = 100% slow
  protected slowDuration: number = 0;
  protected wave: number;
  protected playerCount: number;

  constructor(
    scene: Phaser.Scene,
    path: Phaser.Curves.Path,
    wave: number,
    playerCount: number = 1,
    playerLevel: number = 1
  ) {
    this.scene = scene;
    this.path = path;
    this.wave = wave;
    this.playerCount = playerCount;
    this.follower = { t: 0, vec: new Phaser.Math.Vector2() };

    // Get base stats for enemy type
    const stats = this.calculateStats(wave, playerLevel, playerCount);

    this.maxHealth = stats.health;
    this.health = this.maxHealth;

    // Load base speed from config
    const config = ConfigManager.getInstance().getConfig();
    const baseSpeed = config.enemies.baseSpeed;
    this.baseSpeed = baseSpeed * stats.speedMultiplier;
    this.speed = this.baseSpeed;
    this.goldReward = stats.gold;
    this.xpReward = stats.xp;

    // Create enemy sprite
    this.sprite = scene.add.graphics();
    this.createSprite(stats.color, stats.size);

    // Create health bar
    this.healthBar = scene.add.graphics();

    this.updatePosition();
    this.updateHealthBar();
  }

  /**
   * Abstract method to create the enemy's visual appearance
   * Must be implemented by subclasses
   */
  protected abstract createSprite(color: number, size: number): void;

  /**
   * Abstract method to get enemy type configuration
   * Must be implemented by subclasses
   */
  protected abstract getEnemyConfig(): any;

  /**
   * Hook for special behavior during update (e.g., healing aura, shield regen)
   * Can be overridden by subclasses
   */
  protected onUpdate(_delta: number, _allEnemies?: BaseEnemy[]): void {
    // Default: no special behavior
  }

  /**
   * Hook for special behavior when taking damage (e.g., shield absorption)
   * Returns actual damage taken after modifications
   */
  protected onTakeDamage(damage: number): number {
    // Default: full damage
    return damage;
  }

  /**
   * Hook for special behavior on death (e.g., splitting, explosion)
   * Returns array of new enemies to spawn (empty by default)
   */
  protected onDeath(): BaseEnemy[] {
    // Default: no special behavior
    return [];
  }

  protected calculateStats(
    wave: number,
    playerLevel: number = 1,
    playerCount: number = 1
  ): {
    health: number;
    speedMultiplier: number;
    gold: number;
    xp: number;
    color: number;
    size: number;
  } {
    const config = ConfigManager.getInstance().getConfig();
    const enemyConfig = this.getEnemyConfig();
    const healthScaling = config.enemies.healthScaling;

    // Health scaling from config
    const waveMultiplier = Math.pow(
      healthScaling.waveMultiplier,
      Math.floor(wave / healthScaling.waveInterval)
    );
    const levelMultiplier = Math.pow(healthScaling.levelMultiplier, playerLevel - 1);

    // Multiplayer health scaling
    let multiplayerMultiplier = 1;
    if (playerCount > 1) {
      const multiplayerConfig = config.multiplayer;
      multiplayerMultiplier = 1 + (playerCount - 1) * multiplayerConfig.enemyScaling.healthPerPlayer;
    }

    const healthMultiplier = waveMultiplier * levelMultiplier * multiplayerMultiplier;

    return {
      health: Math.round(enemyConfig.baseHealth * healthMultiplier),
      speedMultiplier: enemyConfig.speedMultiplier,
      gold: enemyConfig.baseGold + wave * enemyConfig.goldPerWave,
      xp: enemyConfig.xpReward,
      color: parseInt(enemyConfig.color),
      size: enemyConfig.size,
    };
  }

  update(delta: number, allEnemies?: BaseEnemy[]): void {
    // Update slow effect
    if (this.slowDuration > 0) {
      this.slowDuration -= delta;
      if (this.slowDuration <= 0) {
        this.slowEffect = 0;
        this.speed = this.baseSpeed;
      }
    }

    // Update burn effect
    const self = this as any;
    if (self.burnEffect) {
      const stillBurning = self.burnEffect.update();
      if (!stillBurning) {
        self.burnEffect = null;
        if (self.burnIndicator) {
          self.burnIndicator.destroy();
          self.burnIndicator = null;
        }
      } else {
        if (self.burnIndicator) {
          self.burnIndicator.clear();
          self.burnIndicator.fillStyle(0xff6600, 0.6);
          self.burnIndicator.fillCircle(this.sprite.x, this.sprite.y, 12);
        }
      }
    }

    // Call special behavior hook
    this.onUpdate(delta, allEnemies);

    this.follower.t += this.speed * delta;

    if (this.follower.t >= 1) {
      this.follower.t = 1;
    }

    this.updatePosition();
  }

  protected updatePosition(): void {
    this.path.getPoint(this.follower.t, this.follower.vec);
    this.sprite.x = this.follower.vec.x;
    this.sprite.y = this.follower.vec.y;
    this.updateHealthBar();
  }

  protected updateHealthBar(): void {
    this.healthBar.clear();

    const width = 30;
    const height = 4;
    const x = this.sprite.x - width / 2;
    const y = this.sprite.y - 25;

    // Background
    this.healthBar.fillStyle(0x000000, 0.5);
    this.healthBar.fillRect(x, y, width, height);

    // Health
    const healthWidth = (this.health / this.maxHealth) * width;
    const color = this.health > this.maxHealth * 0.5 ? 0x00ff00 : 0xff0000;
    this.healthBar.fillStyle(color, 1);
    this.healthBar.fillRect(x, y, healthWidth, height);
  }

  takeDamage(damage: number): BaseEnemy[] {
    const actualDamage = this.onTakeDamage(damage);
    this.health -= actualDamage;
    this.updateHealthBar();
    
    // Show floating damage number
    this.showFloatingDamage(actualDamage);
    
    // Flash effect on hit
    if (this.sprite.setAlpha) {
      this.sprite.setAlpha(0.5);
    }
    if (this.scene.tweens?.add) {
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 1,
        duration: 100,
        ease: 'Power2'
      });
    }
    
    if (this.health <= 0) {
      this.health = 0;
      this.playDeathAnimation();
      return this.onDeath();
    }

    return [];
  }

  /**
   * Show floating damage number above enemy
   */
  private showFloatingDamage(damage: number): void {
    if (!this.scene.add.text || !this.scene.tweens?.add) return; // Skip in test environment
    
    const damageText = this.scene.add.text(
      this.sprite.x,
      this.sprite.y - 20,
      Math.round(damage).toString(),
      {
        fontSize: '16px',
        color: '#ff4444',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      }
    );
    damageText.setOrigin(0.5);
    if (damageText.setDepth) damageText.setDepth(100);
    
    this.scene.tweens.add({
      targets: damageText,
      y: damageText.y - 30,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => damageText.destroy()
    });
  }

  /**
   * Play death animation with particles
   */
  private playDeathAnimation(): void {
    if (!this.scene.tweens?.add) return; // Skip in test environment
    
    // Get enemy color from sprite
    const stats = this.calculateStats(this.wave, 1, this.playerCount);
    
    // Create death particles burst
    for (let i = 0; i < 15; i++) {
      const particle = this.scene.add.graphics();
      const size = 2 + Math.random() * 4;
      particle.fillStyle(stats.color, 0.8);
      particle.fillCircle(0, 0, size);
      particle.x = this.sprite.x;
      particle.y = this.sprite.y;
      if (particle.setDepth) particle.setDepth(95);
      
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 40;
      
      this.scene.tweens.add({
        targets: particle,
        x: particle.x + Math.cos(angle) * speed,
        y: particle.y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0.2,
        duration: 400 + Math.random() * 400,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
    
    // Flash white before disappearing
    this.sprite.clear();
    this.sprite.fillStyle(0xffffff, 0.8);
    this.sprite.fillCircle(0, 0, stats.size);
    
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      scale: 1.5,
      duration: 300,
      ease: 'Power2'
    });
  }

  isDead(): boolean {
    return this.health <= 0;
  }

  reachedEnd(): boolean {
    return this.follower.t >= 1;
  }

  getGoldReward(): number {
    return this.goldReward;
  }

  getHealth(): number {
    return this.health;
  }

  getMaxHealth(): number {
    return this.maxHealth;
  }

  getXPReward(): number {
    return this.xpReward;
  }

  getPosition(): Phaser.Math.Vector2 {
    return this.follower.vec;
  }

  getProgress(): number {
    return this.follower.t;
  }

  get x(): number {
    return this.follower.vec.x;
  }

  get y(): number {
    return this.follower.vec.y;
  }

  applySlow(slowAmount: number, duration: number): void {
    if (slowAmount > this.slowEffect) {
      this.slowEffect = slowAmount;
      this.slowDuration = duration;
      this.speed = this.baseSpeed * (1 - this.slowEffect);
    }
  }

  destroy(): void {
    this.sprite.destroy();
    this.healthBar.destroy();

    // Clean up burn indicator if present
    const self = this as any;
    if (self.burnIndicator) {
      self.burnIndicator.destroy();
      self.burnIndicator = null;
    }
    self.burnEffect = null;
  }
}
