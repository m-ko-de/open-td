import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthManager } from '../AuthManager';
import { PersistenceManager } from '../../client/PersistenceManager';
import { pseudoRandomBytes } from 'crypto';
import { clearMockStorage } from '../../__mocks__/PersistenceManager';
vi.mock('../../client/PersistenceManager', async () => {
  const mod = await import('../../__mocks__/PersistenceManager');
  return { PersistenceManager: mod.PersistenceManager };
});

// Mock fetch for server calls
global.fetch = vi.fn();

describe('AuthManager', () => {
  let authManager: AuthManager;

  beforeEach(() => {
    // Clear storage and mocks
    clearMockStorage();
    vi.mocked(global.fetch).mockClear();
    authManager = AuthManager.getInstance();
    authManager.logout();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = AuthManager.getInstance();
      const instance2 = AuthManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Registration', () => {
    it('should register a new user locally', async () => {
      const result = await authManager.register('testuser', 'password123', 'test@example.com');

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.username).toBe('testuser');
      expect(result.user?.email).toBe('test@example.com');
      expect(result.user?.level).toBe(1);
      expect(result.user?.xp).toBe(0);
      expect(result.token).toBeDefined();
    });

    it('should not register duplicate username', async () => {
      await authManager.register('testuser', 'password123');
      const result = await authManager.register('testuser', 'different');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Benutzername bereits vergeben');
    });

    it('should set user as logged in after registration', async () => {
      const result = await authManager.register('testuser123', 'password123');
    expect(result.success).toBe(true);
      authManager.loadSession();
      expect(authManager.isLoggedIn()).toBe(true);
      expect(authManager.getCurrentUser()?.username).toBe('testuser123');
    });
  });

  describe('Login', () => {
    beforeEach(async () => {
      // Register a user first
      await authManager.register('testuser', 'password123');
      authManager.logout();
    });

    it('should login with correct credentials', async () => {
      const result = await authManager.login('testuser', 'password123');

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.username).toBe('testuser');
      expect(result.token).toBeDefined();
    });

    it('should fail login with wrong password', async () => {
      const result = await authManager.login('testuser', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Falsches Passwort');
    });

    it('should fail login with non-existent user', async () => {
      const result = await authManager.login('nonexistent', 'password123');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Benutzer nicht gefunden');
    });

    it('should set user as logged in after successful login', async () => {
      await authManager.login('testuser', 'password123');
      authManager.loadSession();
      expect(authManager.isLoggedIn()).toBe(true);
      expect(authManager.getCurrentUser()?.username).toBe('testuser');
    });

    it('should update last login time', async () => {
      const result = await authManager.login('testuser', 'password123');
      const lastLogin = result.user?.lastLogin;

      expect(lastLogin).toBeDefined();
      expect(new Date(lastLogin!).getTime()).toBeGreaterThan(Date.now() - 5000);
    });
  });

  describe('Logout', () => {
    it('should clear user session', async () => {
      let result =await authManager.register('testuser', 'password123');
      if(result.success) {
        authManager.loadSession();
        expect(authManager.isLoggedIn()).toBe(true);
        authManager.logout();
        authManager.loadSession();
        expect(authManager.isLoggedIn()).toBe(false);
        expect(authManager.getCurrentUser()).toBeNull();
        expect(authManager.getAuthToken()).toBeNull();
      }
    });
  });

  describe('Progress Update', () => {
    beforeEach(async () => {
      await authManager.register('testuser' + pseudoRandomBytes(4).toString('hex') , 'password123');
    });

    it('should update user XP', async () => {
      const initialXP = authManager.getCurrentUser()?.xp || 0;
      await authManager.updateUserProgress(100);
      authManager.loadSession();
      expect(authManager.getCurrentUser()?.xp).toBe(initialXP + 100);
    });

    it('should update user level on level up', async () => {
      const initialLevel = authManager.getCurrentUser()?.level || 1;
      await authManager.updateUserProgress(100, true);
      authManager.loadSession();
      expect(authManager.getCurrentUser()?.level).toBe(initialLevel + 1);
    });

    it('should not update if not logged in', async () => {
      authManager.logout();
      await authManager.updateUserProgress(100);

      expect(authManager.getCurrentUser()).toBeNull();
    });
  });

  describe('Session Persistence', () => {
    it('should save session to storage after registration', async () => {
      const persistence = PersistenceManager.getInstance();
      await authManager.register('testuser', 'password123');

      expect(persistence.setLocal).toHaveBeenCalledWith('authToken', expect.any(String));
      expect(persistence.setLocal).toHaveBeenCalledWith('currentUser', expect.objectContaining({
        username: 'testuser',
      }));
    });

    it('should save session to storage after login', async () => {
      await authManager.register('testuser', 'password123');
      authManager.logout();
      
      const persistence = PersistenceManager.getInstance();
      vi.clearAllMocks();

      await authManager.login('testuser', 'password123');

      expect(persistence.setLocal).toHaveBeenCalledWith('authToken', expect.any(String));
      expect(persistence.setLocal).toHaveBeenCalledWith('currentUser', expect.objectContaining({
        username: 'testuser',
      }));
    });

    it('should remove session from storage on logout', () => {
      const persistence = PersistenceManager.getInstance();
      authManager.logout();

      expect(persistence.removeLocal).toHaveBeenCalledWith('authToken');
      expect(persistence.removeLocal).toHaveBeenCalledWith('currentUser');
    });
  });

  describe('User Data', () => {
    beforeEach(async () => {
      await authManager.register('testuser' + pseudoRandomBytes(4).toString('hex') , 
                                 'password123',
                                 'test@example.com');
    });

    it('should return current user when logged in', () => {
      authManager.loadSession();
      const user = authManager.getCurrentUser();
      expect(user).toBeDefined();
      expect(user?.username).toContain('testuser');
      expect(user?.email).toBe('test@example.com');
    });

    it('should return auth token when logged in', () => {
      authManager.loadSession();
      const token = authManager.getAuthToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token?.length).toBeGreaterThan(0);
    });

    it('should check login status correctly', () => {
      authManager.loadSession();
      expect(authManager.isLoggedIn()).toBe(true);
      authManager.logout();
      authManager.loadSession();
      expect(authManager.isLoggedIn()).toBe(false);
    });
  });

  describe('Server Integration', () => {
    it('should attempt server registration when server URL is available', async () => {
      // Setup mock fetch BEFORE setting server URL
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          user: { userId: '123', username: 'testuser', level: 1, xp: 0 },
          token: 'server-token',
        }),
      } as any);

      // Set server URL to trigger server registration
      PersistenceManager.getInstance().setServerUrl('http://localhost:3000');

      const result = await authManager.register('testuser', 'password123');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/auth/register',
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result.success).toBe(true);
    });

    it('should fallback to local registration if server fails', async () => {
      // Setup mock to reject
      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));
      
      // Mock server URL
      PersistenceManager.getInstance().setServerUrl('http://localhost:3000');

      const result = await authManager.register('testuser', 'password123');

      expect(result.success).toBe(true);
      expect(result.user?.username).toBe('testuser');
    });
  });

  describe('Password Hashing', () => {
    it('should not store plain text passwords', async () => {
      await authManager.register('testuser', 'password123');
      
      const persistence = PersistenceManager.getInstance();
      const users = persistence.getLocal('users') as any;
      const userData = users?.testuser;

      expect(userData?.passwordHash).toBeDefined();
      expect(userData?.passwordHash).not.toBe('password123');
    });

    it('should validate passwords against hash', async () => {
      await authManager.register('testuser', 'password123');
      authManager.logout();

      const correctLogin = await authManager.login('testuser', 'password123');
      expect(correctLogin.success).toBe(true);

      const wrongLogin = await authManager.login('testuser', 'wrongpassword');
      expect(wrongLogin.success).toBe(false);
    });
  });
});

