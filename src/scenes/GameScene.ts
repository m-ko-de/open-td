import { OptionsScene } from './OptionsScene';
import { GameUI } from '../game/GameUI';
import { WaveManager } from '../game/WaveManager';
import { TowerManager } from '../game/TowerManager';
import { MapManager } from '../game/MapManager';
import { ResearchManager } from '../game/ResearchManager';
import { ProjectileManager } from '../game/ProjectileManager';
import { ConfigManager } from '../client/ConfigManager';
import { NotificationManager } from './game/NotificationManager';
import { XPRewardHandler } from './game/XPRewardHandler';
import { WaveEventHandler } from './game/WaveEventHandler';
import { TowerActionHandler } from './game/TowerActionHandler';
import { MultiplayerHandler } from './game/MultiplayerHandler';
import { GameOverScreen } from './game/GameOverScreen';

export class GameScene extends Phaser.Scene {
  // Core managers
  private ui!: GameUI;
  private waveManager!: WaveManager;
  private towerManager!: TowerManager;
  private mapManager!: MapManager;
  private researchManager!: ResearchManager;
  private projectileManager!: ProjectileManager;
  
  // Helper classes
  private notifications!: NotificationManager;
  private xpHandler!: XPRewardHandler;
  private waveHandler!: WaveEventHandler;
  private towerHandler!: TowerActionHandler;
  private multiplayerHandler?: MultiplayerHandler;
  private gameOverScreen!: GameOverScreen;
  
  // Game state
  private gameStarted: boolean = false;
  private isReady: boolean = false;
  private gold: number = 0;
  private lives: number = 0;
  private isPaused: boolean = false;
  private autoWaveEnabled: boolean = false;
  private autoWaveTimer?: Phaser.Time.TimerEvent;
  
  // Config
  private config = ConfigManager.getInstance().getConfig();
  private levelType: string = 'classic';
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
    this.isReady = false;
  }

  async create(): Promise<void> {
    // Load and create map
    this.mapManager = new MapManager(this, this.levelType);
    try {
      await this.mapManager.loadMap();
      this.mapManager.create();
    } catch (error) {
      console.error('Failed to load map:', error);
      // Fallback to classic map
      this.mapManager = new MapManager(this, 'classic');
      await this.mapManager.loadMap();
      this.mapManager.create();
    }

    // Create managers
    this.waveManager = new WaveManager(this, this.mapManager.getPath(), this.levelType);
    this.towerManager = new TowerManager(this, this.mapManager.getPath());
    this.researchManager = new ResearchManager();
    this.projectileManager = new ProjectileManager();

    // Initialize helper classes
    this.notifications = new NotificationManager(this);
    this.gameOverScreen = new GameOverScreen(this);
    
    // Create UI
    this.ui = new GameUI(this, this.gold, this.lives, this.researchManager);
    
    // Initialize XP handler
    this.xpHandler = new XPRewardHandler(
      this.researchManager,
      this.ui,
      (level, newResearches) => {
        this.notifications.showLevelUp(level);
        newResearches.forEach(name => {
          this.notifications.showResearchUnlocked(name);
        });
        this.ui.showResearchButtonPulse();
      }
    );
    
    // Initialize wave event handler
    this.waveHandler = new WaveEventHandler(
      this.waveManager,
      this.xpHandler,
      (amount: number) => this.changeGold(amount),
      () => this.handleLifeLost(),
      () => this.checkResearchAvailability()
    );
    
    // Initialize tower action handler
    this.towerHandler = new TowerActionHandler(
      this.towerManager,
      this.ui,
      (amount) => this.changeGold(amount),
      (type, refund) => {
        if (type === 'upgrade') this.notifications.showTowerUpgrade();
        else if (type === 'sell' && refund) this.notifications.showTowerSold(refund);
      }
    );

    // Initialize multiplayer if needed
    if (this.isMultiplayer) {
      this.multiplayerHandler = new MultiplayerHandler(
        this,
        this.waveManager,
        this.towerManager,
        this.ui,
        this.xpHandler,
        (gold, lives) => {
          this.gold = gold;
          this.lives = lives;
          this.ui.updateGold(gold);
          this.ui.updateLives(lives);
        },
        (amount) => {
          this.gold += amount;
          this.ui.updateGold(this.gold);
        },
        () => { this.gameStarted = true; }
      );
      this.multiplayerHandler.setup();
      this.events.on('triggerGameOver', () => this.gameOver());
    }

    // Create UI
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

    // Mark as ready after all initialization is complete
    this.isReady = true;
  }

  update(time: number, delta: number): void {
    // Don't update until initialization is complete
    if (!this.isReady) return;
    if (this.isPaused) return;

    // Update upgrade button based on selected tower
    const selectedTower = this.towerManager.getSelectedTower();
    this.ui.updateUpgradeButton(selectedTower);

    // Update waves
    this.waveManager.update(
      delta,
      (gold: number, xp: number) => this.waveHandler.handleEnemyKilled(gold, xp),
      () => this.waveHandler.handleEnemyEscaped(),
      (wave: number) => this.waveHandler.handleWaveCompleted(wave)
    );

    // Update towers and collect projectiles
    const newProjectiles = this.towerManager.update(time, this.waveManager.getEnemies());
    newProjectiles.forEach(projectile => this.projectileManager.addProjectile(projectile));
    
    // Update projectiles
    this.projectileManager.update(delta);

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
    if (this.isMultiplayer && this.multiplayerHandler) {
      this.multiplayerHandler.startWave();
      return;
    }

    if (this.waveManager.isSpawningEnemies()) return;
    if (!this.gameStarted) this.gameStarted = true;
    
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
    this.towerHandler.selectTower(type, cost);
  }

  private handleUpgradeTower(): void {
    if (this.isMultiplayer && this.multiplayerHandler) {
      const selectedTower = this.towerHandler.getSelectedTower();
      if (selectedTower) {
        const towerId = (selectedTower as any).id;
        if (!towerId) {
          console.error('❌ Selected tower has no ID! Cannot upgrade in multiplayer.');
          return;
        }
        console.log(`🎯 Upgrade button clicked for tower: ${towerId}`);
        this.multiplayerHandler.upgradeTower(towerId);
      } else {
        console.error('❌ No tower selected for upgrade');
      }
      return;
    }

    this.towerHandler.tryUpgradeTower(this.gold);
  }

  private handleSellTower(): void {
    if (this.isMultiplayer && this.multiplayerHandler) {
      const selectedTower = this.towerHandler.getSelectedTower();
      if (selectedTower) {
        const towerId = (selectedTower as any).id || 'unknown';
        this.multiplayerHandler.sellTower(towerId);
      }
      return;
    }

    this.towerHandler.trySellTower();
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

  private changeGold(amount: number): void {
    this.gold += amount;
    this.ui.updateGold(this.gold);
  }

  private handleLifeLost(): void {
    this.lives--;
    this.ui.updateLives(this.lives);
    if (this.lives <= 0) {
      this.gameOver();
    }
  }

  private checkAndShowResearchNotification(): void {
    if (this.xpHandler.checkAvailableResearches(this.gold)) {
      this.ui.showResearchButtonPulse();
    }
  }

  private checkResearchAvailability(): void {
    if (this.xpHandler.checkAvailableResearches(this.gold)) {
      this.ui.showResearchButtonPulse();
    }
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    const uiButtons = this.ui.getButtons();
    const clickedOnUI = uiButtons.some(btn => {
      if (!btn.visible) return false;
      const bounds = btn.getBounds();
      return bounds.contains(pointer.x, pointer.y);
    });
    
    if (clickedOnUI) return;

    if (this.isMultiplayer && this.multiplayerHandler) {
      const selectedType = this.towerManager.getSelectedType();
      if (selectedType) {
        console.log(`🎯 Requesting tower placement: ${selectedType} at (${pointer.x}, ${pointer.y})`);
        this.multiplayerHandler.placeTower(selectedType, pointer.x, pointer.y);
        this.towerHandler.deselectTower();
      }
      return;
    }

    this.towerHandler.tryPlaceTower(pointer.x, pointer.y, this.gold);
  }

  private gameOver(): void {
    this.physics.pause();
    this.waveManager.cleanup();
    this.towerManager.cleanup();
    this.time.removeAllEvents();
    this.input.off('pointerdown');
    this.input.off('pointermove');

    this.gameOverScreen.show(this.waveManager.getWave(), () => this.scene.restart());
  }

}
