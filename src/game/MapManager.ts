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
    // Optional map-specific placement distance (px) that overrides the game's default
    placementDistance?: number;
    // Optional path rendering width (px) to provide map-specific path thickness
    pathWidth?: number;
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
  private placedDecorations: Array<{ x: number; y: number; radius: number }> = [];

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
    
    // Organic grass area with variations
    const grassColor = Phaser.Display.Color.HexStringToColor(config.grassColor);
    const baseColor = grassColor.color;
    
    // Create patches of different grass shades for organic look
    const patchSize = 40;
    for (let x = 0; x < width; x += patchSize) {
      for (let y = skyHeight; y < height; y += patchSize) {
        // Random variation in color (-10 to +10)
        const variation = (Math.random() - 0.5) * 20;
        const variedColor = Phaser.Display.Color.ValueToColor(baseColor);
        variedColor.darken(variation);
        
        bg.fillStyle(variedColor.color, 1);
        // Irregular patch shapes
        const w = patchSize + Math.random() * 10;
        const h = patchSize + Math.random() * 10;
        bg.fillRect(x, y, w, h);
      }
    }
    
    // Add small grass details (darker spots for depth)
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * width;
      const y = skyHeight + Math.random() * (height - skyHeight);
      const size = 3 + Math.random() * 4;
      
      bg.fillStyle(0x1a5f1a, 0.2 + Math.random() * 0.2);
      bg.fillCircle(x, y, size);
    }
  }

  private addTerrainDecorations(width: number, height: number): void {
    const decorations = this.mapConfig.decorations;

    // Water bodies
    if (decorations.water) {
      decorations.water.forEach(water => {
        const x = water.x * width;
        const y = water.y * height;
        const radius = Math.max(water.width, water.height) / 2;
        if (this.canPlaceDecoration(x, y, radius, water.safeDistance)) {
          this.drawSteampunkWater(x, y, water.width, water.height);
          this.registerDecoration(x, y, radius);
        }
      });
    }

    // Mountains
    if (decorations.mountains) {
      decorations.mountains.forEach(mountain => {
        const x = mountain.x * width;
        const y = mountain.y * height;
        const color = Phaser.Display.Color.HexStringToColor(mountain.color);
        const radius = Math.max(mountain.width, mountain.height) / 2;
        if (this.canPlaceDecoration(x, y, radius, mountain.safeDistance)) {
          this.drawMountain(x, y, mountain.width, mountain.height, color.color);
          this.registerDecoration(x, y, radius);
        }
      });
    }

    // Gears
    if (decorations.gears) {
      decorations.gears.forEach(gear => {
        const x = gear.x * width;
        const y = gear.y * height;
        const color = Phaser.Display.Color.HexStringToColor(gear.color);
        if (this.canPlaceDecoration(x, y, gear.radius, gear.safeDistance)) {
          this.drawSteampunkGear(x, y, gear.radius, color.color);
          this.registerDecoration(x, y, gear.radius);
        }
      });
    }

    // Pipes
    if (decorations.pipes) {
      decorations.pipes.forEach(pipe => {
        const x = pipe.x * width;
        const y = pipe.y * height;
        const pipeRadius = 30; // Estimated pipe size
        if (this.canPlaceDecoration(x, y, pipeRadius, pipe.safeDistance)) {
          this.drawSteampunkPipes(x, y);
          this.registerDecoration(x, y, pipeRadius);
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
        const radius = tree.size * 0.6; // Tree trunk + crown radius
        if (this.canPlaceDecoration(x, y, radius, tree.safeDistance)) {
          this.drawComicTree(x, y, tree.size, color.color);
          this.registerDecoration(x, y, radius);
        }
      });
    }

    // Bushes
    if (decorations.bushes) {
      decorations.bushes.forEach(bush => {
        const x = bush.x * width;
        const y = bush.y * height;
        const color = Phaser.Display.Color.HexStringToColor(bush.color);
        const radius = bush.size * 0.8; // Bush radius
        if (this.canPlaceDecoration(x, y, radius, bush.safeDistance)) {
          this.drawBush(x, y, bush.size, color.color);
          this.registerDecoration(x, y, radius);
        }
      });
    }

    // Lamps
    if (decorations.lamps) {
      decorations.lamps.forEach(lamp => {
        const x = lamp.x * width;
        const y = lamp.y * height;
        const lampRadius = 20; // Estimated lamp size
        if (this.canPlaceDecoration(x, y, lampRadius, lamp.safeDistance)) {
          this.drawSteampunkLamp(x, y);
          this.registerDecoration(x, y, lampRadius);
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

  private canPlaceDecoration(x: number, y: number, radius: number, safeDistance: number): boolean {
    // Check if on path
    if (this.isOnPath(x, y, safeDistance)) {
      return false;
    }
    
    // Check collision with already placed decorations
    for (const placed of this.placedDecorations) {
      const distance = Phaser.Math.Distance.Between(x, y, placed.x, placed.y);
      const minDistance = radius + placed.radius + 10; // 10px buffer
      if (distance < minDistance) {
        return false;
      }
    }
    
    return true;
  }

  private registerDecoration(x: number, y: number, radius: number): void {
    this.placedDecorations.push({ x, y, radius });
  }

  private drawPathWithDepth(): void {
    const graphics = this.scene.add.graphics();
    
    // Get path points for organic edge rendering
    const pathPoints = this.path.getPoints(200);
    
    // Draw organic path with irregular edges
    for (let i = 0; i < pathPoints.length - 1; i++) {
      const p1 = pathPoints[i];
      const p2 = pathPoints[i + 1];
      
      // Calculate perpendicular for path width
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) continue;
      
      const perpX = -dy / len;
      const perpY = dx / len;
      
      // Base width with slight variation
      const baseWidth = 22;
      const widthVar = Math.sin(i * 0.3) * 2;
      const width = baseWidth + widthVar;
      
      // Draw path segment with organic edges
      graphics.fillStyle(0x6b5d4f, 1);
      graphics.fillTriangle(
        p1.x - perpX * width, p1.y - perpY * width,
        p1.x + perpX * width, p1.y + perpY * width,
        p2.x - perpX * width, p2.y - perpY * width
      );
      graphics.fillTriangle(
        p2.x + perpX * width, p2.y + perpY * width,
        p2.x - perpX * width, p2.y - perpY * width,
        p1.x + perpX * width, p1.y + perpY * width
      );
    }
    
    // Add darker edge shadows for depth
    graphics.lineStyle(2, 0x4a3a2a, 0.4);
    for (let i = 0; i < pathPoints.length - 1; i++) {
      const p = pathPoints[i];
      const dx = pathPoints[Math.min(i + 1, pathPoints.length - 1)].x - p.x;
      const dy = pathPoints[Math.min(i + 1, pathPoints.length - 1)].y - p.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) continue;
      
      const perpX = -dy / len;
      const perpY = dx / len;
      const edgeWidth = 24;
      
      // Left edge
      graphics.beginPath();
      graphics.moveTo(p.x - perpX * edgeWidth, p.y - perpY * edgeWidth);
      graphics.lineTo(pathPoints[Math.min(i + 1, pathPoints.length - 1)].x - perpX * edgeWidth,
                      pathPoints[Math.min(i + 1, pathPoints.length - 1)].y - perpY * edgeWidth);
      graphics.strokePath();
      
      // Right edge
      graphics.beginPath();
      graphics.moveTo(p.x + perpX * edgeWidth, p.y + perpY * edgeWidth);
      graphics.lineTo(pathPoints[Math.min(i + 1, pathPoints.length - 1)].x + perpX * edgeWidth,
                      pathPoints[Math.min(i + 1, pathPoints.length - 1)].y + perpY * edgeWidth);
      graphics.strokePath();
    }
    
    // Add stones and details on path
    for (let i = 0; i < pathPoints.length; i += 5) {
      const p = pathPoints[i];
      
      // Random stones on path
      if (Math.random() > 0.6) {
        const offsetX = (Math.random() - 0.5) * 30;
        const offsetY = (Math.random() - 0.5) * 30;
        const stoneSize = 3 + Math.random() * 4;
        
        graphics.fillStyle(0x8a7a6a, 0.5 + Math.random() * 0.3);
        graphics.fillCircle(p.x + offsetX, p.y + offsetY, stoneSize);
        
        // Stone highlight
        graphics.fillStyle(0xaaaaaa, 0.3);
        graphics.fillCircle(p.x + offsetX - 1, p.y + offsetY - 1, stoneSize * 0.4);
      }
      
      // Cracks/worn areas
      if (Math.random() > 0.8) {
        graphics.lineStyle(1, 0x5a4a3a, 0.3);
        const crackLength = 5 + Math.random() * 10;
        const angle = Math.random() * Math.PI * 2;
        graphics.beginPath();
        graphics.moveTo(p.x, p.y);
        graphics.lineTo(p.x + Math.cos(angle) * crackLength, p.y + Math.sin(angle) * crackLength);
        graphics.strokePath();
      }
    }
    
    // Add grass tufts along path edges
    for (let i = 0; i < pathPoints.length; i += 8) {
      const p = pathPoints[i];
      const nextIdx = Math.min(i + 1, pathPoints.length - 1);
      const dx = pathPoints[nextIdx].x - p.x;
      const dy = pathPoints[nextIdx].y - p.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) continue;
      
      const perpX = -dy / len;
      const perpY = dx / len;
      
      // Grass on both sides
      for (const side of [-1, 1]) {
        const edgeDist = 26 + Math.random() * 8;
        const grassX = p.x + perpX * edgeDist * side;
        const grassY = p.y + perpY * edgeDist * side;
        
        // Draw grass tuft (3-5 blades)
        const blades = 3 + Math.floor(Math.random() * 3);
        for (let b = 0; b < blades; b++) {
          const bladeAngle = (Math.random() - 0.5) * 0.4;
          const bladeHeight = 4 + Math.random() * 4;
          const bladeX = grassX + (Math.random() - 0.5) * 3;
          const bladeY = grassY + (Math.random() - 0.5) * 3;
          
          graphics.lineStyle(1, 0x2d5016, 0.6 + Math.random() * 0.2);
          graphics.beginPath();
          graphics.moveTo(bladeX, bladeY);
          graphics.lineTo(
            bladeX + Math.sin(bladeAngle) * 2,
            bladeY - bladeHeight
          );
          graphics.strokePath();
        }
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

  /**
   * Get the map-specific placement distance threshold for tower placement.
   * Returns a default of 45px if not specified in the map config.
   */
  getPlacementDistance(): number {
    const placement = this.mapConfig?.path?.placementDistance;
    if (typeof placement === 'number') return placement;
    return 45; // default value
  }
}
