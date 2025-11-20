import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { GameServer } from '../GameServer';

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
    it('should accept client connections', async () => {
      gameServer.start();

      clientSocket = ioClient(`http://localhost:${port}`);

      await new Promise<void>((resolve, reject) => {
        clientSocket.on('connect', () => {
          expect(clientSocket.connected).toBe(true);
          resolve();
        });

        clientSocket.on('connect_error', (error) => {
          reject(error);
        });
      });
    });
  });

  describe('room creation', () => {
    it('should create a room and receive room code', async () => {
      gameServer.start();
      clientSocket = ioClient(`http://localhost:${port}`);

      await new Promise<void>((resolve, reject) => {
        clientSocket.on('connect', () => {
          clientSocket.emit('room:create', 'TestPlayer');
        });

        clientSocket.on('room:joined', (data: any) => {
          try {
            expect(data.code).toBeDefined();
            expect(data.code).toMatch(/^[a-z]+-[a-z]+$/);
            expect(data.players).toHaveLength(1);
            expect(data.players[0].name).toBe('TestPlayer');
            expect(data.players[0].isHost).toBe(true);
            resolve();
          } catch (error) {
            reject(error);
          }
        });

        clientSocket.on('room:error', (message: string) => {
          reject(new Error(message));
        });
      });
    });
  });

  describe('room joining', () => {
    it('should allow second player to join existing room', async () => {
      gameServer.start();
      
      const client1 = ioClient(`http://localhost:${port}`);

      await new Promise<void>((resolve, reject) => {
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
              try {
                expect(data.code).toBe(roomCode);
                expect(data.players).toHaveLength(2);
                client1.disconnect();
                resolve();
              } catch (error) {
                client1.disconnect();
                reject(error);
              }
            });

            clientSocket.on('room:error', (message: string) => {
              client1.disconnect();
              reject(new Error(message));
            });
          }
        });
      });
    });

    it('should reject joining non-existent room', async () => {
      gameServer.start();
      clientSocket = ioClient(`http://localhost:${port}`);

      await new Promise<void>((resolve, reject) => {
        clientSocket.on('connect', () => {
          clientSocket.emit('room:join', 'fake-code', 'TestPlayer', (response: any) => {
            try {
              expect(response.success).toBe(false);
              expect(response.error).toBeTruthy();
              resolve();
            } catch (error) {
              reject(error);
            }
          });
        });
      });
    });
  });

  describe('player ready', () => {
    it('should update player ready status', async () => {
      gameServer.start();
      clientSocket = ioClient(`http://localhost:${port}`);

      await new Promise<void>((resolve, reject) => {
        clientSocket.on('connect', () => {
          clientSocket.emit('room:create', 'TestPlayer', (response: any) => {
            if (!response.success) {
              reject(new Error('Failed to create room'));
            }
          });
        });

        clientSocket.on('room:joined', () => {
          clientSocket.emit('room:ready', true);
        });

        clientSocket.on('room:playerReady', (data: any) => {
          try {
            expect(data.isReady).toBe(true);
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });
    });
  });
});
