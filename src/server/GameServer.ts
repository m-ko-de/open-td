import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import { 
  ServerToClientEvents, 
  ClientToServerEvents, 
  InterServerEvents, 
  SocketData,
  RoomData
} from './types';
import { PlayerSession } from './PlayerSession';
import { ServerGameState } from './ServerGameState';
import { generateWordRoomCode } from './wordLists';

export class GameServer {
  private io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
  private rooms: Map<string, RoomData>;
  private gameStates: Map<string, ServerGameState>;
  private config: any;
  private httpServer: any;

  constructor(config: any) {
    this.config = config;
    this.rooms = new Map();
    this.gameStates = new Map();

    // Create HTTP server
    this.httpServer = createServer();

    // Initialize Socket.io
    this.io = new Server(this.httpServer, {
      cors: {
        origin: '*', // In production, restrict this to your domain
        methods: ['GET', 'POST']
      }
    });

    this.setupSocketHandlers();
  }

  public start(): void {
    const port = this.config.multiplayer.serverPort;
    this.httpServer.listen(port, '0.0.0.0', () => {
      console.log(`🎮 Game Server running on port ${port}`);
      console.log(`📡 Listening on 0.0.0.0:${port} (IPv4 + IPv6)`);
      console.log(`📊 Max players per room: ${this.config.multiplayer.maxPlayers}`);
      console.log(`🏰 Max rooms: ${this.config.multiplayer.roomSettings.maxRooms}`);
    });
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
      console.log(`✅ Player connected: ${socket.id}`);

      // Room management
      socket.on('room:create', (playerName, callback) => {
        this.handleCreateRoom(socket, playerName, callback);
      });

      socket.on('room:join', (roomCode, playerName, callback) => {
        this.handleJoinRoom(socket, roomCode, playerName, callback);
      });

      socket.on('room:leave', () => {
        this.handleLeaveRoom(socket);
      });

      socket.on('room:ready', (isReady) => {
        this.handlePlayerReady(socket, isReady);
      });

      socket.on('room:startGame', () => {
        this.handleStartGame(socket);
      });

      // Game actions
      socket.on('game:placeTower', (data) => {
        this.handlePlaceTower(socket, data);
      });

      socket.on('game:upgradeTower', (towerId) => {
        this.handleUpgradeTower(socket, towerId);
      });

      socket.on('game:sellTower', (towerId) => {
        this.handleSellTower(socket, towerId);
      });

      socket.on('game:startWave', () => {
        this.handleStartWave(socket);
      });

      socket.on('game:researchUnlock', (researchType) => {
        this.handleResearchUnlock(socket, researchType);
      });

      // Disconnect
      socket.on('disconnect', () => {
        console.log(`❌ Player disconnected: ${socket.id}`);
        this.handleDisconnect(socket);
      });
    });
  }

  private generateRoomCode(): string {
    // Use word-based room codes (e.g., "bear-lamp", "rose-moon")
    return generateWordRoomCode();
  }

  private handleCreateRoom(socket: Socket, playerName: string, callback: (response: { success: boolean; code?: string; error?: string }) => void): void {
    // Check room limit
    if (this.rooms.size >= this.config.multiplayer.roomSettings.maxRooms) {
      callback({ success: false, error: 'Server is full. Please try again later.' });
      return;
    }

    // Generate unique room code
    let roomCode = this.generateRoomCode();
    while (this.rooms.has(roomCode)) {
      roomCode = this.generateRoomCode();
    }

    // Create room
    const roomId = `room_${Date.now()}_${Math.random()}`;
    const playerId = `player_${socket.id}`;
    const player = new PlayerSession(playerId, playerName, socket.id, true); // true = is host

    const room: RoomData = {
      id: roomId,
      code: roomCode,
      hostId: playerId,
      players: new Map([[playerId, player]]),
      gameStarted: false,
      createdAt: Date.now()
    };

    this.rooms.set(roomCode, room);
    socket.join(roomCode);
    socket.data.playerId = playerId;
    socket.data.roomId = roomCode;
    socket.data.playerName = playerName;

    console.log(`🏠 Room created: ${roomCode} by ${playerName}`);
    callback({ success: true, code: roomCode });
    
    socket.emit('room:joined', {
      code: roomCode,
      players: [player.toPlayerData()],
      isHost: true
    });
  }

  private handleJoinRoom(socket: Socket, roomCode: string, playerName: string, callback: (response: { success: boolean; error?: string }) => void): void {
    const room = this.rooms.get(roomCode);

    if (!room) {
      callback({ success: false, error: 'Room not found.' });
      return;
    }

    if (room.gameStarted) {
      callback({ success: false, error: 'Game already started.' });
      return;
    }

    if (room.players.size >= this.config.multiplayer.maxPlayers) {
      callback({ success: false, error: 'Room is full.' });
      return;
    }

    // Add player to room
    const playerId = `player_${socket.id}`;
    const player = new PlayerSession(playerId, playerName, socket.id, false);
    room.players.set(playerId, player);

    socket.join(roomCode);
    socket.data.playerId = playerId;
    socket.data.roomId = roomCode;
    socket.data.playerName = playerName;

    console.log(`👥 ${playerName} joined room: ${roomCode}`);
    callback({ success: true });

    // Notify all players in room
    const playerList = Array.from(room.players.values()).map(p => p.toPlayerData());
    socket.emit('room:joined', {
      code: roomCode,
      players: playerList,
      isHost: false
    });

    // Notify other players
    socket.to(roomCode).emit('room:playerJoined', player.toPlayerData());
  }

  private handleLeaveRoom(socket: Socket): void {
    const roomCode = socket.data.roomId;
    const playerId = socket.data.playerId;

    if (!roomCode || !playerId) return;

    const room = this.rooms.get(roomCode);
    if (!room) return;

    room.players.delete(playerId);
    socket.leave(roomCode);

    console.log(`👋 ${socket.data.playerName} left room: ${roomCode}`);

    // If room is empty, delete it
    if (room.players.size === 0) {
      this.rooms.delete(roomCode);
      this.gameStates.delete(roomCode);
      console.log(`🗑️ Room deleted: ${roomCode}`);
    } else {
      // If host left, assign new host
      if (room.hostId === playerId) {
        const newHost = room.players.values().next().value as PlayerSession;
        newHost.isHost = true;
        room.hostId = newHost.id;
        console.log(`👑 New host: ${newHost.name}`);
      }

      // Notify remaining players
      socket.to(roomCode).emit('room:playerLeft', playerId);
    }
  }

  private handlePlayerReady(socket: Socket, isReady: boolean): void {
    const roomCode = socket.data.roomId;
    const playerId = socket.data.playerId;

    if (!roomCode || !playerId) return;

    const room = this.rooms.get(roomCode);
    if (!room) return;

    const player = room.players.get(playerId);
    if (player) {
      player.setReady(isReady);
      console.log(`${isReady ? '✅' : '❌'} ${player.name} is ${isReady ? 'ready' : 'not ready'}`);
      
      // Notify all players in the room about the updated ready status
      this.io.to(roomCode).emit('room:playerReady', {
        playerId: playerId,
        name: player.name,
        isReady: isReady
      });
    }
  }

  private handleStartGame(socket: Socket): void {
    const roomCode = socket.data.roomId;
    const playerId = socket.data.playerId;

    if (!roomCode || !playerId) return;

    const room = this.rooms.get(roomCode);
    if (!room || room.hostId !== playerId) {
      console.log(`❌ Start game rejected: Not host. Player: ${playerId}, Host: ${room?.hostId}`);
      socket.emit('room:error', 'Only the host can start the game.');
      return;
    }

    // Check if all players are ready
    const playerStates = Array.from(room.players.values()).map(p => ({
      name: p.name,
      isHost: p.isHost,
      isReady: p.isReady
    }));
    console.log('Player states:', playerStates);
    
    const allReady = Array.from(room.players.values()).every(p => p.isReady || p.isHost);
    console.log('All ready?', allReady);
    
    if (!allReady) {
      console.log(`❌ Start game rejected: Not all players ready`);
      socket.emit('room:error', 'Not all players are ready.');
      return;
    }

    // Initialize game state
    room.gameStarted = true;
    const gameState = new ServerGameState(roomCode, room.players, this.config);
    this.gameStates.set(roomCode, gameState);

    console.log(`🎮 Game starting in room: ${roomCode}`);
    this.io.to(roomCode).emit('game:started');
    this.io.to(roomCode).emit('game:stateUpdate', gameState.getState());
  }

  private handlePlaceTower(socket: Socket, data: { type: string; x: number; y: number }): void {
    const roomCode = socket.data.roomId;
    const playerId = socket.data.playerId;

    console.log(`📥 Received tower placement request: type=${data.type}, x=${data.x}, y=${data.y}, player=${playerId}`);

    if (!roomCode || !playerId) {
      console.log('❌ Missing roomCode or playerId');
      return;
    }

    const gameState = this.gameStates.get(roomCode);
    if (!gameState) {
      console.log('❌ Game state not found for room:', roomCode);
      return;
    }

    const towerConfig = this.config.towers[data.type];
    if (!towerConfig) {
      console.log('❌ Tower config not found for type:', data.type);
      return;
    }

    const tower = gameState.placeTower(data.type, data.x, data.y, playerId, towerConfig.cost);
    if (tower) {
      console.log('✅ Tower placed successfully, broadcasting to room');
      this.io.to(roomCode).emit('game:towerPlaced', tower);
      this.io.to(roomCode).emit('game:stateUpdate', gameState.getState());
    } else {
      console.log('❌ Tower placement failed (returned null)');
    }
  }

  private handleUpgradeTower(socket: Socket, towerId: string): void {
    const roomCode = socket.data.roomId;
    const playerId = socket.data.playerId;

    console.log(`📥 Received tower upgrade request: towerId=${towerId}, player=${playerId}`);

    if (!roomCode) {
      console.log('❌ Missing roomCode');
      return;
    }

    const gameState = this.gameStates.get(roomCode);
    if (!gameState) {
      console.log('❌ Game state not found for room:', roomCode);
      return;
    }

    // Get tower and calculate upgrade cost
    const state = gameState.getState();
    const tower = state.towers.find(t => t.id === towerId);
    if (!tower) {
      console.log('❌ Tower not found with ID:', towerId);
      console.log('Available towers:', state.towers.map(t => ({ id: t.id, type: t.type, level: t.level })));
      return;
    }

    console.log(`🔍 Found tower: type=${tower.type}, level=${tower.level}, x=${tower.x}, y=${tower.y}`);

    if (tower.level >= 3) {
      console.log('❌ Tower already at max level');
      return;
    }

    const upgradeConfig = tower.level === 1 ? this.config.towerUpgrades.level2 : this.config.towerUpgrades.level3;
    const towerConfig = this.config.towers[tower.type];
    const upgradeCost = Math.round(towerConfig.cost * upgradeConfig.costMultiplier);

    console.log(`💰 Upgrade cost: ${upgradeCost}, current gold: ${state.gold}`);

    if (gameState.upgradeTower(towerId, upgradeCost)) {
      const newLevel = tower.level + 1;
      console.log(`✅ Tower upgraded successfully to level ${newLevel}`);
      this.io.to(roomCode).emit('game:towerUpgraded', towerId, newLevel);
      this.io.to(roomCode).emit('game:stateUpdate', gameState.getState());
    } else {
      console.log('❌ Tower upgrade failed (insufficient gold or invalid state)');
    }
  }

  private handleSellTower(socket: Socket, towerId: string): void {
    const roomCode = socket.data.roomId;
    if (!roomCode) return;

    const gameState = this.gameStates.get(roomCode);
    if (!gameState) return;

    const state = gameState.getState();
    const tower = state.towers.find(t => t.id === towerId);
    if (!tower) return;

    // Calculate refund
    const towerConfig = this.config.towers[tower.type];
    let totalCost = towerConfig.cost;
    
    if (tower.level >= 2) {
      totalCost += Math.round(towerConfig.cost * this.config.towerUpgrades.level2.costMultiplier);
    }
    if (tower.level >= 3) {
      totalCost += Math.round(towerConfig.cost * this.config.towerUpgrades.level3.costMultiplier);
    }
    
    const refund = Math.round(totalCost * this.config.towerUpgrades.sellRefundPercent);

    if (gameState.sellTower(towerId, refund)) {
      this.io.to(roomCode).emit('game:towerSold', towerId, refund);
      this.io.to(roomCode).emit('game:stateUpdate', gameState.getState());
    }
  }

  private handleStartWave(socket: Socket): void {
    const roomCode = socket.data.roomId;
    if (!roomCode) return;

    const gameState = this.gameStates.get(roomCode);
    if (!gameState) return;

    const nextWave = gameState.getWave() + 1;
    gameState.startWave(nextWave);

    this.io.to(roomCode).emit('game:waveStarted', nextWave);
    this.io.to(roomCode).emit('game:stateUpdate', gameState.getState());

    // TODO: Spawn enemies based on wave and player count
    // This would be handled by the wave spawning logic
  }

  private handleResearchUnlock(socket: Socket, _researchType: string): void {
    const roomCode = socket.data.roomId;
    if (!roomCode) return;

    // TODO: Implement research unlock logic
    // For now, just sync state
    const gameState = this.gameStates.get(roomCode);
    if (gameState) {
      this.io.to(roomCode).emit('game:stateUpdate', gameState.getState());
    }
  }

  private handleDisconnect(socket: Socket): void {
    this.handleLeaveRoom(socket);
  }
}
