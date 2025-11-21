// Enemy exports
// Legacy export for backwards compatibility
export { Enemy } from './Enemy';
export type { EnemyType as LegacyEnemyType } from './Enemy';
export { BossEnemy } from './BossEnemy';

// New enemy system
export { BaseEnemy } from './BaseEnemy';
export { NormalEnemy } from './NormalEnemy';
export { FastEnemy } from './FastEnemy';
export { TankEnemy } from './TankEnemy';
export { ShieldedEnemy } from './ShieldedEnemy';
export { ArmoredEnemy } from './ArmoredEnemy';
export { HealingEnemy } from './HealingEnemy';
export { EnemyFactory } from './EnemyFactory';
export type { EnemyType } from './EnemyFactory';
