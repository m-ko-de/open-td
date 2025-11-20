/**
 * DifficultySelector - Manages difficulty selection UI
 */
export class DifficultySelector {
  private buttons: Phaser.GameObjects.Text[] = [];
  private currentDifficulty: string;

  constructor(
    private scene: Phaser.Scene,
    private onChange: (difficulty: string) => void
  ) {
    this.currentDifficulty = 'normal';
  }

  create(
    centerX: number,
    centerY: number,
    initialDifficulty: string
  ): { label: Phaser.GameObjects.Text; buttons: Phaser.GameObjects.Text[] } {
    this.currentDifficulty = initialDifficulty;

    const difficultyLabel = this.scene.add.text(centerX - 150, centerY + 50, 'Schwierigkeit:', {
      font: '24px Arial',
      color: '#ffffff',
    });

    const difficulties = [
      { value: 'easy', label: 'Leicht', color: 0x00aa00 },
      { value: 'normal', label: 'Normal', color: 0x0066cc },
      { value: 'hard', label: 'Schwer', color: 0xcc0000 },
    ];

    difficulties.forEach((diff, index) => {
      const button = this.scene.add.text(
        centerX - 120 + index * 120,
        centerY + 100,
        diff.label,
        {
          font: '20px Arial',
          color: '#ffffff',
          backgroundColor: this.currentDifficulty === diff.value 
            ? `#${diff.color.toString(16).padStart(6, '0')}` 
            : '#333333',
          padding: { x: 15, y: 8 },
        }
      );
      button.setOrigin(0.5);
      button.setInteractive({ useHandCursor: true });

      button.on('pointerover', () => {
        if (this.currentDifficulty !== diff.value) {
          button.setStyle({ backgroundColor: '#555555' });
        }
      });

      button.on('pointerout', () => {
        if (this.currentDifficulty !== diff.value) {
          button.setStyle({ backgroundColor: '#333333' });
        }
      });

      button.on('pointerdown', () => {
        this.currentDifficulty = diff.value;
        this.onChange(diff.value);
        
        // Update all buttons
        this.buttons.forEach((btn, i) => {
          const d = difficulties[i];
          btn.setStyle({
            backgroundColor: this.currentDifficulty === d.value 
              ? `#${d.color.toString(16).padStart(6, '0')}` 
              : '#333333',
          });
        });
      });

      this.buttons.push(button);
    });

    return { label: difficultyLabel, buttons: this.buttons };
  }

  getDifficultyInfo(): string {
    switch (this.currentDifficulty) {
      case 'easy':
        return 'Weniger Gegner, mehr Startgold';
      case 'normal':
        return 'Ausbalanciertes Spielerlebnis';
      case 'hard':
        return 'Mehr Gegner, weniger Ressourcen';
      default:
        return '';
    }
  }
}
