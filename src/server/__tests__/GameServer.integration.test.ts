import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Server } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { GameServer } from '../GameServer';
import { createServer } from 'http';

describe('GameServer Integration Tests', () => {
  let gameServer: GameServer;
  let clientSocket: ClientSocket;
  let port: number;
  let mockConfig: any;

  beforeEach(async () => {
    port = 3000 + Math.floor(Math.random() * 1000);
    
    mockConfig = {
      game: {
        startGold: 200,
        startLives: 20,
      },
      multiplayer: {
        serverPort: port,
        maxPlayers: 4,
        roomSettings: {
          maxRooms: 100,
        },
      },
      towers: {
        basic: { cost: 50 },
      },
      towerUpgrades: {
        level2: { costMultiplier: 1.5 },
        level3: { costMultiplier: 2.0 },
      },
    };

    gameServer = new GameServer(mockConfig);
  });

  afterEach(async () => {
    if (clientSocket?.connected) {
      clientSocket.disconnect();
    }
    // Give time for cleanup
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('connection', () => {
    it('should accept client connections', (done) => {
      gameServer.start();

      clientSocket = ioClient(`http://localhost:${port}`);

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });

      clientSocket.on('connect_error', (error) => {
        done(error);
      });
    });
  });

  describe('room creation', () => {
    it('should create a room and receive room code', (done) => {
      gameServer.start();
      clientSocket = ioClient(`http://localhost:${port}`);

      clientSocket.on('connect', () => {
        clientSocket.emit('room:create', 'TestPlayer');
      });

      clientSocket.on('room:joined', (data: any) => {
        expect(data.code).toBeDefined();
        expect(data.code).toMatch(/^[a-z]+-[a-z]+$/);
        expect(data.players).toHaveLength(1);
        expect(data.players[0].name).toBe('TestPlayer');
        expect(data.players[0].isHost).toBe(true);
        done();
      });

      clientSocket.on('room:error', (message: string) => {
        done(new Error(message));
      });
    });
  });

  describe('room joining', () => {
    it('should allow second player to join existing room', (done) => {
      gameServer.start();
      
      const client1 = ioClient(`http://localhost:${port}`);
      let roomCode: string;
      let joinedCount = 0;

      client1.on('connect', () => {
        client1.emit('room:create', 'Player1');
      });

      client1.on('room:joined', (data: any) => {
        roomCode = data.code;
        joinedCount++;
        
        if (joinedCount === 1) {
          // First player created room, now join with second player
          clientSocket = ioClient(`http://localhost:${port}`);
          
          clientSocket.on('connect', () => {
            clientSocket.emit('room:join', roomCode, 'Player2');
          });

          clientSocket.on('room:joined', (data: any) => {
            expect(data.code).toBe(roomCode);
            expect(data.players).toHaveLength(2);
            client1.disconnect();
            done();
          });

          clientSocket.on('room:error', (message: string) => {
            client1.disconnect();
            done(new Error(message));
          });
        }
      });
    });

    it('should reject joining non-existent room', (done) => {
      gameServer.start();
      clientSocket = ioClient(`http://localhost:${port}`);

      clientSocket.on('connect', () => {
        clientSocket.emit('room:join', 'fake-code', 'TestPlayer');
      });

      clientSocket.on('room:error', (message: string) => {
        expect(message).toBeTruthy();
        done();
      });
    });
  });

  describe('player ready', () => {
    it('should update player ready status', (done) => {
      gameServer.start();
      clientSocket = ioClient(`http://localhost:${port}`);
      let roomCode: string;

      clientSocket.on('connect', () => {
        clientSocket.emit('room:create', 'TestPlayer');
      });

      clientSocket.on('room:joined', (data: any) => {
        roomCode = data.code;
        clientSocket.emit('room:setReady', true);
      });

      clientSocket.on('room:playerReady', (data: any) => {
        expect(data.isReady).toBe(true);
        expect(data.name).toBe('TestPlayer');
        done();
      });
    });
  });
});
