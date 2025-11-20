import { Enemy, EnemyType } from '../entities/Enemy';
import { BossEnemy } from '../entities/BossEnemy';
import { OptionsScene } from '../scenes/OptionsScene';
import { ConfigManager } from '../config/ConfigManager';

export class WaveManager {
  private scene: Phaser.Scene;
  private path: Phaser.Curves.Path;
  private enemies: Enemy[] = [];
  private wave: number = 0;
  private isSpawning: boolean = false;
  private waveComplete: boolean = false;
  private playerLevel: number = 1;
  private playerCount: number = 1; // Number of players in multiplayer

  constructor(scene: Phaser.Scene, path: Phaser.Curves.Path, _levelType: string = 'classic') {
    this.scene = scene;
    this.path = path;
  }

  setPlayerCount(count: number): void {
    this.playerCount = Math.max(1, count);
  }

  setPlayerLevel(level: number): void {
    this.playerLevel = level;
  }

  startWave(): void {
    if (this.isSpawning) return;
    
    this.isSpawning = true;
    this.waveComplete = false;
    this.wave++;

    const config = ConfigManager.getInstance().getConfig().waves;
    const isBossWave = this.wave % config.bossInterval === 0;

    if (isBossWave) {
      // Boss wave: spawn fewer but stronger bosses
      let bossCount = Math.max(1, Math.floor(this.wave / config.bossInterval));
      
      // Scale boss count based on player count (multiplayer scaling)
      if (this.playerCount > 1) {
        const multiplayerConfig = ConfigManager.getInstance().getConfig().multiplayer;
        const countScaling = 1 + (this.playerCount - 1) * multiplayerConfig.enemyScaling.countPerPlayer;
        bossCount = Math.max(1, Math.round(bossCount * countScaling));
      }
      
      const spawnDelay = config.bossSpawnDelay;

      for (let i = 0; i < bossCount; i++) {
        this.scene.time.delayedCall(i * spawnDelay, () => {
          const boss = new BossEnemy(this.scene, this.path, this.wave, this.playerLevel, this.playerCount);
          this.enemies.push(boss);
        });
      }

      this.scene.time.delayedCall((bossCount - 1) * spawnDelay + 100, () => {
        this.isSpawning = false;
      });
    } else {
      // Normal wave with mixed enemy types from config
      const settings = OptionsScene.getSettings();
      const difficultyConfig = config.difficulty[settings.difficulty] || config.difficulty.normal;
      
      const baseEnemies = difficultyConfig.baseEnemies;
      const enemyMultiplier = difficultyConfig.enemyMultiplier;

      // Calculate base enemy count
      let enemyCount = baseEnemies + this.wave * enemyMultiplier;
      
      // Scale enemy count based on player count (multiplayer scaling)
      if (this.playerCount > 1) {
        const multiplayerConfig = ConfigManager.getInstance().getConfig().multiplayer;
        const countScaling = 1 + (this.playerCount - 1) * multiplayerConfig.enemyScaling.countPerPlayer;
        enemyCount = Math.round(enemyCount * countScaling);
      }
      
      const spawnDelay = Math.max(
        config.spawnDelay.minimum,
        config.spawnDelay.base - this.wave * config.spawnDelay.reduction
      );

      for (let i = 0; i < enemyCount; i++) {
        this.scene.time.delayedCall(i * spawnDelay, () => {
          const enemyType = this.getEnemyTypeForWave(this.wave, i, enemyCount);
          const enemy = new Enemy(this.scene, this.path, this.wave, this.playerCount, enemyType, this.playerLevel);
          this.enemies.push(enemy);
        });
      }

      this.scene.time.delayedCall((enemyCount - 1) * spawnDelay + 100, () => {
        this.isSpawning = false;
      });
    }
  }

  update(delta: number, onEnemyKilled: (gold: number, xp: number) => void, onEnemyReachedEnd: () => void, onWaveComplete?: (wave: number) => void): void {
    this.enemies = this.enemies.filter((enemy) => {
      enemy.update(delta);
      
      if (enemy.isDead()) {
        onEnemyKilled(enemy.getGoldReward(), enemy.getXPReward());
        enemy.destroy();
        return false;
      }

      if (enemy.reachedEnd()) {
        onEnemyReachedEnd();
        enemy.destroy();
        return false;
      }

      return true;
    });

    // Check if wave is complete
    if (this.enemies.length === 0 && this.wave > 0 && !this.waveComplete && !this.isSpawning) {
      this.waveComplete = true;
      if (onWaveComplete) {
        onWaveComplete(this.wave);
      }
    }
  }

  getEnemies(): Enemy[] {
    return this.enemies;
  }

  getWave(): number {
    return this.wave;
  }

  isWaveComplete(): boolean {
    return this.waveComplete;
  }

  isSpawningEnemies(): boolean {
    return this.isSpawning;
  }

  resetWaveComplete(): void {
    this.waveComplete = false;
  }

  markWaveComplete(): void {
    this.waveComplete = true;
  }

  private getEnemyTypeForWave(wave: number, _index: number, _totalEnemies: number): EnemyType {
    // Keine fast enemies, bis Spieler Level 3 erreicht hat (Frost-Tower kann erforscht werden)
    const canSpawnFast = this.playerLevel >= 3;

    // Wave 1-2: Only normal enemies
    if (wave <= 2) {
      return 'normal';
    }

    // Wave 3-4: Erste Tanks erscheinen, aber noch keine fast
    if (wave <= 4 && !canSpawnFast) {
      const rand = Math.random();
      if (rand < 0.3) return 'tank';
      return 'normal';
    }

    // Ab Level 3 (Frost verfügbar): Fast enemies können spawnen
    if (canSpawnFast) {
      // Wave 3-5: Erste fast enemies
      if (wave <= 5) {
        const rand = Math.random();
        if (rand < 0.25) return 'fast';
        if (rand < 0.45) return 'tank';
        return 'normal';
      }

      // Wave 6-8: Mehr fast enemies
      if (wave <= 8) {
        const rand = Math.random();
        if (rand < 0.35) return 'fast';
        if (rand < 0.6) return 'tank';
        return 'normal';
      }

      // Wave 9+: Heavy mix mit vielen fast enemies
      const rand = Math.random();
      if (rand < 0.4) return 'fast';
      if (rand < 0.7) return 'tank';
      return 'normal';
    }

    // Fallback: nur normal und tank, wenn Level < 3
    return Math.random() < 0.3 ? 'tank' : 'normal';
  }

  cleanup(): void {
    this.enemies.forEach(enemy => enemy.destroy());
    this.enemies = [];
  }
}
