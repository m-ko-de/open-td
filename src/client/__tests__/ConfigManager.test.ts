import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('ConfigManager (path resolution)', () => {
  let originalFetch: any;
  let originalDocument: any;

  beforeEach(() => {
    // Ensure we load the real module (test setup may mock it globally)
    vi.resetModules();
    try {
      vi.unmock('../ConfigManager');
    } catch (e) {
      // ignore if not mocked
    }

    originalFetch = (globalThis as any).fetch;
    originalDocument = (globalThis as any).document;
  });

  afterEach(() => {
    (globalThis as any).fetch = originalFetch;
    (globalThis as any).document = originalDocument;
    vi.restoreAllMocks();
  });

  it('fetches config.json relative to subdirectory baseURI', async () => {
    const fetchedUrls: string[] = [];
    (globalThis as any).fetch = vi.fn(async (url: string) => {
      fetchedUrls.push(String(url));
      return { ok: true, json: async () => ({}) } as any;
    });

    // Simulate being served from a subdirectory on GitHub Pages
    const originalBaseURIDescriptor = Object.getOwnPropertyDescriptor(document, 'baseURI');
    Object.defineProperty(document, 'baseURI', {
      get: () => 'https://m-ko-de.github.io/open-td/',
      configurable: true,
    });

    const { ConfigManager } = await import('../ConfigManager');
    const mgr = ConfigManager.getInstance();
    await mgr.load();

    expect(fetchedUrls.length).toBeGreaterThan(0);
    expect(fetchedUrls[0].endsWith('/config.json')).toBe(true);

    // restore original document.baseURI descriptor
    if (originalBaseURIDescriptor) {
      Object.defineProperty(document, 'baseURI', originalBaseURIDescriptor);
    } else {
      delete (document as any).baseURI;
    }
  });

  it('fetches config.json from site root when baseURI is root', async () => {
    const fetchedUrls: string[] = [];
    (globalThis as any).fetch = vi.fn(async (url: string) => {
      fetchedUrls.push(String(url));
      return { ok: true, json: async () => ({}) } as any;
    });

    // Simulate site root baseURI
    const originalBaseURIDescriptor = Object.getOwnPropertyDescriptor(document, 'baseURI');
    Object.defineProperty(document, 'baseURI', {
      get: () => 'https://m-ko-de.github.io/',
      configurable: true,
    });

    const { ConfigManager } = await import('../ConfigManager');
    const mgr = ConfigManager.getInstance();
    await mgr.load();

    expect(fetchedUrls[0].endsWith('/config.json')).toBe(true);
    // restore original document.baseURI descriptor
    if (originalBaseURIDescriptor) {
      Object.defineProperty(document, 'baseURI', originalBaseURIDescriptor);
    } else {
      delete (document as any).baseURI;
    }
  });
});
