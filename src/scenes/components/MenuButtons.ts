/**
 * MenuButtons - Creates and manages menu navigation buttons
 */
export class MenuButtons {
  constructor(private scene: Phaser.Scene) {}

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

    // Hover effects
    button.on('pointerover', () => {
      button.setScale(1.1);
      this.scene.tweens.add({
        targets: button,
        scale: 1.1,
        duration: 200,
        ease: 'Back.easeOut',
      });
    });

    button.on('pointerout', () => {
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
      'Einzelspieler',
      '#00aa00',
      callbacks.onSingleplayer
    );

    const multiplayerButton = this.createButton(
      centerX,
      startY + buttonSpacing,
      'Mehrspieler',
      '#e67e22',
      callbacks.onMultiplayer
    );

    const optionsButton = this.createButton(
      centerX,
      startY + buttonSpacing * 2,
      'Optionen',
      '#0066cc',
      callbacks.onOptions
    );

    const creditsButton = this.createButton(
      centerX,
      startY + buttonSpacing * 3,
      'Credits',
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
