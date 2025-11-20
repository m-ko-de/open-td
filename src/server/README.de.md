# Server

Server-seitige Multiplayer-Logik für Open TD basierend auf Socket.io.

## Übersicht

Der Server verwaltet Multiplayer-Räume, synchronisiert den Spielzustand zwischen mehreren Spielern und führt autoritative Spiellogik aus, um Cheating zu verhindern.

## Hauptkomponenten

### GameServer (`GameServer.ts`)

Zentraler Socket.io-Server, der alle Multiplayer-Verbindungen verwaltet.

**Hauptfunktionen**:
- Raum-Verwaltung (erstellen, beitreten, verlassen)
- Spieler-Authentifizierung und Session-Management
- Event-Routing zwischen Clients
- Spiel-Synchronisation (Türme, Gegner, Wellen)

**Wichtige Events**:
- `createRoom` - Neuen Multiplayer-Raum erstellen
- `joinRoom` - Bestehendem Raum beitreten
- `setReady` - Bereitschaft signalisieren
- `startGame` - Spiel starten (nur Host)
- `placeTower`, `upgradeTower`, `sellTower` - Tower-Aktionen
- `startWave` - Nächste Welle starten

### PlayerSession (`PlayerSession.ts`)

Verwaltet Daten und Status eines einzelnen Spielers.

**Eigenschaften**:
- `id` - Eindeutige Socket-ID
- `name` - Spielername
- `isReady` - Bereitschaftsstatus
- `isHost` - Host-Status im Raum

### ServerGameState (`ServerGameState.ts`)

Autoritative Spielzustand-Verwaltung auf Server-Seite.

**Verantwortlichkeiten**:
- Spiel-Ressourcen (Gold, Leben) verwalten
- Tower-Platzierung validieren und verwalten
- Gegner-Spawning und -Bewegung
- Wellen-Fortschritt koordinieren
- Kollisions- und Schadens-Berechnung
- Multiplayer-Ressourcenteilung (shared/individual)

**Konfiguration**:
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

TypeScript-Typen für Server-Client-Kommunikation.

**Wichtige Interfaces**:
- `PlayerData` - Spieler-Informationen
- `RoomData` - Raum-Status und Spieler-Liste
- `TowerData` - Tower-Eigenschaften
- `EnemyData` - Gegner-Status
- `GameStateData` - Vollständiger Spiel-Zustand
- `ServerToClientEvents` - Events vom Server an Clients
- `ClientToServerEvents` - Events von Clients an Server

### Word Lists (`wordLists.ts`)

Generierung von lesbaren Raum-Codes im Format `wort-wort`.

**Funktion**:
```typescript
generateWordRoomCode(): string
// Beispiel: "katze-baum", "haus-mond"
```

## Architektur

```
Client 1 ──┐
           │
Client 2 ──┼──> GameServer ──> ServerGameState
           │                     ↓
Client N ──┘                   Validierung
                               Kollision
                               Ressourcen
```

### Ablauf: Raum erstellen und Spiel starten

1. Client sendet `createRoom` mit Spielernamen
2. Server erstellt neuen Raum mit eindeutigem Code
3. Server sendet `roomCreated` an Client zurück
4. Weitere Spieler können mit `joinRoom` beitreten
5. Alle Spieler setzen `setReady` auf true
6. Host sendet `startGame`
7. Server initialisiert `ServerGameState`
8. Server sendet `gameStarted` an alle Clients
9. Spiel-Loop beginnt, Events werden synchronisiert

## Tests

Siehe [__tests__/README.md](./__tests__/README.md) für detaillierte Informationen zu den Server-Tests.

**Test-Abdeckung**:
- Unit-Tests: `PlayerSession`, `ServerGameState`, `wordLists`
- Integration-Tests: Socket.io-Verbindungen, Raum-Management, Spiel-Synchronisation

## Verwendung

### Server starten

```bash
pnpm run server
```

Der Server läuft standardmäßig auf Port 3001.

### Umgebungsvariablen

```bash
PORT=3001  # Server-Port (optional, default: 3001)
```

## Socket.io Events Referenz

### Client → Server

| Event | Parameter | Beschreibung |
|-------|-----------|--------------|
| `createRoom` | `{ playerName }` | Neuen Raum erstellen |
| `joinRoom` | `{ roomCode, playerName }` | Raum beitreten |
| `leaveRoom` | - | Raum verlassen |
| `setReady` | `{ ready }` | Bereitschaft setzen |
| `startGame` | - | Spiel starten (Host) |
| `placeTower` | `{ type, x, y }` | Turm platzieren |
| `upgradeTower` | `{ towerId }` | Turm upgraden |
| `sellTower` | `{ towerId }` | Turm verkaufen |
| `startWave` | - | Welle starten |

### Server → Client

| Event | Parameter | Beschreibung |
|-------|-----------|--------------|
| `roomCreated` | `{ code, isHost }` | Raum erfolgreich erstellt |
| `roomJoined` | `{ code, isHost }` | Raum erfolgreich beigetreten |
| `roomUpdate` | `RoomData` | Raum-Status aktualisiert |
| `playerJoined` | `PlayerData` | Neuer Spieler im Raum |
| `playerLeft` | `{ playerId }` | Spieler hat Raum verlassen |
| `gameStarted` | `GameStateData` | Spiel wurde gestartet |
| `gameStateUpdate` | `GameStateData` | Spielzustand aktualisiert |
| `towerPlaced` | `TowerData` | Turm wurde platziert |
| `error` | `{ message }` | Fehler aufgetreten |

## Best Practices

1. **Validation First**: Alle Client-Aktionen auf Server-Seite validieren
2. **Authoritative State**: Server hat immer die "Wahrheit" über den Spielzustand
3. **Resource Sharing**: Multiplayer-Konfiguration bestimmt, ob Ressourcen geteilt werden
4. **Error Handling**: Immer Fehler an Clients zurücksenden für bessere UX
5. **Room Cleanup**: Leere Räume automatisch aufräumen

## Siehe auch

- [Tests README](./__tests__/README.md) - Test-Dokumentation
- [NetworkManager](../network/README.md) - Client-seitiges Netzwerk-Interface
- [Multiplayer Sync](../multiplayer/README.md) - Client-Server-Synchronisation
