import { BaseEnemy, EnemyFactory, BossEnemy } from '../entities/enemies';
import { OptionsScene } from '../scenes/OptionsScene';
import { ConfigManager } from '../config/ConfigManager';

export class WaveManager {
  private scene: Phaser.Scene;
  private path: Phaser.Curves.Path;
  private enemies: BaseEnemy[] = [];
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
          this.enemies.push(boss as any);
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

      // Get wave composition from factory
      const waveComposition = EnemyFactory.getWaveComposition(this.wave, enemyCount);

      for (let i = 0; i < enemyCount; i++) {
        this.scene.time.delayedCall(i * spawnDelay, () => {
          const enemyType = waveComposition[i] || 'normal';
          const enemy = EnemyFactory.createEnemy(
            this.scene,
            this.path,
            enemyType,
            this.wave,
            this.playerCount,
            this.playerLevel
          );
          this.enemies.push(enemy);
        });
      }

      this.scene.time.delayedCall((enemyCount - 1) * spawnDelay + 100, () => {
        this.isSpawning = false;
      });
    }
  }

  update(delta: number, onEnemyKilled: (gold: number, xp: number) => void, onEnemyReachedEnd: () => void, onWaveComplete?: (wave: number) => void): void {
    const newEnemies: BaseEnemy[] = [];

    this.enemies = this.enemies.filter((enemy) => {
      // Pass all enemies for special behaviors (e.g., healing aura)
      enemy.update(delta, this.enemies);
      
      if (enemy.isDead()) {
        onEnemyKilled(enemy.getGoldReward(), enemy.getXPReward());
        
        // Check for special death behavior (e.g., splitting enemies)
        const spawnedEnemies = enemy.takeDamage(0); // Get spawned enemies if any
        newEnemies.push(...spawnedEnemies);
        
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

    // Add newly spawned enemies (from splitting, etc.)
    this.enemies.push(...newEnemies);

    // Check if wave is complete
    if (this.enemies.length === 0 && this.wave > 0 && !this.waveComplete && !this.isSpawning) {
      this.waveComplete = true;
      if (onWaveComplete) {
        onWaveComplete(this.wave);
      }
    }
  }

  getEnemies(): BaseEnemy[] {
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



  cleanup(): void {
    this.enemies.forEach(enemy => enemy.destroy());
    this.enemies = [];
  }
}
