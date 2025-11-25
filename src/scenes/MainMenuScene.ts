import { BackgroundEffects } from './components/BackgroundEffects';
import { TitleDisplay } from './components/TitleDisplay';
import { MenuButtons } from './components/MenuButtons';
import { LevelSelection } from './components/LevelSelection';
import { CreditsOverlay } from './components/CreditsOverlay';
import { AuthManager } from '../auth/AuthManager';
import { t } from '@/client/i18n';

export class MainMenuScene extends Phaser.Scene {
  private levelSelection?: LevelSelection;
  private creditsOverlay?: CreditsOverlay;
  private authManager: AuthManager;

  constructor() {
    super({ key: 'MainMenuScene' });
    this.authManager = AuthManager.getInstance();
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Fade in from black
    this.cameras.main.fadeIn(500);

    // Create background effects
    const background = new BackgroundEffects(this);
    background.createGradientBackground(width, height);
    background.createParticles(width, height, 30);

    // Create animated title
    const titleDisplay = new TitleDisplay(this);
    titleDisplay.createAnimatedTitle(width / 2, height / 3, 'OPEN TD', 'Tower Defense');

    // Create menu buttons
    const buttonY = height / 2 + 80;
    const buttonSpacing = 80;

    const menuButtons = new MenuButtons(this);
    const buttons = menuButtons.createMainMenuButtons(
      width / 2,
      buttonY,
      buttonSpacing,
      {
        onSingleplayer: () => this.handleSingleplayer(),
        onMultiplayer: () => this.handleMultiplayer(),
        onOptions: () => this.handleOptions(),
        onCredits: () => this.handleCredits(),
      }
    );

    // Animate buttons entrance
    menuButtons.animateButtonsEntrance(buttons, 800);

    // Instructions with fade in
      const instructions = this.add.text(
      width / 2,
      height - 80,
          t('main.instructions'),
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

    // User info and logout button (top right)
    this.createUserInfo(width);
  }

  private createUserInfo(width: number): void {
    const user = this.authManager.getCurrentUser();
    
    if (user) {
      // User info container
      const userInfoBg = this.add.graphics();
      userInfoBg.fillStyle(0x000000, 0.7);
      userInfoBg.fillRoundedRect(width - 250, 10, 240, 80, 10);
      userInfoBg.lineStyle(2, 0x00aa00, 0.8);
      userInfoBg.strokeRoundedRect(width - 250, 10, 240, 80, 10);

      // Username
      const usernameText = this.add.text(width - 130, 25, user.username, {
        fontSize: '20px',
        fontFamily: 'Arial',
        color: '#00ff00',
        fontStyle: 'bold',
      });
      usernameText.setOrigin(0.5, 0);

      // Level and XP
      const levelText = this.add.text(width - 130, 50, `Level ${user.level} | ${user.xp} XP`, {
        fontSize: '14px',
        color: '#ffffff',
      });
      levelText.setOrigin(0.5, 0);

      // Logout button
      const logoutButton = this.add.text(width - 130, 70, '🚪 ' + t('main.logout'), {
        fontSize: '12px',
        color: '#ff6666',
      });
      logoutButton.setOrigin(0.5, 0);
      logoutButton.setInteractive({ useHandCursor: true });

      logoutButton.on('pointerover', () => {
        logoutButton.setStyle({ color: '#ff0000' });
      });

      logoutButton.on('pointerout', () => {
        logoutButton.setStyle({ color: '#ff6666' });
      });

      logoutButton.on('pointerdown', () => {
        this.authManager.logout();
        this.cameras.main.fadeOut(300);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('LoginScene');
        });
      });
    } else {
      // Guest mode indicator
      const guestText = this.add.text(width - 20, 20, 'Gast-Modus', {
        fontSize: '16px',
        color: '#666666',
      });
      guestText.setOrigin(1, 0);
    }
  }

  private handleSingleplayer(): void {
    this.levelSelection = new LevelSelection(this);
    this.levelSelection.show(
      this.cameras.main.width,
      this.cameras.main.height,
      (levelId: string) => {
        this.cameras.main.fadeOut(300);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('GameScene', { levelType: levelId });
        });
      },
      () => {
        // On back - just close the level selection
      }
    );
  }

  private handleMultiplayer(): void {
    this.cameras.main.fadeOut(500);
    this.time.delayedCall(500, () => {
      this.scene.start('MultiplayerScene');
    });
  }

  private handleOptions(): void {
    this.scene.launch('OptionsScene');
    this.scene.pause();
  }

  private handleCredits(): void {
    this.creditsOverlay = new CreditsOverlay(this);
    this.creditsOverlay.show(
      this.cameras.main.width,
      this.cameras.main.height,
      () => {
        // On close - just hide the credits
      }
    );
  }
}
