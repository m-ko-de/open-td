import { NetworkManager } from '../network/NetworkManager';
import { EnemyData } from '../server/types';

/**
 * Manages enemy synchronization from server
 * Handles enemy spawning, movement, and death events
 */
export class EnemySync {
  private networkManager: NetworkManager;
  private onEnemySpawned: (enemy: EnemyData) => void;
  private onEnemyDied: (enemyId: string, gold: number, xp: number) => void;

  constructor(
    onEnemySpawned: (enemy: EnemyData) => void,
    onEnemyDied: (enemyId: string, gold: number, xp: number) => void
  ) {
    this.networkManager = NetworkManager.getInstance();
    this.onEnemySpawned = onEnemySpawned;
    this.onEnemyDied = onEnemyDied;
    this.setupListeners();
  }

  private setupListeners(): void {
    this.networkManager.on('game:enemySpawned', (enemy: EnemyData) => {
      this.onEnemySpawned(enemy);
    });

    this.networkManager.on('game:enemyDied', (data: { enemyId: string; gold: number; xp: number }) => {
      this.onEnemyDied(data.enemyId, data.gold, data.xp);
    });
  }

  public cleanup(): void {
    // Cleanup listeners if needed
  }
}
