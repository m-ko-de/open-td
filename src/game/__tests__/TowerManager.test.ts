import { describe, vi, test, expect } from 'vitest';
import { TowerManager } from '../TowerManager';

describe('TowerManager placement distance', () => {
  const makeMockGraphics = () => {
    // Return an object that has methods used by various drawing routines
    const methods = [
      'fillStyle','fillRoundedRect','fillRect','fillTriangle','fillCircle','fillEllipse',
      'lineStyle','strokeRect','strokeCircle','strokePath','beginPath','moveTo','lineTo','strokePath','setDepth','destroy','clear',
      'strokeRoundedRect','fillRoundedRect','fillText','setInteractive','on','setRotation'
    ];
    const g: any = {};
    methods.forEach(m => { g[m] = vi.fn(); });
    return g;
  };

  const fakeScene: any = {
    input: { on: vi.fn() },
    add: { graphics: vi.fn(() => makeMockGraphics()), text: vi.fn(() => {
      const t: any = {};
      t.setOrigin = vi.fn(() => t);
      t.setDepth = vi.fn(() => t);
      t.setText = vi.fn(() => t);
      return t;
    }), },
  };

  const fakePath: any = {
    getPoints: (n: number) => [ { x: 100, y: 100 }, { x: n, y: 200 } ],
  };

  test('denies placement if within placementDistance and allows if beyond', () => {
    const tm = new TowerManager(fakeScene, fakePath, 10); // 10 px placement distance

    // select a tower type with cost
    tm.selectTower('basic', 50);

    // Try to place within 5px of first path point (distance < 10) => should fail
    const near = tm.tryPlaceTower(103, 103, 200);
    expect(near.success).toBe(false);

    // Try to place further away (distance > 10) => should succeed
    const far = tm.tryPlaceTower(140, 140, 200);
    expect(far.success).toBe(true);
  });
});
