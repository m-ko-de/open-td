import { Enemy } from './Enemy';
import { ConfigManager } from '../../config/ConfigManager';

export class BossEnemy extends Enemy {
  constructor(scene: Phaser.Scene, path: Phaser.Curves.Path, wave: number, playerLevel: number = 1, playerCount: number = 1) {
    super(scene, path, wave, playerCount, 'normal', playerLevel);
    
    // Load boss config
    const config = ConfigManager.getInstance().getConfig();
    const bossConfig = config.enemies.boss;
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
    
    // Override with boss properties from config
    this.maxHealth = Math.round(bossConfig.baseHealth * healthMultiplier);
    this.health = this.maxHealth;
    this.goldReward = bossConfig.baseGold + wave * bossConfig.goldPerWave;
    this.xpReward = bossConfig.baseXp + wave * bossConfig.xpPerWave;
    
    // Speed from config
    this.baseSpeed = this.baseSpeed * bossConfig.speedMultiplier;
    this.speed = this.baseSpeed;
    
    // Recreate sprite with imposing boss appearance
    this.sprite.destroy();
    this.sprite = scene.add.graphics();
    this.createBossSprite();
    
    this.updatePosition();
    this.updateHealthBar();
  }

  private createBossSprite(): void {
    const size = 32; // Larger boss
    
    // Large shadow
    this.sprite.fillStyle(0x000000, 0.5);
    this.sprite.fillEllipse(0, size * 1.5, size * 2.0, size * 0.8);
    
    // Massive body base
    this.sprite.fillStyle(0x660099, 1); // Dark purple
    this.sprite.fillEllipse(0, size * 0.5, size * 1.5, size * 1.3);
    
    // Upper body/chest
    this.sprite.fillStyle(0x7700aa, 1);
    this.sprite.fillCircle(0, -size * 0.2, size * 1.1);
    
    // Head
    this.sprite.fillStyle(0x8800cc, 1);
    this.sprite.fillCircle(0, -size * 0.8, size * 0.7);
    
    // Massive shoulders/armor
    this.sprite.fillStyle(0x440066, 1);
    this.sprite.fillRect(-size * 1.3, -size * 0.5, size * 0.6, size * 1.2);
    this.sprite.fillRect(size * 0.7, -size * 0.5, size * 0.6, size * 1.2);
    
    // Armor plates with rivets
    this.sprite.fillStyle(0x333333, 1);
    for (let i = -1; i <= 1; i++) {
      this.sprite.fillRect(i * size * 0.4 - size * 0.3, -size * 0.1, size * 0.5, size * 0.15);
    }
    
    // Giant spikes on shoulders
    this.sprite.fillStyle(0x222222, 1);
    for (let i = 0; i < 3; i++) {
      const offset = (i - 1) * size * 0.3;
      // Left shoulder spikes
      this.sprite.beginPath();
      this.sprite.moveTo(-size * 1.5 + offset, -size * 0.3);
      this.sprite.lineTo(-size * 1.3 + offset, -size * 1.2);
      this.sprite.lineTo(-size * 1.1 + offset, -size * 0.3);
      this.sprite.closePath();
      this.sprite.fillPath();
      
      // Right shoulder spikes
      this.sprite.beginPath();
      this.sprite.moveTo(size * 1.5 - offset, -size * 0.3);
      this.sprite.lineTo(size * 1.3 - offset, -size * 1.2);
      this.sprite.lineTo(size * 1.1 - offset, -size * 0.3);
      this.sprite.closePath();
      this.sprite.fillPath();
    }
    
    // Crown/horns on head
    this.sprite.fillStyle(0xffaa00, 1);
    this.sprite.beginPath();
    this.sprite.moveTo(-size * 0.6, -size * 1.1);
    this.sprite.lineTo(-size * 0.4, -size * 1.7);
    this.sprite.lineTo(-size * 0.2, -size * 1.0);
    this.sprite.closePath();
    this.sprite.fillPath();
    
    this.sprite.beginPath();
    this.sprite.moveTo(size * 0.6, -size * 1.1);
    this.sprite.lineTo(size * 0.4, -size * 1.7);
    this.sprite.lineTo(size * 0.2, -size * 1.0);
    this.sprite.closePath();
    this.sprite.fillPath();
    
    // Central crown spike
    this.sprite.beginPath();
    this.sprite.moveTo(-size * 0.15, -size * 1.2);
    this.sprite.lineTo(0, -size * 1.9);
    this.sprite.lineTo(size * 0.15, -size * 1.2);
    this.sprite.closePath();
    this.sprite.fillPath();
    
    // Glowing menacing eyes
    this.sprite.fillStyle(0xff0000, 1);
    this.sprite.fillCircle(-size * 0.25, -size * 0.8, size * 0.25);
    this.sprite.fillCircle(size * 0.25, -size * 0.8, size * 0.25);
    
    // Eye glow
    this.sprite.fillStyle(0xff6600, 0.8);
    this.sprite.fillCircle(-size * 0.25, -size * 0.8, size * 0.35);
    this.sprite.fillCircle(size * 0.25, -size * 0.8, size * 0.35);
    
    // Inner eye shine
    this.sprite.fillStyle(0xffff00, 0.9);
    this.sprite.fillCircle(-size * 0.25, -size * 0.8, size * 0.15);
    this.sprite.fillCircle(size * 0.25, -size * 0.8, size * 0.15);
    
    // Giant teeth/fangs
    this.sprite.fillStyle(0xffffff, 1);
    for (let i = 0; i < 4; i++) {
      const xPos = (i - 1.5) * size * 0.25;
      this.sprite.beginPath();
      this.sprite.moveTo(xPos - size * 0.08, -size * 0.3);
      this.sprite.lineTo(xPos, size * 0.2);
      this.sprite.lineTo(xPos + size * 0.08, -size * 0.3);
      this.sprite.closePath();
      this.sprite.fillPath();
    }
    
    // Energy aura/glow around boss
    this.sprite.lineStyle(4, 0xff00ff, 0.3);
    this.sprite.strokeCircle(0, 0, size * 1.6);
    this.sprite.lineStyle(2, 0xff00ff, 0.5);
    this.sprite.strokeCircle(0, 0, size * 1.7);
    
    // Thick comic outline
    this.sprite.lineStyle(3, 0x000000, 1);
    this.sprite.strokeCircle(0, 0, size);
    
    // Energy aura
    this.sprite.lineStyle(2, 0xffff00, 0.4);
    this.sprite.strokeCircle(0, 0, size * 1.1);
    this.sprite.lineStyle(1, 0xff8800, 0.3);
    this.sprite.strokeCircle(0, 0, size * 1.2);
  }

  protected updateHealthBar(): void {
    this.healthBar.clear();

    const width = 50; // Wider health bar for boss
    const height = 6; // Thicker health bar
    const x = this.sprite.x - width / 2;
    const y = this.sprite.y - 35;

    // Background
    this.healthBar.fillStyle(0x000000, 0.8);
    this.healthBar.fillRect(x, y, width, height);

    // Health
    const healthWidth = (this.health / this.maxHealth) * width;
    const color = this.health > this.maxHealth * 0.5 ? 0xff6600 : 0xff0000;
    this.healthBar.fillStyle(color, 1);
    this.healthBar.fillRect(x, y, healthWidth, height);
    
    // Border
    this.healthBar.lineStyle(1, 0xffff00, 1);
    this.healthBar.strokeRect(x, y, width, height);
  }
}
