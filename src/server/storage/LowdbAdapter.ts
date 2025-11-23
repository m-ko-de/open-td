import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  email?: string;
  createdAt: string;
  // weitere Felder nach Bedarf
}

export interface RankingEntry {
  userId: string;
  score: number;
  timestamp: string;
}

export interface Stats {
  userId: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  // weitere Metriken
}

export interface GameState {
  userId: string;
  state: any;
  updatedAt: string;
}

export interface Metrics {
  key: string;
  value: number;
  updatedAt: string;
}

export interface LowdbSchema {
  users: User[];
  rankings: RankingEntry[];
  stats: Stats[];
  gameStates: GameState[];
  metrics: Metrics[];
}

import { StorageAdapter } from './StorageAdapter';

export class LowdbAdapter implements StorageAdapter {
  private db: Low<LowdbSchema>;

  constructor(file: string) {
    this.db = new Low<LowdbSchema>(new JSONFile<LowdbSchema>(file), {
      users: [],
      rankings: [],
      stats: [],
      gameStates: [],
      metrics: [],
    });
  }

  private async ensureDb() {
    await this.db.read();
    if (!this.db.data) {
      this.db.data = {
        users: [],
        rankings: [],
        stats: [],
        gameStates: [],
        metrics: [],
      };
      await this.db.write();
    }
  }

  async save(userId: string, key: string, value: any): Promise<void> {
    await this.ensureDb();
    // Save to users, gameStates, stats, rankings, metrics depending on key
    if (key === 'user') {
      const idx = this.db.data!.users.findIndex(u => u.id === userId);
      if (idx >= 0) {
        this.db.data!.users[idx] = { ...this.db.data!.users[idx], ...value };
      } else {
        this.db.data!.users.push({ id: userId, ...value });
      }
    } else if (key === 'gameState') {
      const idx = this.db.data!.gameStates.findIndex(g => g.userId === userId);
      if (idx >= 0) {
        this.db.data!.gameStates[idx] = { ...this.db.data!.gameStates[idx], ...value };
      } else {
        this.db.data!.gameStates.push({ userId, ...value });
      }
    } else if (key === 'stats') {
      const idx = this.db.data!.stats.findIndex(s => s.userId === userId);
      if (idx >= 0) {
        this.db.data!.stats[idx] = { ...this.db.data!.stats[idx], ...value };
      } else {
        this.db.data!.stats.push({ userId, ...value });
      }
    } else if (key === 'ranking') {
      this.db.data!.rankings.push({ userId, ...value });
    } else if (key === 'metric') {
      const idx = this.db.data!.metrics.findIndex(m => m.key === value.key);
      if (idx >= 0) {
        this.db.data!.metrics[idx] = { ...this.db.data!.metrics[idx], ...value };
      } else {
        this.db.data!.metrics.push(value);
      }
    } else {
      // fallback: store in metrics
      this.db.data!.metrics.push({ key, value, updatedAt: new Date().toISOString() });
    }
    await this.db.write();
  }

  async load(userId: string, key: string): Promise<any | null> {
    await this.ensureDb();
    if (key === 'user') {
      return this.db.data!.users.find(u => u.id === userId) || null;
    } else if (key === 'gameState') {
      return this.db.data!.gameStates.find(g => g.userId === userId) || null;
    } else if (key === 'stats') {
      return this.db.data!.stats.find(s => s.userId === userId) || null;
    } else if (key === 'ranking') {
      return this.db.data!.rankings.filter(r => r.userId === userId) || [];
    } else if (key === 'metric') {
      return this.db.data!.metrics || [];
    } else {
      return null;
    }
  }

  async keys(userId: string): Promise<string[]> {
    await this.ensureDb();
    const keys: string[] = [];
    if (this.db.data!.users.find(u => u.id === userId)) keys.push('user');
    if (this.db.data!.gameStates.find(g => g.userId === userId)) keys.push('gameState');
    if (this.db.data!.stats.find(s => s.userId === userId)) keys.push('stats');
    if (this.db.data!.rankings.find(r => r.userId === userId)) keys.push('ranking');
    if (this.db.data!.metrics.length > 0) keys.push('metric');
    return keys;
  }

  async delete(userId: string, key: string): Promise<void> {
    await this.ensureDb();
    if (key === 'user') {
      this.db.data!.users = this.db.data!.users.filter(u => u.id !== userId);
    } else if (key === 'gameState') {
      this.db.data!.gameStates = this.db.data!.gameStates.filter(g => g.userId !== userId);
    } else if (key === 'stats') {
      this.db.data!.stats = this.db.data!.stats.filter(s => s.userId !== userId);
    } else if (key === 'ranking') {
      this.db.data!.rankings = this.db.data!.rankings.filter(r => r.userId !== userId);
    } else if (key === 'metric') {
      // For metrics, delete by key instead of userId
      // No action for userId, as metrics are global
    }
    await this.db.write();
  }
}
