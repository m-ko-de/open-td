import Phaser from 'phaser';

/**
 * Very small GridSizer utility for Phaser 3.
 * - Not a full replacement for rexUI, but provides a simple grid layout.
 * - Usage: instantiate with a box region (x,y,width,height) and call add(gameObject, row, col)
 *   then call layout() to compute positions.
 */
export class GridSizer {
  private rows: number;
  private cols: number;
  private padding: { left: number; top: number; right: number; bottom: number };
  private cellWidth: number;
  private cellHeight: number;
  private map: Map<number, Phaser.GameObjects.GameObject>;

  constructor(
    private x: number,
    private y: number,
    private width: number,
    private height: number,
    rows: number,
    cols: number,
    padding = { left: 20, top: 20, right: 20, bottom: 20 }
  ) {
    this.rows = rows;
    this.cols = cols;
    this.padding = padding;
    this.cellWidth = (this.width - padding.left - padding.right) / this.cols;
    this.cellHeight = (this.height - padding.top - padding.bottom) / this.rows;
    this.map = new Map();
  }

  add(gameObject: Phaser.GameObjects.GameObject, row: number, col: number) {
    const key = row * this.cols + col;
    this.map.set(key, gameObject);
  }

  layout() {
    for (const [key, obj] of this.map) {
      const row = Math.floor(key / this.cols);
      const col = key % this.cols;
      const cx = this.x - this.width / 2 + this.padding.left + this.cellWidth * col + this.cellWidth / 2;
      const cy = this.y - this.height / 2 + this.padding.top + this.cellHeight * row + this.cellHeight / 2;
      try {
        // Position any gameobject that supports setPosition
        // We use `any` because GameObject may not have setPosition typed correctly
        (obj as any).setPosition(cx, cy);
        if ((obj as any).setOrigin) (obj as any).setOrigin?.(0.5);
      } catch (e) {
        // ignore if cannot set position
      }
    }
  }

  setRows(rows: number) {
    this.rows = rows;
    this.cellHeight = (this.height - this.padding.top - this.padding.bottom) / this.rows;
  }

  setCols(cols: number) {
    this.cols = cols;
    this.cellWidth = (this.width - this.padding.left - this.padding.right) / this.cols;
  }

  clear() {
    this.map.clear();
  }
}
