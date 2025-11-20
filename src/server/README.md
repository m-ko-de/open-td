# Server

Server-side multiplayer logic for Open TD based on Socket.io.

## Overview

The server manages multiplayer rooms, synchronizes game state between multiple players, and executes authoritative game logic to prevent cheating.

## Main Components

### GameServer (`GameServer.ts`)

Central Socket.io server that manages all multiplayer connections.

**Main Functions**:

- Room management (create, join, leave)
- Player authentication and session management
- Event routing between clients
- Game synchronization (towers, enemies, waves)

**Important Events**:

- `createRoom` - Create new multiplayer room
- `joinRoom` - Join existing room
- `setReady` - Signal readiness
- `startGame` - Start game (host only)
- `placeTower`, `upgradeTower`, `sellTower` - Tower actions
- `startWave` - Start next wave

### PlayerSession (`PlayerSession.ts`)

Manages data and status of a single player.

**Properties**:

- `id` - Unique socket ID
- `name` - Player name
- `isReady` - Readiness status
- `isHost` - Host status in room

### ServerGameState (`ServerGameState.ts`)

Authoritative game state management on server side.

**Responsibilities**:

- Manage game resources (gold, lives)
- Validate and manage tower placement
- Enemy spawning and movement
- Wave progression coordination
- Collision and damage calculation
- Multiplayer resource sharing (shared/individual)

**Configuration**:

```typescript
{
  initialGold: number,
  initialLives: number,
  mapBounds: { width, height },
  path: { x, y }[],
  multiplayer: {
    resourceSharing: {
      gold: 'shared' | 'individual',
      lives: 'shared' | 'individual'
    }
  }
}
```

### Types (`types.ts`)

TypeScript types for server-client communication.

**Important Interfaces**:

- `PlayerData` - Player information
- `RoomData` - Room status and player list
- `TowerData` - Tower properties
- `EnemyData` - Enemy status
- `GameStateData` - Complete game state
- `ServerToClientEvents` - Events from server to clients
- `ClientToServerEvents` - Events from clients to server

### Word Lists (`wordLists.ts`)

Generation of readable room codes in `word-word` format.

**Function**:

```typescript
generateWordRoomCode(): string
// Example: "cat-tree", "house-moon"
```

## Architecture

```adr
Client 1 ──┐
           │
Client 2 ──┼──> GameServer ──> ServerGameState
           │                     ↓
Client N ──┘                   Validation
                               Collision
                               Resources
```

### Flow: Create Room and Start Game

1. Client sends `createRoom` with player name
2. Server creates new room with unique code
3. Server sends `roomCreated` back to client
4. Other players can join with `joinRoom`
5. All players set `setReady` to true
6. Host sends `startGame`
7. Server initializes `ServerGameState`
8. Server sends `gameStarted` to all clients
9. Game loop begins, events are synchronized

## Tests

See [**tests**/README.md](./__tests__/README.md) for detailed information about server tests.

**Test Coverage**:

- Unit Tests: `PlayerSession`, `ServerGameState`, `wordLists`
- Integration Tests: Socket.io connections, room management, game synchronization

## Usage

### Start Server

```bash
pnpm run server
```

The server runs on port 3001 by default.

### Environment Variables

```bash
PORT=3001  # Server port (optional, default: 3001)
```

## Socket.io Events Reference

### Client → Server

| Event | Parameters | Description |
|-------|-----------|-------------|
| `createRoom` | `{ playerName }` | Create new room |
| `joinRoom` | `{ roomCode, playerName }` | Join room |
| `leaveRoom` | - | Leave room |
| `setReady` | `{ ready }` | Set readiness |
| `startGame` | - | Start game (host) |
| `placeTower` | `{ type, x, y }` | Place tower |
| `upgradeTower` | `{ towerId }` | Upgrade tower |
| `sellTower` | `{ towerId }` | Sell tower |
| `startWave` | - | Start wave |

### Server → Client

| Event | Parameters | Description |
|-------|-----------|-------------|
| `roomCreated` | `{ code, isHost }` | Room successfully created |
| `roomJoined` | `{ code, isHost }` | Room successfully joined |
| `roomUpdate` | `RoomData` | Room status updated |
| `playerJoined` | `PlayerData` | New player in room |
| `playerLeft` | `{ playerId }` | Player left room |
| `gameStarted` | `GameStateData` | Game was started |
| `gameStateUpdate` | `GameStateData` | Game state updated |
| `towerPlaced` | `TowerData` | Tower was placed |
| `error` | `{ message }` | Error occurred |

## Best Practices

1. **Validation First**: Always validate client actions on server side
2. **Authoritative State**: Server always has the "truth" about game state
3. **Resource Sharing**: Multiplayer configuration determines if resources are shared
4. **Error Handling**: Always send errors back to clients for better UX
5. **Room Cleanup**: Automatically clean up empty rooms

## See Also

- [Tests README](./__tests__/README.md) - Test documentation
- [NetworkManager](../network/README.md) - Client-side network interface
- [Multiplayer Sync](../multiplayer/README.md) - Client-server synchronization
