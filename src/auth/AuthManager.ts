import { PersistenceManager } from '../client/PersistenceManager';


export interface UserProfile {
  userId: string;
  username: string;
  email?: string;
  level: number;
  xp: number;
  createdAt: string;
  lastLogin: string;
  passwordHash: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: UserProfile;
  token?: string;
}

export class AuthManager {
  private static instance: AuthManager;
  private currentUser: UserProfile | null = null;
  private authToken: string | null = null;
  private persistence: PersistenceManager;



  private constructor() {
    this.persistence = PersistenceManager.getInstance();
    this.loadSession();
  }

  public static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  public loadSession(): void {
    // Try to load existing session from localStorage
    const savedToken = this.persistence.getLocal<string>('authToken');
    const savedUser = this.persistence.getLocal<UserProfile>('currentUser');

    if (savedToken && savedUser) {
      this.authToken = savedToken;
      this.currentUser = savedUser;
      console.log('✅ Session restored:', savedUser.username);
    }
  }

  private saveSession(): void {
    if (this.authToken && this.currentUser) {
      this.persistence.setLocal('authToken', this.authToken);
      this.persistence.setLocal('currentUser', this.currentUser);
    }
  }

  public async register(username: string, password: string, email?: string): Promise<AuthResponse> {
    try {
      // Try server registration first
      const serverUrl = this.persistence.getServerUrl();
      if (serverUrl) {
        const response = await fetch(`${serverUrl}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password, email }),
        });

        if (response.ok) {
          const data = await response.json();
          this.authToken = data.token;
          this.currentUser = data.user;
          this.saveSession();
          console.log('✅ Registered on server:', username);
          return { success: true, user: data.user, token: data.token };
        }
      }
    } catch (error) {
      console.log('⚠️ Server registration failed, using local storage');
    }

    // Fallback to local registration
    const existingUsers = this.persistence.getLocal<Record<string, any>>('users') || {};

    if (existingUsers[username]) {
      return { success: false, message: 'Benutzername bereits vergeben' };
    }

    const newUser: UserProfile = {
      userId: this.generateUserId(),
      username,
      email,
      level: 1,
      xp: 0,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      passwordHash: await this.hashPassword(password),
    };

    existingUsers[username] = {
      ...newUser,
    };

    this.persistence.setLocal('users', existingUsers);
    this.authToken = this.generateToken(newUser.userId);
    this.currentUser = newUser;
    this.saveSession();

    console.log('✅ Registered locally:', username);
    return { success: true, user: newUser, token: this.authToken };
  }

  public async login(username: string, password: string): Promise<AuthResponse> {
    try {
      // Try server login first
      const serverUrl = this.persistence.getServerUrl();
      if (serverUrl) {
        const response = await fetch(`${serverUrl}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
          const data = await response.json();
          this.authToken = data.token;
          this.currentUser = data.user;
          if (this.currentUser) {
            this.currentUser.lastLogin = new Date().toISOString();
          }
          this.saveSession();
          console.log('✅ Logged in via server:', username);
          return { success: true, user: data.user, token: data.token };
        }
      }
    } catch (error) {
      console.log('⚠️ Server login failed, using local storage');
    }

    // Fallback to local login
    const existingUsers = this.persistence.getLocal<Record<string, any>>('users') || {};
    const user = existingUsers[username];

    if (!user) {
      return { success: false, message: 'Benutzer nicht gefunden' };
    }

    if (user.passwordHash !== await this.hashPassword(password)) {
      return { success: false, message: 'Falsches Passwort' };
    }

    user.lastLogin = new Date().toISOString();
    existingUsers[username] = user;
    this.persistence.setLocal('users', existingUsers);

    this.authToken = this.generateToken(user.userId);
    this.currentUser = {
      userId: user.userId,
      username: user.username,
      email: user.email,
      level: user.level,
      xp: user.xp,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      passwordHash: user.passwordHash,
    };
    this.saveSession();

    console.log('✅ Logged in locally:', username);
    return { success: true, user: this.currentUser, token: this.authToken };
  }

  public logout(): void {
    this.currentUser = null;
    this.authToken = null;
    this.persistence.removeLocal('authToken');
    this.persistence.removeLocal('currentUser');
    console.log('👋 Logged out');
  }

  public isLoggedIn(): boolean {
    return this.currentUser !== null && this.authToken !== null;
  }

  public getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  public getAuthToken(): string | null {
    return this.authToken;
  }

  public async updateUserProgress(xpGained: number, levelUp?: boolean): Promise<void> {
    if (!this.currentUser) return;

    this.currentUser.xp += xpGained;
    if (levelUp && this.currentUser.level) {
      this.currentUser.level += 1;
    }

    this.saveSession();

    // Try to sync with server
    try {
      const serverUrl = this.persistence.getServerUrl();
      if (serverUrl && this.authToken) {
        await fetch(`${serverUrl}/auth/progress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.authToken}`,
          },
          body: JSON.stringify({
            xp: this.currentUser.xp,
            level: this.currentUser.level,
          }),
        });
      }
    } catch (error) {
      console.log('⚠️ Could not sync progress with server');
    }

    // Update local storage
    const users = this.persistence.getLocal<Record<string, any>>('users') || {};
    if (users[this.currentUser.username]) {
      users[this.currentUser.username].xp = this.currentUser.xp;
      users[this.currentUser.username].level = this.currentUser.level;
      this.persistence.setLocal('users', users);
    }
  }

  private generateUserId(): string {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private generateToken(userId: string): string {
    return btoa(userId + ':' + Date.now() + ':' + Math.random().toString(36).substr(2, 16));
  }

  private async hashPassword(password: string): Promise<string> {
    // Simple hash for demo - in production use proper crypto
    let salt = this.persistence.getLocal<string>('passwordSalt');
    if (!salt) {
      const saltBytes = new Uint8Array(128);
      crypto.getRandomValues(saltBytes);
      salt = btoa(String.fromCharCode(...saltBytes));
      this.persistence.setLocal('passwordSalt', salt);
    }

    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const saltBytes = new Uint8Array([...atob(salt)].map(c => c.charCodeAt(0)));

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBytes,
        iterations: 1000,
        hash: 'SHA-512'
      },
      passwordKey,
      512
    );

    const hashArray = new Uint8Array(derivedBits);
    return Array.from(hashArray, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}
