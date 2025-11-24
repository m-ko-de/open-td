export function resolveUrl(relativePath: string): string {
  let base: string | undefined;
  try {
    // @ts-ignore - import.meta may not be available in test envs
    const maybeBase = (import.meta as any)?.env?.BASE_URL;
    if (maybeBase) base = maybeBase;
  } catch (e) {
    base = undefined;
  }
  if (!base) {
    if (typeof document !== 'undefined' && document.baseURI) {
      base = document.baseURI;
    } else if (typeof window !== 'undefined' && window.location) {
      base = window.location.href;
    } else {
      base = '/';
    }
  }

  try {
    // Normalize base to a directory. If the last path segment looks like a
    // filename (contains a dot), do not append a slash. This mirrors browser
    // semantics to avoid resolving into a sibling file.
    const parsed = new URL(base);
    const pathname = parsed.pathname || '';
    const segments = pathname.split('/').filter(Boolean);
    const lastSeg = segments.length ? segments[segments.length - 1] : '';
    if (!pathname.endsWith('/') && lastSeg && !lastSeg.includes('.')) {
      parsed.pathname = pathname + '/';
    }
    const baseDir = new URL('.', parsed.toString()).toString();
    return new URL(relativePath, baseDir).toString();
  } catch (e) {
    // Fallback for non-standard environments
    if (typeof base === 'string') {
      if (base.endsWith('/')) return base + relativePath;
      return base + '/' + relativePath;
    }
    return relativePath;
  }
}

export function resolveAsset(relativePath: string): string {
  // alias for clearer intent in callers
  return resolveUrl(relativePath);
}
