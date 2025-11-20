/**
 * TitleDisplay - Manages animated title and subtitle display
 */
export class TitleDisplay {
  constructor(private scene: Phaser.Scene) {}

  createAnimatedTitle(
    x: number,
    y: number,
    titleText: string,
    subtitleText?: string
  ): void {
    // Title with enhanced styling
    const title = this.scene.add.text(x, y - 20, titleText, {
      font: 'bold 80px Arial',
      color: '#00ff00',
    });
    title.setOrigin(0.5);
    title.setStroke('#003300', 10);
    title.setShadow(0, 0, '#00ff00', 20, false, true);
    
    // Title entrance animation
    title.setScale(0);
    title.setAlpha(0);
    this.scene.tweens.add({
      targets: title,
      scale: 1,
      alpha: 1,
      duration: 800,
      ease: 'Back.easeOut',
    });
    
    // Continuous pulse
    this.scene.tweens.add({
      targets: title,
      scale: { from: 1, to: 1.05 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Subtitle with typewriter effect
    if (subtitleText) {
      const subtitle = this.scene.add.text(x, y + 70, '', {
        font: '28px Arial',
        color: '#00cc00',
      });
      subtitle.setOrigin(0.5);
      
      let currentChar = 0;
      this.scene.time.addEvent({
        delay: 100,
        callback: () => {
          if (currentChar < subtitleText.length) {
            subtitle.setText(subtitleText.substring(0, currentChar + 1));
            currentChar++;
          }
        },
        repeat: subtitleText.length - 1,
      });
    }
  }
}
