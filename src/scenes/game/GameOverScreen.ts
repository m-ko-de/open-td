/**
 * GameOverScreen - Handles game over display
 */
import { t } from '@/client/i18n';

export class GameOverScreen {
  constructor(private scene: Phaser.Scene) {}

  show(wave: number, onRestart: () => void): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0);

    const gameOverText = this.scene.add.text(width / 2, height / 2 - 50, t('game.game_over'), {
      font: 'bold 64px Arial',
      color: '#ff0000',
    });
    gameOverText.setOrigin(0.5);

    const finalWaveText = this.scene.add.text(
      width / 2,
      height / 2 + 20,
      t('game.final_wave', { wave }),
      {
        font: '32px Arial',
        color: '#ffffff',
      }
    );
    finalWaveText.setOrigin(0.5);

    const restartButton = this.scene.add.text(width / 2, height / 2 + 100, t('menu.restart'), {
      font: '28px Arial',
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 20, y: 10 },
    });
    restartButton.setOrigin(0.5);
    restartButton.setInteractive({ useHandCursor: true });

    restartButton.on('pointerover', () => {
      restartButton.setStyle({ backgroundColor: '#555555' });
    });

    restartButton.on('pointerout', () => {
      restartButton.setStyle({ backgroundColor: '#333333' });
    });

    restartButton.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      onRestart();
    });
  }
}
