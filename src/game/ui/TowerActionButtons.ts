/**
 * Manages tower upgrade and sell buttons
 */
export class TowerActionButtons {
  private upgradeButton: Phaser.GameObjects.Text;
  private sellButton: Phaser.GameObjects.Text;
  private towerInfoText: Phaser.GameObjects.Text;
  private gold: number;

  constructor(
    scene: Phaser.Scene,
    gold: number,
    onUpgradeTower: () => void,
    onSellTower: () => void
  ) {
    this.gold = gold;
    const width = scene.cameras.main.width;
    const height = scene.cameras.main.height;

    // Tower info text
    this.towerInfoText = scene.add.text(
      width / 2,
      height - 220,
      '',
      {
        font: '20px Arial',
        color: '#ffffff',
        backgroundColor: '#333333',
        padding: { x: 20, y: 10 },
        align: 'center',
      }
    );
    this.towerInfoText.setOrigin(0.5);
    this.towerInfoText.setVisible(false);

    // Upgrade button
    this.upgradeButton = scene.add.text(
      width / 2,
      height - 160,
      'Upgrade-Turm\n(Wähle einen Turm)',
      {
        font: '18px Arial',
        color: '#ffffff',
        backgroundColor: '#ff9900',
        padding: { x: 15, y: 10 },
        align: 'center',
      }
    );
    this.upgradeButton.setOrigin(0.5);
    this.upgradeButton.setInteractive({ useHandCursor: true });
    this.upgradeButton.setVisible(false);

    this.upgradeButton.on('pointerover', () => {
      this.upgradeButton.setStyle({ backgroundColor: '#ffaa00' });
    });

    this.upgradeButton.on('pointerout', () => {
      this.upgradeButton.setStyle({ backgroundColor: '#ff9900' });
    });

    this.upgradeButton.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      onUpgradeTower();
    });

    // Sell button
    this.sellButton = scene.add.text(
      width / 2 + 150,
      height - 160,
      'Verkaufen\n(90% zurück)',
      {
        font: '18px Arial',
        color: '#ffffff',
        backgroundColor: '#cc0000',
        padding: { x: 15, y: 10 },
        align: 'center',
      }
    );
    this.sellButton.setOrigin(0.5);
    this.sellButton.setInteractive({ useHandCursor: true });
    this.sellButton.setVisible(false);

    this.sellButton.on('pointerover', () => {
      this.sellButton.setStyle({ backgroundColor: '#ff0000' });
    });

    this.sellButton.on('pointerout', () => {
      this.sellButton.setStyle({ backgroundColor: '#cc0000' });
    });

    this.sellButton.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      onSellTower();
    });
  }

  updateGold(gold: number): void {
    this.gold = gold;
  }

  updateForTower(selectedTower: any): void {
    if (!selectedTower) {
      this.upgradeButton.setVisible(false);
      this.sellButton.setVisible(false);
      this.towerInfoText.setVisible(false);
      return;
    }

    // Show tower info
    const towerType = selectedTower.getType();
    const towerName = this.getTowerDisplayName(towerType);
    const level = selectedTower.getUpgradeLevel();
    const damage = Math.round(selectedTower.getDamage());
    const range = Math.round(selectedTower.getRange());
    
    this.towerInfoText.setText(`${towerName} (Level ${level})\nSchaden: ${damage} | Reichweite: ${range}`);
    this.towerInfoText.setVisible(true);

    // Show sell button
    const sellValue = selectedTower.getSellValue();
    this.sellButton.setText(`Verkaufen\n${sellValue}G\n(90% zurück)`);
    this.sellButton.setVisible(true);

    // Show upgrade button if tower can be upgraded
    if (!selectedTower.canUpgrade()) {
      this.upgradeButton.setVisible(false);
      return;
    }

    const cost = selectedTower.getUpgradeCost();
    
    this.upgradeButton.setText(`Upgrade Turm\nLevel ${level} → ${level + 1}\nKosten: ${cost}G`);
    this.upgradeButton.setVisible(true);

    // Update color based on affordability
    if (this.gold >= cost) {
      this.upgradeButton.setStyle({ backgroundColor: '#ff9900' });
    } else {
      this.upgradeButton.setStyle({ backgroundColor: '#666666' });
    }
  }

  getButtons(): Phaser.GameObjects.Text[] {
    return [this.upgradeButton, this.sellButton];
  }

  private getTowerDisplayName(type: string): string {
    const names: Record<string, string> = {
      'basic': 'Basis-Turm',
      'fast': 'Schnell-Turm',
      'strong': 'Stark-Turm',
      'sniper': 'Sniper-Turm',
      'splash': 'Splash-Turm',
      'frost': 'Frost-Turm',
      'fire': 'Feuer-Turm'
    };
    return names[type] || type;
  }
}
