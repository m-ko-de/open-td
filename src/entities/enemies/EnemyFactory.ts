import { BaseEnemy } from './BaseEnemy';
import { NormalEnemy } from './NormalEnemy';
import { FastEnemy } from './FastEnemy';
import { TankEnemy } from './TankEnemy';
import { ShieldedEnemy } from './ShieldedEnemy';
import { ArmoredEnemy } from './ArmoredEnemy';
import { HealingEnemy } from './HealingEnemy';

export type EnemyType = 'normal' | 'fast' | 'tank' | 'shielded' | 'armored' | 'healing';

export class EnemyFactory {
  static createEnemy(
    scene: Phaser.Scene,
    path: Phaser.Curves.Path,
    type: EnemyType,
    wave: number,
    playerCount: number = 1,
    playerLevel: number = 1
  ): BaseEnemy {
    switch (type) {
      case 'normal':
        return new NormalEnemy(scene, path, wave, playerCount, playerLevel);
      
      case 'fast':
        return new FastEnemy(scene, path, wave, playerCount, playerLevel);
      
      case 'tank':
        return new TankEnemy(scene, path, wave, playerCount, playerLevel);
      
      case 'shielded':
        return new ShieldedEnemy(scene, path, wave, playerCount, playerLevel);
      
      case 'armored':
        return new ArmoredEnemy(scene, path, wave, playerCount, playerLevel);
      
      case 'healing':
        return new HealingEnemy(scene, path, wave, playerCount, playerLevel);
      
      default:
        console.warn(`Unknown enemy type: ${type}, defaulting to normal`);
        return new NormalEnemy(scene, path, wave, playerCount, playerLevel);
    }
  }

  /**
   * Get a random enemy type based on wave progression
   * Early waves: mostly normal enemies
   * Later waves: more variety and special types
   */
  static getRandomType(wave: number): EnemyType {
    // Wave 1-3: Only normal and fast
    if (wave <= 3) {
      return Math.random() < 0.7 ? 'normal' : 'fast';
    }

    // Wave 4-7: Add tank
    if (wave <= 7) {
      const rand = Math.random();
      if (rand < 0.5) return 'normal';
      if (rand < 0.75) return 'fast';
      return 'tank';
    }

    // Wave 8-12: Add shielded
    if (wave <= 12) {
      const rand = Math.random();
      if (rand < 0.35) return 'normal';
      if (rand < 0.6) return 'fast';
      if (rand < 0.8) return 'tank';
      return 'shielded';
    }

    // Wave 13-18: Add armored
    if (wave <= 18) {
      const rand = Math.random();
      if (rand < 0.25) return 'normal';
      if (rand < 0.45) return 'fast';
      if (rand < 0.65) return 'tank';
      if (rand < 0.85) return 'shielded';
      return 'armored';
    }

    // Wave 19+: All types including healing (rare but valuable target)
    const rand = Math.random();
    if (rand < 0.2) return 'normal';
    if (rand < 0.35) return 'fast';
    if (rand < 0.5) return 'tank';
    if (rand < 0.65) return 'shielded';
    if (rand < 0.8) return 'armored';
    return 'healing';
  }

  /**
   * Get enemy types for a specific wave composition
   * Returns an array of enemy types for the wave
   */
  static getWaveComposition(wave: number, enemyCount: number): EnemyType[] {
    const types: EnemyType[] = [];

    // Boss waves (every 10 waves) - handled separately
    if (wave % 10 === 0) {
      // Boss waves use normal enemies as support
      for (let i = 0; i < enemyCount; i++) {
        types.push('normal');
      }
      return types;
    }

    // Special themed waves
    if (wave % 5 === 0 && wave > 5) {
      // Every 5th wave: Healer support wave (if unlocked)
      if (wave >= 19) {
        const healerCount = Math.min(2, Math.floor(enemyCount * 0.15));
        for (let i = 0; i < healerCount; i++) {
          types.push('healing');
        }
        // Fill rest with tanks and armored
        for (let i = healerCount; i < enemyCount; i++) {
          types.push(Math.random() < 0.5 ? 'tank' : 'armored');
        }
        return types;
      }
    }

    // Normal waves: Random composition
    for (let i = 0; i < enemyCount; i++) {
      types.push(this.getRandomType(wave));
    }

    return types;
  }
}
