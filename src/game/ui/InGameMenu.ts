import DOMPurify from 'dompurify';
import { marked } from 'marked';

/**
 * Simple in-game menu overlay with a burger button.
 * - Displays README.md (fetched from GitHub raw URL) as plain text
 * - Has a 'Source code' button that opens the GitHub repo
 */
export class InGameMenu {
  private scene: Phaser.Scene;
  private repoUrl: string;
  private readmeUrl: string;
  private container!: Phaser.GameObjects.Container;
  private buttonBg!: Phaser.GameObjects.Rectangle;
  private overlayEl?: HTMLElement;
  private confirmEl?: HTMLElement;
  private buttonText?: Phaser.GameObjects.Text;
  private burgerGraphics?: Phaser.GameObjects.Graphics;
  private margin = 12;
  private size = 44;

  constructor(scene: Phaser.Scene, repoUrl: string, readmeUrl?: string) {
    this.scene = scene;
    this.repoUrl = repoUrl;
    this.readmeUrl = readmeUrl || `https://raw.githubusercontent.com/m-ko-de/open-td/main/README.md`;
  }

  public create(): void {
    const margin = this.margin;
    const size = this.size;
    const cam = this.scene.cameras.main;
    let btnLeft = cam.width - margin - size;
    let btnTop = cam.height - margin - size;
    let centerX = btnLeft + size / 2;
    let centerY = btnTop + size / 2;

    this.buttonBg = this.scene.add.rectangle(centerX, centerY, size, size, 0x222222, 0.8);
    this.buttonBg.setStrokeStyle(2, 0xffffff, 0.06);
    this.buttonBg.setOrigin(0.5);
    this.buttonBg.setInteractive({ useHandCursor: true });

    // Draw burger lines using graphics
    this.burgerGraphics = this.scene.add.graphics({ x: btnLeft + 10, y: btnTop + 12 });
    this.burgerGraphics.fillStyle(0xffffff, 1);
    this.burgerGraphics.fillRect(0, 0, 24, 3);
    this.burgerGraphics.fillRect(0, 8, 24, 3);
    this.burgerGraphics.fillRect(0, 16, 24, 3);

    this.buttonText = this.scene.add.text(btnLeft - 8, centerY, 'Menü', { font: '12px Arial', color: '#ffffff' });
    this.buttonText.setOrigin(1, 0.5);

    this.container = this.scene.add.container(0, 0, [this.buttonBg, this.burgerGraphics!, this.buttonText]);
    this.container.setDepth(1000);

    this.buttonBg.on('pointerdown', () => {
      this.openOverlay();
    });

    // Reposition on resize
    this.scene.scale.on('resize', this.onResize, this);
  }

  private onResize(_gameSize: any) {
    try {
      const cam = this.scene.cameras.main;
      const margin = this.margin;
      const size = this.size;
      const btnLeft = cam.width - margin - size;
      const btnTop = cam.height - margin - size;
      const centerX = btnLeft + size / 2;
      const centerY = btnTop + size / 2;
      if (this.buttonBg) this.buttonBg.setPosition(centerX, centerY);
      if (this.burgerGraphics) this.burgerGraphics.setPosition(btnLeft + 10, btnTop + 12);
      if (this.buttonText) this.buttonText.setPosition(btnLeft - 8, centerY);
    } catch (e) {
      // ignore
    }
  }

  public destroy(): void {
    try {
      if (this.container) {
        this.container.removeAll(true);
        this.container.destroy();
      }
    } catch (e) {
      // ignore
    }
    try {
      if (this.overlayEl) {
        this.overlayEl.remove();
        this.overlayEl = undefined;
      }
    } catch (e) {
      // ignore
    }
    try {
      this.scene.scale.off('resize', this.onResize, this);
    } catch (e) {
      // ignore
    }
  }

  public getButton(): Phaser.GameObjects.Text | Phaser.GameObjects.Rectangle {
    // Return background rectangle as clickable item for pointer checks
    return this.buttonBg;
  }

  private async openOverlay() {
    // If DOM not available, show a simple in-canvas overlay
    if (typeof document === 'undefined') {
      this.showCanvasOverlay('Could not load README (no DOM in this environment)');
      return;
    }

    if (!this.overlayEl) {
      const root = document.getElementById('game-container') || document.body;
      const el = document.createElement('div');
      el.id = 'opentd-ingame-menu-overlay';
      el.style.position = 'fixed';
      el.style.left = '0';
      el.style.top = '0';
      el.style.right = '0';
      el.style.bottom = '0';
      el.style.zIndex = '10000';
      el.style.background = 'rgba(0,0,0,0.85)';
      el.style.color = '#fff';
      el.style.padding = '18px';
      el.style.overflow = 'auto';
      el.style.fontFamily = 'Arial, sans-serif';

      // Close button
      const closeBtn = document.createElement('button');
      closeBtn.textContent = 'Schließen';
      closeBtn.style.position = 'fixed';
      closeBtn.style.right = '18px';
      closeBtn.style.top = '18px';
      closeBtn.style.padding = '8px 12px';
      closeBtn.style.cursor = 'pointer';
      closeBtn.onclick = () => this.closeOverlay();

      // Source code button
      const sourceBtn = document.createElement('button');
      sourceBtn.textContent = 'Quellcode';
      sourceBtn.style.position = 'fixed';
      sourceBtn.style.right = '120px';
      sourceBtn.style.top = '18px';
      sourceBtn.style.padding = '8px 12px';
      sourceBtn.style.cursor = 'pointer';
      sourceBtn.onclick = () => window.open(this.repoUrl, '_blank');

      // Restart button
      const restartBtn = document.createElement('button');
      restartBtn.textContent = 'Neustarten';
      restartBtn.style.position = 'fixed';
      restartBtn.style.right = '240px';
      restartBtn.style.top = '18px';
      restartBtn.style.padding = '8px 12px';
      restartBtn.style.cursor = 'pointer';
      restartBtn.onclick = () => {
        this.showRestartConfirm();
      };

      // Content area
      const content = document.createElement('div');
      // style container for markdown rendered HTML
      content.style.maxWidth = 'min(1100px, 95%)';
      content.style.margin = '60px auto 40px auto';
      content.style.fontSize = '14px';
      content.style.lineHeight = '1.4';
      content.style.background = 'rgba(0,0,0,0.1)';
      content.style.padding = '12px';
      content.style.borderRadius = '8px';
      content.style.whiteSpace = 'pre-wrap';
      content.style.wordWrap = 'break-word';
      content.style.maxWidth = 'min(1100px, 95%)';
      content.style.margin = '60px auto 40px auto';
      content.style.fontSize = '14px';
      content.style.lineHeight = '1.4';
      content.style.background = 'rgba(0,0,0,0.1)';
      content.style.padding = '12px';
      content.style.borderRadius = '8px';

      el.appendChild(closeBtn);
      el.appendChild(sourceBtn);
      el.appendChild(restartBtn);
      el.appendChild(content);
      root.appendChild(el);
      this.overlayEl = el;

      // Load README (render markdown)
      try {
        const res = await fetch(this.readmeUrl);
        if (res.ok) {
          const text = await res.text();
          // Convert markdown to HTML and sanitize
          try {
            const html = marked(text);
            const sanitized = DOMPurify.sanitize(html);
            content.innerHTML = sanitized;
          } catch (e) {
            content.textContent = text;
          }
        } else {
          content.textContent = 'Could not load README content.';
        }
      } catch (e) {
        content.textContent = 'Error fetching README: ' + String(e);
      }
    }
    // Pause the game when overlay is visible
    try {
      // Pause Phaser scene update
      (this.scene as any).scene.pause();
      // Also attempt to inform UI
      try { (this.scene as any).ui?.setPaused?.(true); } catch (e) { /* ignore */ }
    } catch (e) {
      // ignore
    }

    this.overlayEl.style.display = 'block';
  }

  private showRestartConfirm() {
    if (!this.overlayEl) return;
    if (this.confirmEl) return; // already showing

    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.left = '0';
    modal.style.top = '0';
    modal.style.right = '0';
    modal.style.bottom = '0';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '10001';

    const box = document.createElement('div');
    box.style.background = '#111';
    box.style.color = '#fff';
    box.style.border = '1px solid rgba(255,255,255,0.05)';
    box.style.padding = '18px';
    box.style.borderRadius = '8px';
    box.style.minWidth = '320px';
    box.style.textAlign = 'center';

    const txt = document.createElement('div');
    txt.textContent = 'Neustarten? Alle nicht gespeicherten Daten gehen verloren.';
    txt.style.marginBottom = '12px';

    const btnConfirm = document.createElement('button');
    btnConfirm.textContent = 'Ja';
    btnConfirm.style.marginRight = '8px';
    btnConfirm.style.padding = '8px 12px';
    btnConfirm.onclick = () => {
      try {
        const fn = window.restartGame;
        if (typeof fn === 'function') {
          fn();
        } else {
          window.location.reload();
        }
      } catch (e) {
        console.warn('Neustart fehlgeschlagen', e);
      } finally {
        this.removeConfirm();
      }
    };

    const btnCancel = document.createElement('button');
    btnCancel.textContent = 'Abbrechen';
    btnCancel.style.padding = '8px 12px';
    btnCancel.onclick = () => this.removeConfirm();

    box.appendChild(txt);
    box.appendChild(btnConfirm);
    box.appendChild(btnCancel);
    modal.appendChild(box);
    document.body.appendChild(modal);
    this.confirmEl = modal;
  }

  private removeConfirm() {
    if (!this.confirmEl) return;
    try {
      this.confirmEl.remove();
    } catch (e) {
      // ignore
    }
    this.confirmEl = undefined;
  }

  private closeOverlay() {
    if (this.overlayEl) this.overlayEl.style.display = 'none';
    // Resume the game when overlay is closed
    try {
      (this.scene as any).scene.resume();
      try { (this.scene as any).ui?.setPaused?.(false); } catch (e) { /* ignore */ }
    } catch (e) {
      // ignore
    }
  }

  private showCanvasOverlay(message: string) {
    // Canvas fallback: show a simple text box
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const bg = this.scene.add.rectangle(width / 2, height / 2, width - 40, height - 40, 0x000000, 0.9);
    const txt = this.scene.add.text(width / 2, height / 2, message, { font: '16px Arial', color: '#ffffff', align: 'center', wordWrap: { width: width - 80 } });
    txt.setOrigin(0.5);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', () => {
      bg.destroy();
      txt.destroy();
    });
  }
}

export default InGameMenu;
