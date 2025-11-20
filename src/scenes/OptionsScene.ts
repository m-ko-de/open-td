import { ToggleButton } from './components/ToggleButton';
import { DifficultySelector } from './components/DifficultySelector';
import { SettingsManager, GameSettings } from './components/SettingsManager';

export class OptionsScene extends Phaser.Scene {
  private settings: GameSettings;

  constructor() {
    super({ key: 'OptionsScene' });
    this.settings = SettingsManager.load();
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

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
    
    const soundToggle = new ToggleButton(
      this,
      width / 2 + 100,
      height / 2 - 100,
      this.settings.soundEnabled,
      (enabled) => {
        this.settings.soundEnabled = enabled;
        SettingsManager.save(this.settings);
      }
    );

    // Music toggle
    const musicLabel = this.add.text(width / 2 - 150, height / 2 - 30, 'Musik:', {
      font: '24px Arial',
      color: '#ffffff',
    });
    
    const musicToggle = new ToggleButton(
      this,
      width / 2 + 100,
      height / 2 - 30,
      this.settings.musicEnabled,
      (enabled) => {
        this.settings.musicEnabled = enabled;
        SettingsManager.save(this.settings);
      }
    );

    // Difficulty selection
    const difficultySelector = new DifficultySelector(this, (difficulty: string) => {
      this.settings.difficulty = difficulty;
      SettingsManager.save(this.settings);
      infoText.setText(difficultySelector.getDifficultyInfo());
    });

    const { label: difficultyLabel, buttons: difficultyButtons } = difficultySelector.create(
      width / 2,
      height / 2,
      this.settings.difficulty
    );

    // Info text
    const infoText = this.add.text(
      width / 2,
      height / 2 + 150,
      difficultySelector.getDifficultyInfo(),
      {
        font: '16px Arial',
        color: '#888888',
        align: 'center',
      }
    );
    infoText.setOrigin(0.5);

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
      soundToggle.getContainer(),
      musicLabel,
      musicToggle.getContainer(),
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

  public static getSettings(): GameSettings {
    return SettingsManager.getSettings();
  }
}
