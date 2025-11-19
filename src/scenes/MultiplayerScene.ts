import Phaser from 'phaser';
import { ConfigManager } from '../config/ConfigManager';
import { NetworkManager } from '../network/NetworkManager';

export class MultiplayerScene extends Phaser.Scene {
  private networkManager: NetworkManager;
  private config: any;
  
  // UI Elements
  private playerNameInput: HTMLInputElement | null = null;
  private roomCodeInput: HTMLInputElement | null = null;
  private statusText: Phaser.GameObjects.Text | null = null;
  private playerListText: Phaser.GameObjects.Text | null = null;
  private readyButton: Phaser.GameObjects.Text | null = null;
  private startButton: Phaser.GameObjects.Text | null = null;
  
  private players: Map<string, any> = new Map();
  private isReady: boolean = false;
  private currentRoomCode: string | null = null;

  constructor() {
    super({ key: 'MultiplayerScene' });
    this.networkManager = NetworkManager.getInstance();
  }

  init(): void {
    // Cleanup any leftover inputs from previous sessions
    this.cleanupInputs();
  }

  create(): void {
    this.config = ConfigManager.getInstance().getConfig();
    
    const centerX = this.cameras.main.centerX;

    // Title
    this.add.text(centerX, 50, 'Multiplayer Lobby', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Check if already connected
    if (!this.networkManager.isConnected()) {
      this.connectToServer();
    } else {
      this.showLobbyUI();
    }
  }

  private async connectToServer(): Promise<void> {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    const connectingText = this.add.text(centerX, centerY, 'Verbinde mit Server...', {
      fontSize: '24px',
      color: '#ffff00'
    }).setOrigin(0.5);

    try {
      // Try to connect to local server
      const serverUrl = `http://localhost:${this.config.multiplayer.serverPort}`;
      await this.networkManager.connect(serverUrl);
      
      connectingText.destroy();
      this.showLobbyUI();
    } catch (error) {
      connectingText.setText('❌ Server nicht erreichbar!\n\nStarte Server mit: pnpm server');
      connectingText.setColor('#ff0000');
      
      // Back button
      const backButton = this.add.text(centerX, centerY + 100, '< Zurück zum Menü', {
        fontSize: '24px',
        color: '#ffffff',
        backgroundColor: '#333333',
        padding: { x: 20, y: 10 }
      }).setOrigin(0.5).setInteractive();

      backButton.on('pointerdown', () => {
        this.cleanupInputs();
        this.scene.start('MainMenuScene');
      });

      backButton.on('pointerover', () => {
        backButton.setBackgroundColor('#555555');
      });

      backButton.on('pointerout', () => {
        backButton.setBackgroundColor('#333333');
      });
    }
  }

  private showLobbyUI(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const centerX = width / 2;

    // If already in a room, show room UI
    if (this.networkManager.getCurrentRoom()) {
      this.showRoomUI();
      return;
    }

    // Back button at top left
    const backButton = this.add.text(30, 30, '◀ Zurück', {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 15, y: 10 }
    }).setInteractive();

    backButton.on('pointerdown', () => {
      this.cleanupInputs();
      this.networkManager.disconnect();
      this.scene.start('MainMenuScene');
    });

    backButton.on('pointerover', () => backButton.setBackgroundColor('#555555'));
    backButton.on('pointerout', () => backButton.setBackgroundColor('#333333'));

    // Main container - Create Room Section
    const createBoxY = 150;
    
    // Create Room Box
    const createBox = this.add.graphics();
    createBox.fillStyle(0x2c3e50, 1);
    createBox.fillRoundedRect(centerX - 250, createBoxY, 500, 200, 10);
    createBox.lineStyle(2, 0x34495e, 1);
    createBox.strokeRoundedRect(centerX - 250, createBoxY, 500, 200, 10);

    this.add.text(centerX, createBoxY + 25, '🎮 Neuen Raum Erstellen', {
      fontSize: '26px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(centerX, createBoxY + 50, 'Spielername:', {
      fontSize: '18px',
      color: '#ecf0f1'
    }).setOrigin(0.5);

    // Input field centered below label
    this.playerNameInput = this.createInput(centerX - 120, createBoxY + 140, 440, 45, 'Dein Name');
    
    // Load saved player name from localStorage
    const savedName = localStorage.getItem('openTD_playerName');
    if (savedName) {
      this.playerNameInput.value = savedName;
    }

    const createButton = this.add.text(centerX, createBoxY + 160, 'Raum Erstellen', {
      fontSize: '22px',
      color: '#ffffff',
      backgroundColor: '#27ae60',
      padding: { x: 40, y: 12 }
    }).setOrigin(0.5).setInteractive();

    createButton.on('pointerdown', () => this.handleCreateRoom());
    createButton.on('pointerover', () => createButton.setBackgroundColor('#229954'));
    createButton.on('pointerout', () => createButton.setBackgroundColor('#27ae60'));

    // Separator
    this.add.text(centerX, createBoxY + 230, 'oder', {
      fontSize: '18px',
      color: '#7f8c8d',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    // Join Room Box
    const joinBoxY = createBoxY + 270;
    
    const joinBox = this.add.graphics();
    joinBox.fillStyle(0x2c3e50, 1);
    joinBox.fillRoundedRect(centerX - 250, joinBoxY, 500, 200, 10);
    joinBox.lineStyle(2, 0x34495e, 1);
    joinBox.strokeRoundedRect(centerX - 250, joinBoxY, 500, 200, 10);

    this.add.text(centerX, joinBoxY + 25, '🚪 Raum Beitreten', {
      fontSize: '26px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(centerX, joinBoxY + 60, 'Raum-Code: (z.B. bear-lamp)', {
      fontSize: '18px',
      color: '#ecf0f1'
    }).setOrigin(0.5);

    // Input field centered below label
    this.roomCodeInput = this.createInput(centerX - 110, joinBoxY + 220, 440, 45, 'Raum-Code eingeben');

    const joinButton = this.add.text(centerX, joinBoxY + 160, 'Beitreten', {
      fontSize: '22px',
      color: '#ffffff',
      backgroundColor: '#3498db',
      padding: { x: 40, y: 12 }
    }).setOrigin(0.5).setInteractive();

    joinButton.on('pointerdown', () => this.handleJoinRoom());
    joinButton.on('pointerover', () => joinButton.setBackgroundColor('#2980b9'));
    joinButton.on('pointerout', () => joinButton.setBackgroundColor('#3498db'));

    // Status text at bottom
    this.statusText = this.add.text(centerX, height - 40, '', {
      fontSize: '18px',
      color: '#e74c3c',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Setup network event listeners
    this.setupNetworkListeners();
  }

  private showRoomUI(): void {
    // Clear previous UI and HTML inputs
    this.cleanupInputs();
    this.children.removeAll();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const centerX = width / 2;

    // Title
    this.add.text(centerX, 50, 'Multiplayer Lobby', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Room info box
    const infoBoxY = 130;
    const infoBox = this.add.graphics();
    infoBox.fillStyle(0x2c3e50, 1);
    infoBox.fillRoundedRect(centerX - 300, infoBoxY, 600, 100, 10);
    infoBox.lineStyle(3, 0x27ae60, 1);
    infoBox.strokeRoundedRect(centerX - 300, infoBoxY, 600, 100, 10);

    this.add.text(centerX, infoBoxY + 25, 'Raum-Code:', {
      fontSize: '20px',
      color: '#bdc3c7'
    }).setOrigin(0.5);

    this.add.text(centerX, infoBoxY + 60, this.currentRoomCode || '...', {
      fontSize: '36px',
      color: '#27ae60',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Player list box
    const playerBoxY = 260;
    const playerBox = this.add.graphics();
    playerBox.fillStyle(0x2c3e50, 1);
    playerBox.fillRoundedRect(centerX - 300, playerBoxY, 600, 220, 10);
    playerBox.lineStyle(2, 0x34495e, 1);
    playerBox.strokeRoundedRect(centerX - 300, playerBoxY, 600, 220, 10);

    this.add.text(centerX, playerBoxY + 25, '👥 Spieler', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.playerListText = this.add.text(centerX, playerBoxY + 70, 'Lade Spielerliste...', {
      fontSize: '20px',
      color: '#ecf0f1',
      align: 'center',
      lineSpacing: 12
    }).setOrigin(0.5, 0);

    // Action buttons
    const buttonY = 520;
    const isHost = this.networkManager.getIsHost();
    
    // Ready button
    const readyX = isHost ? centerX - 160 : centerX;
    this.readyButton = this.add.text(readyX, buttonY, this.isReady ? '✓ Bereit' : 'Bereit?', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: this.isReady ? '#27ae60' : '#95a5a6',
      padding: { x: 35, y: 15 }
    }).setOrigin(0.5).setInteractive();

    this.readyButton.on('pointerdown', () => this.toggleReady());
    this.readyButton.on('pointerover', () => {
      if (!this.isReady) this.readyButton!.setBackgroundColor('#7f8c8d');
    });
    this.readyButton.on('pointerout', () => {
      if (!this.isReady) this.readyButton!.setBackgroundColor('#95a5a6');
    });

    // Start button (host only)
    if (isHost) {
      this.startButton = this.add.text(centerX + 160, buttonY, '🚀 Starten', {
        fontSize: '24px',
        color: '#ffffff',
        backgroundColor: '#3498db',
        padding: { x: 35, y: 15 }
      }).setOrigin(0.5).setInteractive();

      this.startButton.on('pointerdown', () => this.handleStartGame());
      this.startButton.on('pointerover', () => this.startButton!.setBackgroundColor('#2980b9'));
      this.startButton.on('pointerout', () => this.startButton!.setBackgroundColor('#3498db'));
    }

    // Leave button
    const leaveButton = this.add.text(centerX, buttonY + 80, '← Verlassen', {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#e74c3c',
      padding: { x: 30, y: 12 }
    }).setOrigin(0.5).setInteractive();

    leaveButton.on('pointerdown', () => this.handleLeaveRoom());
    leaveButton.on('pointerover', () => leaveButton.setBackgroundColor('#c0392b'));
    leaveButton.on('pointerout', () => leaveButton.setBackgroundColor('#e74c3c'));

    // Status text
    this.statusText = this.add.text(centerX, height - 40, '', {
      fontSize: '18px',
      color: '#e74c3c',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.updatePlayerList();
  }

  private createInput(x: number, y: number, width: number, height: number, placeholder: string): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = placeholder;
    input.autocomplete = 'on';
    input.style.position = 'absolute';
    input.style.left = `${x}px`;
    input.style.top = `${y}px`;
    input.style.width = `${width}px`;
    input.style.height = `${height}px`;
    input.style.fontSize = '18px';
    input.style.padding = '10px 15px';
    input.style.border = '2px solid #3498db';
    input.style.borderRadius = '8px';
    input.style.backgroundColor = '#34495e';
    input.style.color = '#ecf0f1';
    input.style.boxSizing = 'border-box';
    input.style.textAlign = 'center';
    input.style.fontFamily = 'Arial, sans-serif';
    input.style.outline = 'none';
    input.style.transition = 'all 0.3s';
    
    // Focus effect
    input.addEventListener('focus', () => {
      input.style.borderColor = '#2ecc71';
      input.style.backgroundColor = '#2c3e50';
    });
    
    input.addEventListener('blur', () => {
      input.style.borderColor = '#3498db';
      input.style.backgroundColor = '#34495e';
    });
    
    document.body.appendChild(input);
    return input;
  }

  private setupNetworkListeners(): void {
    this.networkManager.on('room:joined', (data: any) => {
      this.currentRoomCode = data.code;
      this.players.clear();
      data.players.forEach((player: any) => {
        this.players.set(player.id, player);
      });
      this.showRoomUI();
    });

    this.networkManager.on('room:playerJoined', (player: any) => {
      this.players.set(player.id, player);
      this.updatePlayerList();
      this.showStatus(`${player.name} ist beigetreten!`, '#2ecc71');
    });

    this.networkManager.on('room:playerReady', (data: any) => {
      const player = this.players.get(data.playerId);
      if (player) {
        player.isReady = data.isReady;
        this.updatePlayerList();
        console.log(`Player ${data.name} ready status: ${data.isReady}`);
      }
    });

    this.networkManager.on('room:playerLeft', (playerId: string) => {
      const player = this.players.get(playerId);
      if (player) {
        this.showStatus(`${player.name} hat den Raum verlassen.`, '#e74c3c');
        this.players.delete(playerId);
        this.updatePlayerList();
      }
    });

    this.networkManager.on('room:error', (message: string) => {
      this.showStatus(`Fehler: ${message}`, '#e74c3c');
    });

    this.networkManager.on('game:started', () => {
      this.showStatus('Spiel startet...', '#2ecc71');
      this.time.delayedCall(1000, () => {
        this.cleanupInputs();
        this.scene.start('GameScene', { 
          multiplayer: true,
          roomCode: this.currentRoomCode 
        });
      });
    });

    this.networkManager.on('disconnect', () => {
      this.showStatus('Verbindung zum Server verloren!', '#e74c3c');
      this.time.delayedCall(3000, () => {
        this.cleanupInputs();
        this.scene.start('MainMenuScene');
      });
    });
  }

  private async handleCreateRoom(): Promise<void> {
    const playerName = this.playerNameInput?.value.trim() || '';
    
    if (!playerName) {
      this.showStatus('Bitte gib einen Namen ein!', '#e74c3c');
      return;
    }

    if (playerName.length < 2 || playerName.length > 20) {
      this.showStatus('Name muss 2-20 Zeichen lang sein!', '#e74c3c');
      return;
    }

    // Save player name to localStorage
    localStorage.setItem('openTD_playerName', playerName);

    this.showStatus('Erstelle Raum...', '#ffff00');

    try {
      const roomCode = await this.networkManager.createRoom(playerName);
      this.currentRoomCode = roomCode;
      this.showStatus(`Raum erstellt: ${roomCode}`, '#2ecc71');
    } catch (error: any) {
      this.showStatus(`Fehler: ${error.message}`, '#e74c3c');
    }
  }

  private async handleJoinRoom(): Promise<void> {
    const playerName = this.playerNameInput?.value.trim() || '';
    const roomCode = this.roomCodeInput?.value.trim().toLowerCase() || '';
    
    if (!playerName) {
      this.showStatus('Bitte gib einen Namen ein!', '#e74c3c');
      return;
    }

    if (!roomCode) {
      this.showStatus('Bitte gib einen Raum-Code ein!', '#e74c3c');
      return;
    }

    // Validate format: word-word (e.g., "bear-lamp")
    if (!/^[a-z]{2,4}-[a-z]{2,4}$/.test(roomCode)) {
      this.showStatus('Raum-Code Format: wort-wort (z.B. bear-lamp)', '#e74c3c');
      return;
    }

    // Save player name to localStorage
    localStorage.setItem('openTD_playerName', playerName);

    this.showStatus('Trete Raum bei...', '#ffff00');

    try {
      await this.networkManager.joinRoom(roomCode, playerName);
      this.currentRoomCode = roomCode;
      this.showStatus(`Raum beigetreten: ${roomCode}`, '#2ecc71');
    } catch (error: any) {
      this.showStatus(`Fehler: ${error.message}`, '#e74c3c');
    }
  }

  private handleLeaveRoom(): void {
    this.networkManager.leaveRoom();
    this.players.clear();
    this.currentRoomCode = null;
    this.isReady = false;
    this.cleanupInputs();
    this.children.removeAll();
    this.create();
  }

  private toggleReady(): void {
    this.isReady = !this.isReady;
    console.log('Toggle ready:', this.isReady);
    this.networkManager.setReady(this.isReady);
    
    if (this.readyButton) {
      this.readyButton.setText(this.isReady ? '✓ Bereit' : 'Bereit?');
      this.readyButton.setBackgroundColor(this.isReady ? '#27ae60' : '#95a5a6');
    }
  }

  private handleStartGame(): void {
    // Check if all players are ready
    const playerArray = Array.from(this.players.values());
    const allReady = playerArray.every((p: any) => p.isReady || p.isHost);
    
    // Debug: Show player status
    console.log('Players:', playerArray.map((p: any) => ({ 
      name: p.name, 
      isHost: p.isHost, 
      isReady: p.isReady 
    })));
    console.log('All ready?', allReady);
    
    if (!allReady) {
      this.showStatus('Nicht alle Spieler sind bereit!', '#e74c3c');
      return;
    }

    if (this.players.size < 1) {
      this.showStatus('Mindestens 1 Spieler benötigt!', '#e74c3c');
      return;
    }

    console.log('Starting game...');
    this.networkManager.startGame();
  }

  private updatePlayerList(): void {
    if (!this.playerListText) return;

    let listText = '';
    Array.from(this.players.values()).forEach((player: any, index: number) => {
      const hostBadge = player.isHost ? ' 👑' : '';
      const readyBadge = player.isReady ? ' ✓' : player.isHost ? '' : ' ⏳';
      
      listText += `${index + 1}. ${player.name}${hostBadge}${readyBadge}\n`;
    });

    this.playerListText.setText(listText || 'Keine Spieler');
  }

  private showStatus(message: string, color: string): void {
    if (this.statusText) {
      this.statusText.setText(message);
      this.statusText.setColor(color);
    }
  }

  private cleanupInputs(): void {
    if (this.playerNameInput && this.playerNameInput.parentNode) {
      this.playerNameInput.parentNode.removeChild(this.playerNameInput);
      this.playerNameInput = null;
    }
    if (this.roomCodeInput && this.roomCodeInput.parentNode) {
      this.roomCodeInput.parentNode.removeChild(this.roomCodeInput);
      this.roomCodeInput = null;
    }
  }

  shutdown(): void {
    this.cleanupInputs();
  }
}
