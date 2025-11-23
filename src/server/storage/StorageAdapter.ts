export interface StorageAdapter {
  save(userId: string, key: string, value: any): Promise<void>;
  load(userId: string, key: string): Promise<any | null>;
  keys(userId: string): Promise<string[]>;
  delete(userId: string, key: string): Promise<void>;
}
