import { InputFieldHelper } from './InputFieldHelper';

/**
 * RoomJoinUI - Handles room joining interface
 */
export class RoomJoinUI {
  private playerNameInput: HTMLInputElement | null = null;
  private roomCodeInput: HTMLInputElement | null = null;

  constructor(private scene: Phaser.Scene) {}

  show(
    centerX: number,
    joinBoxY: number,
    onJoin: (playerName: string, roomCode: string) => void
  ): { playerNameInput: HTMLInputElement; roomCodeInput: HTMLInputElement } {
    // Join Room Box
    const joinBox = this.scene.add.graphics();
    joinBox.fillStyle(0x2c3e50, 1);
    joinBox.fillRoundedRect(centerX - 250, joinBoxY, 500, 240, 10);
    joinBox.lineStyle(2, 0x34495e, 1);
    joinBox.strokeRoundedRect(centerX - 250, joinBoxY, 500, 240, 10);

    this.scene.add.text(centerX, joinBoxY + 25, '🚪 Raum Beitreten', {
      fontSize: '26px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.scene.add.text(centerX, joinBoxY + 60, 'Spielername:', {
      fontSize: '18px',
      color: '#ecf0f1'
    }).setOrigin(0.5);

    // Player name input
    this.playerNameInput = InputFieldHelper.create(
      centerX - 120,
      joinBoxY + 160,
      440,
      45,
      'Dein Name'
    );
    
    // Load saved player name
    const savedName = localStorage.getItem('openTD_playerName');
    if (savedName) {
      this.playerNameInput.value = savedName;
    }

    this.scene.add.text(centerX, joinBoxY + 100, 'Raum-Code: (z.B. bear-lamp)', {
      fontSize: '18px',
      color: '#ecf0f1'
    }).setOrigin(0.5);

    // Room code input
    this.roomCodeInput = InputFieldHelper.create(
      centerX - 110,
      joinBoxY + 260,
      440,
      45,
      'Raum-Code eingeben'
    );

    const joinButton = this.scene.add.text(centerX, joinBoxY + 200, 'Beitreten', {
      fontSize: '22px',
      color: '#ffffff',
      backgroundColor: '#3498db',
      padding: { x: 40, y: 12 }
    }).setOrigin(0.5).setInteractive();

    joinButton.on('pointerdown', () => {
      const playerName = this.playerNameInput?.value.trim() || '';
      const roomCode = this.roomCodeInput?.value.trim().toLowerCase() || '';
      onJoin(playerName, roomCode);
    });
    joinButton.on('pointerover', () => joinButton.setBackgroundColor('#2980b9'));
    joinButton.on('pointerout', () => joinButton.setBackgroundColor('#3498db'));

    return {
      playerNameInput: this.playerNameInput,
      roomCodeInput: this.roomCodeInput
    };
  }

  cleanup(): void {
    const inputs = [];
    if (this.playerNameInput) inputs.push(this.playerNameInput);
    if (this.roomCodeInput) inputs.push(this.roomCodeInput);
    
    if (inputs.length > 0) {
      InputFieldHelper.removeAll(inputs);
    }
    
    this.playerNameInput = null;
    this.roomCodeInput = null;
  }
}
