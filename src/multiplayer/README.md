# Multiplayer

Client-side synchronization layer between Phaser game scenes and the server.

## Overview

The multiplayer folder contains classes that automatically synchronize game entities between client and server. These classes act as "glue code" between the [`NetworkManager`](../network/README.md) and Phaser game scenes.

## Architecture

```adr
Phaser Scene
    ↓
MultiplayerCoordinator
    ↓
├── TowerSync ────┐
├── EnemySync ────┤
├── WaveSync ─────┼──> NetworkManager ──> Server
└── GameStateSync ┘
```

## MultiplayerCoordinator (`MultiplayerCoordinator.ts`)

Central coordination class that manages all sync modules.

### Usage

```typescript
export class GameScene extends Phaser.Scene {
  private coordinator: MultiplayerCoordinator;

  create() {
    this.coordinator = new MultiplayerCoordinator(this);
    this.coordinator.initialize();
  }

  shutdown() {
    this.coordinator.cleanup();
  }
}
```

### Responsibilities

- Initialize all sync modules
- Coordinate event handlers
- Manage cleanup when leaving scene
- Connect game objects with network events

## TowerSync (`TowerSync.ts`)

Synchronizes tower placement, upgrades, and sales.

### Tower Features

- **Placement**: Local tower creation → Server validation → Broadcast to all players
- **Upgrades**: Synchronize tower level increases
- **Sales**: Remove tower and refund gold
- **Remote Towers**: Display towers from other players

### Tower Server Events

- `towerPlaced` - New tower was placed
- `towerUpgraded` - Tower was upgraded
- `towerSold` - Tower was sold

## EnemySync (`EnemySync.ts`)

Synchronizes enemy spawning, movement, and death.

### Enemy Features

- **Spawning**: Server controls when and which enemies spawn
- **Position**: Enemy positions are regularly synchronized
- **Health**: Receive damage events from server
- **Death**: Synchronize enemy removal

### Enemy Server Events

- `enemySpawned` - New enemy spawned
- `enemyUpdate` - Enemy position/health update
- `enemyKilled` - Enemy was killed

## WaveSync (`WaveSync.ts`)

Synchronizes wave progress between players.

### Wave Features

- **Wave Start**: Host starts wave, all clients synchronize
- **Wave Status**: Current wave number and remaining enemies
- **Wave Complete**: Wave completion and rewards
- **Auto-Start**: Automatic wave start in multiplayer (optional)

### Wave Server Events

- `waveStarted` - New wave started
- `waveUpdate` - Wave status updated
- `waveComplete` - Wave completed

## GameStateSync (`GameStateSync.ts`)

Synchronizes global game state (resources, lives, game over).

### GameState Features

- **Resources**: Synchronize gold and lives between players
- **Resource Sharing**: Supports shared/individual modes
- **Game Over**: Synchronize game end conditions
- **Full State Updates**: Periodic complete state synchronization

### GameState Server Events

- `gameStateUpdate` - Complete state update
- `resourceUpdate` - Gold/lives update
- `gameOver` - Game ended

## Resource Sharing Modes

The server can manage resources in two ways:

### Shared Mode (Default)

```typescript
multiplayer: {
  resourceSharing: {
    gold: 'shared',
    lives: 'shared'
  }
}
```

- All players share gold and lives
- Tower costs are deducted from shared pool
- Enemy death gives gold to all players

### Individual Mode

```typescript
multiplayer: {
  resourceSharing: {
    gold: 'individual',
    lives: 'individual'
  }
}
```

- Each player has their own resources
- Only the player who places the tower pays
- Only the player whose tower kills gets gold

## Event Flow Example: Place Tower

```adr
1. Player A clicks on map
2. GameScene → TowerSync.placeTower(x, y)
3. TowerSync → NetworkManager.placeTower(x, y)
4. NetworkManager → [Socket.io] → Server
5. Server validates position and costs
6. Server → [Socket.io] → All Clients
7. All clients receive 'towerPlaced'
8. TowerSync creates tower sprite in all clients
```

## Conflict Resolution

The server is **authoritative** - client requests can be rejected:

- ❌ Not enough gold → Tower is not placed
- ❌ Invalid position → Tower is not placed
- ❌ Player is not in room → Action is ignored

Clients must wait for server confirmation before displaying changes.

## Performance

### Optimizations

- **Debouncing**: Position updates are throttled (max. 10 per second)
- **Delta Compression**: Only changes are sent
- **Event Batching**: Multiple updates are combined
- **Interpolation**: Smooth movement between updates

### Network Traffic

Typical traffic for 2 players:

- Idle: ~1 KB/s (Heartbeat)
- Active wave: ~5-10 KB/s (Position updates)
- Tower actions: ~0.5 KB per action

## Testing

The multiplayer sync classes are **not directly tested**. Instead:

- ✅ Server logic tested: `GameServer.integration.test.ts`
- ✅ Network layer tested: `NetworkManager.test.ts`
- ✅ Server game state tested: `ServerGameState.test.ts`

**Reason**: Sync classes are glue code between tested components.

## Debugging

### Console Logs

Sync classes log important events:

```typescript
// TowerSync
console.log('🏰 Tower placed by player:', towerData);

// EnemySync
console.log('👾 Enemy spawned:', enemyData);

// WaveSync
console.log('🌊 Wave started:', waveNumber);

// GameStateSync
console.log('💰 Resources updated:', gold, lives);
```

### Network Monitor

Browser DevTools → Network → WS (WebSocket):

- Outgoing events (Client → Server)
- Incoming events (Server → Client)
- Event timing and size

## Best Practices

1. **Coordinator Pattern**: Always use `MultiplayerCoordinator`, not individual sync classes
2. **Cleanup**: Call `coordinator.cleanup()` in `shutdown()`
3. **Server Authority**: Never make local state changes without server confirmation
4. **Error Handling**: Server errors can lead to desyncs → Request full state sync
5. **Scene Lifecycle**: Sync only in active scenes, not in pause or menu

## See Also

- [NetworkManager](../network/README.md) - Network abstraction
- [GameServer](../server/README.md) - Server-side logic
- [Game Manager](../game/README.md) - Client-side game logic
