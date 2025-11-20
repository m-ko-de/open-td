import { BackgroundEffects } from './components/BackgroundEffects';
import { TitleDisplay } from './components/TitleDisplay';
import { MenuButtons } from './components/MenuButtons';
import { LevelSelection } from './components/LevelSelection';
import { CreditsOverlay } from './components/CreditsOverlay';

export class MainMenuScene extends Phaser.Scene {
  private levelSelection?: LevelSelection;
  private creditsOverlay?: CreditsOverlay;

  constructor() {
    super({ key: 'MainMenuScene' });
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
