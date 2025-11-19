import { GameStateSync } from './GameStateSync';
import { TowerSync } from './TowerSync';
import { EnemySync } from './EnemySync';
import { WaveSync } from './WaveSync';
import { NetworkManager } from '../network/NetworkManager';
import { GameStateData, TowerData, EnemyData } from '../server/types';

/**
 * Coordinator for all multiplayer synchronization modules
 * Provides a single interface for GameScene to interact with multiplayer features
 */
export class MultiplayerCoordinator {
  private networkManager: NetworkManager;
  private gameStateSync?: GameStateSync;
  private towerSync?: TowerSync;
  private enemySync?: EnemySync;
  private waveSync?: WaveSync;
  private isMultiplayer: boolean;

  constructor(
    scene: Phaser.Scene,
    callbacks: {
      onStateUpdate: (state: GameStateData) => void;
      onTowerPlaced: (tower: TowerData) => void;
      onTowerUpgraded: (towerId: string, level: number) => void;
      onTowerSold: (towerId: string, refund: number) => void;
      onEnemySpawned: (enemy: EnemyData) => void;
      onEnemyDied: (enemyId: string, gold: number, xp: number) => void;
      onWaveStarted: (wave: number) => void;
      onWaveCompleted: (wave: number, bonus: number) => void;
    }
  ) {
    this.networkManager = NetworkManager.getInstance();
    this.isMultiplayer = this.networkManager.isConnected() && this.networkManager.getCurrentRoom() !== null;

    if (this.isMultiplayer) {
      this.gameStateSync = new GameStateSync(scene, callbacks.onStateUpdate);
      this.towerSync = new TowerSync(
        callbacks.onTowerPlaced,
        callbacks.onTowerUpgraded,
        callbacks.onTowerSold
      );
      this.enemySync = new EnemySync(
        callbacks.onEnemySpawned,
        callbacks.onEnemyDied
      );
      this.waveSync = new WaveSync(
        callbacks.onWaveStarted,
        callbacks.onWaveCompleted
      );
    }
  }

  // Check if in multiplayer mode
  public isInMultiplayerMode(): boolean {
    return this.isMultiplayer;
  }

  // Tower actions
  public placeTower(type: string, x: number, y: number): void {
    if (this.isMultiplayer && this.towerSync) {
      this.towerSync.requestPlaceTower(type, x, y);
    }
  }

  public upgradeTower(towerId: string): void {
    if (this.isMultiplayer && this.towerSync) {
      this.towerSync.requestUpgradeTower(towerId);
    }
  }

  public sellTower(towerId: string): void {
    if (this.isMultiplayer && this.towerSync) {
      this.towerSync.requestSellTower(towerId);
    }
  }

  // Wave actions
  public startWave(): void {
    if (this.isMultiplayer && this.waveSync) {
      this.waveSync.requestStartWave();
    }
  }

  // Research actions
  public unlockResearch(researchType: string): void {
    if (this.isMultiplayer) {
      this.networkManager.unlockResearch(researchType);
    }
  }

  // Cleanup
  public cleanup(): void {
    if (this.isMultiplayer) {
      this.gameStateSync?.cleanup();
      this.towerSync?.cleanup();
      this.enemySync?.cleanup();
      this.waveSync?.cleanup();
    }
  }
}
