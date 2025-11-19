export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Fade in from black
    this.cameras.main.fadeIn(500);

    // Animated gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a0a, 0x0a0a0a, 0x162447, 0x1f4068, 1);
    bg.fillRect(0, 0, width, height);

    // Animated background particles
    for (let i = 0; i < 30; i++) {
      const particle = this.add.graphics();
      particle.fillStyle(0x00ff00, 0.1 + Math.random() * 0.2);
      particle.fillCircle(0, 0, Math.random() * 4 + 2);
      particle.x = Math.random() * width;
      particle.y = Math.random() * height;
      
      this.tweens.add({
        targets: particle,
        y: particle.y + Math.random() * 300 - 150,
        x: particle.x + Math.random() * 200 - 100,
        alpha: { from: particle.alpha, to: 0 },
        scale: { from: 1, to: 0 },
        duration: 3000 + Math.random() * 2000,
        repeat: -1,
        delay: Math.random() * 2000,
      });
    }

    // Title with enhanced styling
    const title = this.add.text(width / 2, height / 3 - 20, 'OPEN TD', {
      font: 'bold 80px Arial',
      color: '#00ff00',
    });
    title.setOrigin(0.5);
    title.setStroke('#003300', 10);
    title.setShadow(0, 0, '#00ff00', 20, false, true);
    
    // Title entrance animation
    title.setScale(0);
    title.setAlpha(0);
    this.tweens.add({
      targets: title,
      scale: 1,
      alpha: 1,
      duration: 800,
      ease: 'Back.easeOut',
    });
    
    // Continuous pulse
    this.tweens.add({
      targets: title,
      scale: { from: 1, to: 1.05 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Subtitle with typewriter effect
    const subtitle = this.add.text(width / 2, height / 3 + 70, '', {
      font: '28px Arial',
      color: '#00cc00',
    });
    subtitle.setOrigin(0.5);
    
    const fullText = 'Tower Defense';
    let currentChar = 0;
    this.time.addEvent({
      delay: 100,
      callback: () => {
        if (currentChar < fullText.length) {
          subtitle.setText(fullText.substring(0, currentChar + 1));
          currentChar++;
        }
      },
      repeat: fullText.length - 1,
    });

    // Create buttons
    const buttonY = height / 2 + 80;
    const buttonSpacing = 80;

    const startButton = this.createButton(
      width / 2,
      buttonY,
      'Einzelspieler',
      '#00aa00',
      () => {
        this.showLevelSelection();
      }
    );

    const multiplayerButton = this.createButton(
      width / 2,
      buttonY + buttonSpacing,
      'Mehrspieler',
      '#e67e22',
      () => {
        this.cameras.main.fadeOut(500);
        this.time.delayedCall(500, () => {
          this.scene.start('MultiplayerScene');
        });
      }
    );

    const optionsButton = this.createButton(
      width / 2,
      buttonY + buttonSpacing * 2,
      'Optionen',
      '#0066cc',
      () => {
        this.scene.launch('OptionsScene');
        this.scene.pause();
      }
    );

    const creditsButton = this.createButton(
      width / 2,
      buttonY + buttonSpacing * 3,
      'Credits',
      '#666666',
      () => {
        this.showCredits();
      }
    );

    // Animate buttons entrance
    [startButton, multiplayerButton, optionsButton, creditsButton].forEach((btn, index) => {
      btn.setAlpha(0);
      btn.setY(btn.y + 50);
      this.tweens.add({
        targets: btn,
        alpha: 1,
        y: btn.y - 50,
        duration: 500,
        delay: 800 + index * 150,
        ease: 'Back.easeOut',
      });
    });

    // Instructions with fade in
    const instructions = this.add.text(
      width / 2,
      height - 80,
      '🎮 Platziere strategisch Türme und verteidige deine Basis!',
      {
        font: '18px Arial',
        color: '#888888',
      }
    );
    instructions.setOrigin(0.5);
    instructions.setAlpha(0);
    this.tweens.add({
      targets: instructions,
      alpha: 1,
      duration: 1000,
      delay: 1500,
    });

    // Version info
    const version = this.add.text(width - 10, height - 10, 'v1.0.0', {
      font: '14px Arial',
      color: '#444444',
    });
    version.setOrigin(1, 1);
  }

  private createButton(
    x: number,
    y: number,
    text: string,
    color: string,
    callback: () => void
  ): Phaser.GameObjects.Text {
    const button = this.add.text(x, y, text, {
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
      this.tweens.add({
        targets: button,
        scale: 1.1,
        duration: 200,
        ease: 'Back.easeOut',
      });
    });

    button.on('pointerout', () => {
      this.tweens.add({
        targets: button,
        scale: 1,
        duration: 200,
      });
    });

    button.on('pointerdown', () => {
      this.tweens.add({
        targets: button,
        scale: 0.95,
        duration: 100,
        yoyo: true,
        onComplete: callback,
      });
    });

    return button;
  }

  private showCredits(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Semi-transparent overlay
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8);
    overlay.setOrigin(0);
    overlay.setInteractive();

    // Credits box
    const creditsBox = this.add.rectangle(width / 2, height / 2, 500, 300, 0x1a1a2e);
    creditsBox.setStrokeStyle(3, 0x00ff00);

    const creditsTitle = this.add.text(width / 2, height / 2 - 100, 'Credits', {
      font: 'bold 32px Arial',
      color: '#00ff00',
    });
    creditsTitle.setOrigin(0.5);

    const creditsText = this.add.text(
      width / 2,
      height / 2 - 20,
      'Entwickelt mit Phaser 3\n\nGame Engine: Phaser.io\nBuild Tool: Vite\nMobile: Capacitor\n\nEin Open Source Projekt',
      {
        font: '18px Arial',
        color: '#ffffff',
        align: 'center',
      }
    );
    creditsText.setOrigin(0.5);

    const closeButton = this.add.text(width / 2, height / 2 + 110, 'Schließen', {
      font: 'bold 20px Arial',
      color: '#ffffff',
      backgroundColor: '#00aa00',
      padding: { x: 20, y: 8 },
    });
    closeButton.setOrigin(0.5);
    closeButton.setInteractive({ useHandCursor: true });

    closeButton.on('pointerdown', () => {
      [overlay, creditsBox, creditsTitle, creditsText, closeButton].forEach((obj) => {
        this.tweens.add({
          targets: obj,
          alpha: 0,
          duration: 300,
          onComplete: () => obj.destroy(),
        });
      });
    });

    // Fade in animation
    [overlay, creditsBox, creditsTitle, creditsText, closeButton].forEach((obj) => {
      obj.setAlpha(0);
      this.tweens.add({
        targets: obj,
        alpha: 1,
        duration: 300,
      });
    });
  }

  private showLevelSelection(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Overlay
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8);
    overlay.setOrigin(0);
    overlay.setInteractive();

    // Selection box
    const boxWidth = 700;
    const boxHeight = 400;
    const selectionBox = this.add.rectangle(
      width / 2,
      height / 2,
      boxWidth,
      boxHeight,
      0x1a1a2e
    );
    selectionBox.setStrokeStyle(3, 0x00ff00);

    const title = this.add.text(width / 2, height / 2 - 150, 'Wähle eine Karte', {
      font: 'bold 32px Arial',
      color: '#00ff00',
    });
    title.setOrigin(0.5);

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
    const startX = width / 2 - (levels.length - 1) * buttonSpacing / 2;

    const elements: Phaser.GameObjects.GameObject[] = [overlay, selectionBox, title];

    levels.forEach((level, index) => {
      const x = startX + index * buttonSpacing;
      const y = height / 2 - 20;

      // Level preview box
      const preview = this.add.rectangle(x, y, buttonWidth, 120, 0x2d5016);
      preview.setStrokeStyle(3, parseInt(level.color.replace('#', '0x')));
      preview.setInteractive({ useHandCursor: true });

      // Level name
      const nameText = this.add.text(x, y - 10, level.name, {
        font: 'bold 20px Arial',
        color: level.color,
      });
      nameText.setOrigin(0.5);

      // Level description
      const descText = this.add.text(x, y + 20, level.description, {
        font: '14px Arial',
        color: '#cccccc',
        align: 'center',
        wordWrap: { width: buttonWidth - 20 },
      });
      descText.setOrigin(0.5);

      // Hover effects
      preview.on('pointerover', () => {
        preview.setFillStyle(0x3d6026);
        this.tweens.add({
          targets: preview,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 200,
        });
      });

      preview.on('pointerout', () => {
        preview.setFillStyle(0x2d5016);
        this.tweens.add({
          targets: preview,
          scaleX: 1,
          scaleY: 1,
          duration: 200,
        });
      });

      // Start game with selected level
      preview.on('pointerdown', () => {
        this.cameras.main.fadeOut(300);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('GameScene', { levelType: level.id });
        });
      });

      elements.push(preview, nameText, descText);
    });

    // Back button
    const backButton = this.add.text(width / 2, height / 2 + 140, 'Zurück', {
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
      elements.forEach((obj) => {
        this.tweens.add({
          targets: obj,
          alpha: 0,
          duration: 300,
          onComplete: () => obj.destroy(),
        });
      });
      this.tweens.add({
        targets: backButton,
        alpha: 0,
        duration: 300,
        onComplete: () => backButton.destroy(),
      });
    });

    elements.push(backButton);

    // Fade in animation
    elements.forEach((obj, index) => {
      if ('setAlpha' in obj) {
        (obj as any).setAlpha(0);
      }
      this.tweens.add({
        targets: obj,
        alpha: 1,
        duration: 300,
        delay: index * 30,
      });
    });
  }
}
