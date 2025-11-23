import { MapRegistry } from '../game/MapRegistry';

export class PreloaderScene extends Phaser.Scene {
  private particles!: Phaser.GameObjects.Graphics[];
  private mapRegistry: MapRegistry;
  
  constructor() {
    super({ key: 'PreloaderScene' });
    this.mapRegistry = MapRegistry.getInstance();
  }

  preload(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Dark gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a0a, 0x0a0a0a, 0x1a1a2e, 0x1a1a2e, 1);
    bg.fillRect(0, 0, width, height);

    // Animated particles in background
    this.particles = [];
    for (let i = 0; i < 20; i++) {
      const particle = this.add.graphics();
      particle.fillStyle(0x00ff00, 0.3);
      particle.fillCircle(0, 0, Math.random() * 3 + 1);
      particle.x = Math.random() * width;
      particle.y = Math.random() * height;
      this.particles.push(particle);
      
      // Animate particle
      this.tweens.add({
        targets: particle,
        y: particle.y + Math.random() * 200 - 100,
        x: particle.x + Math.random() * 100 - 50,
        alpha: { from: 0.3, to: 0 },
        duration: 2000 + Math.random() * 1000,
        repeat: -1,
        yoyo: true,
      });
    }

    // Title with glow effect
    const title = this.add.text(width / 2, height / 3, 'OPEN TD', {
      font: 'bold 72px Arial',
      color: '#00ff00',
    });
    title.setOrigin(0.5);
    title.setStroke('#003300', 8);
    
    // Pulse animation for title
    this.tweens.add({
      targets: title,
      scale: { from: 1, to: 1.05 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Subtitle
    const subtitle = this.add.text(width / 2, height / 3 + 60, 'Tower Defense', {
      font: '24px Arial',
      color: '#00aa00',
    });
    subtitle.setOrigin(0.5);
    subtitle.setAlpha(0);
    
    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      duration: 800,
      delay: 300,
    });

    // Progress bar background with border
    const progressBox = this.add.graphics();
    progressBox.lineStyle(3, 0x00ff00, 0.8);
    progressBox.strokeRoundedRect(width / 2 - 165, height / 2 + 50, 330, 40, 10);
    progressBox.fillStyle(0x000000, 0.5);
    progressBox.fillRoundedRect(width / 2 - 165, height / 2 + 50, 330, 40, 10);

    // Progress bar fill
    const progressBar = this.add.graphics();

    // Loading text
    const loadingText = this.add.text(width / 2, height / 2 + 20, 'Lädt...', {
      font: '20px Arial',
      color: '#00ff00',
    });
    loadingText.setOrigin(0.5);
    
    // Animate loading text dots
    let dotCount = 0;
    this.time.addEvent({
      delay: 500,
      callback: () => {
        dotCount = (dotCount + 1) % 4;
        loadingText.setText('Lädt' + '.'.repeat(dotCount));
      },
      loop: true,
    });

    // Percentage text
    const percentText = this.add.text(width / 2, height / 2 + 70, '0%', {
      font: 'bold 20px Arial',
      color: '#ffffff',
    });
    percentText.setOrigin(0.5);

    // Update loading bar with animation
    this.load.on('progress', (value: number) => {
      progressBar.clear();
      
      // Gradient fill for progress bar
      progressBar.fillGradientStyle(0x00ff00, 0x00ff00, 0x00aa00, 0x00aa00, 1);
      progressBar.fillRoundedRect(width / 2 - 160, height / 2 + 55, 320 * value, 30, 8);
      
      // Add glow effect
      progressBar.lineStyle(2, 0x00ff00, 0.5);
      progressBar.strokeRoundedRect(width / 2 - 160, height / 2 + 55, 320 * value, 30, 8);
      
      percentText.setText(`${Math.floor(value * 100)}%`);
      
      // Scale animation on percent text
      this.tweens.add({
        targets: percentText,
        scale: { from: 1, to: 1.1 },
        duration: 100,
        yoyo: true,
      });
    });

    // Tower & Sound assets vorladen
    this.load.audio('click', 'assets/sounds/click.mp3');
    this.load.audio('music', 'assets/music/menu.mp3');
    this.load.audio('tower_basic', 'assets/sounds/tower_basic.mp3');
    this.load.audio('tower_fast', 'assets/sounds/tower_fast.mp3');
    this.load.audio('tower_fire', 'assets/sounds/tower_fire.mp3');
    this.load.audio('tower_frost', 'assets/sounds/tower_frost.mp3');
    this.load.audio('tower_sniper', 'assets/sounds/tower_sniper.mp3');
    this.load.audio('tower_splash', 'assets/sounds/tower_splash.mp3');
    this.load.audio('tower_strong', 'assets/sounds/tower_strong.mp3');
    
    // Handle load complete
    this.load.once('complete', () => {
      // Fade out animation after a short delay
      this.time.delayedCall(800, () => {
        this.tweens.add({
          targets: [progressBar, progressBox, loadingText, percentText, title, subtitle],
          alpha: 0,
          duration: 500,
        });
        
        this.particles.forEach(p => {
          this.tweens.add({
            targets: p,
            alpha: 0,
            duration: 500,
          });
        });
      });
    });
  }

  async create(): Promise<void> {
    // Load all maps
    console.log('Loading maps...');
    await this.mapRegistry.loadAllMaps();
    console.log(`Loaded ${this.mapRegistry.getMapCount()} maps`);

    // If no assets were loaded, the preload completes immediately
    // So we need to manually trigger progress updates
    if (this.load.totalToLoad === 0) {
      // Simulate loading progress for visual effect
      let progress = 0;
      const interval = setInterval(() => {
        progress += 0.1;
        if (progress >= 1) {
          progress = 1;
          clearInterval(interval);
          this.load.emit('complete');
          
          // Wait for animations then transition to login
          this.time.delayedCall(1500, () => {
            this.cameras.main.fadeOut(300);
            this.cameras.main.once('camerafadeoutcomplete', () => {
              this.scene.start('LoginScene');
            });
          });
        }
        this.load.emit('progress', progress);
      }, 100);
    } else {
      // Real assets are loading, transition after they complete
      this.load.once('complete', () => {
        this.time.delayedCall(1500, () => {
          this.cameras.main.fadeOut(300);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('LoginScene');
          });
        });
      });
    }
  }
}
