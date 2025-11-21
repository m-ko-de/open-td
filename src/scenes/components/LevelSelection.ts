import { MapRegistry } from '../../game/MapRegistry';

/**
 * LevelSelection - Displays level selection overlay
 */
export class LevelSelection {
  private elements: Phaser.GameObjects.GameObject[] = [];
  private mapRegistry: MapRegistry;

  constructor(private scene: Phaser.Scene) {
    this.mapRegistry = MapRegistry.getInstance();
  }

  show(width: number, height: number, onLevelSelect: (levelId: string) => void, onBack: () => void): void {
    const centerX = width / 2;
    const centerY = height / 2;

    // Overlay
    const overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.8);
    overlay.setOrigin(0);
    overlay.setInteractive();

    // Get all available maps
    const availableMaps = this.mapRegistry.getAllMaps();
    
    // Adjust box size based on number of maps
    const boxWidth = Math.min(700, 200 + availableMaps.length * 220);
    const boxHeight = 400;
    
    // Selection box
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

    // Generate level buttons dynamically from loaded maps
    const levels = availableMaps.map((map, index) => {
      // Assign colors based on index
      const colors = ['#0088ff', '#ff8800', '#8800ff', '#00ff88', '#ff0088', '#88ff00'];
      return {
        id: map.id,
        name: map.config.name,
        description: map.config.description,
        color: colors[index % colors.length]
      };
    });

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
