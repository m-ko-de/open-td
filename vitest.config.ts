import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
        'src/server/index.ts', // Entry point
        'capacitor.config.ts',
        'vite.config.ts',
      ],
    },
    testTimeout: 10000,
  },
});
