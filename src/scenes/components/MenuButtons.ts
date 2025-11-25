/**
 * MenuButtons - Creates and manages menu navigation buttons
 */
import { t } from '@/client/i18n';

export class MenuButtons {
  constructor(private scene: Phaser.Scene) {}

  /**
   * Lighten a hex color by percentage
   */
  private lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, ((num >> 16) & 0xff) + amt);
    const G = Math.min(255, ((num >> 8) & 0xff) + amt);
    const B = Math.min(255, (num & 0xff) + amt);
    return '#' + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1);
  }

  createButton(
    x: number,
    y: number,
    text: string,
    color: string,
    callback: () => void
  ): Phaser.GameObjects.Text {
    const button = this.scene.add.text(x, y, text, {
      font: 'bold 28px Arial',
      color: '#ffffff',
      backgroundColor: color,
      padding: { x: 30, y: 12 },
    });
    button.setOrigin(0.5);
    button.setInteractive({ useHandCursor: true });

    // Hover effects with glow
    button.on('pointerover', () => {
      button.setScale(1.1);
      button.setStyle({ 
        backgroundColor: this.lightenColor(color, 30),
        shadow: { blur: 15, color: color, fill: true }
      });
      this.scene.tweens.add({
        targets: button,
        scale: 1.1,
        duration: 200,
        ease: 'Back.easeOut',
      });
    });

    button.on('pointerout', () => {
      button.setStyle({ 
        backgroundColor: color,
        shadow: { blur: 0, color: '#000000', fill: false }
      });
      this.scene.tweens.add({
        targets: button,
        scale: 1,
        duration: 200,
      });
    });

    button.on('pointerdown', () => {
      this.scene.tweens.add({
        targets: button,
        scale: 0.95,
        duration: 100,
        yoyo: true,
        onComplete: callback,
      });
    });

    return button;
  }

  createMainMenuButtons(
    centerX: number,
    startY: number,
    buttonSpacing: number,
    callbacks: {
      onSingleplayer: () => void;
      onMultiplayer: () => void;
      onOptions: () => void;
      onCredits: () => void;
    }
  ): Phaser.GameObjects.Text[] {
    const startButton = this.createButton(
      centerX,
      startY,
      t('menu.singleplayer'),
      '#00aa00',
      callbacks.onSingleplayer
    );

    const multiplayerButton = this.createButton(
      centerX,
      startY + buttonSpacing,
      t('menu.multiplayer'),
      '#e67e22',
      callbacks.onMultiplayer
    );

    const optionsButton = this.createButton(
      centerX,
      startY + buttonSpacing * 2,
      t('menu.options'),
      '#0066cc',
      callbacks.onOptions
    );

    const creditsButton = this.createButton(
      centerX,
      startY + buttonSpacing * 3,
      t('menu.credits'),
      '#666666',
      callbacks.onCredits
    );

    return [startButton, multiplayerButton, optionsButton, creditsButton];
  }

  animateButtonsEntrance(buttons: Phaser.GameObjects.Text[], baseDelay: number = 800): void {
    buttons.forEach((btn, index) => {
      btn.setAlpha(0);
      btn.setY(btn.y + 50);
      this.scene.tweens.add({
        targets: btn,
        alpha: 1,
        y: btn.y - 50,
        duration: 500,
        delay: baseDelay + index * 150,
        ease: 'Back.easeOut',
      });
    });
  }
}
