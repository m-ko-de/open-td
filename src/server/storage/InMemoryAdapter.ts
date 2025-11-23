import { StorageAdapter } from './StorageAdapter';

export class InMemoryAdapter implements StorageAdapter {
  private storage: Map<string, Map<string, any>> = new Map();

  async save(userId: string, key: string, value: any): Promise<void> {
    if (!this.storage.has(userId)) {
      this.storage.set(userId, new Map());
    }
    this.storage.get(userId)!.set(key, { value, updatedAt: new Date().toISOString() });
  }

  async load(userId: string, key: string): Promise<any | null> {
    const userStorage = this.storage.get(userId);
    if (!userStorage || !userStorage.has(key)) return null;
    return userStorage.get(key);
  }

  async keys(userId: string): Promise<string[]> {
    const userStorage = this.storage.get(userId);
    return userStorage ? Array.from(userStorage.keys()) : [];
  }

  async delete(userId: string, key: string): Promise<void> {
    const userStorage = this.storage.get(userId);
    if (userStorage) userStorage.delete(key);
  }
}
