/**
 * Manages game control buttons (pause, auto-wave, wave start)
 */
export class ControlButtons {
  private startButton: Phaser.GameObjects.Text;
  private pauseButton: Phaser.GameObjects.Text;
  private autoWaveButton: Phaser.GameObjects.Text;
  private isPaused: boolean = false;
  private autoWaveEnabled: boolean = false;

  constructor(
    scene: Phaser.Scene,
    onStartWave: () => void,
    onPauseToggle: () => void,
    onAutoWaveToggle: () => void
  ) {
    const width = scene.cameras.main.width;
    const height = scene.cameras.main.height;
    const padding = 20;

    // Start button
    this.startButton = scene.add.text(
      width / 2,
      height / 2,
      'Welle Starten',
      {
        font: 'bold 32px Arial',
        color: '#ffffff',
        backgroundColor: '#00aa00',
        padding: { x: 30, y: 15 },
      }
    );
    this.startButton.setOrigin(0.5);
    this.startButton.setInteractive({ useHandCursor: true });

    this.startButton.on('pointerover', () => {
      this.startButton.setStyle({ backgroundColor: '#00ff00' });
    });

    this.startButton.on('pointerout', () => {
      this.startButton.setStyle({ backgroundColor: '#00aa00' });
    });

    this.startButton.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      onStartWave();
    });

    // Pause button
    this.pauseButton = scene.add.text(
      width - padding,
      padding,
      '⏸ Pause',
      {
        font: 'bold 20px Arial',
        color: '#ffffff',
        backgroundColor: '#666666',
        padding: { x: 15, y: 8 },
      }
    );
    this.pauseButton.setOrigin(1, 0);
    this.pauseButton.setInteractive({ useHandCursor: true });

    this.pauseButton.on('pointerover', () => {
      this.pauseButton.setStyle({ backgroundColor: '#888888' });
    });

    this.pauseButton.on('pointerout', () => {
      const bgColor = this.isPaused ? '#ff6600' : '#666666';
      this.pauseButton.setStyle({ backgroundColor: bgColor });
    });

    this.pauseButton.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      onPauseToggle();
    });

    // Auto-Wave button
    this.autoWaveButton = scene.add.text(
      width - padding,
      padding + 45,
      '⚡ Auto-Welle: AUS',
      {
        font: 'bold 18px Arial',
        color: '#ffffff',
        backgroundColor: '#444444',
        padding: { x: 12, y: 6 },
      }
    );
    this.autoWaveButton.setOrigin(1, 0);
    this.autoWaveButton.setInteractive({ useHandCursor: true });

    this.autoWaveButton.on('pointerover', () => {
      this.autoWaveButton.setStyle({ backgroundColor: '#666666' });
    });

    this.autoWaveButton.on('pointerout', () => {
      const bgColor = this.autoWaveEnabled ? '#00aa00' : '#444444';
      this.autoWaveButton.setStyle({ backgroundColor: bgColor });
    });

    this.autoWaveButton.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      onAutoWaveToggle();
    });
  }

  showStartButton(text: string = 'Welle Starten'): void {
    this.startButton.setText(text);
    this.startButton.setVisible(true);
    this.startButton.setInteractive({ useHandCursor: true });
  }

  hideStartButton(): void {
    this.startButton.setVisible(false);
    this.startButton.disableInteractive();
  }

  setPaused(paused: boolean): void {
    this.isPaused = paused;
    this.pauseButton.setText(paused ? '▶ Weiter' : '⏸ Pause');
    this.pauseButton.setStyle({ backgroundColor: paused ? '#ff6600' : '#666666' });
  }

  setAutoWave(enabled: boolean): void {
    this.autoWaveEnabled = enabled;
    this.autoWaveButton.setText(enabled ? '⚡ Auto-Welle: AN' : '⚡ Auto-Welle: AUS');
    this.autoWaveButton.setStyle({ backgroundColor: enabled ? '#00aa00' : '#444444' });
  }

  getButtons(): Phaser.GameObjects.Text[] {
    return [this.startButton, this.pauseButton, this.autoWaveButton];
  }
}
