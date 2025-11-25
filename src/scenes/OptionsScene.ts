import { ToggleButton } from './components/ToggleButton';
import { DifficultySelector } from './components/DifficultySelector';
import { SettingsManager, GameSettings } from './components/SettingsManager';
import { SoundManager } from '../client/SoundManager';
import { ConfigManager } from '@/client/ConfigManager';
import { AuthManager } from '@/auth/AuthManager';
import { t, getAvailableLanguages, setLanguage, getLanguage } from '@/client/i18n';
import { GridSizer } from './components/GridSizer';

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
    overlay.setDepth(0);

    // Options box
    const boxWidth = 700;
    const boxHeight = 520;
    const box = this.add.rectangle(width / 2, height / 2, boxWidth, boxHeight, 0x1a1a2e);
    box.setStrokeStyle(4, 0x00ff00);
    box.setDepth(1);

    // Title
    const title = this.add.text(width / 2, height / 2 - boxHeight / 2 + 28, t('options.title'), {
      font: 'bold 48px Arial',
      color: '#00ff00',
    });
    title.setOrigin(0.5);

    // layout constants
    const boxCenterX = width / 2;
    const boxCenterY = height / 2;
    const labelX = boxCenterX - 180;
    const controlX = boxCenterX + 140;
    const firstRowY = boxCenterY - 100;
    const rowSpacing = 80; // increase spacing to reduce vertical overlap

    // Prepare a unified UI elements array (no tabs) for fade-in animations
    const uiElements: Phaser.GameObjects.GameObject[] = [];

    // Create a single main GridSizer that fills the options box area
    const mainSizer = new GridSizer(
      boxCenterX,
      boxCenterY + 20,
      boxWidth - 80,
      boxHeight - 120,
      6,
      2
    );

    // Sound toggle in audio container
    const soundLabel = this.add.text(0, 0, t('options.sound'), {
      font: '24px Arial',
      color: '#ffffff',
      wordWrap: { width: boxWidth - 200, useAdvancedWrap: true },
    });
    
    const cfg = ConfigManager.getInstance();
    const effectiveSoundDefault = cfg.isLoaded() ? cfg.isSoundEnabled() : this.settings.soundEnabled;
    const soundToggle = new ToggleButton(
      this,
      0,
      0,
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
    // ensure toggles are above overlay and other UI
    soundToggle.getContainer().setDepth(200);

    // Music toggle (audio)
    const musicLabel = this.add.text(0, 0, t('options.music'), {
      font: '24px Arial',
      color: '#ffffff',
      wordWrap: { width: boxWidth - 200, useAdvancedWrap: true },
    });
    
    const effectiveMusicDefault = cfg.isLoaded() ? cfg.isMusicEnabled() : this.settings.musicEnabled;
    const musicToggle = new ToggleButton(
      this,
      0,
      0,
      effectiveMusicDefault,
      (enabled) => {
        this.settings.musicEnabled = enabled;
        SettingsManager.save(this.settings);
        const ok = soundManager.setMusicEnabled(enabled);
        // Inform UI about music changes; we don't dynamically alter layout — mainSizer handles layout
        if (!ok) {
          musicToggle.setEnabled(false);
          this.settings.musicEnabled = false;
          SettingsManager.save(this.settings);
        }
      }
    );
    musicToggle.getContainer().setDepth(200);

    // Difficulty selection (gameplay)
    const difficultySelector = new DifficultySelector(this, (difficulty: string) => {
      this.settings.difficulty = difficulty;
      SettingsManager.save(this.settings);
      infoText.setText(difficultySelector.getDifficultyInfo());
    });

    const { label: difficultyLabel, buttons: difficultyButtons } = difficultySelector.create(
      boxCenterX,
      boxCenterY - 60,
      this.settings.difficulty
    );

    // Info text (gameplay)
    const infoText = this.add.text(
      boxCenterX,
      boxCenterY + 120,
      difficultySelector.getDifficultyInfo(),
      {
        font: '16px Arial',
        color: '#888888',
        align: 'center',
      }
    );
    infoText.setOrigin(0.5);

    // Close button (global)
    const closeButton = this.add.text(boxCenterX + boxWidth / 2 - 140, boxCenterY + boxHeight / 2 - 48, t('options.back'), {
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

    // Admin button to view error reports (visible only if logged in) - global
    const showAdminButton = this.add.text(boxCenterX - 120, boxCenterY + boxHeight / 2 - 48, t('options.show_reports'), {
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
          alert(t('options.must_login_to_view_reports'));
      }
    });
    

    // Assign elements to respective containers
    // populate uiElements unified
    uiElements.push(soundLabel, soundToggle.getContainer(), musicLabel, musicToggle.getContainer());
    uiElements.push(difficultyLabel, infoText);

    // Global elements
    const globalElements = [overlay, box, title, closeButton, showAdminButton];

    // Fade in animation for global and active group
    const elements = [...globalElements, ...uiElements];
    // Avoid pushing showAdminButton twice (it's already part of globalElements)
    elements.forEach((element, index) => {
      (element as Phaser.GameObjects.Text | Phaser.GameObjects.Container | Phaser.GameObjects.Rectangle).setAlpha(0);
      this.tweens.add({
        targets: element,
        alpha: 1,
        duration: 300,
        delay: index * 30,
      });
      // set depth so UI elements are above overlay
      if (element !== overlay && (element as any).setDepth) {
        // Avoid over-writing depths for elements which may have been set higher (e.g., toggles).
        const existingDepth = (element as any).depth || 0;
        const calculated = 10 + index;
        (element as any).setDepth(Math.max(existingDepth, calculated));
      }
    });

    // Musikstatus initial setzen
    soundManager.init(this, this.settings.soundEnabled, this.settings.musicEnabled);
    if (this.settings.musicEnabled) {
      soundManager.playMusic();
    } else {
      soundManager.stopMusic();
    }

    // Auto-restart toggle (gameplay)
    const restartLabel = this.add.text(0, 0, t('options.auto_restart'), {
      font: '24px Arial',
      color: '#ffffff',
      wordWrap: { width: boxWidth - 200, useAdvancedWrap: true },
    });
    const restartToggle = new ToggleButton(
      this,
      0,
      0,
      Boolean(this.settings.autoRestartOnError),
      (enabled) => {
        this.settings.autoRestartOnError = enabled;
        SettingsManager.save(this.settings);
      }
    );
    restartToggle.getContainer().setDepth(200);
    uiElements.push(restartLabel, restartToggle.getContainer());

    // Language selector + label (audio)
    const languages = getAvailableLanguages();
    const langLabel = this.add.text(0, 0, t('options.language'), { font: '24px Arial', color: '#ffffff', wordWrap: { width: boxWidth - 200, useAdvancedWrap: true } });
    const langButtons: Phaser.GameObjects.Text[] = [];
    let i = 0;
    for (const l of languages) {
      const txt = this.add.text(0, 0, l.label, { font: '18px Arial', color: getLanguage() === l.code ? '#00ff00' : '#ffffff' });
      txt.setInteractive({ useHandCursor: true });
      txt.on('pointerdown', () => {
        setLanguage(l.code as any);
        // Update UI labels in-scene: a quick approach is to reload the scene
        this.scene.restart();
      });
      langButtons.push(txt);
      i += 1;
    }
    // arrange positions of the buttons inside the container
    uiElements.push(langLabel);

    // No tabs - both sizers show their respective controls side-by-side

    // No containers — set initial visibility of grouped elements, keep all visible
    uiElements.forEach((e: any) => e.setVisible(true));

    // Add elements to sizer for layout and then layout them
    mainSizer.clear();
    mainSizer.add(soundLabel, 0, 0);
    mainSizer.add(soundToggle.getContainer(), 0, 1);
    mainSizer.add(musicLabel, 1, 0);
    mainSizer.add(musicToggle.getContainer(), 1, 1);

    // Language label and buttons
    mainSizer.add(langLabel, 2, 0);
    const langContainer = this.add.container(0, 0, langButtons);
    langButtons.forEach((b, idx) => {
      b.setOrigin(0.5);
      b.setPosition(-120 + idx * 90, 0);
    });
    langContainer.setDepth(300);
    mainSizer.add(langContainer, 2, 1);

    // Difficulty label and buttons
    mainSizer.add(difficultyLabel, 3, 0);
    difficultyLabel.setOrigin(0.5);
    difficultyLabel.setPosition(0, 0);
    const diffContainer = this.add.container(0, 0, difficultyButtons);
    difficultyButtons.forEach((b, idx) => {
      b.setOrigin(0.5);
      b.setPosition(-80 + idx * 120, 0);
    });
    diffContainer.setDepth(300);
    mainSizer.add(diffContainer, 3, 1);

    mainSizer.add(infoText, 4, 0);
    mainSizer.add(infoText, 4, 1);
    mainSizer.add(restartLabel, 5, 0);
    mainSizer.add(restartToggle.getContainer(), 5, 1);
    mainSizer.layout();

    // Ensure interactions and depths are enforced after any repositioning by sizers
    // restoring interactive geometry with explicit rectangle to avoid overriding
    soundToggle.getContainer().setInteractive(new Phaser.Geom.Rectangle(-40, -18, 80, 36), Phaser.Geom.Rectangle.Contains);
    musicToggle.getContainer().setInteractive(new Phaser.Geom.Rectangle(-40, -18, 80, 36), Phaser.Geom.Rectangle.Contains);
    restartToggle.getContainer().setInteractive(new Phaser.Geom.Rectangle(-40, -18, 80, 36), Phaser.Geom.Rectangle.Contains);
    soundToggle.getContainer().setDepth(200);
    musicToggle.getContainer().setDepth(200);
    restartToggle.getContainer().setDepth(200);
    // Also ensure difficulty and language buttons are above the overlay
    difficultyButtons.forEach((btn: any) => (btn as Phaser.GameObjects.Text).setDepth(300));
    langButtons.forEach((btn) => btn.setDepth(300));

    // No mask — elements are placed inside the box to avoid overflow
  }

  public static getSettings(): GameSettings {
    return SettingsManager.getSettings();
  }
}
