import { StorageAdapter } from './StorageAdapter';
import { Db } from 'mongodb';

export class MongoAdapter implements StorageAdapter {
  private db: Db;
  private collection: string;

  constructor(db: Db, collection: string = 'storage') {
    this.db = db;
    this.collection = collection;
  }

  async save(userId: string, key: string, value: any): Promise<void> {
    await this.db.collection(this.collection).updateOne(
      { userId },
      { $set: { [key]: { value, updatedAt: new Date().toISOString() } } },
      { upsert: true }
    );
  }

  async load(userId: string, key: string): Promise<any | null> {
    const doc = await this.db.collection(this.collection).findOne({ userId });
    return doc && doc[key] ? doc[key] : null;
  }

  async keys(userId: string): Promise<string[]> {
    const doc = await this.db.collection(this.collection).findOne({ userId });
    return doc ? Object.keys(doc).filter(k => k !== '_id' && k !== 'userId') : [];
  }

  async delete(userId: string, key: string): Promise<void> {
    await this.db.collection(this.collection).updateOne(
      { userId },
      { $unset: { [key]: '' } }
    );
  }
}
