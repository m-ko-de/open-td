import { describe, it, expect, beforeEach } from 'vitest';
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
      multiplayer: {
        resourceSharing: {
          gold: 'shared',
          lives: 'shared'
        }
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
      ['player1', new PlayerSession('player1', 'Player1', 'socket1', true)],
      ['player2', new PlayerSession('player2', 'Player2', 'socket2', false)],
    ]);

    gameState = new ServerGameState('test-room', players, mockConfig);
  });

  describe('initialization', () => {
    it('should initialize with correct starting values', () => {
      const state = gameState.getState();
      expect(gameState.getGold()).toBe(400); // 200 * 2 players
      expect(state.gold).toBe(400);
      expect(state.lives).toBe(40); // 20 * 2 players
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
      expect(tower?.id).toBeDefined();
      
      const state = gameState.getState();
      expect(state.gold).toBe(350); // 400 - 50
    });

    it('should not place tower if insufficient gold', () => {
      const tower = gameState.placeTower('strong', 100, 200, 'player1', 500); // More than 400
      expect(tower).toBeNull();
      
      const state = gameState.getState();
      expect(state.gold).toBe(400); // Unchanged
      expect(state.towers).toHaveLength(0);
    });

    it('should upgrade tower successfully', () => {
      const tower = gameState.placeTower('basic', 100, 200, 'player1', 50);
      expect(tower).toBeDefined();
      
      const upgradeCost = 50 * 1.5; // 75
      const success = gameState.upgradeTower(tower!.id, upgradeCost);
      
      expect(success).toBe(true);
      const state = gameState.getState();
      expect(state.towers[0].level).toBe(2);
      expect(state.gold).toBe(275); // 400 - 50 - 75
    });

    it('should not upgrade tower if insufficient gold', () => {
      const tower = gameState.placeTower('basic', 100, 200, 'player1', 50);
      expect(tower).toBeDefined();
      
      const success = gameState.upgradeTower(tower!.id, 500); // More than available
      expect(success).toBe(false);

      const state = gameState.getState();
      expect(state.towers[0].level).toBe(1);
      expect(state.gold).toBe(350); // 400 - 50
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
      expect(state.gold).toBe(375); // 400 - 50 + 25
    });
  });

  describe('resource management', () => {
    it('should add XP and level up', () => {
      const leveledUp1 = gameState.addXP(100);
      expect(leveledUp1).toBe(true); // Should level up at 100 XP
      expect(gameState.getPlayerLevel()).toBe(2);
      
      // Level up at 200 XP for level 2->3
      const leveledUp2 = gameState.addXP(150);
      expect(leveledUp2).toBe(false); // Not enough yet
      gameState.addXP(50);
      expect(gameState.getPlayerLevel()).toBe(3);
    });

    it('should handle enemy reaching end', () => {
      const enemy = gameState.spawnEnemy('normal', 1, 100, 0, 0);
      const result = gameState.enemyReachedEnd(enemy.id);
      expect(result).toBe(true);
      expect(gameState.getLives()).toBe(39); // 40 - 1
    });

    it('should detect game over when lives reach 0', () => {
      for (let i = 0; i < 40; i++) { // 40 lives total (20 * 2 players)
        const enemy = gameState.spawnEnemy('normal', 1, 100, 0, 0);
        gameState.enemyReachedEnd(enemy.id);
      }
      expect(gameState.isGameOver()).toBe(true);
      expect(gameState.getLives()).toBe(0);
    });
  });

  describe('wave management', () => {
    it('should start a new wave', () => {
      gameState.startWave(1);
      expect(gameState.getWave()).toBe(1);
    });

    it('should complete a wave and award bonus', () => {
      gameState.startWave(1);
      const initialGold = gameState.getGold();
      
      gameState.completeWave(50);
      expect(gameState.getGold()).toBe(initialGold + 50);
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

    it('should damage enemy and award rewards on death', () => {
      const enemy = gameState.spawnEnemy('normal', 1, 100, 0, 0);
      const initialGold = gameState.getGold();
      
      const result = gameState.damageEnemy(enemy.id, 100);
      
      expect(result.died).toBe(true);
      expect(result.gold).toBeGreaterThan(0);
      expect(result.xp).toBeGreaterThan(0);
      
      const state = gameState.getState();
      expect(state.enemies).toHaveLength(0);
      expect(gameState.getGold()).toBeGreaterThan(initialGold);
    });
  });
});
