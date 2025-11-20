/**
 * RoomLobbyUI - Displays room lobby with player list
 */
export class RoomLobbyUI {
  private playerListText: Phaser.GameObjects.Text | null = null;

  constructor(private scene: Phaser.Scene) {}

  show(
    centerX: number,
    roomCode: string,
    isHost: boolean,
    isReady: boolean,
    onReady: () => void,
    onStart: () => void,
    onLeave: () => void
  ): { playerListText: Phaser.GameObjects.Text; readyButton: Phaser.GameObjects.Text } {
    
    // Room info box
    const infoBoxY = 130;
    const infoBox = this.scene.add.graphics();
    infoBox.fillStyle(0x2c3e50, 1);
    infoBox.fillRoundedRect(centerX - 300, infoBoxY, 600, 100, 10);
    infoBox.lineStyle(3, 0x27ae60, 1);
    infoBox.strokeRoundedRect(centerX - 300, infoBoxY, 600, 100, 10);

    this.scene.add.text(centerX, infoBoxY + 25, 'Raum-Code:', {
      fontSize: '20px',
      color: '#bdc3c7'
    }).setOrigin(0.5);

    this.scene.add.text(centerX, infoBoxY + 60, roomCode, {
      fontSize: '36px',
      color: '#27ae60',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Player list box
    const playerBoxY = 260;
    const playerBox = this.scene.add.graphics();
    playerBox.fillStyle(0x2c3e50, 1);
    playerBox.fillRoundedRect(centerX - 300, playerBoxY, 600, 220, 10);
    playerBox.lineStyle(2, 0x34495e, 1);
    playerBox.strokeRoundedRect(centerX - 300, playerBoxY, 600, 220, 10);

    this.scene.add.text(centerX, playerBoxY + 25, '👥 Spieler', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.playerListText = this.scene.add.text(centerX, playerBoxY + 70, 'Lade Spielerliste...', {
      fontSize: '20px',
      color: '#ecf0f1',
      align: 'center',
      lineSpacing: 12
    }).setOrigin(0.5, 0);

    // Action buttons
    const buttonY = 520;
    
    // Ready button
    const readyX = isHost ? centerX - 160 : centerX;
    const readyButton = this.scene.add.text(readyX, buttonY, isReady ? '✓ Bereit' : 'Bereit?', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: isReady ? '#27ae60' : '#95a5a6',
      padding: { x: 35, y: 15 }
    }).setOrigin(0.5).setInteractive();

    readyButton.on('pointerdown', onReady);
    readyButton.on('pointerover', () => {
      readyButton.setBackgroundColor(isReady ? '#229954' : '#7f8c8d');
    });
    readyButton.on('pointerout', () => {
      readyButton.setBackgroundColor(isReady ? '#27ae60' : '#95a5a6');
    });

    // Start button (host only)
    if (isHost) {
      const startButton = this.scene.add.text(centerX + 160, buttonY, 'Starten', {
        fontSize: '24px',
        color: '#ffffff',
        backgroundColor: '#f39c12',
        padding: { x: 35, y: 15 }
      }).setOrigin(0.5).setInteractive();

      startButton.on('pointerdown', onStart);
      startButton.on('pointerover', () => startButton.setBackgroundColor('#e67e22'));
      startButton.on('pointerout', () => startButton.setBackgroundColor('#f39c12'));
    }

    // Leave button
    const leaveButton = this.scene.add.text(centerX, buttonY + 80, '← Verlassen', {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#e74c3c',
      padding: { x: 30, y: 12 }
    }).setOrigin(0.5).setInteractive();

    leaveButton.on('pointerdown', onLeave);
    leaveButton.on('pointerover', () => leaveButton.setBackgroundColor('#c0392b'));
    leaveButton.on('pointerout', () => leaveButton.setBackgroundColor('#e74c3c'));

    return { playerListText: this.playerListText, readyButton };
  }

  updatePlayerList(players: Map<string, any>): void {
    if (!this.playerListText) return;

    if (players.size === 0) {
      this.playerListText.setText('Keine Spieler im Raum');
      return;
    }

    const playerList = Array.from(players.values())
      .map(player => {
        const readyIndicator = player.ready ? '✓' : '○';
        const hostIndicator = player.isHost ? ' 👑' : '';
        return `${readyIndicator} ${player.name}${hostIndicator}`;
      })
      .join('\n');

    this.playerListText.setText(playerList);
  }
}
