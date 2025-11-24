export type StorageMode = 'local' | 'server' | 'hybrid';

export interface GameProgress {
  userId: string;
  highestWave: number;
  totalKills: number;
  totalGold: number;
  completedLevels: string[];
  achievements: string[];
  lastPlayed: string;
}

import { resolveUrl } from './UrlManager';

export class PersistenceManager {
  private static instance: PersistenceManager;
  private storageMode: StorageMode = 'hybrid';
  private serverUrl: string | null = null;
  private storagePrefix = 'opentd_';

  private constructor() {
    this.detectStorageMode();
  }

  // Use UrlManager to resolve server-relative URLs when needed
  // Import at top to avoid dynamic imports inside methods
  // (kept here for patch clarity — actual import added at file top)

  public static getInstance(): PersistenceManager {
    if (!PersistenceManager.instance) {
      PersistenceManager.instance = new PersistenceManager();
    }
    return PersistenceManager.instance;
  }

  private detectStorageMode(): void {
    // Check if server is available
    const savedServerUrl = localStorage.getItem(this.storagePrefix + 'serverUrl');
    if (savedServerUrl) {
      this.serverUrl = savedServerUrl;
      this.storageMode = 'hybrid';
    } else {
      this.storageMode = 'local';
    }
    console.log(`💾 Storage mode: ${this.storageMode}`);
  }

  public setServerUrl(url: string): void {
    this.serverUrl = url;
    localStorage.setItem(this.storagePrefix + 'serverUrl', url);
    this.storageMode = 'hybrid';
    console.log(`🌐 Server URL set: ${url}`);
  }

  public getServerUrl(): string | null {
    return this.serverUrl;
  }

  public setStorageMode(mode: StorageMode): void {
    this.storageMode = mode;
    console.log(`💾 Storage mode changed to: ${mode}`);
  }

  // Local Storage operations
  public setLocal<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(this.storagePrefix + key, serialized);
    } catch (error) {
      console.error('❌ Failed to save to localStorage:', error);
    }
  }

  public getLocal<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.storagePrefix + key);
      if (item === null) return null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error('❌ Failed to read from localStorage:', error);
      return null;
    }
  }

  public removeLocal(key: string): void {
    localStorage.removeItem(this.storagePrefix + key);
  }

  public clearLocal(): void {
    // Get all keys from localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.storagePrefix)) {
        keysToRemove.push(key);
      }
    }
    
    // Remove all prefixed keys
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('🗑️ Local storage cleared');
  }

  // Server operations
  public async saveToServer(key: string, value: any, authToken: string): Promise<boolean> {
    if (!this.serverUrl || this.storageMode === 'local') {
      return false;
    }

    try {
      // Resolve endpoint correctly for relative serverUrl values
      // `resolveUrl` will return absolute URLs for absolute inputs and
      // resolve relative inputs against the app base.
      // Import here to avoid circular / top-level ordering issues.
      const endpoint = resolveUrl(`${this.serverUrl.replace(/\/$/, '')}/storage/save`);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ key, value }),
      });

      if (response.ok) {
        console.log(`☁️ Saved to server: ${key}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Failed to save to server:', error);
      return false;
    }
  }

  public async loadFromServer(key: string, authToken: string): Promise<any | null> {
    if (!this.serverUrl || this.storageMode === 'local') {
      return null;
    }

    try {
      // Resolve server endpoint
      const endpoint = resolveUrl(`${this.serverUrl.replace(/\/$/, '')}/storage/load?key=${encodeURIComponent(key)}`);
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`☁️ Loaded from server: ${key}`);
        return data.value;
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to load from server:', error);
      return null;
    }
  }

  // Hybrid operations (try server, fallback to local)
  public async save(key: string, value: any, authToken?: string): Promise<void> {
    // Always save locally
    this.setLocal(key, value);

    // Try server if available
    if (this.storageMode === 'hybrid' || this.storageMode === 'server') {
      if (authToken) {
        await this.saveToServer(key, value, authToken);
      }
    }
  }

  public async load<T>(key: string, authToken?: string): Promise<T | null> {
    // Try server first if in server/hybrid mode
    if ((this.storageMode === 'hybrid' || this.storageMode === 'server') && authToken) {
      const serverData = await this.loadFromServer(key, authToken);
      if (serverData !== null) {
        // Update local cache
        this.setLocal(key, serverData);
        return serverData as T;
      }
    }

    // Fallback to local
    return this.getLocal<T>(key);
  }

  // Game progress specific methods
  public async saveGameProgress(progress: GameProgress, authToken?: string): Promise<void> {
    await this.save('gameProgress', progress, authToken);
  }

  public async loadGameProgress(authToken?: string): Promise<GameProgress | null> {
    return await this.load<GameProgress>('gameProgress', authToken);
  }

  // Settings
  public saveSettings(settings: any): void {
    this.setLocal('settings', settings);
  }

  public loadSettings(): any | null {
    return this.getLocal('settings');
  }

  // Statistics
  public async updateStatistics(stats: any, authToken?: string): Promise<void> {
    await this.save('statistics', stats, authToken);
  }

  public async loadStatistics(authToken?: string): Promise<any | null> {
    return await this.load('statistics', authToken);
  }

  // clear all data
  public async clearAllData(authToken?: string): Promise<void> {
    this.clearLocal();  
    if (this.storageMode === 'hybrid' || this.storageMode === 'server') {
      if (authToken) {
        // resolve clear endpoint
        const clearEndpoint = resolveUrl(`${this.serverUrl!.replace(/\/$/, '')}/storage/clear`);
        await fetch(clearEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        });
      }
    }
  }
  
}
