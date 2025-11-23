# Testing

This project uses Vitest for unit and integration tests.

Quick commands

```bash
pnpm install
pnpm run test:run    # Run all tests once
pnpm run test        # Run vitest in watch mode
pnpm run test:coverage  # Run tests with coverage
```

Notes

- The test environment is `happy-dom` (configured in `vitest.config.ts`) to provide browser-like globals such as `window`, `localStorage`, and `crypto`.
- The test setup (`src/test/setup.ts`) contains important global mocks for Phaser and configuration. If tests fail due to missing browser features (e.g. `crypto`), ensure the environment provides them (happy-dom does).
- Coverage reports are output to the `coverage/` directory when running `pnpm run test:coverage`.

Troubleshooting

- If tests fail due to environment issues on CI, ensure the workflow installs dependencies (`pnpm install`) and runs with Node versions defined in `.github/workflows/build.yml`.
- If you change global mocks in `src/test/setup.ts`, update affected tests accordingly.
