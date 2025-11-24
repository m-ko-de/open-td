import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('PersistenceManager - server endpoint construction', () => {
  beforeEach(() => {
    // reset module cache so singleton is recreated
    vi.resetModules();

    // minimal localStorage mock
    const store: Record<string, string> = {};
    const localStorageMock = {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => { store[k] = String(v); },
      removeItem: (k: string) => { delete store[k]; },
      clear: () => { for (const k of Object.keys(store)) delete store[k]; },
      key: (i: number) => Object.keys(store)[i] || null,
      get length() { return Object.keys(store).length; },
    } as any;
    // @ts-ignore
    globalThis.localStorage = localStorageMock;

    // ensure document base for resolveUrl
    if ((globalThis as any).document) {
      Object.defineProperty(document, 'baseURI', { get: () => 'https://example.com/open-td/', configurable: true });
    } else {
      (globalThis as any).document = { baseURI: 'https://example.com/open-td/' } as any;
    }

    // reset fetch mock
    globalThis.fetch = vi.fn();
  });

  async function importMgr() {
    const mod = await import('../PersistenceManager');
    return mod.PersistenceManager.getInstance();
  }

  it('builds absolute endpoint when serverUrl is absolute', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true }) as any);
    // @ts-ignore
    globalThis.fetch = fetchMock;

    const mgr = await importMgr();
    mgr.setServerUrl('https://api.example.com');

    const res = await mgr.saveToServer('k', { a: 1 }, 'tok');
    expect(res).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = (fetchMock as any).mock.calls[0][0];
    expect(String(calledUrl).includes('api.example.com')).toBe(true);
    expect(String(calledUrl).endsWith('/storage/save')).toBe(true);
  });

  it('resolves absolute-path serverUrl like /api to site origin', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true }) as any);
    // @ts-ignore
    globalThis.fetch = fetchMock;

    const mgr = await importMgr();
    mgr.setServerUrl('/api');

    await mgr.saveToServer('k', { a: 1 }, 'tok');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = (fetchMock as any).mock.calls[0][0];
    // should resolve against example.com/open-td -> origin + /api
    expect(String(calledUrl).includes('/api/storage/save')).toBe(true);
  });

  it('resolves relative serverUrl like api to app base', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true }) as any);
    // @ts-ignore
    globalThis.fetch = fetchMock;

    const mgr = await importMgr();
    mgr.setServerUrl('api');

    await mgr.saveToServer('k', { a: 1 }, 'tok');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = (fetchMock as any).mock.calls[0][0];
    // should contain /open-td/api/storage/save or similar
    expect(String(calledUrl).includes('/api/storage/save')).toBe(true);
  });

  it('handles trailing slash/no trailing slash consistently', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true }) as any);
    // @ts-ignore
    globalThis.fetch = fetchMock;

    const mgr = await importMgr();
    mgr.setServerUrl('/api/');
    await mgr.saveToServer('k', { a: 1 }, 'tok');

    mgr.setServerUrl('/api');
    await mgr.saveToServer('k2', { b: 2 }, 'tok');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const u1 = (fetchMock as any).mock.calls[0][0];
    const u2 = (fetchMock as any).mock.calls[1][0];
    expect(String(u1).endsWith('/storage/save')).toBe(true);
    expect(String(u2).endsWith('/storage/save')).toBe(true);
  });

  it('loadFromServer calls load endpoint with encoded key and returns value', async () => {
    const payload = { value: { hello: 'world' } };
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => payload } as any));
    // @ts-ignore
    globalThis.fetch = fetchMock;

    const mgr = await importMgr();
    mgr.setServerUrl('api');

    const loaded = await mgr.loadFromServer('a key/with?chars', 'tok');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = (fetchMock as any).mock.calls[0][0];
    expect(String(calledUrl).includes('/storage/load?key=')).toBe(true);
    expect(String(calledUrl)).toContain(encodeURIComponent('a key/with?chars'));
    expect(loaded).toEqual(payload.value);
  });

  it('clearAllData calls clear endpoint when hybrid and authToken provided', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true }) as any);
    // @ts-ignore
    globalThis.fetch = fetchMock;

    const mgr = await importMgr();
    mgr.setServerUrl('/api');
    // ensure hybrid
    mgr.setStorageMode('hybrid');

    await mgr.clearAllData('my-token');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = (fetchMock as any).mock.calls[0][0];
    expect(String(calledUrl).includes('/storage/clear')).toBe(true);
  });
});
