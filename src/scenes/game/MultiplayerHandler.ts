import { GameStateData, TowerData, EnemyData } from '../../server/types';
import { MultiplayerCoordinator } from '../../multiplayer/MultiplayerCoordinator';
import { WaveManager } from '../../game/WaveManager';
import { TowerManager } from '../../game/TowerManager';
import { GameUI } from '../../game/GameUI';
import { XPRewardHandler } from './XPRewardHandler';

/**
 * MultiplayerHandler - Handles all multiplayer-specific logic
 */
export class MultiplayerHandler {
  private coordinator?: MultiplayerCoordinator;

  constructor(
    private scene: Phaser.Scene,
    private waveManager: WaveManager,
    private towerManager: TowerManager,
    private ui: GameUI,
    private xpHandler: XPRewardHandler,
    private onStateUpdate: (gold: number, lives: number) => void,
    private onGoldChange: (amount: number) => void,
    private onGameStarted: () => void
  ) {}

  setup(): void {
    this.coordinator = new MultiplayerCoordinator(this.scene, {
      onStateUpdate: (state: GameStateData) => this.handleStateUpdate(state),
      onTowerPlaced: (tower: TowerData) => this.handleTowerPlaced(tower),
      onTowerUpgraded: (towerId: string, level: number) => this.handleTowerUpgraded(towerId, level),
      onTowerSold: (towerId: string, refund: number) => this.handleTowerSold(towerId, refund),
      onEnemySpawned: (enemy: EnemyData) => this.handleEnemySpawned(enemy),
      onEnemyDied: (enemyId: string, gold: number, xp: number) => this.handleEnemyDied(enemyId, gold, xp),
      onWaveStarted: (wave: number) => this.handleWaveStarted(wave),
      onWaveCompleted: (wave: number, bonus: number) => this.handleWaveCompleted(wave, bonus)
    });

    this.scene.events.on('gameOver', (won: boolean) => {
      if (!won) {
        // Trigger game over in scene
        this.scene.events.emit('triggerGameOver');
      }
    });
  }

  startWave(): void {
    this.coordinator?.startWave();
  }

  placeTower(type: string, x: number, y: number): void {
    console.log(`🎯 Requesting tower placement: ${type} at (${x}, ${y})`);
    this.coordinator?.placeTower(type, x, y);
  }

  upgradeTower(towerId: string): void {
    console.log(`🔧 Requesting tower upgrade: ${towerId}`);
    this.coordinator?.upgradeTower(towerId);
  }

  sellTower(towerId: string): void {
    this.coordinator?.sellTower(towerId);
  }

  private handleStateUpdate(state: GameStateData): void {
    this.onStateUpdate(state.gold, state.lives);
    this.ui.updateWave(state.wave);
    this.ui.updateXP(state.xp, state.playerLevel);
    this.waveManager.setPlayerLevel(state.playerLevel);
    this.waveManager.setPlayerCount(state.playerCount);
  }

  private handleTowerPlaced(tower: TowerData): void {
    console.log(`✅ Tower placed by server: ${tower.type} at (${tower.x}, ${tower.y}), level ${tower.level}, id=${tower.id}`);
    this.towerManager.addTowerFromServer(tower.x, tower.y, tower.type, tower.level, tower.id);
  }

  private handleTowerUpgraded(towerId: string, level: number): void {
    console.log(`✅ Tower ${towerId} upgraded to level ${level} by server`);
    this.towerManager.upgradeTowerById(towerId, level);
  }

  private handleTowerSold(towerId: string, refund: number): void {
    console.log(`💰 Tower ${towerId} sold for ${refund} gold by server`);
    this.towerManager.sellTowerById(towerId);
  }

  private handleEnemySpawned(enemy: EnemyData): void {
    console.log(`Enemy spawned: ${enemy.type} (${enemy.id})`);
  }

  private handleEnemyDied(enemyId: string, gold: number, xp: number): void {
    console.log(`💀 Enemy ${enemyId} died. Rewarded: ${gold} gold, ${xp} xp`);
    this.onGoldChange(gold);
    this.xpHandler.awardXP(xp, this.waveManager);
  }

  private handleWaveStarted(wave: number): void {
    console.log(`Wave ${wave} started`);
    this.onGameStarted();
    this.ui.hideStartButton();
    this.ui.updateWave(wave);
    this.waveManager.resetWaveComplete();
    this.waveManager.startWave();
  }

  private handleWaveCompleted(wave: number, bonus: number): void {
    console.log(`🎉 Wave ${wave} completed. Bonus: ${bonus} gold`);
    
    // Award bonus gold and XP
    this.onGoldChange(bonus);
    const xpReward = (20 + wave * 5) * 2;
    this.xpHandler.awardXP(xpReward, this.waveManager);
    
    // Mark wave as complete
    this.waveManager.markWaveComplete();
    this.ui.showStartButton();
  }
}
