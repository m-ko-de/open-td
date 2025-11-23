import express, { Request, Response, Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

interface User {
  userId: string;
  username: string;
  passwordHash: string;
  email?: string;
  level: number;
  xp: number;
  createdAt: string;
  lastLogin: string;
}

export class AuthRouter {
  public router: Router;
  private users: Map<string, User> = new Map();
  private jwtSecret: string = process.env.JWT_SECRET || 'opentd_secret_key_change_in_production';

  constructor() {
    this.router = express.Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Register new user
    this.router.post('/register', async (req: Request, res: Response) => {
      try {
        const { username, password, email } = req.body;

        if (!username || !password) {
          return res.status(400).json({ success: false, message: 'Username and password required' });
        }

        // Check if user exists
        if (this.users.has(username)) {
          return res.status(409).json({ success: false, message: 'Username already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const user: User = {
          userId: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          username,
          passwordHash,
          email,
          level: 1,
          xp: 0,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };

        this.users.set(username, user);

        // Generate token
        const token = jwt.sign({ userId: user.userId, username }, this.jwtSecret, { expiresIn: '7d' });

        console.log(`✅ User registered: ${username}`);

        res.json({
          success: true,
          user: {
            userId: user.userId,
            username: user.username,
            email: user.email,
            level: user.level,
            xp: user.xp,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
          },
          token,
        });
      } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
      }
    });

    // Login
    this.router.post('/login', async (req: Request, res: Response) => {
      try {
        const { username, password } = req.body;

        if (!username || !password) {
          return res.status(400).json({ success: false, message: 'Username and password required' });
        }

        const user = this.users.get(username);

        if (!user) {
          return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.passwordHash);

        if (!validPassword) {
          return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Update last login
        user.lastLogin = new Date().toISOString();

        // Generate token
        const token = jwt.sign({ userId: user.userId, username }, this.jwtSecret, { expiresIn: '7d' });

        console.log(`✅ User logged in: ${username}`);

        res.json({
          success: true,
          user: {
            userId: user.userId,
            username: user.username,
            email: user.email,
            level: user.level,
            xp: user.xp,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
          },
          token,
        });
      } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
      }
    });

    // Update user progress
    this.router.post('/progress', this.authenticateToken, async (req: Request, res: Response) => {
      try {
        const { xp, level } = req.body;
        const username = (req as any).user.username;

        const user = this.users.get(username);
        if (!user) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (xp !== undefined) user.xp = xp;
        if (level !== undefined) user.level = level;

        console.log(`📊 Progress updated for ${username}: Level ${user.level}, XP ${user.xp}`);

        res.json({ success: true, xp: user.xp, level: user.level });
      } catch (error) {
        console.error('❌ Progress update error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
      }
    });

    // Get user profile
    this.router.get('/profile', this.authenticateToken, async (req: Request, res: Response) => {
      try {
        const username = (req as any).user.username;
        const user = this.users.get(username);

        if (!user) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
          success: true,
          user: {
            userId: user.userId,
            username: user.username,
            email: user.email,
            level: user.level,
            xp: user.xp,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
          },
        });
      } catch (error) {
        console.error('❌ Profile fetch error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
      }
    });
  }

  // Middleware to verify JWT token
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

