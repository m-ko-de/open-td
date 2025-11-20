/**
 * BackgroundEffects - Manages animated background elements for scenes
 */
export class BackgroundEffects {
  constructor(private scene: Phaser.Scene) {}

  createGradientBackground(width: number, height: number): void {
    const bg = this.scene.add.graphics();
    bg.fillGradientStyle(0x0a0a0a, 0x0a0a0a, 0x162447, 0x1f4068, 1);
    bg.fillRect(0, 0, width, height);
  }

  createParticles(width: number, height: number, count: number = 30): void {
    for (let i = 0; i < count; i++) {
      const particle = this.scene.add.graphics();
      particle.fillStyle(0x00ff00, 0.1 + Math.random() * 0.2);
      particle.fillCircle(0, 0, Math.random() * 4 + 2);
      particle.x = Math.random() * width;
      particle.y = Math.random() * height;
      
      this.scene.tweens.add({
        targets: particle,
        y: particle.y + Math.random() * 300 - 150,
        x: particle.x + Math.random() * 200 - 100,
        alpha: { from: particle.alpha, to: 0 },
        scale: { from: 1, to: 0 },
        duration: 3000 + Math.random() * 2000,
        repeat: -1,
        delay: Math.random() * 2000,
      });
    }
  }
}
