import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';

function extractPlaceholders(value: string): string[] {
  const regex = /{{\s*([^}\s]+)\s*}}/g;
  const res: string[] = [];
  let m;
  while ((m = regex.exec(value)) !== null) {
    res.push(m[1]);
  }
  return res.sort();
}

describe('i18n locales consistency', () => {
  const localesDir = path.join(__dirname, '..', 'locales');
  const files = readdirSync(localesDir).filter((f) => f.endsWith('.json'));
  const locales = files.map((f) => ({
    code: path.basename(f, '.json'),
    data: JSON.parse(readFileSync(path.join(localesDir, f), 'utf-8')) as Record<string, string>,
  }));

  it('all locales should contain the same set of keys', () => {
    const base = locales[0].data;
    const baseKeys = Object.keys(base).sort();
    for (const loc of locales.slice(1)) {
      const keys = Object.keys(loc.data).sort();
      expect(keys).toEqual(baseKeys);
    }
  });

  it('placeholders should match across locales per key', () => {
    const base = locales[0].data;
    for (const key of Object.keys(base)) {
      const basePlaceholders = extractPlaceholders(base[key]);
      for (const loc of locales.slice(1)) {
        const ph = extractPlaceholders(loc.data[key]);
        if (JSON.stringify(ph) !== JSON.stringify(basePlaceholders)) {
          throw new Error(`Placeholders mismatch for key ${key} in ${loc.code}. base: ${JSON.stringify(basePlaceholders)} got: ${JSON.stringify(ph)}`);
        }
        expect(ph).toEqual(basePlaceholders);
      }
    }
  });
});
