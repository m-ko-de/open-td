/**
 * Burn effect that deals damage over time
 */
export class BurnEffect {
  private enemy: any;
  private damagePerSecond: number;
  private duration: number;
  private startTime: number;
  private lastDamageTick: number;

  constructor(enemy: any, damagePerSecond: number, duration: number) {
    this.enemy = enemy;
    this.damagePerSecond = damagePerSecond;
    this.duration = duration;
    this.startTime = Date.now();
    this.lastDamageTick = this.startTime;
  }

  update(): boolean {
    const currentTime = Date.now();
    const elapsed = currentTime - this.startTime;

    // Check if effect has expired
    if (elapsed >= this.duration) {
      return false; // Effect finished
    }

    // Apply damage every second
    const timeSinceLastTick = currentTime - this.lastDamageTick;
    if (timeSinceLastTick >= 1000) {
      this.enemy.takeDamage(this.damagePerSecond);
      this.lastDamageTick = currentTime;
    }

    return true; // Effect still active
  }

  getTimeRemaining(): number {
    const elapsed = Date.now() - this.startTime;
    return Math.max(0, this.duration - elapsed);
  }

  getDamagePerSecond(): number {
    return this.damagePerSecond;
  }

  // Refresh the burn effect (restart timer)
  refresh(): void {
    this.startTime = Date.now();
    this.lastDamageTick = this.startTime;
  }
}
