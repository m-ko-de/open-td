import { InputFieldHelper } from './InputFieldHelper';
import { PersistenceManager } from '../../client/PersistenceManager';

/**
 * RoomCreationUI - Handles room creation interface
 */
export class RoomCreationUI {
  private playerNameInput: HTMLInputElement | null = null;

  constructor(private scene: Phaser.Scene) {}

  show(
    centerX: number,
    createBoxY: number,
    onCreate: (playerName: string) => void
  ): HTMLInputElement {
    // Create Room Box
    const createBox = this.scene.add.graphics();
    createBox.fillStyle(0x2c3e50, 1);
    createBox.fillRoundedRect(centerX - 250, createBoxY, 500, 200, 10);
    createBox.lineStyle(2, 0x34495e, 1);
    createBox.strokeRoundedRect(centerX - 250, createBoxY, 500, 200, 10);

    this.scene.add.text(centerX, createBoxY + 25, '🎮 Neuen Raum Erstellen', {
      fontSize: '26px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.scene.add.text(centerX, createBoxY + 50, 'Spielername:', {
      fontSize: '18px',
      color: '#ecf0f1'
    }).setOrigin(0.5);

    // Input field centered below label
    this.playerNameInput = InputFieldHelper.create(
      centerX - 120,
      createBoxY + 140,
      440,
      45,
      'Dein Name'
    );
    
    // Load saved player name from PersistenceManager
    const savedName = PersistenceManager.getInstance().getLocal<string>('playerName');
    if (savedName) {
      this.playerNameInput.value = savedName;
    }

    const createButton = this.scene.add.text(centerX, createBoxY + 160, 'Raum Erstellen', {
      fontSize: '22px',
      color: '#ffffff',
      backgroundColor: '#27ae60',
      padding: { x: 40, y: 12 }
    }).setOrigin(0.5).setInteractive();

    createButton.on('pointerdown', () => {
      const playerName = this.playerNameInput?.value.trim() || '';
      onCreate(playerName);
    });
    createButton.on('pointerover', () => createButton.setBackgroundColor('#229954'));
    createButton.on('pointerout', () => createButton.setBackgroundColor('#27ae60'));

    return this.playerNameInput;
  }

  cleanup(): void {
    if (this.playerNameInput) {
      InputFieldHelper.removeAll([this.playerNameInput]);
      this.playerNameInput = null;
    }
  }
}
