export class LevelManager {
  private scene: Phaser.Scene;
  private path!: Phaser.Curves.Path;
  private levelType: string;

  constructor(scene: Phaser.Scene, levelType: string = 'classic') {
    this.scene = scene;
    this.levelType = levelType;
  }

  create(): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    // Background with gradient
    this.createBackground(width, height);

    // Add decorations before path
    this.addTerrainDecorations(width, height);

    // Create path based on level type
    this.createPath();

    // Draw path with depth
    this.drawPathWithDepth();

    // Add decorations on top of path
    this.addVegetationDecorations(width, height);
  }

  private createPath(): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    switch (this.levelType) {
      case 'classic':
        this.createClassicPath(width, height);
        break;
      case 'spiral':
        this.createSpiralPath(width, height);
        break;
      case 'zigzag':
        this.createZigzagPath(width, height);
        break;
      default:
        this.createClassicPath(width, height);
    }
  }

  private createClassicPath(width: number, height: number): void {
    // Simple path with curves - stays below sky line (40%)
    const startY = height * 0.6;
    const minY = height * 0.45; // Minimum Y to stay out of sky
    
    this.path = new Phaser.Curves.Path(50, startY);
    this.path.lineTo(300, startY);
    this.path.lineTo(300, minY);
    this.path.lineTo(600, minY);
    this.path.lineTo(600, height * 0.75);
    this.path.lineTo(900, height * 0.75);
    this.path.lineTo(900, startY);
    this.path.lineTo(width - 50, startY);
  }

  private createSpiralPath(width: number, height: number): void {
    // Spiral from outside to center - stays below sky line (40%)
    const minY = height * 0.45;
    const margin = 80;
    
    this.path = new Phaser.Curves.Path(50, minY);
    this.path.lineTo(width - margin, minY);
    this.path.lineTo(width - margin, height - margin);
    this.path.lineTo(180, height - margin);
    this.path.lineTo(180, minY + 100);
    this.path.lineTo(width - 180, minY + 100);
    this.path.lineTo(width - 180, height - 180);
    this.path.lineTo(280, height - 180);
    this.path.lineTo(280, minY + 200);
    this.path.lineTo(width / 2 + 20, minY + 200);
  }

  private createZigzagPath(width: number, height: number): void {
    // Zigzag pattern - stays below sky line (40%)
    const topY = height * 0.45;
    const bottomY = height - 100;
    
    this.path = new Phaser.Curves.Path(50, topY);
    this.path.lineTo(200, topY);
    this.path.lineTo(300, bottomY);
    this.path.lineTo(400, topY);
    this.path.lineTo(500, bottomY);
    this.path.lineTo(600, topY);
    this.path.lineTo(700, bottomY);
    this.path.lineTo(800, topY);
    this.path.lineTo(width - 50, topY);
  }

  private createBackground(width: number, height: number): void {
    // Gradient background - sky to grass
    const bg = this.scene.add.graphics();
    
    // Sky gradient
    for (let i = 0; i < height * 0.4; i++) {
      const alpha = i / (height * 0.4);
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(0x87ceeb),
        Phaser.Display.Color.ValueToColor(0xb0e0e6),
        100,
        alpha * 100
      );
      bg.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
      bg.fillRect(0, i, width, 2);
    }
    
    // Grass area
    bg.fillStyle(0x3a6b2e, 1);
    bg.fillRect(0, height * 0.4, width, height * 0.6);
  }

  private addTerrainDecorations(width: number, height: number): void {
    // Add water bodies with steampunk style
    this.drawSteampunkWater(width * 0.1, height * 0.7, 120, 80);
    this.drawSteampunkWater(width * 0.8, height * 0.3, 100, 60);
    
    // Add mountains in background
    this.drawMountain(width * 0.2, height * 0.35, 150, 180, 0x8b7d6b);
    this.drawMountain(width * 0.6, height * 0.38, 120, 150, 0x9d8b7a);
    this.drawMountain(width * 0.85, height * 0.36, 100, 140, 0x8b7d6b);
    
    // Add steampunk gears and pipes scattered around
    this.drawSteampunkGear(width * 0.15, height * 0.6, 25, 0xb8860b);
    this.drawSteampunkGear(width * 0.7, height * 0.8, 30, 0xcd7f32);
    this.drawSteampunkPipes(width * 0.9, height * 0.5);
  }

  private drawSteampunkWater(x: number, y: number, w: number, h: number): void {
    const graphics = this.scene.add.graphics();
    
    // Water body
    graphics.fillStyle(0x4682b4, 0.7);
    graphics.fillEllipse(x, y, w, h);
    
    // Steampunk border/frame
    graphics.lineStyle(3, 0x8b7355, 1);
    graphics.strokeEllipse(x, y, w, h);
    
    // Rivets around border
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const rx = x + Math.cos(angle) * (w / 2);
      const ry = y + Math.sin(angle) * (h / 2);
      graphics.fillStyle(0x696969, 1);
      graphics.fillCircle(rx, ry, 3);
    }
  }

  private drawMountain(x: number, y: number, width: number, height: number, color: number): void {
    const graphics = this.scene.add.graphics();
    
    // Mountain body with comic outline
    graphics.fillStyle(color, 1);
    graphics.beginPath();
    graphics.moveTo(x - width / 2, y + height / 2);
    graphics.lineTo(x - width / 4, y - height / 4);
    graphics.lineTo(x, y - height / 2);
    graphics.lineTo(x + width / 4, y - height / 4);
    graphics.lineTo(x + width / 2, y + height / 2);
    graphics.closePath();
    graphics.fillPath();
    
    // Snow cap
    graphics.fillStyle(0xfffafa, 1);
    graphics.beginPath();
    graphics.moveTo(x - width / 8, y - height / 4);
    graphics.lineTo(x, y - height / 2);
    graphics.lineTo(x + width / 8, y - height / 4);
    graphics.closePath();
    graphics.fillPath();
    
    // Comic outline
    graphics.lineStyle(3, 0x000000, 1);
    graphics.beginPath();
    graphics.moveTo(x - width / 2, y + height / 2);
    graphics.lineTo(x, y - height / 2);
    graphics.lineTo(x + width / 2, y + height / 2);
    graphics.strokePath();
  }

  private drawSteampunkGear(x: number, y: number, radius: number, color: number): void {
    const graphics = this.scene.add.graphics();
    
    // Main gear circle
    graphics.fillStyle(color, 1);
    graphics.fillCircle(x, y, radius);
    
    // Gear teeth
    graphics.fillStyle(color, 1);
    const teeth = 8;
    for (let i = 0; i < teeth; i++) {
      const angle = (i / teeth) * Math.PI * 2;
      const tx = x + Math.cos(angle) * radius;
      const ty = y + Math.sin(angle) * radius;
      graphics.fillRect(tx - 3, ty - 5, 6, 10);
    }
    
    // Center hole
    graphics.fillStyle(0x333333, 1);
    graphics.fillCircle(x, y, radius * 0.4);
    
    // Bolts
    graphics.fillStyle(0x696969, 1);
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const bx = x + Math.cos(angle) * radius * 0.6;
      const by = y + Math.sin(angle) * radius * 0.6;
      graphics.fillCircle(bx, by, 3);
    }
    
    // Comic outline
    graphics.lineStyle(2, 0x000000, 1);
    graphics.strokeCircle(x, y, radius);
  }

  private drawSteampunkPipes(x: number, y: number): void {
    const graphics = this.scene.add.graphics();
    
    // Vertical pipe
    graphics.fillStyle(0x8b7355, 1);
    graphics.fillRect(x - 8, y - 60, 16, 120);
    
    // Pipe segments with rivets
    for (let i = 0; i < 3; i++) {
      const py = y - 40 + i * 40;
      graphics.lineStyle(2, 0x654321, 1);
      graphics.lineTo(x - 8, py);
      graphics.lineTo(x + 8, py);
      graphics.strokePath();
      
      // Rivets
      graphics.fillStyle(0x696969, 1);
      graphics.fillCircle(x - 6, py, 2);
      graphics.fillCircle(x + 6, py, 2);
    }
    
    // Valve
    graphics.fillStyle(0xcd7f32, 1);
    graphics.fillCircle(x + 15, y, 8);
    graphics.lineStyle(3, 0x654321, 1);
    graphics.lineTo(x + 8, y);
    graphics.lineTo(x + 22, y);
    graphics.strokePath();
  }

  private drawPathWithDepth(): void {
    const graphics = this.scene.add.graphics();
    
    // Shadow/depth layer
    graphics.lineStyle(48, 0x5a4a3a, 0.6);
    this.path.draw(graphics, 128);
    
    // Main path layer
    graphics.lineStyle(42, 0x8b7355, 1);
    this.path.draw(graphics, 128);
    
    // Highlight on path
    graphics.lineStyle(38, 0xa0895f, 1);
    this.path.draw(graphics, 128);
    
    // Comic outline
    graphics.lineStyle(3, 0x000000, 1);
    this.path.draw(graphics, 128);
    
    // Add path texture details
    const points = [];
    for (let t = 0; t <= 1; t += 0.05) {
      const point = this.path.getPoint(t);
      points.push(point);
    }
    
    // Draw cobblestones/bricks on path
    graphics.fillStyle(0x6b5d4f, 0.3);
    for (let i = 0; i < points.length - 1; i++) {
      if (i % 3 === 0) {
        const p = points[i];
        graphics.fillRect(p.x - 8, p.y - 8, 16, 16);
      }
    }
  }

  private addVegetationDecorations(width: number, height: number): void {
    // Add trees with comic style
    this.drawComicTree(width * 0.25, height * 0.6, 40, 0x2d5016);
    this.drawComicTree(width * 0.45, height * 0.25, 35, 0x3a6b2e);
    this.drawComicTree(width * 0.75, height * 0.7, 45, 0x2d5016);
    
    // Add bushes
    this.drawBush(width * 0.35, height * 0.8, 25, 0x228b22);
    this.drawBush(width * 0.55, height * 0.85, 20, 0x2e8b57);
    this.drawBush(width * 0.65, height * 0.2, 22, 0x228b22);
    this.drawBush(width * 0.85, height * 0.75, 28, 0x2e8b57);
    
    // Add steampunk street lamps
    this.drawSteampunkLamp(width * 0.2, height * 0.4);
    this.drawSteampunkLamp(width * 0.8, height * 0.6);
  }

  private drawComicTree(x: number, y: number, size: number, leafColor: number): void {
    const graphics = this.scene.add.graphics();
    
    // Tree trunk with comic outline
    graphics.fillStyle(0x654321, 1);
    graphics.fillRect(x - size * 0.15, y, size * 0.3, size * 0.8);
    graphics.lineStyle(2, 0x000000, 1);
    graphics.strokeRect(x - size * 0.15, y, size * 0.3, size * 0.8);
    
    // Leafy top - three overlapping circles
    graphics.fillStyle(leafColor, 1);
    graphics.fillCircle(x, y - size * 0.2, size * 0.5);
    graphics.fillCircle(x - size * 0.3, y, size * 0.4);
    graphics.fillCircle(x + size * 0.3, y, size * 0.4);
    
    // Comic outline for leaves
    graphics.lineStyle(2, 0x000000, 1);
    graphics.strokeCircle(x, y - size * 0.2, size * 0.5);
    graphics.strokeCircle(x - size * 0.3, y, size * 0.4);
    graphics.strokeCircle(x + size * 0.3, y, size * 0.4);
    
    // Highlights on leaves
    graphics.fillStyle(0xffffff, 0.3);
    graphics.fillCircle(x - size * 0.1, y - size * 0.3, size * 0.15);
  }

  private drawBush(x: number, y: number, size: number, color: number): void {
    const graphics = this.scene.add.graphics();
    
    // Bush body - multiple overlapping circles
    graphics.fillStyle(color, 1);
    graphics.fillCircle(x, y, size);
    graphics.fillCircle(x - size * 0.5, y + size * 0.2, size * 0.7);
    graphics.fillCircle(x + size * 0.5, y + size * 0.2, size * 0.7);
    
    // Comic outline
    graphics.lineStyle(2, 0x000000, 1);
    graphics.strokeCircle(x, y, size);
    graphics.strokeCircle(x - size * 0.5, y + size * 0.2, size * 0.7);
    graphics.strokeCircle(x + size * 0.5, y + size * 0.2, size * 0.7);
    
    // Highlight
    graphics.fillStyle(0xffffff, 0.2);
    graphics.fillCircle(x - size * 0.2, y - size * 0.2, size * 0.3);
  }

  private drawSteampunkLamp(x: number, y: number): void {
    const graphics = this.scene.add.graphics();
    
    // Lamp post
    graphics.fillStyle(0x8b7355, 1);
    graphics.fillRect(x - 4, y, 8, 80);
    
    // Post segments
    for (let i = 0; i < 4; i++) {
      const py = y + i * 20;
      graphics.fillStyle(0x696969, 1);
      graphics.fillCircle(x - 4, py, 2);
      graphics.fillCircle(x + 4, py, 2);
    }
    
    // Lamp housing (steampunk style)
    graphics.fillStyle(0xcd7f32, 1);
    graphics.fillRect(x - 12, y - 20, 24, 20);
    
    // Glass
    graphics.fillStyle(0xffff99, 0.8);
    graphics.fillRect(x - 8, y - 16, 16, 12);
    
    // Lamp top
    graphics.fillStyle(0x8b7355, 1);
    graphics.beginPath();
    graphics.moveTo(x - 14, y - 20);
    graphics.lineTo(x, y - 28);
    graphics.lineTo(x + 14, y - 20);
    graphics.closePath();
    graphics.fillPath();
    
    // Comic outline
    graphics.lineStyle(2, 0x000000, 1);
    graphics.strokeRect(x - 12, y - 20, 24, 20);
    graphics.strokeRect(x - 4, y, 8, 80);
  }

  getPath(): Phaser.Curves.Path {
    return this.path;
  }
}
