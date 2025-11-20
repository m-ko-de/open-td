import { TowerManager } from '../../game/TowerManager';
import { GameUI } from '../../game/GameUI';

/**
 * TowerActionHandler - Handles tower placement, upgrade, and selling
 */
export class TowerActionHandler {
  constructor(
    private towerManager: TowerManager,
    private ui: GameUI,
    private onGoldChange: (amount: number) => void,
    private onNotification: (type: 'upgrade' | 'sell', refund?: number) => void
  ) {}

  selectTower(type: string, cost: number): void {
    this.towerManager.selectTower(type, cost);
    this.ui.updateButtonStyles(this.towerManager.getSelectedType() || undefined);
  }

  tryPlaceTower(x: number, y: number, gold: number): boolean {
    const result = this.towerManager.tryPlaceTower(x, y, gold);
    if (result.success) {
      this.onGoldChange(-result.cost);
      this.ui.updateButtonStyles();
      return true;
    }
    return false;
  }

  tryUpgradeTower(gold: number): boolean {
    const result = this.towerManager.tryUpgradeTower(gold);
    if (result.success) {
      this.onGoldChange(-result.cost);
      this.onNotification('upgrade');
      return true;
    }
    return false;
  }

  trySellTower(): boolean {
    const result = this.towerManager.trySellTower();
    if (result.success) {
      this.onGoldChange(result.refund);
      this.onNotification('sell', result.refund);
      return true;
    }
    return false;
  }

  getSelectedTower(): any {
    return this.towerManager.getSelectedTower();
  }

  deselectTower(): void {
    this.towerManager.deselectTower();
  }
}
