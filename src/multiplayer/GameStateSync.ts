import { NetworkManager } from '../network/NetworkManager';
import { GameStateData } from '../server/types';

/**
 * Handles synchronization of game state from server to client
 * Responsible for updating local game objects based on server state
 */
export class GameStateSync {
  private scene: Phaser.Scene;
  private networkManager: NetworkManager;
  private onStateUpdate: (state: GameStateData) => void;

  constructor(scene: Phaser.Scene, onStateUpdate: (state: GameStateData) => void) {
    this.scene = scene;
    this.networkManager = NetworkManager.getInstance();
    this.onStateUpdate = onStateUpdate;
    this.setupListeners();
  }

  private setupListeners(): void {
    this.networkManager.on('game:stateUpdate', (state: GameStateData) => {
      this.handleStateUpdate(state);
    });

    this.networkManager.on('game:over', (won: boolean) => {
      this.handleGameOver(won);
    });
  }

  private handleStateUpdate(state: GameStateData): void {
    this.onStateUpdate(state);
  }

  private handleGameOver(won: boolean): void {
    console.log(`Game Over! ${won ? 'Victory!' : 'Defeat!'}`);
    // Scene will handle game over UI
    this.scene.events.emit('gameOver', won);
  }

  public cleanup(): void {
    // Remove all listeners when done
    this.networkManager.off('game:stateUpdate', this.handleStateUpdate);
    this.networkManager.off('game:over', this.handleGameOver);
  }
}
