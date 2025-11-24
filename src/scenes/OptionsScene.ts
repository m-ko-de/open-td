import { ToggleButton } from './components/ToggleButton';
import { DifficultySelector } from './components/DifficultySelector';
import { SettingsManager, GameSettings } from './components/SettingsManager';
import { SoundManager } from '../client/SoundManager';
import { ConfigManager } from '@/client/ConfigManager';
import { AuthManager } from '@/auth/AuthManager';

export class OptionsScene extends Phaser.Scene {
  private settings: GameSettings;
  private auth: AuthManager;

  constructor() {
    super({ key: 'OptionsScene' });
    this.settings = SettingsManager.load();
    this.auth = AuthManager.getInstance();
  }

  create(): void {
    // SoundManager initialisieren
    const soundManager = SoundManager.getInstance();
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
    
    const cfg = ConfigManager.getInstance();
    const effectiveSoundDefault = cfg.isLoaded() ? cfg.isSoundEnabled() : this.settings.soundEnabled;
    const soundToggle = new ToggleButton(
      this,
      width / 2 + 100,
      height / 2 - 100,
      effectiveSoundDefault,
      (enabled) => {
        // Persist user preference (UI/Settings), but the SoundManager may refuse to enable if config blocks it
        this.settings.soundEnabled = enabled;
        SettingsManager.save(this.settings);
        const ok = soundManager.setSoundEnabled(enabled);
        if (!ok) {
          // Revert toggle visually if global config prevents enabling
          soundToggle.setEnabled(false);
          this.settings.soundEnabled = false;
          SettingsManager.save(this.settings);
        } else if (enabled) {
          soundManager.playClick();
        }
      }
    );

    // Music toggle
    const musicLabel = this.add.text(width / 2 - 150, height / 2 - 30, 'Musik:', {
      font: '24px Arial',
      color: '#ffffff',
    });
    
    const effectiveMusicDefault = cfg.isLoaded() ? cfg.isMusicEnabled() : this.settings.musicEnabled;
    const musicToggle = new ToggleButton(
      this,
      width / 2 + 100,
      height / 2 - 30,
      effectiveMusicDefault,
      (enabled) => {
        this.settings.musicEnabled = enabled;
        SettingsManager.save(this.settings);
        const ok = soundManager.setMusicEnabled(enabled);
        if (!ok) {
          musicToggle.setEnabled(false);
          this.settings.musicEnabled = false;
          SettingsManager.save(this.settings);
        }
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

    // Admin button to view error reports (visible only if logged in)
    const showAdminButton = this.add.text(width / 2, height / 2 + 240, 'Fehlerberichte anzeigen', {
      font: 'bold 18px Arial',
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 8, y: 8 },
    });
    showAdminButton.setOrigin(0.5);
    showAdminButton.setInteractive({ useHandCursor: true });
    showAdminButton.on('pointerdown', () => {
      if (this.auth.isLoggedIn()) {
        // Open admin scene
        this.scene.launch('AdminScene');
        this.scene.pause();
      } else {
        // Not logged in
        alert('Bitte einloggen, um Fehlerberichte anzuzeigen.');
      }
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
    elements.push(showAdminButton);
    elements.forEach((element, index) => {
      element.setAlpha(0);
      this.tweens.add({
        targets: element,
        alpha: 1,
        duration: 300,
        delay: index * 30,
      });
    });

    // Musikstatus initial setzen
    soundManager.init(this, this.settings.soundEnabled, this.settings.musicEnabled);
    if (this.settings.musicEnabled) {
      soundManager.playMusic();
    } else {
      soundManager.stopMusic();
    }

    // Auto-restart toggle
    const restartLabel = this.add.text(width / 2 - 150, height / 2 + 60, 'Auto-Restart bei Fehlern:', {
      font: '24px Arial',
      color: '#ffffff',
    });
    const restartToggle = new ToggleButton(
      this,
      width / 2 + 100,
      height / 2 + 60,
      Boolean(this.settings.autoRestartOnError),
      (enabled) => {
        this.settings.autoRestartOnError = enabled;
        SettingsManager.save(this.settings);
      }
    );
    elements.splice(elements.length - 1, 0, restartLabel, restartToggle.getContainer());
  }

  public static getSettings(): GameSettings {
    return SettingsManager.getSettings();
  }
}
