# Network

Client-side network abstraction for Socket.io communication.

## Overview

The network layer provides a type-safe, event-based API for communication between client and server. The `NetworkManager` is a singleton that encapsulates the Socket.io connection and provides a simple interface for multiplayer features.

## NetworkManager (`NetworkManager.ts`)

### Singleton Pattern

The `NetworkManager` follows the singleton pattern - there is only one instance per client.

```typescript
const network = NetworkManager.getInstance();
```

### Connection

**Establish connection**:

```typescript
await network.connect('http://localhost:3001');
```

**Check connection status**:

```typescript
if (network.isConnected()) {
  // Socket is connected
}
```

**Disconnect**:

```typescript
network.disconnect();
```

### Event System

**Register event handler**:

```typescript
network.on('roomUpdate', (data) => {
  console.log('Room updated:', data);
});

network.on('gameStateUpdate', (state) => {
  // Update game state
});
```

**Remove event handler**:

```typescript
network.off('roomUpdate', handler);
```

**Manually trigger events**:

```typescript
network.trigger('customEvent', data);
```

### Room Management

**Create room**:

```typescript
const result = await network.createRoom('MyName');
if (result.success) {
  console.log('Room code:', result.code);
}
```

**Join room**:

```typescript
const result = await network.joinRoom('cat-tree', 'MyName');
if (result.success) {
  console.log('Successfully joined');
}
```

**Leave room**:

```typescript
network.leaveRoom();
```

**Set readiness**:

```typescript
network.setReady(true);
```

**Start game** (host only):

```typescript
const result = await network.startGame();
if (result.success) {
  console.log('Game started');
}
```

### Game Actions

**Place tower**:

```typescript
network.placeTower('basic', 100, 200);
```

**Upgrade tower**:

```typescript
network.upgradeTower('tower-123');
```

**Sell tower**:

```typescript
network.sellTower('tower-123');
```

**Start wave**:

```typescript
network.startWave();
```

**Unlock research**:

```typescript
network.unlockResearch('fast-fire');
```

### Getter Methods

```typescript
// Get current room code
const roomCode = network.getCurrentRoom(); // e.g. "cat-tree"

// Check host status
const isHost = network.getIsHost(); // true/false
```

## Usage in Phaser Scenes

### Example: MainMenuScene

```typescript
export class MainMenuScene extends Phaser.Scene {
  private network: NetworkManager;

  create() {
    this.network = NetworkManager.getInstance();
    
    // Connect
    await this.network.connect('http://localhost:3001');
    
    // Create room button
    this.add.text(100, 100, 'Create Room')
      .setInteractive()
      .on('pointerdown', async () => {
        const result = await this.network.createRoom('Player1');
        if (result.success) {
          this.scene.start('LobbyScene', { roomCode: result.code });
        }
      });
  }
}
```

### Example: GameScene with Multiplayer

```typescript
export class GameScene extends Phaser.Scene {
  private network: NetworkManager;

  create() {
    this.network = NetworkManager.getInstance();
    
    // Register events
    this.network.on('gameStateUpdate', (state) => {
      this.updateGameState(state);
    });
    
    this.network.on('towerPlaced', (tower) => {
      this.createTowerSprite(tower);
    });
    
    // Place tower
    this.input.on('pointerdown', (pointer) => {
      this.network.placeTower('basic', pointer.x, pointer.y);
    });
  }
  
  shutdown() {
    // Cleanup
    this.network.off('gameStateUpdate');
    this.network.off('towerPlaced');
  }
}
```

## Error Handling

The NetworkManager handles errors gracefully and provides feedback:

```typescript
// Action without connection
network.placeTower('basic', 100, 200);
// Console: ❌ Cannot place tower: socket not connected

// Join room error
const result = await network.joinRoom('invalid', 'Player');
if (!result.success) {
  console.error(result.error); // e.g. "Room not found"
}
```

## Logging

The NetworkManager logs important events:

- ✅ `Connected to game server`
- 📤 `Sending tower placement: type=basic, x=100, y=200`
- 🚪 `Leaving room: cat-tree`
- ❌ `Cannot place tower: socket not connected`

## Architecture

```adr
Phaser Scene
    ↓
NetworkManager (Singleton)
    ↓
Socket.io Client
    ↓
[Internet]
    ↓
GameServer
```

## Tests

The NetworkManager is fully tested with 26 tests.

See [**tests**/NetworkManager.test.ts](./__tests__/NetworkManager.test.ts).

**Test Coverage**:

- Singleton Pattern
- Connection Management
- Event System (on/off/trigger)
- Room Management (create/join/leave/ready/start)
- Game Actions (towers, waves, research)
- Disconnect Cleanup
- Error Handling
- Getters

## Best Practices

1. **Use Singleton**: Always use `getInstance()`, never `new NetworkManager()`
2. **Event Cleanup**: Remove events in `shutdown()` or `destroy()`
3. **Connection Check**: Check `isConnected()` before critical actions
4. **Error Handling**: Always check `success` in callbacks
5. **Async/Await**: Room operations are async, always use `await`

## See Also

- [GameServer](../server/README.md) - Server-side implementation
- [Multiplayer Sync](../multiplayer/README.md) - Automatic synchronization
- [Server Types](../server/types.ts) - Event definitions
