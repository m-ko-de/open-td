import { Enemy } from './Enemy';
import { Projectile } from './Projectile';
import { ConfigManager } from '../config/ConfigManager';

export class Tower {
  public id?: string; // Server-assigned ID for multiplayer
  private sprite!: Phaser.GameObjects.Graphics;
  private scene: Phaser.Scene;
  private range: number;
  private damage: number;
  private fireRate: number;
  private lastFired: number = 0;
  private rangeCircle: Phaser.GameObjects.Graphics;
  private showRange: boolean = false;
  private isFrost: boolean = false;
  private isFire: boolean = false;
  private burnDamagePerSecond: number = 0;
  private burnDuration: number = 0;
  public x: number;
  public y: number;
  private baseDamage: number;
  private baseFireRate: number;
  private upgradeLevel: number = 1;
  private upgradeLevelText: Phaser.GameObjects.Text;
  private buildCost: number;
  private totalInvested: number;
  private towerType: string;

  constructor(scene: Phaser.Scene, x: number, y: number, type: string, buildCost: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.towerType = type;
    this.buildCost = buildCost;
    this.totalInvested = buildCost;

    // Load tower config
    const config = ConfigManager.getInstance().getTowerConfig(type);
    
    if (!config) {
      throw new Error(`Tower config not found for type: ${type}`);
    }

    // Set tower properties from config
    this.range = config.range;
    this.baseDamage = config.damage;
    this.baseFireRate = config.fireRate;
    this.isFrost = config.type === 'frost';
    this.isFire = config.type === 'fire';
    
    // Fire tower specific properties
    if (this.isFire) {
      this.burnDamagePerSecond = config.burnDamagePerSecond || 8;
      this.burnDuration = config.burnDuration || 5000;
    }

    // Create sprite based on type
    if (type === 'fast') {
      this.createMGSprite();
    } else if (type === 'frost') {
      this.createSprite(0x00ddff);
    } else if (type === 'fire') {
      this.createSprite(0xff6600);
    } else if (type === 'strong') {
      this.createSprite(0xff00ff);
    } else {
      this.createSprite(0x0000ff);
    }

    // Apply initial upgrade level stats
    this.damage = this.baseDamage;
    this.fireRate = this.baseFireRate;
    
    // Create upgrade level indicator
    this.upgradeLevelText = this.scene.add.text(this.x, this.y - 30, '1', {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(100);

    // Create range indicator
    this.rangeCircle = scene.add.graphics();
    this.updateRangeCircle();

    // Make tower interactive
    this.sprite.setInteractive(
      new Phaser.Geom.Circle(0, 0, 20),
      Phaser.Geom.Circle.Contains
    );

    this.sprite.on('pointerover', () => {
      this.showRange = true;
      this.updateRangeCircle();
    });

    this.sprite.on('pointerout', () => {
      this.showRange = false;
      this.updateRangeCircle();
    });
  }

  private createSprite(color: number): void {
    this.sprite = this.scene.add.graphics();
    
    // Steam-punk tower base
    // Base platform
    this.sprite.fillStyle(0x4a4a4a, 1);
    this.sprite.fillRoundedRect(-18, 10, 36, 8, 2);
    
    // Main tower body with metallic sheen
    this.sprite.fillStyle(color, 1);
    this.sprite.fillRoundedRect(-12, -8, 24, 18, 3);
    
    // Darker shade for depth
    const colorObj = Phaser.Display.Color.IntegerToColor(color);
    const darkerColor = Phaser.Display.Color.GetColor(
      Math.floor(colorObj.red * 0.6),
      Math.floor(colorObj.green * 0.6),
      Math.floor(colorObj.blue * 0.6)
    );
    this.sprite.fillStyle(darkerColor, 1);
    this.sprite.fillRect(8, -8, 4, 18);
    
    // Top cannon/weapon part
    this.sprite.fillStyle(0x2a2a2a, 1);
    this.sprite.fillRoundedRect(-8, -15, 16, 7, 2);
    
    // Barrel/weapon detail
    this.sprite.fillStyle(0x3a3a3a, 1);
    this.sprite.fillRect(-3, -18, 6, 8);
    
    // Energy core/gem in center
    this.sprite.fillStyle(0xffff00, 0.8);
    this.sprite.fillCircle(0, 0, 4);
    this.sprite.lineStyle(1, 0xffffff, 0.6);
    this.sprite.strokeCircle(0, 0, 4);
    
    // Bolts/rivets
    this.sprite.fillStyle(0x666666, 1);
    [-8, 8].forEach(x => {
      [-4, 4].forEach(y => {
        this.sprite.fillCircle(x, y, 1.5);
      });
    });
    
    // Outer border glow
    this.sprite.lineStyle(2, 0xffffff, 0.3);
    this.sprite.strokeRoundedRect(-12, -8, 24, 18, 3);
    
    this.sprite.x = this.x;
    this.sprite.y = this.y;
  }

  private createMGSprite(): void {
    this.sprite = this.scene.add.graphics();
    
    // MG-Turm in militärischem Grau/Grün
    // Base platform
    this.sprite.fillStyle(0x3a3a3a, 1);
    this.sprite.fillRoundedRect(-18, 10, 36, 8, 2);
    
    // Main turret body - military olive green
    this.sprite.fillStyle(0x556b2f, 1);
    this.sprite.fillRoundedRect(-14, -6, 28, 16, 2);
    
    // Darker side for depth
    this.sprite.fillStyle(0x3d4f1f, 1);
    this.sprite.fillRect(10, -6, 4, 16);
    
    // Ammo belt/drum on side
    this.sprite.fillStyle(0x8b7355, 1);
    this.sprite.fillRoundedRect(-16, 0, 6, 8, 1);
    this.sprite.lineStyle(1, 0x000000, 0.5);
    this.sprite.strokeRoundedRect(-16, 0, 6, 8, 1);
    
    // Dual barrels (MG style)
    this.sprite.fillStyle(0x2a2a2a, 1);
    this.sprite.fillRect(-3, -18, 2, 14);
    this.sprite.fillRect(1, -18, 2, 14);
    
    // Barrel tips
    this.sprite.fillStyle(0x1a1a1a, 1);
    this.sprite.fillRect(-3, -19, 2, 3);
    this.sprite.fillRect(1, -19, 2, 3);
    
    // Muzzle flashes (metallic rings)
    this.sprite.lineStyle(1, 0x666666, 1);
    this.sprite.strokeCircle(-2, -18, 2);
    this.sprite.strokeCircle(2, -18, 2);
    
    // Ventilation slots
    this.sprite.fillStyle(0x1a1a1a, 1);
    for (let i = 0; i < 4; i++) {
      this.sprite.fillRect(-10 + i * 5, -2, 2, 1);
      this.sprite.fillRect(-10 + i * 5, 2, 2, 1);
    }
    
    // Warning stripes (yellow/black)
    this.sprite.fillStyle(0xffff00, 0.8);
    this.sprite.fillRect(-12, 8, 4, 2);
    this.sprite.fillRect(8, 8, 4, 2);
    this.sprite.fillStyle(0x000000, 0.8);
    this.sprite.fillRect(-10, 8, 2, 2);
    this.sprite.fillRect(10, 8, 2, 2);
    
    // Bolts/rivets
    this.sprite.fillStyle(0x666666, 1);
    [-10, -6, 6, 10].forEach(x => {
      this.sprite.fillCircle(x, 0, 1.5);
    });
    
    // Red targeting light
    this.sprite.fillStyle(0xff0000, 0.9);
    this.sprite.fillCircle(0, -8, 2);
    this.sprite.lineStyle(1, 0xff6666, 0.5);
    this.sprite.strokeCircle(0, -8, 3);
    
    this.sprite.x = this.x;
    this.sprite.y = this.y;
  }

  private updateRangeCircle(): void {
    this.rangeCircle.clear();

    if (this.showRange) {
      this.rangeCircle.lineStyle(2, 0xffffff, 0.5);
      this.rangeCircle.strokeCircle(this.x, this.y, this.range);
    }
  }

  update(time: number, enemies: Enemy[], projectiles: Projectile[]): void {
    if (time - this.lastFired < this.fireRate) {
      return;
    }

    // Find enemy in range
    const target = this.findTarget(enemies);

    if (target) {
      this.fire(target, projectiles);
      this.lastFired = time;
    }
  }

  private findTarget(enemies: Enemy[]): Enemy | null {
    let targetEnemy: Enemy | null = null;
    let maxProgress = -1;

    for (const enemy of enemies) {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);

      if (distance <= this.range) {
        // Target the enemy that has progressed furthest along the path (t value)
        const progress = enemy.getProgress();
        if (progress > maxProgress) {
          maxProgress = progress;
          targetEnemy = enemy;
        }
      }
    }

    return targetEnemy;
  }

  private fire(target: Enemy, projectiles: Projectile[]): void {
    // Fire tower applies burn effect directly without projectiles
    if (this.isFire) {
      this.applyBurnEffect(target);
      // Visual feedback
      const flame = this.scene.add.graphics();
      flame.fillStyle(0xff6600, 0.8);
      flame.fillCircle(target.x, target.y, 15);
      this.scene.tweens.add({
        targets: flame,
        alpha: 0,
        scale: 1.5,
        duration: 300,
        onComplete: () => flame.destroy()
      });
      return;
    }
    
    // Regular projectile attack for other towers
    const projectile = new Projectile(
      this.scene,
      this.x,
      this.y,
      target,
      this.damage,
      this.isFrost,
      0.5, // 50% slow
      2000 // 2 seconds
    );
    projectiles.push(projectile);
  }
  
  private applyBurnEffect(enemy: Enemy): void {
    // Check if enemy already has a burn effect from any tower
    if (!(enemy as any).burnEffect) {
      const BurnEffect = require('./BurnEffect').BurnEffect;
      (enemy as any).burnEffect = new BurnEffect(enemy, this.burnDamagePerSecond, this.burnDuration);
      
      // Add visual burn indicator
      if (!(enemy as any).burnIndicator) {
        const burnIndicator = this.scene.add.graphics();
        (enemy as any).burnIndicator = burnIndicator;
      }
    } else {
      // Refresh existing burn effect
      (enemy as any).burnEffect.refresh();
    }
  }

  upgrade(): boolean {
    if (this.upgradeLevel >= 3) {
      return false; // Max level reached
    }

    const cost = this.getUpgradeCost();
    this.totalInvested += cost;
    
    this.upgradeLevel++;
    this.applyUpgradeStats();
    this.updateUpgradeLevelDisplay();
    
    return true;
  }

  private applyUpgradeStats(): void {
    const upgradeConfig = ConfigManager.getInstance().getUpgradeConfig();
    
    switch (this.upgradeLevel) {
      case 1:
        this.damage = this.baseDamage;
        this.fireRate = this.baseFireRate;
        break;
      case 2:
        this.damage = Math.round(this.baseDamage * upgradeConfig.level2.damageMultiplier);
        this.fireRate = Math.round(this.baseFireRate * upgradeConfig.level2.fireRateMultiplier);
        break;
      case 3:
        this.damage = Math.round(this.baseDamage * upgradeConfig.level3.damageMultiplier);
        this.fireRate = Math.round(this.baseFireRate * upgradeConfig.level3.fireRateMultiplier);
        break;
    }
  }

  private updateUpgradeLevelDisplay(): void {
    this.upgradeLevelText.setText(this.upgradeLevel.toString());
    
    // Change color based on level
    switch (this.upgradeLevel) {
      case 1:
        this.upgradeLevelText.setColor('#ffffff');
        break;
      case 2:
        this.upgradeLevelText.setColor('#00ff00');
        break;
      case 3:
        this.upgradeLevelText.setColor('#ffff00');
        break;
    }
  }

  getUpgradeLevel(): number {
    return this.upgradeLevel;
  }

  getUpgradeCost(): number {
    const upgradeConfig = ConfigManager.getInstance().getUpgradeConfig();
    const baseCost = this.buildCost;
    
    switch (this.upgradeLevel) {
      case 1:
        return Math.round(baseCost * upgradeConfig.level2.costMultiplier);
      case 2:
        return Math.round(baseCost * upgradeConfig.level3.costMultiplier);
      default:
        return 0; // Max level, no upgrade available
    }
  }

  canUpgrade(): boolean {
    return this.upgradeLevel < 3;
  }

  getSellValue(): number {
    const upgradeConfig = ConfigManager.getInstance().getUpgradeConfig();
    return Math.floor(this.totalInvested * upgradeConfig.sellRefundPercent);
  }

  getTotalInvested(): number {
    return this.totalInvested;
  }

  getType(): string {
    return this.towerType;
  }

  destroy(): void {
    this.sprite.destroy();
    this.rangeCircle.destroy();
    this.upgradeLevelText.destroy();
  }
}
