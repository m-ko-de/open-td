export type EnemyType = 'normal' | 'fast' | 'tank';

import { ConfigManager } from '../config/ConfigManager';

export class Enemy {
  protected sprite: Phaser.GameObjects.Graphics;
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

  constructor(scene: Phaser.Scene, path: Phaser.Curves.Path, wave: number, playerCount: number = 1, type: EnemyType = 'normal', playerLevel: number = 1) {
    this.path = path;
    this.follower = { t: 0, vec: new Phaser.Math.Vector2() };

    // Get base stats for enemy type (with multiplayer scaling)
    const stats = this.getTypeStats(type, wave, playerLevel, playerCount);
    
    this.maxHealth = stats.health;
    this.health = this.maxHealth;
    
    // Load base speed from config
    const config = ConfigManager.getInstance().getConfig();
    const baseSpeed = config.enemies.baseSpeed;
    this.baseSpeed = baseSpeed * stats.speedMultiplier;
    this.speed = this.baseSpeed;
    this.goldReward = stats.gold;
    this.xpReward = stats.xp;

    // Create enemy sprite with type-specific appearance
    this.sprite = scene.add.graphics();
    
    // Create different sprites based on type
    switch (type) {
      case 'fast':
        this.createGhostSprite(stats.color, stats.size);
        break;
      case 'tank':
        this.createHeavyMonsterSprite(stats.color, stats.size);
        break;
      case 'normal':
      default:
        this.createMonsterSprite(stats.color, stats.size);
        break;
    }

    // Create health bar
    this.healthBar = scene.add.graphics();

    this.updatePosition();
    this.updateHealthBar();
  }

  private getTypeStats(type: EnemyType, wave: number, playerLevel: number = 1, playerCount: number = 1): {
    health: number;
    speedMultiplier: number;
    gold: number;
    xp: number;
    color: number;
    size: number;
  } {
    const config = ConfigManager.getInstance().getConfig();
    const enemyConfig = config.enemies[type];
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

  private createMonsterSprite(color: number, size: number): void {
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

  private createGhostSprite(color: number, size: number): void {
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

  private createHeavyMonsterSprite(color: number, size: number): void {
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

  update(delta: number): void {
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
        // Burn effect expired
        self.burnEffect = null;
        if (self.burnIndicator) {
          self.burnIndicator.destroy();
          self.burnIndicator = null;
        }
      } else {
        // Update burn indicator position
        if (self.burnIndicator) {
          self.burnIndicator.clear();
          self.burnIndicator.fillStyle(0xff6600, 0.6);
          self.burnIndicator.fillCircle(this.sprite.x, this.sprite.y, 12);
        }
      }
    }

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

  takeDamage(damage: number): void {
    this.health -= damage;
    this.updateHealthBar();

    if (this.health <= 0) {
      this.health = 0;
    }
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
