/**
 * CreditsOverlay - Displays credits information
 */
export class CreditsOverlay {
  private elements: Phaser.GameObjects.GameObject[] = [];

  constructor(private scene: Phaser.Scene) {}

  show(width: number, height: number, onClose: () => void): void {
    const centerX = width / 2;
    const centerY = height / 2;

    // Semi-transparent overlay
    const overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.8);
    overlay.setOrigin(0);
    overlay.setInteractive();

    // Credits box
    const creditsBox = this.scene.add.rectangle(centerX, centerY, 500, 300, 0x1a1a2e);
    creditsBox.setStrokeStyle(3, 0x00ff00);

    const creditsTitle = this.scene.add.text(centerX, centerY - 100, 'Credits', {
      font: 'bold 32px Arial',
      color: '#00ff00',
    });
    creditsTitle.setOrigin(0.5);

    const creditsText = this.scene.add.text(
      centerX,
      centerY - 20,
      'Entwickelt mit Phaser 3\n\nGame Engine: Phaser.io\nBuild Tool: Vite\nMobile: Capacitor\n\nEin Open Source Projekt',
      {
        font: '18px Arial',
        color: '#ffffff',
        align: 'center',
      }
    );
    creditsText.setOrigin(0.5);

    const closeButton = this.scene.add.text(centerX, centerY + 110, 'Schließen', {
      font: 'bold 20px Arial',
      color: '#ffffff',
      backgroundColor: '#00aa00',
      padding: { x: 20, y: 8 },
    });
    closeButton.setOrigin(0.5);
    closeButton.setInteractive({ useHandCursor: true });

    closeButton.on('pointerdown', () => {
      this.hide();
      onClose();
    });

    this.elements = [overlay, creditsBox, creditsTitle, creditsText, closeButton];

    // Fade in animation
    this.elements.forEach((obj) => {
      if ('setAlpha' in obj) {
        (obj as any).setAlpha(0);
      }
      this.scene.tweens.add({
        targets: obj,
        alpha: 1,
        duration: 300,
      });
    });
  }

  hide(): void {
    this.elements.forEach((obj) => {
      this.scene.tweens.add({
        targets: obj,
        alpha: 0,
        duration: 300,
        onComplete: () => obj.destroy(),
      });
    });
    this.elements = [];
  }
}
