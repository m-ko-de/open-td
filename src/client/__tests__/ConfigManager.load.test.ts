import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('ConfigManager load behavior - additional tests', () => {
  let originalFetch: any;
  let originalBaseURIDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    vi.resetModules();
    try {
      vi.unmock('../ConfigManager');
    } catch (e) {
      // ignore
    }
    originalFetch = (globalThis as any).fetch;
    originalBaseURIDescriptor = Object.getOwnPropertyDescriptor(document, 'baseURI');
  });

  afterEach(() => {
    (globalThis as any).fetch = originalFetch;
    if (originalBaseURIDescriptor) {
      Object.defineProperty(document, 'baseURI', originalBaseURIDescriptor);
    } else {
      // if there was no descriptor, remove our override
      try {
        delete (document as any).baseURI;
      } catch (e) {
        // ignore
      }
    }
    vi.restoreAllMocks();
  });

  it('throws when fetch returns non-ok', async () => {
    (globalThis as any).fetch = vi.fn(async () => ({ ok: false, statusText: 'Not Found' } as any));
    const { ConfigManager } = await import('../ConfigManager');
    const mgr = ConfigManager.getInstance();
    await expect(mgr.load()).rejects.toThrow('Failed to load config');
  });

  it('throws when fetch.json() fails', async () => {
    (globalThis as any).fetch = vi.fn(async () => ({ ok: true, json: async () => { throw new Error('bad json'); } } as any));
    const { ConfigManager } = await import('../ConfigManager');
    const mgr = ConfigManager.getInstance();
    await expect(mgr.load()).rejects.toThrow('bad json');
  });

  it('is idempotent - multiple loads fetch once', async () => {
    const calls: string[] = [];
    (globalThis as any).fetch = vi.fn(async (url: string) => { calls.push(String(url)); return { ok: true, json: async () => ({}) } as any; });
    const { ConfigManager } = await import('../ConfigManager');
    const mgr = ConfigManager.getInstance();
    await mgr.load();
    await mgr.load();
    expect(calls.length).toBe(1);
    expect(calls[0].endsWith('/config.json')).toBe(true);
  });

  it('handles trailing slash and no-trailing-slash bases correctly', async () => {
    const calls: string[] = [];
    (globalThis as any).fetch = vi.fn(async (url: string) => { calls.push(String(url)); return { ok: true, json: async () => ({}) } as any; });

    // no trailing slash base
    Object.defineProperty(document, 'baseURI', { get: () => 'https://example.com/open-td', configurable: true });
    vi.resetModules();
    const { ConfigManager: CM1 } = await import('../ConfigManager');
    const mgr1 = CM1.getInstance();
    await mgr1.load();
    const first = calls.pop();
    expect(first?.endsWith('/config.json')).toBe(true);

    // trailing slash base
    Object.defineProperty(document, 'baseURI', { get: () => 'https://example.com/open-td/', configurable: true });
    vi.resetModules();
    const { ConfigManager: CM2 } = await import('../ConfigManager');
    const mgr2 = CM2.getInstance();
    await mgr2.load();
    const second = calls.pop();
    expect(second?.endsWith('/config.json')).toBe(true);
  });
});
