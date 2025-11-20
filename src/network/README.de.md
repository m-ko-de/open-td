# Network

Client-seitige Netzwerk-Abstraktion für Socket.io-Kommunikation.

## Übersicht

Der Network-Layer bietet eine typsichere, event-basierte API für die Kommunikation zwischen Client und Server. Der `NetworkManager` ist ein Singleton, der die Socket.io-Verbindung kapselt und eine einfache Schnittstelle für Multiplayer-Funktionen bereitstellt.

## NetworkManager (`NetworkManager.ts`)

### Singleton Pattern

Der `NetworkManager` folgt dem Singleton-Pattern - es gibt nur eine Instanz pro Client.

```typescript
const network = NetworkManager.getInstance();
```

### Verbindung

**Verbindung aufbauen**:

```typescript
await network.connect('http://localhost:3001');
```

**Verbindungsstatus prüfen**:

```typescript
if (network.isConnected()) {
  // Socket ist verbunden
}
```

**Verbindung trennen**:

```typescript
network.disconnect();
```

### Event System

**Event-Handler registrieren**:

```typescript
network.on('roomUpdate', (data) => {
  console.log('Room updated:', data);
});

network.on('gameStateUpdate', (state) => {
  // Spielzustand aktualisieren
});
```

**Event-Handler entfernen**:

```typescript
network.off('roomUpdate', handler);
```

**Events manuell auslösen**:

```typescript
network.trigger('customEvent', data);
```

### Raum-Verwaltung

**Raum erstellen**:

```typescript
const result = await network.createRoom('MeinName');
if (result.success) {
  console.log('Raum-Code:', result.code);
}
```

**Raum beitreten**:

```typescript
const result = await network.joinRoom('katze-baum', 'MeinName');
if (result.success) {
  console.log('Erfolgreich beigetreten');
}
```

**Raum verlassen**:

```typescript
network.leaveRoom();
```

**Bereitschaft setzen**:

```typescript
network.setReady(true);
```

**Spiel starten** (nur Host):

```typescript
const result = await network.startGame();
if (result.success) {
  console.log('Spiel gestartet');
}
```

### Spiel-Aktionen

**Turm platzieren**:

```typescript
network.placeTower('basic', 100, 200);
```

**Turm upgraden**:

```typescript
network.upgradeTower('tower-123');
```

**Turm verkaufen**:

```typescript
network.sellTower('tower-123');
```

**Welle starten**:

```typescript
network.startWave();
```

**Forschung freischalten**:

```typescript
network.unlockResearch('fast-fire');
```

### Getter-Methoden

```typescript
// Aktuellen Raum-Code abrufen
const roomCode = network.getCurrentRoom(); // z.B. "katze-baum"

// Host-Status prüfen
const isHost = network.getIsHost(); // true/false
```

## Verwendung in Phaser Scenes

### Beispiel: MainMenuScene

```typescript
export class MainMenuScene extends Phaser.Scene {
  private network: NetworkManager;

  create() {
    this.network = NetworkManager.getInstance();
    
    // Verbinden
    await this.network.connect('http://localhost:3001');
    
    // Raum erstellen Button
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

### Beispiel: GameScene mit Multiplayer

```typescript
export class GameScene extends Phaser.Scene {
  private network: NetworkManager;

  create() {
    this.network = NetworkManager.getInstance();
    
    // Events registrieren
    this.network.on('gameStateUpdate', (state) => {
      this.updateGameState(state);
    });
    
    this.network.on('towerPlaced', (tower) => {
      this.createTowerSprite(tower);
    });
    
    // Tower platzieren
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

## Fehlerbehandlung

Der NetworkManager behandelt Fehler graceful und gibt Feedback:

```typescript
// Aktion ohne Verbindung
network.placeTower('basic', 100, 200);
// Konsole: ❌ Cannot place tower: socket not connected

// Raum beitreten Fehler
const result = await network.joinRoom('invalid', 'Player');
if (!result.success) {
  console.error(result.error); // z.B. "Room not found"
}
```

## Logging

Der NetworkManager logged wichtige Events:

- ✅ `Connected to game server`
- 📤 `Sending tower placement: type=basic, x=100, y=200`
- 🚪 `Leaving room: katze-baum`
- ❌ `Cannot place tower: socket not connected`

## Architektur

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

Der NetworkManager ist vollständig getestet mit 26 Tests.

Siehe [**tests**/NetworkManager.test.ts](./__tests__/NetworkManager.test.ts).

**Test-Abdeckung**:

- Singleton Pattern
- Connection Management
- Event System (on/off/trigger)
- Room Management (create/join/leave/ready/start)
- Game Actions (towers, waves, research)
- Disconnect Cleanup
- Error Handling
- Getters

## Best Practices

1. **Singleton verwenden**: Immer `getInstance()` verwenden, nie `new NetworkManager()`
2. **Event Cleanup**: Events in `shutdown()` oder `destroy()` entfernen
3. **Connection Check**: `isConnected()` prüfen vor kritischen Aktionen
4. **Error Handling**: Immer `success` in Callbacks prüfen
5. **Async/Await**: Room-Operationen sind async, immer mit `await` verwenden

## Siehe auch

- [GameServer](../server/README.md) - Server-seitige Implementierung
- [Multiplayer Sync](../multiplayer/README.md) - Automatische Synchronisation
- [Server Types](../server/types.ts) - Event-Definitionen
