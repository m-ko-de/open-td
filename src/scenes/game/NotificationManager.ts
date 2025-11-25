/**
 * NotificationManager - Manages game notifications (level up, tower actions, etc.)
 */
import { t } from '@/client/i18n';

export class NotificationManager {
  constructor(private scene: Phaser.Scene) {}

  showLevelUp(level: number): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    const notification = this.scene.add.container(width / 2, height / 3);

    const bg = this.scene.add.rectangle(0, 0, 300, 100, 0x000000, 0.8);
    const text = this.scene.add.text(0, -20, t('notification.level_up'), {
      font: 'bold 32px Arial',
      color: '#ffff00',
    }).setOrigin(0.5);
    const levelText = this.scene.add.text(0, 20, `Level ${level}`, {
      font: '24px Arial',
      color: '#ffffff',
    }).setOrigin(0.5);

    notification.add([bg, text, levelText]);
    notification.setDepth(1000);

    this.scene.tweens.add({
      targets: notification,
      alpha: { from: 1, to: 0 },
      y: height / 3 - 50,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => notification.destroy(),
    });
  }

  showTowerUpgrade(): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    const notification = this.scene.add.container(width / 2, height / 2);

    const bg = this.scene.add.rectangle(0, 0, 250, 80, 0x000000, 0.8);
    const text = this.scene.add.text(0, 0, t('notification.tower_upgraded'), {
      font: 'bold 28px Arial',
      color: '#ff9900',
    }).setOrigin(0.5);

    notification.add([bg, text]);
    notification.setDepth(1000);

    this.scene.tweens.add({
      targets: notification,
      alpha: { from: 1, to: 0 },
      y: height / 2 - 50,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => notification.destroy(),
    });
  }

  showTowerSold(refund: number): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    const notification = this.scene.add.container(width / 2, height / 2);

    const bg = this.scene.add.rectangle(0, 0, 280, 100, 0x000000, 0.8);
    const text = this.scene.add.text(0, -15, t('notification.tower_sold'), {
      font: 'bold 28px Arial',
      color: '#cc0000',
    }).setOrigin(0.5);
    const refundText = this.scene.add.text(0, 20, t('notification.gold_gain', { amount: refund }), {
      font: '22px Arial',
      color: '#ffff00',
    }).setOrigin(0.5);

    notification.add([bg, text, refundText]);
    notification.setDepth(1000);

    this.scene.tweens.add({
      targets: notification,
      alpha: { from: 1, to: 0 },
      y: height / 2 - 50,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => notification.destroy(),
    });
  }

  showResearchUnlocked(researchName: string): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    const notification = this.scene.add.container(width / 2, height / 2);

    const bg = this.scene.add.rectangle(0, 0, 400, 120, 0x000000, 0.9);
    bg.setStrokeStyle(3, 0x9900ff, 1);
    
    const icon = this.scene.add.text(0, -30, '🔬', {
      font: 'bold 40px Arial',
    }).setOrigin(0.5);
    
    const text = this.scene.add.text(0, 10, t('notification.research_unlocked'), {
      font: 'bold 24px Arial',
      color: '#ff00ff',
    }).setOrigin(0.5);
    
    const nameText = this.scene.add.text(0, 40, researchName, {
      font: '20px Arial',
      color: '#ffff00',
    }).setOrigin(0.5);

    notification.add([bg, icon, text, nameText]);
    notification.setDepth(1001);
    notification.setScale(0.5);

    // Animate in
    this.scene.tweens.add({
      targets: notification,
      scale: { from: 0.5, to: 1 },
      duration: 300,
      ease: 'Back.easeOut',
    });

    // Pulse effect
    this.scene.tweens.add({
      targets: bg,
      scaleX: { from: 1, to: 1.05 },
      scaleY: { from: 1, to: 1.05 },
      duration: 800,
      yoyo: true,
      repeat: 2,
    });

    // Fade out
    this.scene.tweens.add({
      targets: notification,
      alpha: { from: 1, to: 0 },
      y: height / 2 - 80,
      delay: 3000,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => notification.destroy(),
    });
  }
}
