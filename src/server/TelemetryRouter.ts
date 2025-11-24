import express, { Request, Response, Router } from 'express';
import { StorageService } from './storage/StorageService';

export class TelemetryRouter {
  public router: Router;
  private storage: StorageService;

  constructor(mode: 'memory' | 'file' | 'lowdb' | 'mongo' = 'memory', mongoDb?: any) {
    this.router = express.Router();
    this.storage = new StorageService(mode, mongoDb);
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Save a telemetry report for the authenticated user
    this.router.post('/report', async (req: Request, res: Response) => {
      try {
        const user = (req as any).user;
        if (!user || !user.userId) return res.status(401).json({ success: false, message: 'Not authenticated' });
        const { report } = req.body;
        if (!report) return res.status(400).json({ success: false, message: 'report required' });
        const userId = user.userId;
        const existing = (await this.storage.load(userId, 'errorReports')) || { value: [] } as any;
        const arr = existing.value || [];
        arr.push({ ...report, receivedAt: new Date().toISOString() });
        await this.storage.save(userId, 'errorReports', arr);
        res.json({ success: true });
      } catch (e) {
        console.error('❌ Telemetry save error:', e);
        res.status(500).json({ success: false, message: 'Server error' });
      }
    });

    // List telemetry reports for the authenticated user
    this.router.get('/errors', async (req: Request, res: Response) => {
      try {
        const user = (req as any).user;
        if (!user || !user.userId) return res.status(401).json({ success: false, message: 'Not authenticated' });
        const userId = user.userId;
        const existing = (await this.storage.load(userId, 'errorReports')) || { value: [] } as any;
        res.json({ success: true, reports: existing.value || [] });
      } catch (e) {
        console.error('❌ Telemetry list error:', e);
        res.status(500).json({ success: false, message: 'Server error' });
      }
    });
  }
}

export default TelemetryRouter;
