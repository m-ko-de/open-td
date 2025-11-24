import Phaser from 'phaser';
import { ConfigManager } from '../client/ConfigManager';
import { NetworkManager } from '../network/NetworkManager';
import { RoomLobbyUI } from './components/RoomLobbyUI';
import { RoomCreationUI } from './components/RoomCreationUI';
import { RoomJoinUI } from './components/RoomJoinUI';
import { NetworkEventSetup } from './components/NetworkEventSetup';
import { RoomActionHandler } from './components/RoomActionHandler';

export class MultiplayerScene extends Phaser.Scene {
  private networkManager: NetworkManager;
  private config: any;
  
  // UI Components
  private roomLobbyUI?: RoomLobbyUI;
  private roomCreationUI?: RoomCreationUI;
  private roomJoinUI?: RoomJoinUI;
  private networkEventSetup?: NetworkEventSetup;
  private roomActionHandler?: RoomActionHandler;
  
  // UI Elements
  private statusText: Phaser.GameObjects.Text | null = null;
  private readyButton: Phaser.GameObjects.Text | null = null;
  
  private players: Map<string, any> = new Map();
  private isReady: boolean = false;
  private currentRoomCode: string | null = null;

  constructor() {
    super({ key: 'MultiplayerScene' });
    this.networkManager = NetworkManager.getInstance();
  }

  init(): void {
    // Cleanup any leftover components from previous sessions
    this.cleanupComponents();
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
        this.cleanupComponents();
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

    // Initialize room action handler
    this.roomActionHandler = new RoomActionHandler(
      this.networkManager,
      (msg) => this.showStatus(msg, '#2ecc71'),
      (msg) => this.showStatus(msg, '#e74c3c'),
      (msg) => this.showStatus(msg, '#ffff00')
    );

    // Back button at top left
    const backButton = this.add.text(30, 30, '◀ Zurück', {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 15, y: 10 }
    }).setInteractive();

    backButton.on('pointerdown', () => {
      this.networkManager.disconnect();
      this.scene.start('MainMenuScene');
    });

    backButton.on('pointerover', () => backButton.setBackgroundColor('#555555'));
    backButton.on('pointerout', () => backButton.setBackgroundColor('#333333'));

    // Room Creation UI
    this.roomCreationUI = new RoomCreationUI(this);
    this.roomCreationUI.show(centerX, 150, async (playerName) => {
      const roomCode = await this.roomActionHandler!.createRoom(playerName);
      if (roomCode) {
        this.currentRoomCode = roomCode;
      }
    });

    // Separator
    this.add.text(centerX, 380, 'oder', {
      fontSize: '18px',
      color: '#7f8c8d',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    // Room Join UI
    this.roomJoinUI = new RoomJoinUI(this);
    this.roomJoinUI.show(centerX, 420, async (playerName, roomCode) => {
      const success = await this.roomActionHandler!.joinRoom(playerName, roomCode);
      if (success) {
        this.currentRoomCode = roomCode;
      }
    });

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
    // Clear previous UI and components
    this.cleanupComponents();
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

    // Create room lobby UI
    this.roomLobbyUI = new RoomLobbyUI(this);
    const { readyButton } = this.roomLobbyUI.show(
      centerX,
      this.currentRoomCode || '',
      this.networkManager.getIsHost(),
      this.isReady,
      () => this.toggleReady(),
      () => this.handleStartGame(),
      () => this.handleLeaveRoom()
    );

    this.readyButton = readyButton;

    // Status text
    this.statusText = this.add.text(centerX, height - 40, '', {
      fontSize: '18px',
      color: '#e74c3c',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.updatePlayerList();
  }



  private setupNetworkListeners(): void {
    this.networkEventSetup = new NetworkEventSetup(
      this.networkManager,
      (roomCode, players) => {
        this.currentRoomCode = roomCode;
        this.players.clear();
        players.forEach((player: any) => {
          this.players.set(player.id, player);
        });
        this.showRoomUI();
      },
      (player) => {
        this.players.set(player.id, player);
        this.updatePlayerList();
        this.showStatus(`${player.name} ist beigetreten!`, '#2ecc71');
      },
      (playerId, isReady, name) => {
        const player = this.players.get(playerId);
        if (player) {
          player.isReady = isReady;
          this.updatePlayerList();
          console.log(`Player ${name} ready status: ${isReady}`);
        }
      },
      (playerId, playerName) => {
        this.players.delete(playerId);
        this.updatePlayerList();
        this.showStatus(`${playerName} hat den Raum verlassen.`, '#e74c3c');
      },
      (_roomCode) => {
        this.showStatus('Spiel startet...', '#2ecc71');
        this.time.delayedCall(1000, () => {
          this.cleanupComponents();
          this.scene.start('GameScene', { 
            multiplayer: true,
            roomCode: this.currentRoomCode 
          });
        });
      },
      (message) => {
        this.showStatus(`Fehler: ${message}`, '#e74c3c');
      },
      () => {
        this.showStatus('Verbindung zum Server verloren!', '#e74c3c');
        this.time.delayedCall(3000, () => {
          this.cleanupComponents();
          this.scene.start('MainMenuScene');
        });
      }
    );

    this.networkEventSetup.setup();
  }

  private handleLeaveRoom(): void {
    this.roomActionHandler?.leaveRoom();
    this.players.clear();
    this.currentRoomCode = null;
    this.isReady = false;
    this.cleanupComponents();
    this.children.removeAll();
    this.create();
  }

  private toggleReady(): void {
    this.isReady = !this.isReady;
    console.log('Toggle ready:', this.isReady);
    this.roomActionHandler?.setReady(this.isReady);
    
    if (this.readyButton) {
      this.readyButton.setText(this.isReady ? '✓ Bereit' : 'Bereit?');
      this.readyButton.setBackgroundColor(this.isReady ? '#27ae60' : '#95a5a6');
    }
  }

  private handleStartGame(): void {
    if (!this.roomActionHandler) return;

    const validation = this.roomActionHandler.validateGameStart(this.players);
    
    if (!validation.canStart) {
      this.showStatus(validation.message!, '#e74c3c');
      return;
    }

    this.roomActionHandler.startGame();
  }

  private updatePlayerList(): void {
    if (this.roomLobbyUI) {
      this.roomLobbyUI.updatePlayerList(this.players);
    }
  }

  private showStatus(message: string, color: string): void {
    if (this.statusText) {
      this.statusText.setText(message);
      this.statusText.setColor(color);
    }
  }

  private cleanupComponents(): void {
    if (this.roomCreationUI) {
      this.roomCreationUI.cleanup();
      this.roomCreationUI = undefined;
    }
    if (this.roomJoinUI) {
      this.roomJoinUI.cleanup();
      this.roomJoinUI = undefined;
    }
    // RoomLobbyUI doesn't have HTML inputs to clean up
    this.roomLobbyUI = undefined;
  }

  shutdown(): void {
    this.cleanupComponents();
  }
}
