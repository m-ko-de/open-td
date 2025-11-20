# Server Tests

This directory contains unit and integration tests for the Open TD multiplayer server.

## Test Framework

We use **Vitest** as our test framework because:
- ✅ Native ESM support
- ✅ TypeScript out-of-the-box
- ✅ Fast execution (Vite-powered)
- ✅ Jest-compatible API
- ✅ Great for Socket.io testing

## Running Tests

```bash
# Run tests in watch mode (default)
pnpm test

# Run tests once
pnpm test:run

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage
```

## Test Structure

### Unit Tests

**PlayerSession.test.ts**
- Player initialization
- Ready status management
- Player data serialization

**ServerGameState.test.ts**
- Game state initialization
- Tower placement, upgrade, and selling
- Resource management (gold, XP, lives)
- Wave management
- Enemy spawning and death

**wordLists.test.ts**
- Room code generation
- Code format validation
- Uniqueness testing

### Integration Tests

**GameServer.integration.test.ts**
- Socket.io client connections
- Room creation and joining
- Player ready status synchronization
- Real-time multiplayer flow

## Test Coverage

Run `pnpm test:coverage` to generate a coverage report. The report will be available in:
- Terminal: Text summary
- HTML: `coverage/index.html`

Coverage excludes:
- `node_modules/`
- `dist/`
- Test files themselves
- Entry points (`index.ts`)
- Config files

## Writing New Tests

Example test structure:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('MyFeature', () => {
  beforeEach(() => {
    // Setup before each test
  });

  describe('specific functionality', () => {
    it('should do something', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = myFunction(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

## CI/CD Integration

Tests run automatically on:
- Every push to `main` or `develop`
- Every pull request

The CI pipeline:
1. Installs dependencies
2. Runs TypeScript type checking
3. Runs all tests
4. Generates coverage report
5. Builds the project

## Debugging Tests

To debug tests in VS Code:
1. Set breakpoints in your test files
2. Run the test in debug mode via the Test Explorer
3. Or add a `debugger` statement and run `pnpm test`

## Best Practices

1. **Isolation**: Each test should be independent
2. **AAA Pattern**: Arrange, Act, Assert
3. **Descriptive Names**: Use clear, descriptive test names
4. **Mock External Dependencies**: Don't rely on external services
5. **Fast Execution**: Keep tests fast (< 1s per test)
6. **Clean Up**: Always clean up resources (sockets, timers, etc.)

## Socket.io Testing Tips

```typescript
// Always disconnect after tests
afterEach(() => {
  if (clientSocket?.connected) {
    clientSocket.disconnect();
  }
});

// Use unique ports for parallel tests
const port = 3000 + Math.floor(Math.random() * 1000);

// Wait for async operations
await new Promise(resolve => setTimeout(resolve, 100));
```
