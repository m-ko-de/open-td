import { ResearchManager } from '../../game/ResearchManager';
import { GameUI } from '../../game/GameUI';

/**
 * XPRewardHandler - Handles XP rewards and level progression
 */
export class XPRewardHandler {
  constructor(
    private researchManager: ResearchManager,
    private ui: GameUI,
    private onLevelUp: (level: number, newResearches: string[]) => void
  ) {}

  awardXP(xp: number, waveManager?: any): void {
    const result = this.researchManager.addXP(xp);
    this.ui.updateXP(this.researchManager.getXP(), this.researchManager.getLevel());
    
    if (waveManager) {
      waveManager.setPlayerLevel(this.researchManager.getLevel());
    }
    
    if (result.levelUp) {
      this.onLevelUp(result.newLevel, result.newResearchUnlocked);
    }
  }

  checkAvailableResearches(gold: number): boolean {
    const availableResearches = this.researchManager.getAvailableResearches();
    if (availableResearches.length === 0) return false;
    
    const canAffordAny = availableResearches.some(r => 
      this.researchManager.canResearch(r.id, gold)
    );
    
    return canAffordAny || availableResearches.length > 0;
  }
}
