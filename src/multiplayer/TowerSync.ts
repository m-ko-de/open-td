import { NetworkManager } from '../network/NetworkManager';
import { TowerData } from '../server/types';

/**
 * Manages tower synchronization between client and server
 * Handles tower placement, upgrades, and selling through the network
 */
export class TowerSync {
  private networkManager: NetworkManager;
  private onTowerPlaced: (tower: TowerData) => void;
  private onTowerUpgraded: (towerId: string, level: number) => void;
  private onTowerSold: (towerId: string, refund: number) => void;

  constructor(
    onTowerPlaced: (tower: TowerData) => void,
    onTowerUpgraded: (towerId: string, level: number) => void,
    onTowerSold: (towerId: string, refund: number) => void
  ) {
    this.networkManager = NetworkManager.getInstance();
    this.onTowerPlaced = onTowerPlaced;
    this.onTowerUpgraded = onTowerUpgraded;
    this.onTowerSold = onTowerSold;
    this.setupListeners();
  }

  private setupListeners(): void {
    this.networkManager.on('game:towerPlaced', (tower: TowerData) => {
      this.onTowerPlaced(tower);
    });

    this.networkManager.on('game:towerUpgraded', (data: { towerId: string; level: number }) => {
      this.onTowerUpgraded(data.towerId, data.level);
    });

    this.networkManager.on('game:towerSold', (data: { towerId: string; refund: number }) => {
      this.onTowerSold(data.towerId, data.refund);
    });
  }

  public requestPlaceTower(type: string, x: number, y: number): void {
    this.networkManager.placeTower(type, x, y);
  }

  public requestUpgradeTower(towerId: string): void {
    this.networkManager.upgradeTower(towerId);
  }

  public requestSellTower(towerId: string): void {
    this.networkManager.sellTower(towerId);
  }

  public cleanup(): void {
    // Cleanup listeners if needed
  }
}
