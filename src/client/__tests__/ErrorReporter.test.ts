import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('ErrorReporter', () => {
  beforeEach(() => {
    // Reset modules and provide a fake localStorage
    vi.resetModules();
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
  });

  it('should persist error via PersistenceManager', async () => {
    const { errorReporter } = await import('../ErrorReporter');
    const { PersistenceManager } = await import('../PersistenceManager');
    const mgr = PersistenceManager.getInstance();
    const spy = vi.spyOn(mgr as any, 'saveErrorReport');

    const sampleError = new Error('boom');
    await errorReporter.report(sampleError, { stage: 'testing' });

    expect(spy).toHaveBeenCalledTimes(1);
    const arg = spy.mock.calls[0][0];
    expect((arg as { message: string; extra: any }).message).toContain('boom');
    expect((arg as { message: string; extra: any }).extra).toEqual({ stage: 'testing' });
  });
});
