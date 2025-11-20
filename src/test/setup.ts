import { vi } from 'vitest';

// Mock Phaser globally
(global as any).Phaser = {
  Scene: class Scene {
    constructor(_config?: any) {}
    init(_data?: any) {}
    preload() {}
    create() {}
    update(_time?: number, _delta?: number) {}
  },
  Game: class Game {
    constructor(_config: any) {}
  },
  Math: {
    Distance: {
      Between: (x1: number, y1: number, x2: number, y2: number) => 
        Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2),
    },
  },
};

// Mock window for browser-dependent code
if (typeof window === 'undefined') {
  (global as any).window = {
    innerWidth: 800,
    innerHeight: 600,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
}
