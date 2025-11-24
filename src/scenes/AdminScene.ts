import { AuthManager } from '../auth/AuthManager';

export class AdminScene extends Phaser.Scene {
  private auth: AuthManager;
  constructor() {
    super({ key: 'AdminScene' });
    this.auth = AuthManager.getInstance();
  }

  create(): void {
    const width = this.cameras.main.width;

    const title = this.add.text(width / 2, 40, 'Fehlerberichte', { font: 'bold 32px Arial', color: '#ffffff' });
    title.setOrigin(0.5);

    const backButton = this.add.text(20, 20, '← Zurück', { font: '18px Arial', color: '#ffffff' });
    backButton.setInteractive({ useHandCursor: true });
    backButton.on('pointerdown', () => {
      this.scene.resume('MainMenuScene');
      this.scene.stop();
    });

    const loader = this.add.text(width / 2, 120, 'Lade Fehlerberichte...', { font: '16px Arial', color: '#cccccc' });
    loader.setOrigin(0.5);

    const listYStart = 160;
    this.fetchAndRenderReports(listYStart);
  }

  private async fetchAndRenderReports(startY: number) {
    try {
      const token = this.auth.getAuthToken();
      if (!token) {
        this.add.text(this.cameras.main.width / 2, startY, 'Nicht eingeloggt. Keine Berichte.', { color: '#ff6666' }).setOrigin(0.5);
        return;
      }

      const resp = await fetch('/telemetry/errors', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!resp.ok) return this.add.text(this.cameras.main.width / 2, startY, 'Fehler beim Laden', { color: '#ff6666' }).setOrigin(0.5);

      const data = await resp.json();
      const reports = data.reports || [];
      if (reports.length === 0) {
        this.add.text(this.cameras.main.width / 2, startY, 'Keine Berichte gefunden', { color: '#888888' }).setOrigin(0.5);
        return;
      }

      let y = startY;
      for (const r of reports.slice().reverse()) {
        const message = r.message || (r.extra && r.extra.message) || 'no message';
        const time = r.receivedAt || r.timestamp || '';
        const t = this.add.text(40, y, `${time} — ${message}`, { font: '14px Arial', color: '#ffffff', wordWrap: { width: this.cameras.main.width - 80 } });
        y += t.getBounds().height + 8;
      }
    } catch (e) {
      console.error('Failed to fetch reports', e);
      this.add.text(this.cameras.main.width / 2, startY, 'Fehler beim Laden', { color: '#ff6666' }).setOrigin(0.5);
    }
  }
}

export default AdminScene;
