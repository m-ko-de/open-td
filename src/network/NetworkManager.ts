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
    this.onSocket('room:created', (roomCode: string) => {
      this.currentRoom = roomCode;
      this.trigger('room:created', roomCode);
    });

    this.onSocket('room:joined', (data: { code: string; isHost: boolean }) => {
      this.currentRoom = data.code;
      this.isHost = data.isHost;
      this.trigger('room:joined', data);
    });

    ['room:playerJoined', 'room:playerLeft', 'room:playerReady'].forEach((evt) => {
      this.onSocket(evt, (payload: any) => this.trigger(evt, payload));
    });

    this.onSocket('room:error', (message: string) => this.trigger('room:error', message));

    // Game events: map many events to the internal trigger
    this.onSocket('game:started', () => this.trigger('game:started'));
    this.onSocket('game:stateUpdate', (state: any) => this.trigger('game:stateUpdate', state));
    this.onSocket('game:towerPlaced', (tower: any) => this.trigger('game:towerPlaced', tower));
    this.onSocket('game:towerUpgraded', (towerId: string, level: number) => this.trigger('game:towerUpgraded', { towerId, level }));
    this.onSocket('game:towerSold', (towerId: string, refund: number) => this.trigger('game:towerSold', { towerId, refund }));
    this.onSocket('game:enemySpawned', (enemy: any) => this.trigger('game:enemySpawned', enemy));
    this.onSocket('game:enemyDied', (enemyId: string, gold: number, xp: number) => this.trigger('game:enemyDied', { enemyId, gold, xp }));
    this.onSocket('game:waveStarted', (wave: any) => this.trigger('game:waveStarted', wave));
    this.onSocket('game:waveCompleted', (wave: any, bonus: any) => this.trigger('game:waveCompleted', { wave, bonus }));
    this.onSocket('game:levelUp', (level: number) => this.trigger('game:levelUp', level));
    this.onSocket('game:over', (won: boolean) => this.trigger('game:over', won));
  }

  /**
   * Shorthand for registering socket listeners with a null-check.
   */
  private onSocket(event: string, handler: (...args: any[]) => void): void {
    if (!this.socket) return;
    this.socket.on(event as any, (...args: any[]) => handler(...args));
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


  // Generic storage actions
  public saveData(key: string, value: any): void {
    if (this.socket) {
      this.socket.emit('storage:saveData', { key, value });
    }
  }

  public loadData(key: string, callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.emit('storage:loadData',  key, callback);
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
