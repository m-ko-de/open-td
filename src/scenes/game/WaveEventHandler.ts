import { WaveManager } from '../../game/WaveManager';
import { XPRewardHandler } from './XPRewardHandler';

/**
 * WaveEventHandler - Handles wave-related events (completion, enemy death, etc.)
 */
export class WaveEventHandler {
  constructor(
    private waveManager: WaveManager,
    private xpHandler: XPRewardHandler,
    private onGoldChange: (amount: number) => void,
    private onLifeLost: () => void,
    private onWaveComplete: (wave: number) => void
  ) {}

  handleEnemyKilled(gold: number, xp: number): void {
    this.onGoldChange(gold);
    this.xpHandler.awardXP(xp, this.waveManager);
  }

  handleEnemyEscaped(): void {
    this.onLifeLost();
  }

  handleWaveCompleted(wave: number): void {
    const bonusGold = 50 + wave * 10;
    const xpReward = (20 + wave * 5) * 2;
    
    this.onGoldChange(bonusGold);
    this.xpHandler.awardXP(xpReward, this.waveManager);
    
    this.onWaveComplete(wave);
  }
}
