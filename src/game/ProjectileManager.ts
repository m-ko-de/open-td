import { Projectile } from '../entities/projectiles/Projectile';

/**
 * Manages all active projectiles in the game
 */
export class ProjectileManager {
  private projectiles: Projectile[] = [];

  /**
   * Add a new projectile to be tracked and updated
   */
  addProjectile(projectile: Projectile): void {
    this.projectiles.push(projectile);
  }

  /**
   * Update all projectiles and remove those that have hit their targets
   */
  update(delta: number): void {
    // Update all projectiles
    for (const projectile of this.projectiles) {
      projectile.update(delta);
    }

    // Remove projectiles that should be destroyed
    this.projectiles = this.projectiles.filter(projectile => {
      if (projectile.shouldDestroy()) {
        projectile.destroy();
        return false;
      }
      return true;
    });
  }

  /**
   * Get the count of active projectiles
   */
  getCount(): number {
    return this.projectiles.length;
  }

  /**
   * Clear all projectiles (for game reset)
   */
  clear(): void {
    for (const projectile of this.projectiles) {
      projectile.destroy();
    }
    this.projectiles = [];
  }
}
