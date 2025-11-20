/**
 * ToggleButton - Reusable toggle button component
 */
export class ToggleButton {
  private container: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Rectangle;
  private toggleCircle: Phaser.GameObjects.Arc;
  private label: Phaser.GameObjects.Text;
  private enabled: boolean;

  constructor(
    private scene: Phaser.Scene,
    x: number,
    y: number,
    initialState: boolean,
    private onChange: (enabled: boolean) => void
  ) {
    this.enabled = initialState;
    this.container = scene.add.container(x, y);

    // Background
    this.bg = scene.add.rectangle(0, 0, 80, 36, initialState ? 0x00aa00 : 0x666666);
    this.bg.setStrokeStyle(2, 0xffffff, 0.5);

    // Toggle circle
    this.toggleCircle = scene.add.circle(initialState ? 20 : -20, 0, 14, 0xffffff);

    // Label
    this.label = scene.add.text(0, 0, initialState ? 'AN' : 'AUS', {
      font: 'bold 16px Arial',
      color: '#000000',
    });
    this.label.setOrigin(0.5);

    this.container.add([this.bg, this.toggleCircle, this.label]);
    this.container.setSize(80, 36);
    this.container.setInteractive(
      new Phaser.Geom.Rectangle(-40, -18, 80, 36),
      Phaser.Geom.Rectangle.Contains
    );

    this.container.on('pointerdown', () => this.handleToggle());
  }

  private handleToggle(): void {
    this.enabled = !this.enabled;

    // Animate background color
    this.bg.setFillStyle(this.enabled ? 0x00aa00 : 0x666666);

    // Animate toggle position
    this.scene.tweens.add({
      targets: this.toggleCircle,
      x: this.enabled ? 20 : -20,
      duration: 300,
      ease: 'Back.easeOut',
    });

    // Update label
    this.label.setText(this.enabled ? 'AN' : 'AUS');

    this.onChange(this.enabled);
  }

  getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }
}
