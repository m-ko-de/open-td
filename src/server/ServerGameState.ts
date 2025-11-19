import { GameStateData, TowerData, EnemyData } from './types';
import { PlayerSession } from './PlayerSession';

export class ServerGameState {
  private players: Map<string, PlayerSession>;
  private gold: number;
  private lives: number;
  private wave: number;
  private isWaveActive: boolean;
  private towers: Map<string, TowerData>;
  private enemies: Map<string, EnemyData>;
  private playerLevel: number;
  private xp: number;
  private nextTowerId: number;
  private nextEnemyId: number;
  private startGold: number;
  private startLives: number;

  constructor(_roomId: string, players: Map<string, PlayerSession>, config: any) {
    this.players = players;
    this.wave = 0;
    this.isWaveActive = false;
    this.towers = new Map();
    this.enemies = new Map();
    this.playerLevel = 1;
    this.xp = 0;
    this.nextTowerId = 1;
    this.nextEnemyId = 1;

    // Initialize with config values, scaled by player count
    const playerCount = players.size;
    const multiplayerConfig = config.multiplayer;
    
    this.startGold = config.game.startGold;
    this.startLives = config.game.startLives;
    
    // In shared mode, pool resources from all players (200 gold per player)
    // In individual mode, each player would have their own separate pool
    if (multiplayerConfig.resourceSharing.gold === 'shared') {
      this.gold = this.startGold * playerCount;
    } else {
      this.gold = this.startGold * playerCount;
    }
    
    if (multiplayerConfig.resourceSharing.lives === 'shared') {
      this.lives = this.startLives * playerCount;
    } else {
      this.lives = this.startLives * playerCount;
    }
  }

  public getState(): GameStateData {
    return {
      gold: this.gold,
      lives: this.lives,
      wave: this.wave,
      isWaveActive: this.isWaveActive,
      towers: Array.from(this.towers.values()),
      enemies: Array.from(this.enemies.values()),
      playerLevel: this.playerLevel,
      xp: this.xp,
      playerCount: this.players.size
    };
  }

  public canAffordTower(cost: number): boolean {
    return this.gold >= cost;
  }

  public placeTower(type: string, x: number, y: number, ownerId: string, cost: number): TowerData | null {
    if (!this.canAffordTower(cost)) {
      return null;
    }

    const towerId = `tower_${this.nextTowerId++}`;
    const tower: TowerData = {
      id: towerId,
      type,
      x,
      y,
      level: 1,
      ownerId
    };

    this.towers.set(towerId, tower);
    this.gold -= cost;
    return tower;
  }

  public upgradeTower(towerId: string, cost: number): boolean {
    const tower = this.towers.get(towerId);
    if (!tower || !this.canAffordTower(cost) || tower.level >= 3) {
      return false;
    }

    tower.level++;
    this.gold -= cost;
    return true;
  }

  public sellTower(towerId: string, refund: number): boolean {
    const tower = this.towers.get(towerId);
    if (!tower) {
      return false;
    }

    this.towers.delete(towerId);
    this.gold += refund;
    return true;
  }

  public spawnEnemy(type: string, wave: number, health: number, x: number, y: number): EnemyData {
    const enemyId = `enemy_${this.nextEnemyId++}`;
    const enemy: EnemyData = {
      id: enemyId,
      type,
      health,
      maxHealth: health,
      x,
      y,
      pathIndex: 0,
      wave
    };

    this.enemies.set(enemyId, enemy);
    return enemy;
  }

  public updateEnemyPosition(enemyId: string, x: number, y: number, pathIndex: number): void {
    const enemy = this.enemies.get(enemyId);
    if (enemy) {
      enemy.x = x;
      enemy.y = y;
      enemy.pathIndex = pathIndex;
    }
  }

  public damageEnemy(enemyId: string, damage: number): { died: boolean; gold: number; xp: number } {
    const enemy = this.enemies.get(enemyId);
    if (!enemy) {
      return { died: false, gold: 0, xp: 0 };
    }

    enemy.health -= damage;
    
    if (enemy.health <= 0) {
      this.enemies.delete(enemyId);
      // Gold and XP would be calculated based on enemy type and wave
      const gold = 10; // Placeholder - would come from enemy config
      const xp = 3;    // Placeholder
      this.gold += gold;
      this.xp += xp;
      
      // Check for level up
      const xpNeeded = this.playerLevel * 100;
      if (this.xp >= xpNeeded) {
        this.playerLevel++;
        this.xp -= xpNeeded;
      }
      
      return { died: true, gold, xp };
    }

    return { died: false, gold: 0, xp: 0 };
  }

  public enemyReachedEnd(enemyId: string): boolean {
    const enemy = this.enemies.get(enemyId);
    if (!enemy) {
      return false;
    }

    this.enemies.delete(enemyId);
    this.lives--;
    return true;
  }

  public startWave(waveNumber: number): void {
    this.wave = waveNumber;
    this.isWaveActive = true;
  }

  public completeWave(bonus: number): void {
    this.isWaveActive = false;
    this.gold += bonus;
  }

  public addXP(amount: number): boolean {
    this.xp += amount;
    const xpNeeded = this.playerLevel * 100;
    
    if (this.xp >= xpNeeded) {
      this.playerLevel++;
      this.xp -= xpNeeded;
      return true; // Level up occurred
    }
    
    return false;
  }

  public isGameOver(): boolean {
    return this.lives <= 0;
  }

  public getPlayerCount(): number {
    return this.players.size;
  }

  public getGold(): number {
    return this.gold;
  }

  public getLives(): number {
    return this.lives;
  }

  public getWave(): number {
    return this.wave;
  }

  public getPlayerLevel(): number {
    return this.playerLevel;
  }
}
