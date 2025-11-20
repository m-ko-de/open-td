import { ResearchManager } from './ResearchManager';
import { StatsDisplay } from './ui/StatsDisplay';
import { TowerButtonPanel } from './ui/TowerButtonPanel';
import { ControlButtons } from './ui/ControlButtons';
import { TowerActionButtons } from './ui/TowerActionButtons';
import { ResearchButton } from './ui/ResearchButton';
import { ResearchOverlay } from './ui/ResearchOverlay';

/**
 * Main UI coordinator that delegates to specialized UI modules
 * Follows Single Responsibility Principle by delegating to focused components
 */
export class GameUI {
  private scene: Phaser.Scene;
  private gold: number;
  private lives: number;
  private wave: number;
  private researchManager: ResearchManager;
  
  private statsDisplay!: StatsDisplay;
  private towerButtons!: TowerButtonPanel;
  private controlButtons!: ControlButtons;
  private towerActionButtons!: TowerActionButtons;
  private researchButton!: ResearchButton;
  private researchOverlay!: ResearchOverlay;

  constructor(scene: Phaser.Scene, startGold: number, startLives: number, researchManager: ResearchManager) {
    this.scene = scene;
    this.gold = startGold;
    this.lives = startLives;
    this.wave = 0;
    this.researchManager = researchManager;
  }

  create(
    onStartWave: () => void, 
    onTowerSelect: (type: string, cost: number) => void,
    onPauseToggle: () => void,
    onAutoWaveToggle: () => void,
    onResearchToggle: () => void,
    onUpgradeTower: () => void,
    onSellTower: () => void
  ): void {
    // Initialize all UI modules
    this.statsDisplay = new StatsDisplay(
      this.scene,
      this.gold,
      this.lives,
      this.wave,
      this.researchManager.getLevel(),
      this.researchManager.getXP(),
      this.researchManager.getXPForNextLevel()
    );

    this.towerButtons = new TowerButtonPanel(
      this.scene,
      this.gold,
      this.researchManager,
      onTowerSelect
    );

    this.controlButtons = new ControlButtons(
      this.scene,
      onStartWave,
      onPauseToggle,
      onAutoWaveToggle
    );

    this.towerActionButtons = new TowerActionButtons(
      this.scene,
      this.gold,
      onUpgradeTower,
      onSellTower
    );

    this.researchButton = new ResearchButton(
      this.scene,
      onResearchToggle
    );

    this.researchOverlay = new ResearchOverlay(
      this.scene,
      this.researchManager,
      this.gold,
      (amount) => {
        this.gold -= amount;
        this.updateGold(this.gold);
      },
      (researchId) => {
        if (researchId === 'frost_tower' || researchId === 'fire_tower') {
          this.towerButtons.recreate();
        }
      }
    );
  }

  updateGold(amount: number): void {
    this.gold = amount;
    this.statsDisplay.updateGold(amount);
    this.towerButtons.updateGold(amount);
    this.towerActionButtons.updateGold(amount);
    this.researchOverlay.updateGold(amount);
  }

  updateLives(amount: number): void {
    this.lives = amount;
    this.statsDisplay.updateLives(amount);
  }

  updateWave(wave: number): void {
    this.wave = wave;
    this.statsDisplay.updateWave(wave);
  }

  updateXP(xp: number, level: number): void {
    this.statsDisplay.updateXP(xp, level, this.researchManager.getXPForNextLevel());
  }

  showStartButton(text: string = 'Welle Starten'): void {
    this.controlButtons.showStartButton(text);
  }

  hideStartButton(): void {
    this.controlButtons.hideStartButton();
  }

  updateButtonStyles(selectedType?: string): void {
    this.towerButtons.updateStyles(selectedType);
  }

  updateUpgradeButton(selectedTower: any): void {
    this.towerActionButtons.updateForTower(selectedTower);
  }

  getButtons(): Phaser.GameObjects.Text[] {
    return [
      ...this.towerButtons.getButtons(),
      ...this.controlButtons.getButtons(),
      ...this.towerActionButtons.getButtons(),
      this.researchButton.getButton()
    ];
  }

  setPaused(paused: boolean): void {
    this.controlButtons.setPaused(paused);
  }

  setAutoWave(enabled: boolean): void {
    this.controlButtons.setAutoWave(enabled);
  }

  toggleResearchOverlay(): void {
    this.researchOverlay.toggle();
  }

  showResearchButtonPulse(): void {
    this.researchButton.showPulse();
  }

  hideResearchButtonPulse(): void {
    this.researchButton.hidePulse();
  }

  getGold(): number {
    return this.gold;
  }

  getLives(): number {
    return this.lives;
  }

  getWave(): number {
    return this.wave;
  }

  showRoomCode(roomCode: string): void {
    this.statsDisplay.showRoomCode(roomCode);
  }

  hideRoomCode(): void {
    this.statsDisplay.hideRoomCode();
  }
}
