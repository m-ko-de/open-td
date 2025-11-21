import { ConfigManager } from '../../config/ConfigManager';
import { ResearchManager } from '../ResearchManager';

/**
 * Manages tower selection buttons at the bottom of the screen
 */
export class TowerButtonPanel {
  private scene: Phaser.Scene;
  private buttons: Phaser.GameObjects.Text[] = [];
  private gold: number;
  private researchManager: ResearchManager;
  private onTowerSelect: (type: string, cost: number) => void;

  constructor(
    scene: Phaser.Scene,
    gold: number,
    researchManager: ResearchManager,
    onTowerSelect: (type: string, cost: number) => void
  ) {
    this.scene = scene;
    this.gold = gold;
    this.researchManager = researchManager;
    this.onTowerSelect = onTowerSelect;
    this.createButtons();
  }

  private createButtons(): void {
    const buttonY = this.scene.cameras.main.height - 80;
    const padding = 20;
    const buttonSpacing = 120;

    const config = ConfigManager.getInstance().getConfig();
    const towers = [
      { type: 'basic', label: config.towers.basic.name, cost: config.towers.basic.cost },
      { type: 'fast', label: config.towers.fast.name, cost: config.towers.fast.cost },
      { type: 'strong', label: config.towers.strong.name, cost: config.towers.strong.cost },
      { type: 'splash', label: config.towers.splash.name, cost: config.towers.splash.cost },
      { type: 'sniper', label: config.towers.sniper.name, cost: config.towers.sniper.cost },
      { type: 'frost', label: config.towers.frost.name, cost: config.towers.frost.cost, requiresResearch: config.towers.frost.requiresResearch, researchId: 'frost_tower' },
      { type: 'fire', label: config.towers.fire.name, cost: config.towers.fire.cost, requiresResearch: config.towers.fire.requiresResearch, researchId: 'fire_tower' },
    ];

    towers.forEach((tower, index) => {
      if (tower.requiresResearch && tower.researchId && !this.researchManager.isResearched(tower.researchId)) {
        return;
      }

      const button = this.scene.add.text(
        padding + index * buttonSpacing,
        buttonY,
        `${tower.label}\n${tower.cost}G`,
        {
          font: '16px Arial',
          color: '#ffffff',
          backgroundColor: '#333333',
          padding: { x: 10, y: 5 },
          align: 'center',
        }
      );
      button.setInteractive({ useHandCursor: true });
      button.setData('towerType', tower.type);
      button.setData('cost', tower.cost);

      button.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        pointer.event.stopPropagation();
        if (this.gold >= tower.cost) {
          this.onTowerSelect(tower.type, tower.cost);
        }
      });

      this.buttons.push(button);
    });
  }

  updateGold(gold: number): void {
    this.gold = gold;
    this.updateStyles();
  }

  updateStyles(selectedType?: string): void {
    this.buttons.forEach((btn) => {
      const btnType = btn.getData('towerType');
      const btnCost = btn.getData('cost');
      
      if (btnType === selectedType) {
        btn.setStyle({ backgroundColor: '#00aa00' });
      } else if (this.gold >= btnCost) {
        btn.setStyle({ backgroundColor: '#333333' });
      } else {
        btn.setStyle({ backgroundColor: '#333333' });
      }
    });
  }

  recreate(): void {
    this.buttons.forEach(btn => btn.destroy());
    this.buttons = [];
    this.createButtons();
  }

  getButtons(): Phaser.GameObjects.Text[] {
    return this.buttons;
  }
}
