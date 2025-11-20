import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NetworkManager } from '../NetworkManager';

// Mock socket.io-client
const mockSocket = {
  on: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  connected: false,
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

describe('NetworkManager', () => {
  let networkManager: NetworkManager;

  beforeEach(() => {
    vi.clearAllMocks();
    networkManager = NetworkManager.getInstance();
    // Reset singleton state
    (networkManager as any).socket = null;
    (networkManager as any).connected = false;
    (networkManager as any).currentRoom = null;
    (networkManager as any).isHost = false;
    (networkManager as any).eventHandlers.clear();
  });

  afterEach(() => {
    networkManager.disconnect();
  });

  describe('Singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = NetworkManager.getInstance();
      const instance2 = NetworkManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('connect', () => {
    it('should establish connection to server', async () => {
      const connectPromise = networkManager.connect('http://localhost:3001');
      
      // Simulate successful connection
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];
      connectHandler?.();

      await connectPromise;
      
      expect(networkManager.isConnected()).toBe(true);
    });

    it('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      const connectPromise = networkManager.connect('http://localhost:3001');
      
      // Simulate connection error
      const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')?.[1];
      errorHandler?.(error);

      await expect(connectPromise).rejects.toThrow('Connection failed');
    });

    it('should resolve immediately if already connected', async () => {
      // First connection
      const connectPromise1 = networkManager.connect('http://localhost:3001');
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];
      connectHandler?.();
      await connectPromise1;

      // Second connection attempt
      const connectPromise2 = networkManager.connect('http://localhost:3001');
      await expect(connectPromise2).resolves.toBeUndefined();
    });
  });

  describe('event system', () => {
    it('should register event handlers', () => {
      const callback = vi.fn();
      networkManager.on('test:event', callback);
      
      // Trigger the event
      (networkManager as any).trigger('test:event', { data: 'test' });
      
      expect(callback).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should support multiple handlers for same event', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      networkManager.on('test:event', callback1);
      networkManager.on('test:event', callback2);
      
      (networkManager as any).trigger('test:event', 'data');
      
      expect(callback1).toHaveBeenCalledWith('data');
      expect(callback2).toHaveBeenCalledWith('data');
    });

    it('should remove event handlers', () => {
      const callback = vi.fn();
      networkManager.on('test:event', callback);
      networkManager.off('test:event', callback);
      
      (networkManager as any).trigger('test:event', 'data');
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('room management', () => {
    beforeEach(() => {
      (networkManager as any).socket = mockSocket;
      (networkManager as any).connected = true;
    });

    it('should create room successfully', async () => {
      const createPromise = networkManager.createRoom('TestPlayer');
      
      // Simulate server response
      const emitCall = mockSocket.emit.mock.calls.find(call => call[0] === 'room:create');
      const callback = emitCall?.[2];
      callback?.({ success: true, code: 'test-room' });
      
      const roomCode = await createPromise;
      expect(roomCode).toBe('test-room');
    });

    it('should handle room creation failure', async () => {
      const createPromise = networkManager.createRoom('TestPlayer');
      
      const emitCall = mockSocket.emit.mock.calls.find(call => call[0] === 'room:create');
      const callback = emitCall?.[2];
      callback?.({ success: false, error: 'Server full' });
      
      await expect(createPromise).rejects.toThrow('Server full');
    });

    it('should join room successfully', async () => {
      const joinPromise = networkManager.joinRoom('test-room', 'TestPlayer');
      
      const emitCall = mockSocket.emit.mock.calls.find(call => call[0] === 'room:join');
      const callback = emitCall?.[3];
      callback?.({ success: true });
      
      await expect(joinPromise).resolves.toBeUndefined();
    });

    it('should handle join room failure', async () => {
      const joinPromise = networkManager.joinRoom('invalid-room', 'TestPlayer');
      
      const emitCall = mockSocket.emit.mock.calls.find(call => call[0] === 'room:join');
      const callback = emitCall?.[3];
      callback?.({ success: false, error: 'Room not found' });
      
      await expect(joinPromise).rejects.toThrow('Room not found');
    });

    it('should leave room and reset state', () => {
      (networkManager as any).currentRoom = 'test-room';
      (networkManager as any).isHost = true;
      
      networkManager.leaveRoom();
      
      expect(mockSocket.emit).toHaveBeenCalledWith('room:leave');
      expect(networkManager.getCurrentRoom()).toBeNull();
      expect(networkManager.getIsHost()).toBe(false);
    });

    it('should set player ready status', () => {
      networkManager.setReady(true);
      expect(mockSocket.emit).toHaveBeenCalledWith('room:ready', true);
    });

    it('should start game when host', () => {
      (networkManager as any).isHost = true;
      networkManager.startGame();
      expect(mockSocket.emit).toHaveBeenCalledWith('room:startGame');
    });
  });

  describe('game actions', () => {
    beforeEach(() => {
      (networkManager as any).socket = mockSocket;
      (networkManager as any).connected = true;
    });

    it('should place tower', () => {
      networkManager.placeTower('basic', 100, 200);
      expect(mockSocket.emit).toHaveBeenCalledWith('game:placeTower', {
        type: 'basic',
        x: 100,
        y: 200
      });
    });

    it('should upgrade tower', () => {
      networkManager.upgradeTower('tower-123');
      expect(mockSocket.emit).toHaveBeenCalledWith('game:upgradeTower', 'tower-123');
    });

    it('should sell tower', () => {
      networkManager.sellTower('tower-123');
      expect(mockSocket.emit).toHaveBeenCalledWith('game:sellTower', 'tower-123');
    });

    it('should start wave', () => {
      networkManager.startWave();
      expect(mockSocket.emit).toHaveBeenCalledWith('game:startWave');
    });

    it('should unlock research', () => {
      networkManager.unlockResearch('damage-boost');
      expect(mockSocket.emit).toHaveBeenCalledWith('game:researchUnlock', 'damage-boost');
    });
  });

  describe('disconnect', () => {
    it('should clean up all resources', () => {
      (networkManager as any).socket = mockSocket;
      (networkManager as any).connected = true;
      (networkManager as any).currentRoom = 'test-room';
      (networkManager as any).isHost = true;
      networkManager.on('test:event', vi.fn());

      networkManager.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(networkManager.isConnected()).toBe(false);
      expect(networkManager.getCurrentRoom()).toBeNull();
      expect(networkManager.getIsHost()).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should reject room creation when not connected', async () => {
      (networkManager as any).socket = null;
      
      await expect(networkManager.createRoom('TestPlayer'))
        .rejects.toThrow('Not connected to server');
    });

    it('should reject room join when not connected', async () => {
      (networkManager as any).socket = null;
      
      await expect(networkManager.joinRoom('test-room', 'TestPlayer'))
        .rejects.toThrow('Not connected to server');
    });

    it('should handle placement when not connected gracefully', () => {
      (networkManager as any).socket = null;
      
      // Should not throw
      expect(() => networkManager.placeTower('basic', 100, 200)).not.toThrow();
    });
  });

  describe('getters', () => {
    it('should return connection status', () => {
      expect(networkManager.isConnected()).toBe(false);
      (networkManager as any).connected = true;
      expect(networkManager.isConnected()).toBe(true);
    });

    it('should return current room', () => {
      expect(networkManager.getCurrentRoom()).toBeNull();
      (networkManager as any).currentRoom = 'test-room';
      expect(networkManager.getCurrentRoom()).toBe('test-room');
    });

    it('should return host status', () => {
      expect(networkManager.getIsHost()).toBe(false);
      (networkManager as any).isHost = true;
      expect(networkManager.getIsHost()).toBe(true);
    });
  });
});
