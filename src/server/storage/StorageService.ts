import { StorageAdapter } from './StorageAdapter';
import { InMemoryAdapter } from './InMemoryAdapter';
import { FileAdapter } from './FileAdapter';
import { LowdbAdapter } from './LowdbAdapter';
// import { MongoAdapter } from './MongoAdapter'; // MongoDB optional

export type StorageMode = 'memory' | 'file' | 'mongo' | 'lowdb';

export class StorageService {
  private adapter: StorageAdapter;

  constructor(mode: StorageMode = 'memory', mongoDb?: any) {
    if (mode === 'file') {
      this.adapter = new FileAdapter();
    } else if (mode === 'lowdb') {
      this.adapter = new LowdbAdapter('./data/lowdb.json');
    } else if (mode === 'mongo' && mongoDb) {
      // this.adapter = new MongoAdapter(mongoDb);
      throw new Error('MongoDB adapter not yet configured');
    } else {
      this.adapter = new InMemoryAdapter();
    }
  }

  save(userId: string, key: string, value: any) {
    return this.adapter.save(userId, key, value);
  }
  load(userId: string, key: string) {
    return this.adapter.load(userId, key);
  }
  keys(userId: string) {
    return this.adapter.keys(userId);
  }
  delete(userId: string, key: string) {
    return this.adapter.delete(userId, key);
  }
}
