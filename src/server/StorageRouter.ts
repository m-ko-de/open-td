import express, { Request, Response, Router } from 'express';
import jwt from 'jsonwebtoken';
import { StorageService, StorageMode } from './storage/StorageService';

export class StorageRouter {
  public router: Router;
  private storage: StorageService;
  private jwtSecret: string = process.env.JWT_SECRET || 'opentd_secret_key_change_in_production';

  constructor(mode: StorageMode = 'memory', mongoDb?: any) {
    this.router = express.Router();
    this.storage = new StorageService(mode, mongoDb);
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Save data
    this.router.post('/save', this.authenticateToken, async (req: Request, res: Response) => {
      try {
        const { key, value } = req.body;
        const userId = (req as any).user.userId;
        if (!key) {
          return res.status(400).json({ success: false, message: 'Key required' });
        }
        await this.storage.save(userId, key, value);
        console.log(`💾 Saved data for user ${userId}: ${key}`);
        res.json({ success: true });
      } catch (error) {
        console.error('❌ Storage save error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
      }
    });

    // Load data
    this.router.get('/load', this.authenticateToken, async (req: Request, res: Response) => {
      try {
        const key = req.query.key as string;
        const userId = (req as any).user.userId;
        if (!key) {
          return res.status(400).json({ success: false, message: 'Key required' });
        }
        const data = await this.storage.load(userId, key);
        if (!data) {
          return res.status(404).json({ success: false, message: 'Data not found' });
        }
        console.log(`📥 Loaded data for user ${userId}: ${key}`);
        res.json({ success: true, value: data.value, updatedAt: data.updatedAt });
      } catch (error) {
        console.error('❌ Storage load error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
      }
    });

    // List all keys
    this.router.get('/keys', this.authenticateToken, async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.userId;
        const keys = await this.storage.keys(userId);
        res.json({ success: true, keys });
      } catch (error) {
        console.error('❌ Storage keys error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
      }
    });

    // Delete data
    this.router.delete('/delete', this.authenticateToken, async (req: Request, res: Response) => {
      try {
        const key = req.query.key as string;
        const userId = (req as any).user.userId;
        if (!key) {
          return res.status(400).json({ success: false, message: 'Key required' });
        }
        await this.storage.delete(userId, key);
        console.log(`🗑️ Deleted data for user ${userId}: ${key}`);
        res.json({ success: true });
      } catch (error) {
        console.error('❌ Storage delete error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
      }
    });
  }

  private authenticateToken = (req: Request, res: Response, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    jwt.verify(token, this.jwtSecret, (err: any, user: any) => {
      if (err) {
        return res.status(403).json({ success: false, message: 'Invalid token' });
      }
      (req as any).user = user;
      next();
    });
  };
}
