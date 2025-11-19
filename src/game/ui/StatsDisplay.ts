/**
 * Displays game statistics (gold, lives, wave, XP, level)
 */
export class StatsDisplay {
  private scene: Phaser.Scene;
  private goldText: Phaser.GameObjects.Text;
  private livesText: Phaser.GameObjects.Text;
  private waveText: Phaser.GameObjects.Text;
  private xpText: Phaser.GameObjects.Text;
  private levelText: Phaser.GameObjects.Text;
  private roomCodeText?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, gold: number, lives: number, wave: number, level: number, xp: number, xpForNext: number) {
    this.scene = scene;
    const padding = 20;

    this.goldText = scene.add.text(padding, padding, `Gold: ${gold}`, {
      font: '24px Arial',
      color: '#ffd700',
    });

    this.livesText = scene.add.text(padding, padding + 35, `Leben: ${lives}`, {
      font: '24px Arial',
      color: '#ff0000',
    });

    this.waveText = scene.add.text(padding, padding + 70, `Welle: ${wave}`, {
      font: '24px Arial',
      color: '#00ff00',
    });

    this.levelText = scene.add.text(padding, padding + 105, `Level: ${level}`, {
      font: '20px Arial',
      color: '#00ffff',
    });

    this.xpText = scene.add.text(padding, padding + 135, `XP: ${xp}/${xpForNext}`, {
      font: '18px Arial',
      color: '#aaffff',
    });
  }

  updateGold(gold: number): void {
    this.goldText.setText(`Gold: ${gold}`);
  }

  updateLives(lives: number): void {
    this.livesText.setText(`Leben: ${lives}`);
  }

  updateWave(wave: number): void {
    this.waveText.setText(`Welle: ${wave}`);
  }

  updateXP(xp: number, level: number, xpForNext: number): void {
    this.levelText.setText(`Level: ${level}`);
    this.xpText.setText(`XP: ${xp}/${xpForNext}`);
  }

  showRoomCode(roomCode: string): void {
    const width = this.scene.cameras.main.width;
    const padding = 20;

    this.roomCodeText = this.scene.add.text(
      width - padding,
      padding + 140,
      `🎮 Raum: ${roomCode}`,
      {
        font: 'bold 20px Arial',
        color: '#ffffff',
        backgroundColor: '#4a90e2',
        padding: { x: 12, y: 8 },
      }
    );
    this.roomCodeText.setOrigin(1, 0);
    this.roomCodeText.setInteractive({ useHandCursor: true });

    this.roomCodeText.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      navigator.clipboard.writeText(roomCode).then(() => {
        const originalText = this.roomCodeText!.text;
        this.roomCodeText!.setText('✓ Kopiert!');
        this.roomCodeText!.setStyle({ backgroundColor: '#00aa00' });
        
        this.scene.time.delayedCall(1500, () => {
          if (this.roomCodeText) {
            this.roomCodeText.setText(originalText);
            this.roomCodeText.setStyle({ backgroundColor: '#4a90e2' });
          }
        });
      });
    });

    this.roomCodeText.on('pointerover', () => {
      this.roomCodeText!.setStyle({ backgroundColor: '#5aa0f2' });
    });

    this.roomCodeText.on('pointerout', () => {
      this.roomCodeText!.setStyle({ backgroundColor: '#4a90e2' });
    });
  }

  hideRoomCode(): void {
    if (this.roomCodeText) {
      this.roomCodeText.destroy();
      this.roomCodeText = undefined;
    }
  }
}
