import { BaseTower } from './BaseTower';
import { BasicTower } from './BasicTower';
import { FastTower } from './FastTower';
import { StrongTower } from './StrongTower';
import { FrostTower } from './FrostTower';
import { FireTower } from './FireTower';
import { SplashTower } from './SplashTower';
import { SniperTower } from './SniperTower';

/**
 * TowerFactory - Creates tower instances based on type
 */
export class TowerFactory {
  /**
   * Create a tower of the specified type
   */
  static createTower(
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: string,
    cost: number
  ): BaseTower {
    switch (type) {
      case 'basic':
        return new BasicTower(scene, x, y, cost);
      
      case 'fast':
        return new FastTower(scene, x, y, cost);
      
      case 'strong':
        return new StrongTower(scene, x, y, cost);
      
      case 'frost':
        return new FrostTower(scene, x, y, cost);
      
      case 'fire':
        return new FireTower(scene, x, y, cost);
      
      case 'splash':
        return new SplashTower(scene, x, y, cost);
      
      case 'sniper':
        return new SniperTower(scene, x, y, cost);
      
      default:
        console.warn(`Unknown tower type: ${type}, creating basic tower`);
        return new BasicTower(scene, x, y, cost);
    }
  }
}
