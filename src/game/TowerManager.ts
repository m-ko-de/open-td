import { BaseTower, TowerFactory } from '../entities/towers';
import { BaseEnemy } from '../entities/enemies';
import { ConfigManager } from '../config/ConfigManager';

export class TowerManager {
  private scene: Phaser.Scene;
  private path: Phaser.Curves.Path;
  private towers: BaseTower[] = [];
  private preview: Phaser.GameObjects.Graphics | null = null;
  private selectedType: string | null = null;
  private selectedCost: number = 0;
  private selectedTower: BaseTower | null = null;

  constructor(scene: Phaser.Scene, path: Phaser.Curves.Path) {
    this.scene = scene;
    this.path = path;
    
    // Enable pointer events for tower selection
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleTowerClick(pointer);
    });
  }

  selectTower(type: string, cost: number): void {
    if (this.selectedType === type) {
      // Deselect
      this.selectedType = null;
      this.selectedCost = 0;
      this.clearPreview();
    } else {
      // Select new type
      this.selectedType = type;
      this.selectedCost = cost;
    }
  }

  deselectTower(): void {
    this.selectedType = null;
    this.selectedCost = 0;
    this.clearPreview();
  }

  updatePreview(pointer: Phaser.Input.Pointer): void {
    if (!this.selectedType) {
      this.clearPreview();
      return;
    }

    if (!this.preview) {
      this.preview = this.scene.add.graphics();
    }

    this.preview.clear();

    const isValid = this.isValidPosition(pointer.x, pointer.y);
    const color = isValid ? 0x00ff00 : 0xff0000;
    const alpha = 0.5;

    // Draw tower preview
    this.preview.fillStyle(color, alpha);
    this.preview.fillRect(pointer.x - 15, pointer.y - 15, 30, 30);
    this.preview.lineStyle(2, 0xffffff, alpha);
    this.preview.strokeRect(pointer.x - 15, pointer.y - 15, 30, 30);

    // Draw range
    const range = this.getTowerRange(this.selectedType);
    this.preview.lineStyle(2, color, alpha * 0.5);
    this.preview.strokeCircle(pointer.x, pointer.y, range);
  }

  tryPlaceTower(x: number, y: number, gold: number): { success: boolean; cost: number } {
    if (!this.selectedType || gold < this.selectedCost) {
      return { success: false, cost: 0 };
    }

    if (!this.isValidPosition(x, y)) {
      return { success: false, cost: 0 };
    }

    const tower = TowerFactory.createTower(this.scene, x, y, this.selectedType, this.selectedCost);
    this.towers.push(tower);

    const cost = this.selectedCost;
    this.selectedType = null;
    this.selectedCost = 0;
    this.clearPreview();

    return { success: true, cost };
  }

  update(time: number, enemies: BaseEnemy[]): void {
    // Update towers
    this.towers.forEach((tower) => {
      tower.update(time, enemies);
    });
  }

  private isValidPosition(x: number, y: number): boolean {
    // Check distance from path (reduced from 60 to 45 for tighter spaces)
    const points = this.path.getPoints(100);
    for (const point of points) {
      const distance = Phaser.Math.Distance.Between(x, y, point.x, point.y);
      if (distance < 45) {
        return false;
      }
    }

    // Check distance from other towers (reduced from 80 to 65)
    for (const tower of this.towers) {
      const distance = Phaser.Math.Distance.Between(x, y, tower.x, tower.y);
      if (distance < 65) {
        return false;
      }
    }

    return true;
  }

  private getTowerRange(type: string): number {
    switch (type) {
      case 'fast':
        return 120;
      case 'strong':
        return 180;
      case 'frost':
        return 140;
      case 'splash':
        return 120;
      case 'sniper':
        return 250;
      default:
        return 150;
    }
  }

  private clearPreview(): void {
    if (this.preview) {
      this.preview.destroy();
      this.preview = null;
    }
  }

  getSelectedType(): string | null {
    return this.selectedType;
  }

  addTowerFromServer(x: number, y: number, type: string, level: number, id?: string): void {
    // Add a tower that was placed via multiplayer server
    // Get the correct cost from config so upgrade costs calculate properly
    const config = ConfigManager.getInstance().getConfig();
    const towerConfig = config.towers[type];
    const cost = towerConfig ? towerConfig.cost : 0;
    
    const tower = TowerFactory.createTower(this.scene, x, y, type, cost);
    if (id) {
      tower.id = id; // Set server-assigned ID
    }
    // Upgrade tower to correct level
    for (let i = 1; i < level; i++) {
      tower.upgrade(); // Server already handled cost
    }
    this.towers.push(tower);
  }

  private handleTowerClick(pointer: Phaser.Input.Pointer): void {
    // Check if we're in placement mode
    if (this.selectedType) {
      return; // Let placement handle this
    }

    // Check if we clicked on a tower
    for (const tower of this.towers) {
      const distance = Phaser.Math.Distance.Between(pointer.x, pointer.y, tower.x, tower.y);
      if (distance < 25) {
        this.selectedTower = tower;
        return;
      }
    }

    // Clicked elsewhere, deselect
    this.selectedTower = null;
  }

  tryUpgradeTower(gold: number): { success: boolean; cost: number } {
    if (!this.selectedTower || !this.selectedTower.canUpgrade()) {
      return { success: false, cost: 0 };
    }

    const cost = this.selectedTower.getUpgradeCost();
    if (gold < cost) {
      return { success: false, cost: 0 };
    }

    this.selectedTower.upgrade();
    return { success: true, cost };
  }

  trySellTower(): { success: boolean; refund: number } {
    if (!this.selectedTower) {
      return { success: false, refund: 0 };
    }

    const refund = this.selectedTower.getSellValue();
    
    // Remove tower from array
    const index = this.towers.indexOf(this.selectedTower);
    if (index > -1) {
      this.towers.splice(index, 1);
    }
    
    // Destroy tower
    this.selectedTower.destroy();
    this.selectedTower = null;
    
    return { success: true, refund };
  }

  getSelectedTower(): BaseTower | null {
    return this.selectedTower;
  }

  upgradeTowerById(towerId: string, level: number): void {
    const tower = this.towers.find(t => t.id === towerId);
    if (tower) {
      console.log(`🔧 Upgrading tower ${towerId} to level ${level}`);
      // Upgrade tower to the specified level
      while (tower.getUpgradeLevel() < level && tower.canUpgrade()) {
        tower.upgrade();
      }
    } else {
      console.error(`❌ Tower ${towerId} not found for upgrade`);
      console.log('Available towers:', this.towers.map(t => ({ id: t.id, x: t.x, y: t.y })));
    }
  }

  sellTowerById(towerId: string): void {
    const tower = this.towers.find(t => t.id === towerId);
    if (tower) {
      const index = this.towers.indexOf(tower);
      if (index > -1) {
        this.towers.splice(index, 1);
      }
      tower.destroy();
    }
  }

  cleanup(): void {
    this.towers.forEach(tower => tower.destroy());
    this.towers = [];
    this.clearPreview();
    this.selectedTower = null;
  }
}
