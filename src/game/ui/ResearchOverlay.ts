import { ResearchManager } from '../ResearchManager';
import { t } from '@/client/i18n';

/**
 * Manages the research overlay UI
 */
export class ResearchOverlay {
  private scene: Phaser.Scene;
  private researchManager: ResearchManager;
  private container?: Phaser.GameObjects.Container;
  private gold: number;
  private onGoldSpent: (amount: number) => void;
  private onResearchComplete: (researchId: string) => void;

  constructor(
    scene: Phaser.Scene,
    researchManager: ResearchManager,
    gold: number,
    onGoldSpent: (amount: number) => void,
    onResearchComplete: (researchId: string) => void
  ) {
    this.scene = scene;
    this.researchManager = researchManager;
    this.gold = gold;
    this.onGoldSpent = onGoldSpent;
    this.onResearchComplete = onResearchComplete;
  }

  updateGold(gold: number): void {
    this.gold = gold;
  }

  isOpen(): boolean {
    return this.container !== undefined;
  }

  toggle(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.show();
    }
  }

  show(): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(1000);

    // Background
    const bg = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.8);
    bg.setOrigin(0);
    bg.setInteractive();
    this.container.add(bg);

    // Panel
    const panelWidth = 600;
    const panelHeight = 500;
    const panel = this.scene.add.rectangle(width / 2, height / 2, panelWidth, panelHeight, 0x222222);
    this.container.add(panel);

    // Title
    const title = this.scene.add.text(width / 2, height / 2 - panelHeight / 2 + 40, t('research.title'), {
      font: 'bold 32px Arial',
      color: '#ffffff',
    });
    title.setOrigin(0.5);
    this.container.add(title);

    // Available researches
    const availableResearches = this.researchManager.getAvailableResearches();
    const startY = height / 2 - panelHeight / 2 + 100;
    const itemHeight = 100;

    availableResearches.forEach((research, index) => {
      const y = startY + index * itemHeight;

      // Research item background
      const itemBg = this.scene.add.rectangle(width / 2, y, panelWidth - 60, itemHeight - 10, 0x333333);
      this.container!.add(itemBg);

      // Research name
      const name = this.scene.add.text(width / 2 - 250, y - 20, research.name, {
        font: 'bold 20px Arial',
        color: '#ffff00',
      });
      this.container!.add(name);

      // Research description
      const desc = this.scene.add.text(width / 2 - 250, y + 5, research.description, {
        font: '16px Arial',
        color: '#cccccc',
      });
      this.container!.add(desc);

      // Cost
      const cost = this.scene.add.text(width / 2 - 250, y + 30, t('research.cost_fmt', { gold: research.goldCost, xp: research.xpRequired }), {
        font: '14px Arial',
        color: '#aaaaaa',
      });
      this.container!.add(cost);

      // Research button
      const canResearch = this.researchManager.canResearch(research.id, this.gold);
      const btnText = this.scene.add.text(width / 2 + 180, y, t('research.research_button'), {
        font: 'bold 18px Arial',
        color: '#ffffff',
        backgroundColor: canResearch ? '#00aa00' : '#666666',
        padding: { x: 15, y: 8 },
      });
      btnText.setOrigin(0.5);
      
      if (canResearch) {
        btnText.setInteractive({ useHandCursor: true });
        
        btnText.on('pointerover', () => {
          btnText.setStyle({ backgroundColor: '#00ff00' });
        });

        btnText.on('pointerout', () => {
          btnText.setStyle({ backgroundColor: '#00aa00' });
        });

        btnText.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          pointer.event.stopPropagation();
          this.handleResearch(research.id);
        });
      }

      this.container!.add(btnText);
    });

    // No researches available message
    if (availableResearches.length === 0) {
      const noResearch = this.scene.add.text(width / 2, height / 2, t('research.no_research'), {
        font: '20px Arial',
        color: '#888888',
      });
      noResearch.setOrigin(0.5);
      this.container!.add(noResearch);

      const hint = this.scene.add.text(width / 2, height / 2 + 40, t('research.hint'), {
        font: '16px Arial',
        color: '#666666',
      });
      hint.setOrigin(0.5);
      this.container!.add(hint);
    }

    // Close button
    const closeBtn = this.scene.add.text(width / 2, height / 2 + panelHeight / 2 - 40, t('menu.close'), {
      font: 'bold 20px Arial',
      color: '#ffffff',
      backgroundColor: '#ff0000',
      padding: { x: 20, y: 10 },
    });
    closeBtn.setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });

    closeBtn.on('pointerover', () => {
      closeBtn.setStyle({ backgroundColor: '#ff4444' });
    });

    closeBtn.on('pointerout', () => {
      closeBtn.setStyle({ backgroundColor: '#ff0000' });
    });

    closeBtn.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      this.close();
    });

    this.container!.add(closeBtn);
  }

  close(): void {
    if (this.container) {
      this.container.destroy();
      this.container = undefined;
    }
  }

  private handleResearch(researchId: string): void {
    const research = this.researchManager.getResearch(researchId);
    if (!research) return;

    if (this.researchManager.canResearch(researchId, this.gold)) {
      this.researchManager.research(researchId);
      this.onGoldSpent(research.goldCost);
      this.onResearchComplete(researchId);

      // Refresh overlay
      this.close();
      this.show();
    }
  }
}
