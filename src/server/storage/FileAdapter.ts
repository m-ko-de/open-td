import { StorageAdapter } from './StorageAdapter';
import fs from 'fs/promises';
import path from 'path';

export class FileAdapter implements StorageAdapter {
  private baseDir: string;

  constructor(baseDir: string = './data/storage') {
    this.baseDir = baseDir;
  }

  private getUserFile(userId: string) {
    return path.join(this.baseDir, `${userId}.json`);
  }

  async save(userId: string, key: string, value: any): Promise<void> {
    let data: Record<string, any> = {};
    try {
      const file = this.getUserFile(userId);
      const content = await fs.readFile(file, 'utf-8');
      data = JSON.parse(content);
    } catch {}
    data[key] = { value, updatedAt: new Date().toISOString() };
    await fs.mkdir(this.baseDir, { recursive: true });
    await fs.writeFile(this.getUserFile(userId), JSON.stringify(data, null, 2));
  }

  async load(userId: string, key: string): Promise<any | null> {
    try {
      const file = this.getUserFile(userId);
      const content = await fs.readFile(file, 'utf-8');
      const data = JSON.parse(content);
      return data[key] || null;
    } catch {
      return null;
    }
  }

  async keys(userId: string): Promise<string[]> {
    try {
      const file = this.getUserFile(userId);
      const content = await fs.readFile(file, 'utf-8');
      const data = JSON.parse(content);
      return Object.keys(data);
    } catch {
      return [];
    }
  }

  async delete(userId: string, key: string): Promise<void> {
    try {
      const file = this.getUserFile(userId);
      const content = await fs.readFile(file, 'utf-8');
      const data = JSON.parse(content);
      delete data[key];
      await fs.writeFile(file, JSON.stringify(data, null, 2));
    } catch {}
  }
}
