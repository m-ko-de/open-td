import { NetworkManager } from '../network/NetworkManager';

/**
 * Manages wave synchronization from server
 * Handles wave start, completion, and bonus events
 */
export class WaveSync {
  private networkManager: NetworkManager;
  private onWaveStarted: (wave: number) => void;
  private onWaveCompleted: (wave: number, bonus: number) => void;

  constructor(
    onWaveStarted: (wave: number) => void,
    onWaveCompleted: (wave: number, bonus: number) => void
  ) {
    this.networkManager = NetworkManager.getInstance();
    this.onWaveStarted = onWaveStarted;
    this.onWaveCompleted = onWaveCompleted;
    this.setupListeners();
  }

  private setupListeners(): void {
    this.networkManager.on('game:waveStarted', (wave: number) => {
      this.onWaveStarted(wave);
    });

    this.networkManager.on('game:waveCompleted', (data: { wave: number; bonus: number }) => {
      this.onWaveCompleted(data.wave, data.bonus);
    });

    this.networkManager.on('game:levelUp', (level: number) => {
      console.log(`Level Up! Now level ${level}`);
      // Scene will handle level up notification
    });
  }

  public requestStartWave(): void {
    this.networkManager.startWave();
  }

  public cleanup(): void {
    // Cleanup listeners if needed
  }
}
