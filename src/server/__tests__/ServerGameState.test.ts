import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ServerGameState } from '../ServerGameState';
import { PlayerSession } from '../PlayerSession';

describe('ServerGameState', () => {
  let gameState: ServerGameState;
  let players: Map<string, PlayerSession>;
  let mockConfig: any;

  beforeEach(() => {
    // Mock config
    mockConfig = {
      game: {
        startGold: 200,
        startLives: 20,
      },
      towers: {
        basic: { cost: 50 },
        fast: { cost: 75 },
        strong: { cost: 100 },
      },
      towerUpgrades: {
        level2: { costMultiplier: 1.5 },
        level3: { costMultiplier: 2.0 },
      },
    };

    // Create test players
    players = new Map([
      ['player1', new PlayerSession('player1', 'Player1', true)],
      ['player2', new PlayerSession('player2', 'Player2', false)],
    ]);

    gameState = new ServerGameState('test-room', players, mockConfig);
  });

  describe('initialization', () => {
    it('should initialize with correct starting values', () => {
      const state = gameState.getState();
      expect(state.roomCode).toBe('test-room');
      expect(state.gold).toBe(200);
      expect(state.lives).toBe(20);
      expect(state.wave).toBe(0);
      expect(state.xp).toBe(0);
      expect(state.playerLevel).toBe(1);
      expect(state.playerCount).toBe(2);
      expect(state.towers).toEqual([]);
      expect(state.enemies).toEqual([]);
    });
  });

  describe('tower management', () => {
    it('should place a tower successfully', () => {
      const tower = gameState.placeTower('basic', 100, 200, 'player1', 50);
      
      expect(tower).toBeDefined();
      expect(tower?.type).toBe('basic');
      expect(tower?.x).toBe(100);
      expect(tower?.y).toBe(200);
      expect(tower?.level).toBe(1);
      expect(tower?.placedBy).toBe('player1');
      
      const state = gameState.getState();
      expect(state.gold).toBe(150); // 200 - 50
    });

    it('should not place tower if insufficient gold', () => {
      const tower = gameState.placeTower('strong', 100, 200, 'player1', 250);
      expect(tower).toBeNull();
      
      const state = gameState.getState();
      expect(state.gold).toBe(200); // Unchanged
    });

    it('should upgrade tower successfully', () => {
      const tower = gameState.placeTower('basic', 100, 200, 'player1', 50);
      expect(tower).toBeDefined();
      
      const upgradeCost = 50 * 1.5; // 75
      const success = gameState.upgradeTower(tower!.id, upgradeCost);
      
      expect(success).toBe(true);
      const state = gameState.getState();
      expect(state.towers[0].level).toBe(2);
      expect(state.gold).toBe(75); // 200 - 50 - 75
    });

    it('should not upgrade tower if insufficient gold', () => {
      const tower = gameState.placeTower('basic', 100, 200, 'player1', 50);
      expect(tower).toBeDefined();
      
      const success = gameState.upgradeTower(tower!.id, 200);
      expect(success).toBe(false);
      
      const state = gameState.getState();
      expect(state.towers[0].level).toBe(1);
      expect(state.gold).toBe(150);
    });

    it('should not upgrade tower beyond level 3', () => {
      const tower = gameState.placeTower('basic', 100, 200, 'player1', 50);
      expect(tower).toBeDefined();
      
      // Upgrade to level 2
      gameState.upgradeTower(tower!.id, 75);
      // Upgrade to level 3
      gameState.upgradeTower(tower!.id, 100);
      
      const state1 = gameState.getState();
      expect(state1.towers[0].level).toBe(3);
      
      // Try to upgrade to level 4 (should fail)
      const success = gameState.upgradeTower(tower!.id, 150);
      expect(success).toBe(false);
      
      const state2 = gameState.getState();
      expect(state2.towers[0].level).toBe(3); // Still level 3
    });

    it('should sell tower and get refund', () => {
      const tower = gameState.placeTower('basic', 100, 200, 'player1', 50);
      expect(tower).toBeDefined();
      
      const refund = 25;
      const success = gameState.sellTower(tower!.id, refund);
      
      expect(success).toBe(true);
      const state = gameState.getState();
      expect(state.towers).toHaveLength(0);
      expect(state.gold).toBe(175); // 200 - 50 + 25
    });
  });

  describe('resource management', () => {
    it('should add gold correctly', () => {
      gameState.addGold(100);
      const state = gameState.getState();
      expect(state.gold).toBe(300);
    });

    it('should add XP and level up', () => {
      gameState.addXP(100);
      let state = gameState.getState();
      expect(state.xp).toBe(100);
      expect(state.playerLevel).toBe(1);
      
      // Level up at 100 XP
      gameState.addXP(50);
      state = gameState.getState();
      expect(state.playerLevel).toBe(2);
    });

    it('should lose life correctly', () => {
      gameState.loseLife();
      const state = gameState.getState();
      expect(state.lives).toBe(19);
    });

    it('should detect game over when lives reach 0', () => {
      for (let i = 0; i < 20; i++) {
        gameState.loseLife();
      }
      const state = gameState.getState();
      expect(state.lives).toBe(0);
    });
  });

  describe('wave management', () => {
    it('should start a new wave', () => {
      gameState.startWave(1);
      const state = gameState.getState();
      expect(state.wave).toBe(1);
    });

    it('should complete a wave and award bonus', () => {
      gameState.startWave(1);
      const initialGold = gameState.getState().gold;
      
      gameState.completeWave(1, 50);
      const state = gameState.getState();
      expect(state.gold).toBe(initialGold + 50);
    });
  });

  describe('enemy management', () => {
    it('should spawn an enemy', () => {
      const enemy = gameState.spawnEnemy('normal', 1, 100, 0, 0);
      
      expect(enemy).toBeDefined();
      expect(enemy.type).toBe('normal');
      expect(enemy.wave).toBe(1);
      expect(enemy.health).toBe(100);
      
      const state = gameState.getState();
      expect(state.enemies).toHaveLength(1);
    });

    it('should remove enemy when killed and award rewards', () => {
      const enemy = gameState.spawnEnemy('normal', 1, 100, 0, 0);
      const initialGold = gameState.getState().gold;
      
      gameState.killEnemy(enemy.id, 10, 5);
      
      const state = gameState.getState();
      expect(state.enemies).toHaveLength(0);
      expect(state.gold).toBe(initialGold + 10);
      expect(state.xp).toBe(5);
    });
  });
});
