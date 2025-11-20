# Multiplayer

Client-seitige Synchronisations-Layer zwischen Phaser Game Scenes und dem Server.

## Übersicht

Der Multiplayer-Ordner enthält Klassen, die automatisch Spiel-Entitäten zwischen Client und Server synchronisieren. Diese Klassen fungieren als "Glue Code" zwischen dem [`NetworkManager`](../network/README.md) und den Phaser Game Scenes.

## Architektur

```
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

Zentrale Koordinationsklasse, die alle Sync-Module verwaltet.

### Verwendung

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

### Verantwortlichkeiten

- Initialisiert alle Sync-Module
- Koordiniert Event-Handler
- Managed Cleanup beim Verlassen der Scene
- Verbindet Game Objects mit Netzwerk-Events

## TowerSync (`TowerSync.ts`)

Synchronisiert Tower-Platzierung, Upgrades und Verkäufe.

### Features

- **Platzierung**: Lokale Tower-Erstellung → Server-Validierung → Broadcast an alle Spieler
- **Upgrades**: Tower-Level-Erhöhung synchronisieren
- **Verkauf**: Tower entfernen und Gold zurückgeben
- **Remote Towers**: Türme von anderen Spielern anzeigen

### Server Events

- `towerPlaced` - Neuer Tower wurde platziert
- `towerUpgraded` - Tower wurde upgraded
- `towerSold` - Tower wurde verkauft

## EnemySync (`EnemySync.ts`)

Synchronisiert Gegner-Spawning, Bewegung und Tod.

### Features

- **Spawning**: Server kontrolliert wann und welche Gegner spawnen
- **Position**: Gegner-Positionen werden regelmäßig synchronisiert
- **Health**: Schadens-Events vom Server empfangen
- **Tod**: Gegner-Entfernung synchronisieren

### Server Events

- `enemySpawned` - Neuer Gegner gespawnt
- `enemyUpdate` - Gegner-Position/Health Update
- `enemyKilled` - Gegner wurde getötet

## WaveSync (`WaveSync.ts`)

Synchronisiert Wellen-Fortschritt zwischen Spielern.

### Features

- **Wave Start**: Host startet Welle, alle Clients synchronisieren
- **Wave Status**: Aktueller Wellen-Stand und verbleibende Gegner
- **Wave Complete**: Wellen-Abschluss und Belohnungen
- **Auto-Start**: Automatischer Wellen-Start im Multiplayer (optional)

### Server Events

- `waveStarted` - Neue Welle gestartet
- `waveUpdate` - Wellen-Status aktualisiert
- `waveComplete` - Welle abgeschlossen

## GameStateSync (`GameStateSync.ts`)

Synchronisiert globalen Spielzustand (Ressourcen, Leben, Game Over).

### Features

- **Ressourcen**: Gold und Leben zwischen Spielern synchronisieren
- **Resource Sharing**: Unterstützt shared/individual Modi
- **Game Over**: Spiel-Ende-Bedingungen synchronisieren
- **Full State Updates**: Periodische vollständige Zustandssynchronisation

### Server Events

- `gameStateUpdate` - Vollständiger State-Update
- `resourceUpdate` - Gold/Leben Update
- `gameOver` - Spiel beendet

## Resource Sharing Modi

Der Server kann Ressourcen auf zwei Arten verwalten:

### Shared Mode (Standard)
```typescript
multiplayer: {
  resourceSharing: {
    gold: 'shared',
    lives: 'shared'
  }
}
```
- Alle Spieler teilen Gold und Leben
- Tower-Kosten werden vom gemeinsamen Pool abgezogen
- Gegner-Tod gibt allen Spielern Gold

### Individual Mode
```typescript
multiplayer: {
  resourceSharing: {
    gold: 'individual',
    lives: 'individual'
  }
}
```
- Jeder Spieler hat eigene Ressourcen
- Nur der Spieler, der den Tower platziert, zahlt
- Nur der Spieler, dessen Tower tötet, bekommt Gold

## Event-Flow Beispiel: Tower platzieren

```
1. Spieler A klickt auf Map
2. GameScene → TowerSync.placeTower(x, y)
3. TowerSync → NetworkManager.placeTower(x, y)
4. NetworkManager → [Socket.io] → Server
5. Server validiert Position und Kosten
6. Server → [Socket.io] → Alle Clients
7. Alle Clients empfangen 'towerPlaced'
8. TowerSync erstellt Tower-Sprite in allen Clients
```

## Konfliktauflösung

Der Server ist **authoritative** - Client-Requests können abgelehnt werden:

- ❌ Nicht genug Gold → Tower wird nicht platziert
- ❌ Invalid Position → Tower wird nicht platziert
- ❌ Spieler ist nicht im Raum → Aktion wird ignoriert

Clients müssen auf Server-Bestätigung warten bevor sie Änderungen anzeigen.

## Performance

### Optimierungen

- **Debouncing**: Position-Updates werden gedrosselt (max. 10 pro Sekunde)
- **Delta Compression**: Nur Änderungen werden gesendet
- **Event Batching**: Multiple Updates werden zusammengefasst
- **Interpolation**: Smooth Bewegung zwischen Updates

### Netzwerk-Traffic

Typischer Traffic für 2 Spieler:
- Idle: ~1 KB/s (Heartbeat)
- Aktive Welle: ~5-10 KB/s (Position Updates)
- Tower-Aktionen: ~0.5 KB pro Aktion

## Testing

Die Multiplayer-Sync-Klassen werden **nicht direkt getestet**. Stattdessen:

- ✅ Server-Logik getestet: `GameServer.integration.test.ts`
- ✅ Network-Layer getestet: `NetworkManager.test.ts`
- ✅ Server Game State getestet: `ServerGameState.test.ts`

**Grund**: Sync-Klassen sind Glue Code zwischen getesteten Komponenten.

## Debugging

### Console Logs aktivieren

Sync-Klassen loggen wichtige Events:

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

### Netzwerk-Monitor

Browser DevTools → Network → WS (WebSocket):
- Ausgehende Events (Client → Server)
- Eingehende Events (Server → Client)
- Event-Timing und -Größe

## Best Practices

1. **Coordinator Pattern**: Immer `MultiplayerCoordinator` verwenden, nicht einzelne Sync-Klassen
2. **Cleanup**: `coordinator.cleanup()` in `shutdown()` aufrufen
3. **Server Authority**: Nie lokale State-Änderungen ohne Server-Bestätigung
4. **Error Handling**: Server-Errors können zu Desyncs führen → Full State Sync anfragen
5. **Scene Lifecycle**: Sync nur in aktiven Scenes, nicht in Pause oder Menu

## Siehe auch

- [NetworkManager](../network/README.md) - Netzwerk-Abstraktion
- [GameServer](../server/README.md) - Server-seitige Logik
- [Game Manager](../game/README.md) - Client-seitige Spiel-Logik
