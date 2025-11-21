export interface MapConfig {
  name: string;
  description: string;
  background: {
    skyHeight: number;
    skyColorTop: string;
    skyColorBottom: string;
    grassColor: string;
  };
  path: {
    type: string;
    waypoints: Array<{
      x: number;
      y: number;
      type: string;
    }>;
    [key: string]: any;
  };
  decorations: {
    water?: Array<{ x: number; y: number; width: number; height: number; safeDistance: number }>;
    mountains?: Array<{ x: number; y: number; width: number; height: number; color: string; safeDistance: number }>;
    gears?: Array<{ x: number; y: number; radius: number; color: string; safeDistance: number }>;
    pipes?: Array<{ x: number; y: number; safeDistance: number }>;
    trees?: Array<{ x: number; y: number; size: number; color: string; safeDistance: number }>;
    bushes?: Array<{ x: number; y: number; size: number; color: string; safeDistance: number }>;
    lamps?: Array<{ x: number; y: number; safeDistance: number }>;
  };
}

import { MapRegistry } from './MapRegistry';

export class MapManager {
  private scene: Phaser.Scene;
  private path!: Phaser.Curves.Path;
  private mapConfig!: MapConfig;
  private mapName: string;
  private mapRegistry: MapRegistry;

  constructor(scene: Phaser.Scene, mapName: string = 'classic') {
    this.scene = scene;
    this.mapName = mapName;
    this.mapRegistry = MapRegistry.getInstance();
  }

  async loadMap(): Promise<void> {
    // Get map from registry instead of fetching
    const config = this.mapRegistry.getMap(this.mapName);
    if (!config) {
      throw new Error(`Map not found in registry: ${this.mapName}`);
    }
    this.mapConfig = config;
  }

  create(): void {
    if (!this.mapConfig) {
      throw new Error('Map not loaded. Call loadMap() first.');
    }

    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    // Create background
    this.createBackground(width, height);

    // Create path from waypoints
    this.createPathFromWaypoints(width, height);

    // Add terrain decorations
    this.addTerrainDecorations(width, height);

    // Draw path with depth
    this.drawPathWithDepth();

    // Add vegetation decorations
    this.addVegetationDecorations(width, height);
  }

  private createPathFromWaypoints(width: number, height: number): void {
    const waypoints = this.mapConfig.path.waypoints;
    
    if (waypoints.length === 0) {
      throw new Error('No waypoints defined in map');
    }

    // Convert first waypoint (relative or absolute coordinates)
    const startPoint = this.convertWaypoint(waypoints[0], width, height);
    this.path = new Phaser.Curves.Path(startPoint.x, startPoint.y);

    // Add remaining waypoints
    for (let i = 1; i < waypoints.length; i++) {
      const point = this.convertWaypoint(waypoints[i], width, height);
      this.path.lineTo(point.x, point.y);
    }
  }

  private convertWaypoint(waypoint: any, width: number, height: number): { x: number; y: number } {
    let x = waypoint.x;
    let y = waypoint.y;

    // Convert negative values to width/height relative
    if (x < 0) {
      x = width + x;
    }
    if (y < 0) {
      y = height + y;
    }

    // Convert percentage values (0-1) to absolute
    if (typeof y === 'number' && y > 0 && y <= 1) {
      y = height * y;
    }
    if (typeof x === 'number' && x > 0 && x <= 1) {
      x = width * x;
    }

    return { x, y };
  }

  private createBackground(width: number, height: number): void {
    const bg = this.scene.add.graphics();
    const config = this.mapConfig.background;
    
    // Sky gradient
    const skyHeight = height * config.skyHeight;
    for (let i = 0; i < skyHeight; i++) {
      const alpha = i / skyHeight;
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.HexStringToColor(config.skyColorTop),
        Phaser.Display.Color.HexStringToColor(config.skyColorBottom),
        100,
        alpha * 100
      );
      bg.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
      bg.fillRect(0, i, width, 2);
    }
    
    // Grass area
    const grassColor = Phaser.Display.Color.HexStringToColor(config.grassColor);
    bg.fillStyle(grassColor.color, 1);
    bg.fillRect(0, skyHeight, width, height - skyHeight);
  }

  private addTerrainDecorations(width: number, height: number): void {
    const decorations = this.mapConfig.decorations;

    // Water bodies
    if (decorations.water) {
      decorations.water.forEach(water => {
        const x = water.x * width;
        const y = water.y * height;
        if (!this.isOnPath(x, y, water.safeDistance)) {
          this.drawSteampunkWater(x, y, water.width, water.height);
        }
      });
    }

    // Mountains
    if (decorations.mountains) {
      decorations.mountains.forEach(mountain => {
        const x = mountain.x * width;
        const y = mountain.y * height;
        const color = Phaser.Display.Color.HexStringToColor(mountain.color);
        if (!this.isOnPath(x, y, mountain.safeDistance)) {
          this.drawMountain(x, y, mountain.width, mountain.height, color.color);
        }
      });
    }

    // Gears
    if (decorations.gears) {
      decorations.gears.forEach(gear => {
        const x = gear.x * width;
        const y = gear.y * height;
        const color = Phaser.Display.Color.HexStringToColor(gear.color);
        if (!this.isOnPath(x, y, gear.safeDistance)) {
          this.drawSteampunkGear(x, y, gear.radius, color.color);
        }
      });
    }

    // Pipes
    if (decorations.pipes) {
      decorations.pipes.forEach(pipe => {
        const x = pipe.x * width;
        const y = pipe.y * height;
        if (!this.isOnPath(x, y, pipe.safeDistance)) {
          this.drawSteampunkPipes(x, y);
        }
      });
    }
  }

  private addVegetationDecorations(width: number, height: number): void {
    const decorations = this.mapConfig.decorations;

    // Trees
    if (decorations.trees) {
      decorations.trees.forEach(tree => {
        const x = tree.x * width;
        const y = tree.y * height;
        const color = Phaser.Display.Color.HexStringToColor(tree.color);
        if (!this.isOnPath(x, y, tree.safeDistance)) {
          this.drawComicTree(x, y, tree.size, color.color);
        }
      });
    }

    // Bushes
    if (decorations.bushes) {
      decorations.bushes.forEach(bush => {
        const x = bush.x * width;
        const y = bush.y * height;
        const color = Phaser.Display.Color.HexStringToColor(bush.color);
        if (!this.isOnPath(x, y, bush.safeDistance)) {
          this.drawBush(x, y, bush.size, color.color);
        }
      });
    }

    // Lamps
    if (decorations.lamps) {
      decorations.lamps.forEach(lamp => {
        const x = lamp.x * width;
        const y = lamp.y * height;
        if (!this.isOnPath(x, y, lamp.safeDistance)) {
          this.drawSteampunkLamp(x, y);
        }
      });
    }
  }

  private isOnPath(x: number, y: number, safeDistance: number): boolean {
    const pathPoints = this.path.getPoints(100);
    
    for (const point of pathPoints) {
      const distance = Phaser.Math.Distance.Between(x, y, point.x, point.y);
      if (distance < safeDistance) {
        return true;
      }
    }
    
    return false;
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

  private drawSteampunkWater(x: number, y: number, w: number, h: number): void {
    const graphics = this.scene.add.graphics();
    
    graphics.fillStyle(0x4682b4, 0.7);
    graphics.fillEllipse(x, y, w, h);
    
    graphics.lineStyle(3, 0x8b7355, 1);
    graphics.strokeEllipse(x, y, w, h);
    
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
    
    graphics.fillStyle(color, 1);
    graphics.beginPath();
    graphics.moveTo(x - width / 2, y + height / 2);
    graphics.lineTo(x - width / 4, y - height / 4);
    graphics.lineTo(x, y - height / 2);
    graphics.lineTo(x + width / 4, y - height / 4);
    graphics.lineTo(x + width / 2, y + height / 2);
    graphics.closePath();
    graphics.fillPath();
    
    graphics.fillStyle(0xfffafa, 1);
    graphics.beginPath();
    graphics.moveTo(x - width / 8, y - height / 4);
    graphics.lineTo(x, y - height / 2);
    graphics.lineTo(x + width / 8, y - height / 4);
    graphics.closePath();
    graphics.fillPath();
    
    graphics.lineStyle(3, 0x000000, 1);
    graphics.beginPath();
    graphics.moveTo(x - width / 2, y + height / 2);
    graphics.lineTo(x, y - height / 2);
    graphics.lineTo(x + width / 2, y + height / 2);
    graphics.strokePath();
  }

  private drawSteampunkGear(x: number, y: number, radius: number, color: number): void {
    const graphics = this.scene.add.graphics();
    
    graphics.fillStyle(color, 1);
    graphics.fillCircle(x, y, radius);
    
    graphics.fillStyle(color, 1);
    const teeth = 8;
    for (let i = 0; i < teeth; i++) {
      const angle = (i / teeth) * Math.PI * 2;
      const tx = x + Math.cos(angle) * radius;
      const ty = y + Math.sin(angle) * radius;
      graphics.fillRect(tx - 3, ty - 5, 6, 10);
    }
    
    graphics.fillStyle(0x333333, 1);
    graphics.fillCircle(x, y, radius * 0.4);
    
    graphics.fillStyle(0x696969, 1);
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const bx = x + Math.cos(angle) * radius * 0.6;
      const by = y + Math.sin(angle) * radius * 0.6;
      graphics.fillCircle(bx, by, 3);
    }
    
    graphics.lineStyle(2, 0x000000, 1);
    graphics.strokeCircle(x, y, radius);
  }

  private drawSteampunkPipes(x: number, y: number): void {
    const graphics = this.scene.add.graphics();
    
    graphics.fillStyle(0x8b7355, 1);
    graphics.fillRect(x - 8, y - 60, 16, 120);
    
    for (let i = 0; i < 3; i++) {
      const py = y - 40 + i * 40;
      graphics.lineStyle(2, 0x654321, 1);
      graphics.lineTo(x - 8, py);
      graphics.lineTo(x + 8, py);
      graphics.strokePath();
      
      graphics.fillStyle(0x696969, 1);
      graphics.fillCircle(x - 6, py, 2);
      graphics.fillCircle(x + 6, py, 2);
    }
    
    graphics.fillStyle(0xcd7f32, 1);
    graphics.fillCircle(x + 15, y, 8);
    graphics.lineStyle(3, 0x654321, 1);
    graphics.lineTo(x + 8, y);
    graphics.lineTo(x + 22, y);
    graphics.strokePath();
  }

  private drawComicTree(x: number, y: number, size: number, leafColor: number): void {
    const graphics = this.scene.add.graphics();
    
    graphics.fillStyle(0x654321, 1);
    graphics.fillRect(x - size * 0.15, y, size * 0.3, size * 0.8);
    graphics.lineStyle(2, 0x000000, 1);
    graphics.strokeRect(x - size * 0.15, y, size * 0.3, size * 0.8);
    
    graphics.fillStyle(leafColor, 1);
    graphics.fillCircle(x, y - size * 0.2, size * 0.5);
    graphics.fillCircle(x - size * 0.3, y, size * 0.4);
    graphics.fillCircle(x + size * 0.3, y, size * 0.4);
    
    graphics.lineStyle(2, 0x000000, 1);
    graphics.strokeCircle(x, y - size * 0.2, size * 0.5);
    graphics.strokeCircle(x - size * 0.3, y, size * 0.4);
    graphics.strokeCircle(x + size * 0.3, y, size * 0.4);
    
    graphics.fillStyle(0xffffff, 0.3);
    graphics.fillCircle(x - size * 0.1, y - size * 0.3, size * 0.15);
  }

  private drawBush(x: number, y: number, size: number, color: number): void {
    const graphics = this.scene.add.graphics();
    
    graphics.fillStyle(color, 1);
    graphics.fillCircle(x, y, size);
    graphics.fillCircle(x - size * 0.5, y + size * 0.2, size * 0.7);
    graphics.fillCircle(x + size * 0.5, y + size * 0.2, size * 0.7);
    
    graphics.lineStyle(2, 0x000000, 1);
    graphics.strokeCircle(x, y, size);
    graphics.strokeCircle(x - size * 0.5, y + size * 0.2, size * 0.7);
    graphics.strokeCircle(x + size * 0.5, y + size * 0.2, size * 0.7);
    
    graphics.fillStyle(0xffffff, 0.2);
    graphics.fillCircle(x - size * 0.2, y - size * 0.2, size * 0.3);
  }

  private drawSteampunkLamp(x: number, y: number): void {
    const graphics = this.scene.add.graphics();
    
    graphics.fillStyle(0x8b7355, 1);
    graphics.fillRect(x - 4, y, 8, 80);
    
    for (let i = 0; i < 4; i++) {
      const py = y + i * 20;
      graphics.fillStyle(0x696969, 1);
      graphics.fillCircle(x - 4, py, 2);
      graphics.fillCircle(x + 4, py, 2);
    }
    
    graphics.fillStyle(0xcd7f32, 1);
    graphics.fillRect(x - 12, y - 20, 24, 20);
    
    graphics.fillStyle(0xffff99, 0.8);
    graphics.fillRect(x - 8, y - 16, 16, 12);
    
    graphics.fillStyle(0x8b7355, 1);
    graphics.beginPath();
    graphics.moveTo(x - 14, y - 20);
    graphics.lineTo(x, y - 28);
    graphics.lineTo(x + 14, y - 20);
    graphics.closePath();
    graphics.fillPath();
    
    graphics.lineStyle(2, 0x000000, 1);
    graphics.strokeRect(x - 12, y - 20, 24, 20);
    graphics.strokeRect(x - 4, y, 8, 80);
  }

  getPath(): Phaser.Curves.Path {
    return this.path;
  }

  getMapConfig(): MapConfig {
    return this.mapConfig;
  }
}
