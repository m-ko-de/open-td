/**
 * LevelSelection - Displays level selection overlay
 */
export class LevelSelection {
  private elements: Phaser.GameObjects.GameObject[] = [];

  constructor(private scene: Phaser.Scene) {}

  show(width: number, height: number, onLevelSelect: (levelId: string) => void, onBack: () => void): void {
    const centerX = width / 2;
    const centerY = height / 2;

    // Overlay
    const overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.8);
    overlay.setOrigin(0);
    overlay.setInteractive();

    // Selection box
    const boxWidth = 700;
    const boxHeight = 400;
    const selectionBox = this.scene.add.rectangle(
      centerX,
      centerY,
      boxWidth,
      boxHeight,
      0x1a1a2e
    );
    selectionBox.setStrokeStyle(3, 0x00ff00);

    const title = this.scene.add.text(centerX, centerY - 150, 'Wähle eine Karte', {
      font: 'bold 32px Arial',
      color: '#00ff00',
    });
    title.setOrigin(0.5);

    this.elements = [overlay, selectionBox, title];

    // Level buttons
    const levels = [
      { 
        id: 'classic', 
        name: 'Klassisch', 
        description: 'Einfacher Pfad mit Kurven',
        color: '#0088ff'
      },
      { 
        id: 'spiral', 
        name: 'Spirale', 
        description: 'Von außen nach innen',
        color: '#ff8800'
      },
      { 
        id: 'zigzag', 
        name: 'Zickzack', 
        description: 'Auf und ab',
        color: '#8800ff'
      },
    ];

    const buttonWidth = 180;
    const buttonSpacing = 220;
    const startX = centerX - (levels.length - 1) * buttonSpacing / 2;

    levels.forEach((level, index) => {
      const x = startX + index * buttonSpacing;
      const y = centerY - 20;

      // Level preview box
      const preview = this.scene.add.rectangle(x, y, buttonWidth, 120, 0x2d5016);
      preview.setStrokeStyle(3, parseInt(level.color.replace('#', '0x')));
      preview.setInteractive({ useHandCursor: true });

      // Level name
      const nameText = this.scene.add.text(x, y - 10, level.name, {
        font: 'bold 20px Arial',
        color: level.color,
      });
      nameText.setOrigin(0.5);

      // Level description
      const descText = this.scene.add.text(x, y + 20, level.description, {
        font: '14px Arial',
        color: '#cccccc',
        align: 'center',
        wordWrap: { width: buttonWidth - 20 },
      });
      descText.setOrigin(0.5);

      // Hover effects
      preview.on('pointerover', () => {
        preview.setFillStyle(0x3d6026);
        this.scene.tweens.add({
          targets: preview,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 200,
        });
      });

      preview.on('pointerout', () => {
        preview.setFillStyle(0x2d5016);
        this.scene.tweens.add({
          targets: preview,
          scaleX: 1,
          scaleY: 1,
          duration: 200,
        });
      });

      // Start game with selected level
      preview.on('pointerdown', () => {
        onLevelSelect(level.id);
      });

      this.elements.push(preview, nameText, descText);
    });

    // Back button
    const backButton = this.scene.add.text(centerX, centerY + 140, 'Zurück', {
      font: 'bold 20px Arial',
      color: '#ffffff',
      backgroundColor: '#666666',
      padding: { x: 20, y: 8 },
    });
    backButton.setOrigin(0.5);
    backButton.setInteractive({ useHandCursor: true });

    backButton.on('pointerover', () => {
      backButton.setStyle({ backgroundColor: '#888888' });
    });

    backButton.on('pointerout', () => {
      backButton.setStyle({ backgroundColor: '#666666' });
    });

    backButton.on('pointerdown', () => {
      this.hide();
      onBack();
    });

    this.elements.push(backButton);

    // Fade in animation
    this.elements.forEach((obj, index) => {
      if ('setAlpha' in obj) {
        (obj as any).setAlpha(0);
      }
      this.scene.tweens.add({
        targets: obj,
        alpha: 1,
        duration: 300,
        delay: index * 30,
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
