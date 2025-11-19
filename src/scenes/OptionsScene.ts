export class OptionsScene extends Phaser.Scene {
  private settings = {
    soundEnabled: true,
    musicEnabled: true,
    difficulty: 'normal', // easy, normal, hard
  };

  constructor() {
    super({ key: 'OptionsScene' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Load saved settings
    this.loadSettings();

    // Semi-transparent overlay
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.85);
    overlay.setOrigin(0);
    overlay.setInteractive();

    // Options box
    const boxWidth = 600;
    const boxHeight = 500;
    const box = this.add.rectangle(width / 2, height / 2, boxWidth, boxHeight, 0x1a1a2e);
    box.setStrokeStyle(4, 0x00ff00);

    // Title
    const title = this.add.text(width / 2, height / 2 - 200, 'Optionen', {
      font: 'bold 48px Arial',
      color: '#00ff00',
    });
    title.setOrigin(0.5);

    // Sound toggle
    const soundLabel = this.add.text(width / 2 - 150, height / 2 - 100, 'Sound:', {
      font: '24px Arial',
      color: '#ffffff',
    });
    
    const soundToggle = this.createToggleButton(
      width / 2 + 100,
      height / 2 - 100,
      this.settings.soundEnabled,
      (enabled) => {
        this.settings.soundEnabled = enabled;
        this.saveSettings();
      }
    );

    // Music toggle
    const musicLabel = this.add.text(width / 2 - 150, height / 2 - 30, 'Musik:', {
      font: '24px Arial',
      color: '#ffffff',
    });
    
    const musicToggle = this.createToggleButton(
      width / 2 + 100,
      height / 2 - 30,
      this.settings.musicEnabled,
      (enabled) => {
        this.settings.musicEnabled = enabled;
        this.saveSettings();
      }
    );

    // Difficulty selection
    const difficultyLabel = this.add.text(width / 2 - 150, height / 2 + 50, 'Schwierigkeit:', {
      font: '24px Arial',
      color: '#ffffff',
    });

    const difficulties = [
      { value: 'easy', label: 'Leicht', color: 0x00aa00 },
      { value: 'normal', label: 'Normal', color: 0x0066cc },
      { value: 'hard', label: 'Schwer', color: 0xcc0000 },
    ];

    const difficultyButtons: Phaser.GameObjects.Text[] = [];
    difficulties.forEach((diff, index) => {
      const button = this.add.text(
        width / 2 - 120 + index * 120,
        height / 2 + 100,
        diff.label,
        {
          font: '20px Arial',
          color: '#ffffff',
          backgroundColor: this.settings.difficulty === diff.value ? `#${diff.color.toString(16).padStart(6, '0')}` : '#333333',
          padding: { x: 15, y: 8 },
        }
      );
      button.setOrigin(0.5);
      button.setInteractive({ useHandCursor: true });

      button.on('pointerover', () => {
        if (this.settings.difficulty !== diff.value) {
          button.setStyle({ backgroundColor: '#555555' });
        }
      });

      button.on('pointerout', () => {
        if (this.settings.difficulty !== diff.value) {
          button.setStyle({ backgroundColor: '#333333' });
        }
      });

      button.on('pointerdown', () => {
        this.settings.difficulty = diff.value;
        this.saveSettings();
        
        // Update all buttons
        difficultyButtons.forEach((btn, i) => {
          const d = difficulties[i];
          btn.setStyle({
            backgroundColor: this.settings.difficulty === d.value ? `#${d.color.toString(16).padStart(6, '0')}` : '#333333',
          });
        });
      });

      difficultyButtons.push(button);
    });

    // Info text
    const infoText = this.add.text(
      width / 2,
      height / 2 + 150,
      this.getDifficultyInfo(),
      {
        font: '16px Arial',
        color: '#888888',
        align: 'center',
      }
    );
    infoText.setOrigin(0.5);

    // Update info text when difficulty changes
    const updateInfo = () => {
      infoText.setText(this.getDifficultyInfo());
    };
    difficultyButtons.forEach((btn) => {
      btn.on('pointerdown', updateInfo);
    });

    // Close button
    const closeButton = this.add.text(width / 2, height / 2 + 200, 'Zurück', {
      font: 'bold 24px Arial',
      color: '#ffffff',
      backgroundColor: '#00aa00',
      padding: { x: 30, y: 10 },
    });
    closeButton.setOrigin(0.5);
    closeButton.setInteractive({ useHandCursor: true });

    closeButton.on('pointerover', () => {
      closeButton.setScale(1.1);
    });

    closeButton.on('pointerout', () => {
      closeButton.setScale(1);
    });

    closeButton.on('pointerdown', () => {
      this.scene.resume('MainMenuScene');
      this.scene.stop();
    });

    // Fade in animation
    const elements = [
      overlay,
      box,
      title,
      soundLabel,
      soundToggle,
      musicLabel,
      musicToggle,
      difficultyLabel,
      ...difficultyButtons,
      infoText,
      closeButton,
    ];

    elements.forEach((element, index) => {
      element.setAlpha(0);
      this.tweens.add({
        targets: element,
        alpha: 1,
        duration: 300,
        delay: index * 30,
      });
    });
  }

  private createToggleButton(
    x: number,
    y: number,
    initialState: boolean,
    onChange: (enabled: boolean) => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Background
    const bg = this.add.rectangle(0, 0, 80, 36, initialState ? 0x00aa00 : 0x666666);
    bg.setStrokeStyle(2, 0xffffff, 0.5);

    // Toggle circle
    const toggle = this.add.circle(initialState ? 20 : -20, 0, 14, 0xffffff);

    // Label
    const label = this.add.text(0, 0, initialState ? 'AN' : 'AUS', {
      font: 'bold 16px Arial',
      color: '#000000',
    });
    label.setOrigin(0.5);

    container.add([bg, toggle, label]);
    container.setSize(80, 36);
    container.setInteractive(
      new Phaser.Geom.Rectangle(-40, -18, 80, 36),
      Phaser.Geom.Rectangle.Contains
    );

    let enabled = initialState;

    container.on('pointerdown', () => {
      enabled = !enabled;

      // Animate background color
      bg.setFillStyle(enabled ? 0x00aa00 : 0x666666);

      // Animate toggle position
      this.tweens.add({
        targets: toggle,
        x: enabled ? 20 : -20,
        duration: 300,
        ease: 'Back.easeOut',
      });

      // Update label
      label.setText(enabled ? 'AN' : 'AUS');

      onChange(enabled);
    });

    return container;
  }

  private getDifficultyInfo(): string {
    switch (this.settings.difficulty) {
      case 'easy':
        return 'Weniger Gegner, mehr Startgold';
      case 'normal':
        return 'Ausbalanciertes Spielerlebnis';
      case 'hard':
        return 'Mehr Gegner, weniger Ressourcen';
      default:
        return '';
    }
  }

  private saveSettings(): void {
    localStorage.setItem('openTD_settings', JSON.stringify(this.settings));
  }

  private loadSettings(): void {
    const saved = localStorage.getItem('openTD_settings');
    if (saved) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  }

  public static getSettings(): { soundEnabled: boolean; musicEnabled: boolean; difficulty: string } {
    const saved = localStorage.getItem('openTD_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
    return {
      soundEnabled: true,
      musicEnabled: true,
      difficulty: 'normal',
    };
  }
}
