/**
 * Manages the research button and notification badge
 */
export class ResearchButton {
  private scene: Phaser.Scene;
  private button: Phaser.GameObjects.Text;
  private notificationBadge: Phaser.GameObjects.Graphics;
  private pulseTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, onResearchToggle: () => void) {
    this.scene = scene;
    const width = scene.cameras.main.width;
    const padding = 20;

    this.button = scene.add.text(
      width - padding,
      padding + 95,
      '🔬 Forschung',
      {
        font: 'bold 18px Arial',
        color: '#ffffff',
        backgroundColor: '#9900ff',
        padding: { x: 12, y: 6 },
      }
    );
    this.button.setOrigin(1, 0);
    this.button.setInteractive({ useHandCursor: true });

    this.button.on('pointerover', () => {
      this.button.setStyle({ backgroundColor: '#bb44ff' });
    });

    this.button.on('pointerout', () => {
      this.button.setStyle({ backgroundColor: '#9900ff' });
    });

    this.button.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      this.hidePulse();
      onResearchToggle();
    });

    this.notificationBadge = scene.add.graphics();
    this.notificationBadge.setDepth(100);
    this.notificationBadge.setVisible(false);
  }

  showPulse(): void {
    if (this.pulseTween) {
      this.pulseTween.stop();
    }

    const width = this.scene.cameras.main.width;
    const padding = 20;
    const badgeX = width - padding - 10;
    const badgeY = 108;

    this.notificationBadge.clear();
    this.notificationBadge.fillStyle(0xff0000, 1);
    this.notificationBadge.fillCircle(badgeX, badgeY, 8);
    this.notificationBadge.lineStyle(2, 0xffffff, 1);
    this.notificationBadge.strokeCircle(badgeX, badgeY, 8);
    this.notificationBadge.setVisible(true);

    this.pulseTween = this.scene.tweens.add({
      targets: this.button,
      scaleX: { from: 1, to: 1.1 },
      scaleY: { from: 1, to: 1.1 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.scene.tweens.add({
      targets: this.notificationBadge,
      alpha: { from: 1, to: 0.3 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  hidePulse(): void {
    if (this.pulseTween) {
      this.pulseTween.stop();
      this.pulseTween = undefined;
    }

    this.button.setScale(1);
    this.notificationBadge.setVisible(false);
    this.notificationBadge.clear();
  }

  getButton(): Phaser.GameObjects.Text {
    return this.button;
  }
}
