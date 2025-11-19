import { io, Socket } from 'socket.io-client';
import { ServerToClientEvents, ClientToServerEvents } from '../server/types';

export type NetworkEventCallback = (data?: any) => void;

export class NetworkManager {
  private static instance: NetworkManager;
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private connected: boolean = false;
  private currentRoom: string | null = null;
  private isHost: boolean = false;
  private eventHandlers: Map<string, NetworkEventCallback[]> = new Map();

  private constructor() {}

  public static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  public connect(serverUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connected && this.socket) {
        resolve();
        return;
      }

      this.socket = io(serverUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });

      this.socket.on('connect', () => {
        console.log('✅ Connected to game server');
        this.connected = true;
        this.setupSocketListeners();
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Disconnected from server');
        this.connected = false;
        this.trigger('disconnect');
      });
    });
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    // Room events
    this.socket.on('room:created', (roomCode) => {
      this.currentRoom = roomCode;
      this.trigger('room:created', roomCode);
    });

    this.socket.on('room:joined', (data) => {
      this.currentRoom = data.code;
      this.isHost = data.isHost;
      this.trigger('room:joined', data);
    });

    this.socket.on('room:playerJoined', (player) => {
      this.trigger('room:playerJoined', player);
    });

    this.socket.on('room:playerLeft', (playerId) => {
      this.trigger('room:playerLeft', playerId);
    });

    this.socket.on('room:playerReady', (data) => {
      this.trigger('room:playerReady', data);
    });

    this.socket.on('room:error', (message) => {
      this.trigger('room:error', message);
    });

    // Game events
    this.socket.on('game:started', () => {
      this.trigger('game:started');
    });

    this.socket.on('game:stateUpdate', (state) => {
      this.trigger('game:stateUpdate', state);
    });

    this.socket.on('game:towerPlaced', (tower) => {
      this.trigger('game:towerPlaced', tower);
    });

    this.socket.on('game:towerUpgraded', (towerId, level) => {
      this.trigger('game:towerUpgraded', { towerId, level });
    });

    this.socket.on('game:towerSold', (towerId, refund) => {
      this.trigger('game:towerSold', { towerId, refund });
    });

    this.socket.on('game:enemySpawned', (enemy) => {
      this.trigger('game:enemySpawned', enemy);
    });

    this.socket.on('game:enemyDied', (enemyId, gold, xp) => {
      this.trigger('game:enemyDied', { enemyId, gold, xp });
    });

    this.socket.on('game:waveStarted', (wave) => {
      this.trigger('game:waveStarted', wave);
    });

    this.socket.on('game:waveCompleted', (wave, bonus) => {
      this.trigger('game:waveCompleted', { wave, bonus });
    });

    this.socket.on('game:levelUp', (level) => {
      this.trigger('game:levelUp', level);
    });

    this.socket.on('game:over', (won) => {
      this.trigger('game:over', won);
    });
  }

  // Event system
  public on(event: string, callback: NetworkEventCallback): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(callback);
  }

  public off(event: string, callback: NetworkEventCallback): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(callback);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private trigger(event: string, data?: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(callback => callback(data));
    }
  }

  // Room management
  public createRoom(playerName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected to server'));
        return;
      }

      this.socket.emit('room:create', playerName, (response) => {
        if (response.success && response.code) {
          resolve(response.code);
        } else {
          reject(new Error(response.error || 'Failed to create room'));
        }
      });
    });
  }

  public joinRoom(roomCode: string, playerName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected to server'));
        return;
      }

      this.socket.emit('room:join', roomCode, playerName, (response) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to join room'));
        }
      });
    });
  }

  public leaveRoom(): void {
    if (this.socket) {
      this.socket.emit('room:leave');
      this.currentRoom = null;
      this.isHost = false;
    }
  }

  public setReady(isReady: boolean): void {
    if (this.socket) {
      this.socket.emit('room:ready', isReady);
    }
  }

  public startGame(): void {
    if (this.socket && this.isHost) {
      this.socket.emit('room:startGame');
    }
  }

  // Game actions
  public placeTower(type: string, x: number, y: number): void {
    if (this.socket) {
      console.log(`📤 Sending tower placement: type=${type}, x=${x}, y=${y}`);
      this.socket.emit('game:placeTower', { type, x, y });
    } else {
      console.log('❌ Cannot place tower: socket not connected');
    }
  }

  public upgradeTower(towerId: string): void {
    if (this.socket) {
      this.socket.emit('game:upgradeTower', towerId);
    }
  }

  public sellTower(towerId: string): void {
    if (this.socket) {
      this.socket.emit('game:sellTower', towerId);
    }
  }

  public startWave(): void {
    if (this.socket) {
      this.socket.emit('game:startWave');
    }
  }

  public unlockResearch(researchType: string): void {
    if (this.socket) {
      this.socket.emit('game:researchUnlock', researchType);
    }
  }

  // Getters
  public isConnected(): boolean {
    return this.connected;
  }

  public getCurrentRoom(): string | null {
    return this.currentRoom;
  }

  public getIsHost(): boolean {
    return this.isHost;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.currentRoom = null;
      this.isHost = false;
      this.eventHandlers.clear();
    }
  }
}
