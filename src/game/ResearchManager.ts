export interface Research {
  id: string;
  name: string;
  description: string;
  goldCost: number;
  xpRequired: number;
  unlocked: boolean;
  researched: boolean;
}

export class ResearchManager {
  private xp: number = 0;
  private level: number = 1;
  private researches: Map<string, Research>;

  constructor() {
    this.researches = new Map();
    this.initializeResearches();
    // Check unlocks on initialization in case player is already at level 3+
    this.checkUnlocks();
  }

  private initializeResearches(): void {
    // Basic Tower Upgrade - available after 3 waves (level 2)
    this.researches.set('basic_tower_upgrade', {
      id: 'basic_tower_upgrade',
      name: 'Basis-Turm Upgrade',
      description: 'Verbessert Basis-Türme: +20% Schaden, +10% Reichweite',
      goldCost: 150,
      xpRequired: 0,
      unlocked: true, // Available from start (level 1)
      researched: false,
    });

    // Frost Tower research - unlocks at level 3
    this.researches.set('frost_tower', {
      id: 'frost_tower',
      name: 'Frost-Turm',
      description: 'Schaltet den Frost-Turm frei, der Gegner verlangsamt',
      goldCost: 300,
      xpRequired: 0, // No XP requirement, only level requirement (level 3)
      unlocked: false,
      researched: false,
    });

    // Fire Tower research - unlocks at level 4
    this.researches.set('fire_tower', {
      id: 'fire_tower',
      name: 'Feuer-Turm',
      description: 'Schaltet den Feuer-Turm frei, der Gegner verbrennt (8 Schaden/Sek für 5 Sek)',
      goldCost: 350,
      xpRequired: 0, // No XP requirement, only level requirement (level 4)
      unlocked: false,
      researched: false,
    });

    // Future researches can be added here
    this.researches.set('tower_damage_1', {
      id: 'tower_damage_1',
      name: 'Verstärkter Schaden I',
      description: '+10% Schaden für alle Türme',
      goldCost: 200,
      xpRequired: 0,
      unlocked: false, // Unlocks at level 4
      researched: false,
    });

    this.researches.set('tower_range_1', {
      id: 'tower_range_1',
      name: 'Erweiterte Reichweite I',
      description: '+10% Reichweite für alle Türme',
      goldCost: 200,
      xpRequired: 0,
      unlocked: false, // Unlocks at level 4
      researched: false,
    });
  }

  addXP(amount: number): { levelUp: boolean; newLevel: number; newResearchUnlocked: string[] } {
    this.xp += amount;
    let leveledUp = false;
    const allUnlockedResearches: string[] = [];
    
    // Check for multiple level ups
    while (this.xp >= this.getXPForLevel(this.level + 1)) {
      this.level++;
      leveledUp = true;
      const unlockedResearches = this.checkUnlocks();
      allUnlockedResearches.push(...unlockedResearches);
    }
    
    if (leveledUp) {
      return { levelUp: true, newLevel: this.level, newResearchUnlocked: allUnlockedResearches };
    }
    
    return { levelUp: false, newLevel: this.level, newResearchUnlocked: [] };
  }

  private getXPForLevel(level: number): number {
    // Level 1->2: 100 XP, Level 2->3: 200 XP, Level 3->4: 300 XP, etc.
    // Total XP needed: Level 2=100, Level 3=300, Level 4=600, Level 5=1000
    return level * 100;
  }

  private checkUnlocks(): string[] {
    const newlyUnlocked: string[] = [];
    
    console.log('Checking unlocks, current level:', this.level);
    
    // Unlock frost tower at level 3
    if (this.level >= 3) {
      const frostTower = this.researches.get('frost_tower');
      console.log('Frost tower before unlock:', frostTower?.unlocked);
      if (frostTower && !frostTower.unlocked) {
        frostTower.unlocked = true;
        newlyUnlocked.push(frostTower.name);
        console.log('Frost tower unlocked!');
      }
    }
    
    // Unlock fire tower at level 4
    if (this.level >= 4) {
      const fireTower = this.researches.get('fire_tower');
      if (fireTower && !fireTower.unlocked) {
        fireTower.unlocked = true;
        newlyUnlocked.push(fireTower.name);
      }
      
      const damageUpgrade = this.researches.get('tower_damage_1');
      if (damageUpgrade && !damageUpgrade.unlocked) {
        damageUpgrade.unlocked = true;
        newlyUnlocked.push(damageUpgrade.name);
      }
      
      const rangeUpgrade = this.researches.get('tower_range_1');
      if (rangeUpgrade && !rangeUpgrade.unlocked) {
        rangeUpgrade.unlocked = true;
        newlyUnlocked.push(rangeUpgrade.name);
      }
    }
    
    return newlyUnlocked;
  }

  canResearch(researchId: string, currentGold: number): boolean {
    const research = this.researches.get(researchId);
    if (!research) return false;
    
    // Check if unlocked, not already researched, and player has enough gold
    // Note: xpRequired is a prerequisite for unlocking, not for researching
    return research.unlocked && 
           !research.researched && 
           currentGold >= research.goldCost;
  }

  research(researchId: string): boolean {
    const research = this.researches.get(researchId);
    if (!research || !research.unlocked || research.researched) {
      return false;
    }
    
    research.researched = true;
    return true;
  }

  isResearched(researchId: string): boolean {
    const research = this.researches.get(researchId);
    return research ? research.researched : false;
  }

  getAvailableResearches(): Research[] {
    const available = Array.from(this.researches.values()).filter(r => r.unlocked && !r.researched);
    console.log('Available researches:', available.map(r => ({ name: r.name, unlocked: r.unlocked, researched: r.researched })));
    console.log('Current level:', this.level, 'XP:', this.xp);
    return available;
  }

  getResearch(researchId: string): Research | undefined {
    return this.researches.get(researchId);
  }

  getXP(): number {
    return this.xp;
  }

  getLevel(): number {
    return this.level;
  }

  getXPForNextLevel(): number {
    return this.getXPForLevel(this.level + 1);
  }

  getXPProgress(): number {
    const currentLevelXP = this.level > 1 ? this.getXPForLevel(this.level) : 0;
    const nextLevelXP = this.getXPForLevel(this.level + 1);
    const xpInCurrentLevel = this.xp - currentLevelXP;
    const xpNeededForLevel = nextLevelXP - currentLevelXP;
    
    return xpInCurrentLevel / xpNeededForLevel;
  }
}
