import { OptionsScene } from './OptionsScene';
import { GameUI } from '../game/GameUI';
import { WaveManager } from '../game/WaveManager';
import { TowerManager } from '../game/TowerManager';
import { LevelManager } from '../game/LevelManager';
import { ResearchManager } from '../game/ResearchManager';
import { ConfigManager } from '../config/ConfigManager';
import { MultiplayerCoordinator } from '../multiplayer/MultiplayerCoordinator';
import { GameStateData, TowerData, EnemyData } from '../server/types';

export class GameScene extends Phaser.Scene {
  private ui!: GameUI;
  private waveManager!: WaveManager;
  private towerManager!: TowerManager;
  private levelManager!: LevelManager;
  private researchManager!: ResearchManager;
  private multiplayerCoordinator?: MultiplayerCoordinator;
  private gameStarted: boolean = false;
  private gold: number = 0;
  private lives: number = 0;
  private config = ConfigManager.getInstance().getConfig();
  private levelType: string = 'classic';
  private isPaused: boolean = false;
  private autoWaveEnabled: boolean = false;
  private autoWaveTimer?: Phaser.Time.TimerEvent;
  private isMultiplayer: boolean = false;
  private roomCode?: string;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { levelType?: string; multiplayer?: boolean; roomCode?: string }): void {
    const settings = OptionsScene.getSettings();
    const gameConfig = this.config.game;
    
    // Check if this is a multiplayer game
    this.isMultiplayer = data.multiplayer || false;
    this.roomCode = data.roomCode;
    
    // Set level type from data
    this.levelType = data.levelType || 'classic';
    
    // Initialize gold and lives from config
    // In multiplayer, these will be overwritten by the first server state update
    this.gold = gameConfig.startGold;
    this.lives = gameConfig.startLives;
    
    // Only adjust based on difficulty in single-player mode
    // In multiplayer, the server controls all game state
    if (!this.isMultiplayer) {
      switch (settings.difficulty) {
        case 'easy':
          this.gold = gameConfig.startGold * 2;
          this.lives = Math.round(gameConfig.startLives * 1.5);
          break;
        case 'normal':
          this.gold = gameConfig.startGold;
          this.lives = gameConfig.startLives;
          break;
        case 'hard':
          this.gold = Math.round(gameConfig.startGold * 0.75);
          this.lives = Math.round(gameConfig.startLives * 0.75);
          break;
      }
    }
    
    this.gameStarted = false;
  }

  create(): void {
    // Create level with selected type
    this.levelManager = new LevelManager(this, this.levelType);
    this.levelManager.create();

    // Create managers
    this.waveManager = new WaveManager(this, this.levelManager.getPath(), this.levelType);
    this.towerManager = new TowerManager(this, this.levelManager.getPath());
    this.researchManager = new ResearchManager();

    // Initialize multiplayer if needed
    if (this.isMultiplayer) {
      this.setupMultiplayer();
    }

    // Create UI
    this.ui = new GameUI(this, this.gold, this.lives, this.researchManager);
    this.ui.create(
      () => this.handleStartWave(),
      (type, cost) => this.handleTowerSelect(type, cost),
      () => this.handlePauseToggle(),
      () => this.handleAutoWaveToggle(),
      () => this.handleResearchToggle(),
      () => this.handleUpgradeTower(),
      () => this.handleSellTower()
    );

    // Show room code if in multiplayer mode
    if (this.isMultiplayer && this.roomCode) {
      this.ui.showRoomCode(this.roomCode);
    }

    // Check if there are available researches at game start
    this.checkAndShowResearchNotification();

    // Input handlers
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handlePointerDown(pointer);
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.towerManager.updatePreview(pointer);
    });
  }

  update(time: number, delta: number): void {
    if (this.isPaused) return;

    // Update upgrade button based on selected tower
    const selectedTower = this.towerManager.getSelectedTower();
    this.ui.updateUpgradeButton(selectedTower);

    // Update waves
    this.waveManager.update(
      delta,
      (gold: number, xp: number) => {
        this.gold += gold;
        this.ui.updateGold(this.gold);
        
        // Award XP for killed enemy
        const result = this.researchManager.addXP(xp);
        this.ui.updateXP(this.researchManager.getXP(), this.researchManager.getLevel());
        this.waveManager.setPlayerLevel(this.researchManager.getLevel());
        
        if (result.levelUp) {
          this.showLevelUpNotification(result.newLevel);
          
          if (result.newResearchUnlocked.length > 0) {
            result.newResearchUnlocked.forEach((researchName) => {
              this.showResearchUnlockedNotification(researchName);
            });
            this.ui.showResearchButtonPulse();
          }
        }
      },
      () => {
        this.lives--;
        this.ui.updateLives(this.lives);
        if (this.lives <= 0) {
          this.gameOver();
        }
      },
      (wave: number) => {
        // Wave complete - award bonus gold and XP
        const bonusGold = 50 + wave * 10;
        const xpReward = (20 + wave * 5) * 2; // Doppelte XP für schnelleren Fortschritt
        
        this.gold += bonusGold;
        this.ui.updateGold(this.gold);
        
        const result = this.researchManager.addXP(xpReward);
        this.ui.updateXP(this.researchManager.getXP(), this.researchManager.getLevel());
        
        // Update WaveManager with current player level
        this.waveManager.setPlayerLevel(this.researchManager.getLevel());
        
        if (result.levelUp) {
          this.showLevelUpNotification(result.newLevel);
          
          // Show research notifications if new research unlocked
          if (result.newResearchUnlocked.length > 0) {
            result.newResearchUnlocked.forEach((researchName) => {
              this.showResearchUnlockedNotification(researchName);
            });
            this.ui.showResearchButtonPulse();
          }
        }
        
        // Always check if there are available researches after wave complete
        const availableResearches = this.researchManager.getAvailableResearches();
        if (availableResearches.length > 0) {
          // Check if player can afford any research
          const canAffordAny = availableResearches.some(r => 
            this.researchManager.canResearch(r.id, this.gold)
          );
          if (canAffordAny) {
            this.ui.showResearchButtonPulse();
          }
        }
      }
    );

    // Update towers
    this.towerManager.update(time, this.waveManager.getEnemies());

    // Check wave complete
    if (this.waveManager.isWaveComplete() && this.gameStarted) {
      if (this.autoWaveEnabled) {
        // Auto-start next wave after 5 seconds
        if (!this.autoWaveTimer) {
          this.autoWaveTimer = this.time.delayedCall(5000, () => {
            this.handleStartWave();
            this.autoWaveTimer = undefined;
          });
        }
      } else {
        this.ui.showStartButton('Nächste Welle');
      }
    }
  }

  private handleStartWave(): void {
    // In multiplayer mode, request wave start from server
    if (this.isMultiplayer && this.multiplayerCoordinator) {
      this.multiplayerCoordinator.startWave();
      return;
    }

    // Single-player mode
    if (this.waveManager.isSpawningEnemies()) return;
    
    if (!this.gameStarted) {
      this.gameStarted = true;
    }
    
    // Clear auto-wave timer if exists
    if (this.autoWaveTimer) {
      this.autoWaveTimer.destroy();
      this.autoWaveTimer = undefined;
    }
    
    this.waveManager.resetWaveComplete();
    this.ui.hideStartButton();
    this.waveManager.startWave();
    this.ui.updateWave(this.waveManager.getWave());
  }

  private handleTowerSelect(type: string, cost: number): void {
    this.towerManager.selectTower(type, cost);
    this.ui.updateButtonStyles(this.towerManager.getSelectedType() || undefined);
  }

  private handleUpgradeTower(): void {
    const selectedTower = this.towerManager.getSelectedTower();
    
    // In multiplayer mode, request upgrade from server
    if (this.isMultiplayer && this.multiplayerCoordinator && selectedTower) {
      // Get tower ID from the tower object
      const towerId = (selectedTower as any).id || 'unknown';
      this.multiplayerCoordinator.upgradeTower(towerId);
      return;
    }

    // Single-player mode
    const result = this.towerManager.tryUpgradeTower(this.gold);
    
    if (result.success) {
      this.gold -= result.cost;
      this.ui.updateGold(this.gold);
      
      // Show upgrade notification
      this.showUpgradeNotification();
    }
  }

  private handleSellTower(): void {
    const selectedTower = this.towerManager.getSelectedTower();
    
    // In multiplayer mode, request sell from server
    if (this.isMultiplayer && this.multiplayerCoordinator && selectedTower) {
      // Get tower ID from the tower object
      const towerId = (selectedTower as any).id || 'unknown';
      this.multiplayerCoordinator.sellTower(towerId);
      return;
    }

    // Single-player mode
    const result = this.towerManager.trySellTower();
    
    if (result.success) {
      this.gold += result.refund;
      this.ui.updateGold(this.gold);
      
      // Show sell notification
      this.showSellNotification(result.refund);
    }
  }

  private handlePauseToggle(): void {
    this.isPaused = !this.isPaused;
    
    if (this.isPaused) {
      this.physics.pause();
    } else {
      this.physics.resume();
    }
    
    this.ui.setPaused(this.isPaused);
  }

  private handleAutoWaveToggle(): void {
    this.autoWaveEnabled = !this.autoWaveEnabled;
    this.ui.setAutoWave(this.autoWaveEnabled);
    
    // If currently waiting for next wave and auto-wave is enabled, start timer
    if (this.autoWaveEnabled && this.waveManager.isWaveComplete() && !this.autoWaveTimer) {
      this.autoWaveTimer = this.time.delayedCall(5000, () => {
        this.handleStartWave();
        this.autoWaveTimer = undefined;
      });
    }
    
    // If auto-wave is disabled, cancel any pending timer
    if (!this.autoWaveEnabled && this.autoWaveTimer) {
      this.autoWaveTimer.destroy();
      this.autoWaveTimer = undefined;
      this.ui.showStartButton('Nächste Welle');
    }
  }

  private handleResearchToggle(): void {
    this.ui.toggleResearchOverlay();
  }

  private showLevelUpNotification(level: number): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const notification = this.add.container(width / 2, height / 3);

    const bg = this.add.rectangle(0, 0, 300, 100, 0x000000, 0.8);
    const text = this.add.text(0, -20, 'Level Up!', {
      font: 'bold 32px Arial',
      color: '#ffff00',
    }).setOrigin(0.5);
    const levelText = this.add.text(0, 20, `Level ${level}`, {
      font: '24px Arial',
      color: '#ffffff',
    }).setOrigin(0.5);

    notification.add([bg, text, levelText]);
    notification.setDepth(1000);

    this.tweens.add({
      targets: notification,
      alpha: { from: 1, to: 0 },
      y: height / 3 - 50,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => {
        notification.destroy();
      },
    });
  }

  private showUpgradeNotification(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const notification = this.add.container(width / 2, height / 2);

    const bg = this.add.rectangle(0, 0, 250, 80, 0x000000, 0.8);
    const text = this.add.text(0, 0, 'Turm Verbessert!', {
      font: 'bold 28px Arial',
      color: '#ff9900',
    }).setOrigin(0.5);

    notification.add([bg, text]);
    notification.setDepth(1000);

    this.tweens.add({
      targets: notification,
      alpha: { from: 1, to: 0 },
      y: height / 2 - 50,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => {
        notification.destroy();
      },
    });
  }

  private showSellNotification(refund: number): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const notification = this.add.container(width / 2, height / 2);

    const bg = this.add.rectangle(0, 0, 280, 100, 0x000000, 0.8);
    const text = this.add.text(0, -15, 'Turm Verkauft!', {
      font: 'bold 28px Arial',
      color: '#cc0000',
    }).setOrigin(0.5);
    const refundText = this.add.text(0, 20, `+${refund} Gold`, {
      font: '22px Arial',
      color: '#ffff00',
    }).setOrigin(0.5);

    notification.add([bg, text, refundText]);
    notification.setDepth(1000);

    this.tweens.add({
      targets: notification,
      alpha: { from: 1, to: 0 },
      y: height / 2 - 50,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => {
        notification.destroy();
      },
    });
  }

  private checkAndShowResearchNotification(): void {
    const availableResearches = this.researchManager.getAvailableResearches();
    if (availableResearches.length > 0) {
      // Check if player can afford any research
      const canAffordAny = availableResearches.some(r => 
        this.researchManager.canResearch(r.id, this.gold)
      );
      if (canAffordAny || availableResearches.length > 0) {
        // Show pulse even if player can't afford yet (they should know research exists)
        this.ui.showResearchButtonPulse();
      }
    }
  }

  private showResearchUnlockedNotification(researchName: string): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const notification = this.add.container(width / 2, height / 2);

    // Background with glow effect
    const bg = this.add.rectangle(0, 0, 400, 120, 0x000000, 0.9);
    bg.setStrokeStyle(3, 0x9900ff, 1);
    
    const icon = this.add.text(0, -30, '🔬', {
      font: 'bold 40px Arial',
    }).setOrigin(0.5);
    
    const text = this.add.text(0, 10, 'Neue Forschung verfügbar!', {
      font: 'bold 24px Arial',
      color: '#ff00ff',
    }).setOrigin(0.5);
    
    const nameText = this.add.text(0, 40, researchName, {
      font: '20px Arial',
      color: '#ffff00',
    }).setOrigin(0.5);

    notification.add([bg, icon, text, nameText]);
    notification.setDepth(1001);
    notification.setScale(0.5);

    // Animate in
    this.tweens.add({
      targets: notification,
      scale: { from: 0.5, to: 1 },
      duration: 300,
      ease: 'Back.easeOut',
    });

    // Pulse effect
    this.tweens.add({
      targets: bg,
      scaleX: { from: 1, to: 1.05 },
      scaleY: { from: 1, to: 1.05 },
      duration: 800,
      yoyo: true,
      repeat: 2,
    });

    // Fade out
    this.tweens.add({
      targets: notification,
      alpha: { from: 1, to: 0 },
      y: height / 2 - 80,
      delay: 3000,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        notification.destroy();
      },
    });
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    // Check if clicked on UI (only visible buttons)
    const uiButtons = this.ui.getButtons();
    const clickedOnUI = uiButtons.some(btn => {
      if (!btn.visible) return false; // Ignore invisible buttons
      const bounds = btn.getBounds();
      return bounds.contains(pointer.x, pointer.y);
    });
    
    if (clickedOnUI) return;

    // In multiplayer mode, request tower placement from server
    if (this.isMultiplayer && this.multiplayerCoordinator && this.towerManager.getSelectedType()) {
      const type = this.towerManager.getSelectedType();
      if (type) {
        console.log(`🎯 Requesting tower placement in multiplayer mode: ${type} at (${pointer.x}, ${pointer.y})`);
        this.multiplayerCoordinator.placeTower(type, pointer.x, pointer.y);
        // Clear selection to exit preview mode
        this.towerManager.deselectTower();
        this.ui.updateButtonStyles();
      }
      return;
    }

    // Single-player mode: Try to place tower
    const result = this.towerManager.tryPlaceTower(pointer.x, pointer.y, this.gold);
    if (result.success) {
      this.gold -= result.cost;
      this.ui.updateGold(this.gold);
      this.ui.updateButtonStyles();
    }
  }

  private gameOver(): void {
    this.physics.pause();
    this.waveManager.cleanup();
    this.towerManager.cleanup();
    this.time.removeAllEvents();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0);

    const gameOverText = this.add.text(width / 2, height / 2 - 50, 'Game Over', {
      font: 'bold 64px Arial',
      color: '#ff0000',
    });
    gameOverText.setOrigin(0.5);

    const finalWaveText = this.add.text(
      width / 2,
      height / 2 + 20,
      `Du hast Welle ${this.waveManager.getWave()} erreicht!`,
      {
        font: '32px Arial',
        color: '#ffffff',
      }
    );
    finalWaveText.setOrigin(0.5);

    const restartButton = this.add.text(width / 2, height / 2 + 100, 'Neustart', {
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
      this.scene.restart();
    });

    this.input.off('pointerdown');
    this.input.off('pointermove');
  }

  // ========== Multiplayer Methods ==========

  private setupMultiplayer(): void {
    this.multiplayerCoordinator = new MultiplayerCoordinator(this, {
      onStateUpdate: (state: GameStateData) => this.handleMultiplayerStateUpdate(state),
      onTowerPlaced: (tower: TowerData) => this.handleMultiplayerTowerPlaced(tower),
      onTowerUpgraded: (towerId: string, level: number) => this.handleMultiplayerTowerUpgraded(towerId, level),
      onTowerSold: (towerId: string, refund: number) => this.handleMultiplayerTowerSold(towerId, refund),
      onEnemySpawned: (enemy: EnemyData) => this.handleMultiplayerEnemySpawned(enemy),
      onEnemyDied: (enemyId: string, gold: number, xp: number) => this.handleMultiplayerEnemyDied(enemyId, gold, xp),
      onWaveStarted: (wave: number) => this.handleMultiplayerWaveStarted(wave),
      onWaveCompleted: (wave: number, bonus: number) => this.handleMultiplayerWaveCompleted(wave, bonus)
    });

    // Listen for game over events
    this.events.on('gameOver', (won: boolean) => {
      if (!won) {
        this.gameOver();
      }
      // Victory would be handled separately if needed
    });
  }

  private handleMultiplayerStateUpdate(state: GameStateData): void {
    // Update local state from server
    this.gold = state.gold;
    this.lives = state.lives;
    
    this.ui.updateGold(this.gold);
    this.ui.updateLives(this.lives);
    this.ui.updateWave(state.wave);
    
    // Update research UI with server state
    // Research manager tracks its own state, we just update the display
    this.ui.updateXP(state.xp, state.playerLevel);
    
    // Update wave manager with current player level and count
    this.waveManager.setPlayerLevel(state.playerLevel);
    this.waveManager.setPlayerCount(state.playerCount);
  }

  private handleMultiplayerTowerPlaced(tower: TowerData): void {
    // Tower was placed by this or another player via the server
    console.log(`✅ Tower placed by server: ${tower.type} at (${tower.x}, ${tower.y}), level ${tower.level}`);
    
    // Create the tower visually
    this.towerManager.addTowerFromServer(tower.x, tower.y, tower.type, tower.level);
    
    // Gold and lives are updated via game:stateUpdate
  }

  private handleMultiplayerTowerUpgraded(towerId: string, level: number): void {
    console.log(`Tower ${towerId} upgraded to level ${level}`);
    // TowerManager will handle the upgrade visually
  }

  private handleMultiplayerTowerSold(towerId: string, refund: number): void {
    console.log(`Tower ${towerId} sold for ${refund} gold`);
    // TowerManager will handle the removal
  }

  private handleMultiplayerEnemySpawned(enemy: EnemyData): void {
    console.log(`Enemy spawned: ${enemy.type} (${enemy.id})`);
    // WaveManager will handle enemy creation
  }

  private handleMultiplayerEnemyDied(enemyId: string, gold: number, xp: number): void {
    console.log(`Enemy ${enemyId} died. Rewarded: ${gold} gold, ${xp} xp`);
    // Gold and XP already updated via state sync
  }

  private handleMultiplayerWaveStarted(wave: number): void {
    console.log(`Wave ${wave} started`);
    this.gameStarted = true;
    this.ui.hideStartButton();
    this.ui.updateWave(wave);
    
    // Start the wave locally for enemy spawning
    // In multiplayer, each client spawns enemies locally for now
    // TODO: Server should control enemy spawning and sync positions
    this.waveManager.resetWaveComplete();
    this.waveManager.startWave();
  }

  private handleMultiplayerWaveCompleted(wave: number, bonus: number): void {
    console.log(`Wave ${wave} completed. Bonus: ${bonus}`);
    // Gold already updated via state sync
  }

}
