# Game

Client-seitige Spiellogik und UI-Komponenten für Open TD.

## Übersicht

Der Game-Ordner enthält alle Manager-Klassen und UI-Komponenten, die die Kern-Gameplay-Mechaniken auf der Client-Seite implementieren. Diese Klassen sind eng mit Phaser integriert und verwalten Entities, Ressourcen, Wellen und Benutzeroberfläche.

## Manager-Klassen

### TowerManager (`TowerManager.ts`)

Verwaltet Tower-Platzierung, Upgrades und Kampflogik.

**Verantwortlichkeiten**:
- Tower-Sprites erstellen und positionieren
- Tower-Upgrade-System (Level, Damage, Range, Fire Rate)
- Targeting-System (nächster Gegner in Reichweite)
- Schuss-Logik und Projektile
- Tower-Verkauf und Rückerstattung

**Verwendung**:
```typescript
towerManager.placeTower('basic', 100, 200);
towerManager.upgradeTower(tower);
towerManager.sellTower(tower);
```

**Tower-Typen**:
- `basic` - Ausgeglichen (50 Gold)
- `fast` - Hohe Fire Rate (75 Gold)
- `strong` - Hoher Schaden (100 Gold)

### WaveManager (`WaveManager.ts`)

Kontrolliert Gegner-Wellen und Spawning.

**Verantwortlichkeiten**:
- Wellen-Konfiguration (Anzahl, Typ, Health, Speed)
- Gegner-Spawning mit Delays
- Wave-Progression (zunehmende Schwierigkeit)
- Path-Following für Gegner
- Wave-Complete-Detection

**Verwendung**:
```typescript
waveManager.startWave();
waveManager.isWaveActive(); // true/false
```

**Wellen-Skalierung**:
```typescript
// Jede Welle:
enemyCount = 5 + (waveNumber * 2)
enemyHealth = 100 + (waveNumber * 20)
enemySpeed = 50 + (waveNumber * 5)
goldReward = 10 + (waveNumber * 5)
```

### LevelManager (`LevelManager.ts`)

Verwaltet Level-Daten, Pfade und Map-Konfiguration.

**Verantwortlichkeiten**:
- Level-Definitionen laden
- Pfad-Koordinaten bereitstellen
- Map-Bounds definieren
- Spawn- und End-Punkte verwalten
- Platzierungs-Validierung (Kollision mit Pfad)

**Level-Struktur**:
```typescript
{
  id: 1,
  name: "Grasslands",
  path: [{ x: 0, y: 300 }, { x: 800, y: 300 }],
  mapBounds: { width: 800, height: 600 },
  spawnPoint: { x: 0, y: 300 },
  endPoint: { x: 800, y: 300 }
}
```

### ResearchManager (`ResearchManager.ts`)

Implementiert Forschungs-/Upgrade-System.

**Verantwortlichkeiten**:
- Forschungs-Baum verwalten
- Freischalten von Upgrades
- Kosten-Validierung
- Permanente Buffs anwenden

**Research-Typen**:
```typescript
interface Research {
  id: string;
  name: string;
  description: string;
  cost: number;
  unlocked: boolean;
}
```

**Beispiel-Researches**:
- `damage_boost` - +10% Schaden für alle Türme
- `fire_rate_boost` - +15% Feuerrate
- `range_boost` - +20% Reichweite

### GameUI (`GameUI.ts`)

Koordiniert alle UI-Komponenten und HUD-Elemente.

**Verantwortlichkeiten**:
- UI-Container erstellen und positionieren
- UI-Komponenten initialisieren
- UI-Updates koordinieren
- Event-Handling zwischen UI und Game-Logic

**Sub-Komponenten**:
- `StatsDisplay` - Ressourcen, Welle, Leben
- `TowerButtonPanel` - Tower-Auswahl
- `TowerActionButtons` - Upgrade/Verkauf
- `ControlButtons` - Pause, Menu, Sound
- `ResearchButton` & `ResearchOverlay` - Forschungsmenü

## UI-Komponenten (`ui/`)

### StatsDisplay (`ui/StatsDisplay.ts`)

Zeigt Spiel-Statistiken im HUD.

**Anzeige**:
- 💰 Gold
- ❤️ Leben
- 🌊 Aktuelle Welle
- 👥 Spieler-Namen (Multiplayer)

### TowerButtonPanel (`ui/TowerButtonPanel.ts`)

Tower-Auswahl-Leiste am unteren Bildschirmrand.

**Features**:
- Tower-Typ-Buttons mit Icons
- Kosten-Anzeige
- Hover-Tooltips
- Selection-Highlighting
- Mobile-Touch-Support

### TowerActionButtons (`ui/TowerActionButtons.ts`)

Upgrade- und Verkauf-Buttons für selektierte Türme.

**Features**:
- Erscheint bei Tower-Selektion
- Zeigt Upgrade-Kosten und neue Stats
- Verkaufs-Wert berechnen (70% Rückerstattung)
- Max-Level-Anzeige

### ControlButtons (`ui/ControlButtons.ts`)

Spiel-Kontroll-Buttons (Pause, Menu, etc.).

**Buttons**:
- ⏸️ Pause - Spiel pausieren/fortsetzen
- 🏠 Menu - Zum Hauptmenü
- 🔊 Sound - Ton an/aus
- ⚙️ Settings - Einstellungen öffnen

### ResearchButton & ResearchOverlay

**ResearchButton** (`ui/ResearchButton.ts`):
- Öffnet Forschungsmenü
- Badge für verfügbare Researches
- Animationen für neue Upgrades

**ResearchOverlay** (`ui/ResearchOverlay.ts`):
- Modal-Overlay für Forschungs-Baum
- Grid-Layout der Researches
- Unlock-Buttons mit Kosten
- Abhängigkeiten visualisieren

## Integration mit Multiplayer

Die Game-Manager sind **nicht direkt** mit dem Netzwerk verbunden. Stattdessen:

```
NetworkManager ──> MultiplayerCoordinator ──> TowerSync
                                          └──> WaveSync
                                          └──> EnemySync

TowerSync ──> TowerManager (lokale Visualisierung)
WaveSync ──> WaveManager (lokale Visualisierung)
```

**Wichtig**: Im Multiplayer ist der Server authoritative. Manager führen nur Server-bestätigte Aktionen aus.

## Event-Flow Beispiel: Tower platzieren

### Single Player
```
1. Spieler klickt → GameScene.handleClick()
2. GameScene → TowerManager.placeTower()
3. TowerManager erstellt Tower-Sprite
4. TowerManager zieht Gold ab
```

### Multiplayer
```
1. Spieler klickt → GameScene.handleClick()
2. GameScene → NetworkManager.placeTower()
3. NetworkManager → Server
4. Server validiert und broadcastet
5. TowerSync empfängt 'towerPlaced'
6. TowerSync → TowerManager.createTowerSprite()
```

## Performance-Optimierungen

### Object Pooling
```typescript
// Projektile werden recycled, nicht ständig neu erstellt
projectilePool.get();
projectilePool.release(projectile);
```

### Update-Optimierung
```typescript
// Nur sichtbare Entities updaten
if (enemy.visible && Phaser.Geom.Intersects.RectangleToRectangle(
  enemy.getBounds(),
  this.cameras.main.worldView
)) {
  enemy.update();
}
```

### Batch-Rendering
```typescript
// Sprites in Layern gruppieren
this.add.layer([tower1, tower2, tower3]);
```

## Mobile-Optimierungen

- **Touch-Controls**: Alle Buttons sind touch-friendly (min. 44x44px)
- **Responsive UI**: UI skaliert basierend auf Bildschirmgröße
- **Performance**: Reduzierte Partikel-Effekte auf mobilen Geräten
- **Battery**: Frame-Rate-Limiting bei Inaktivität

## Testing

Game-Manager werden **nicht direkt getestet**, weil:
- ❌ Zu eng mit Phaser gekoppelt (Scene, GameObjects, Physics)
- ❌ Primär Visualisierungs-Code, keine Business-Logik
- ❌ Logik ist bereits server-seitig getestet

**Alternative**: Manuelle QA und Playtesting.

## Debugging

### Phaser Debug-Modus

```typescript
// In main.ts
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  physics: {
    default: 'arcade',
    arcade: { debug: true } // Zeigt Hitboxen, Velocities
  }
};
```

### Tower-Range visualisieren

```typescript
// In TowerManager
const debugGraphics = this.scene.add.graphics();
debugGraphics.lineStyle(2, 0x00ff00, 0.3);
debugGraphics.strokeCircle(tower.x, tower.y, tower.range);
```

### Performance-Monitoring

```typescript
// FPS anzeigen
this.add.text(10, 10, '', { color: '#0f0' })
  .setScrollFactor(0)
  .setDepth(1000);

this.events.on('preupdate', () => {
  text.setText(`FPS: ${this.game.loop.actualFps.toFixed(2)}`);
});
```

## Best Practices

1. **Separation of Concerns**: Manager verwalten nur ihre Domäne (Towers, Waves, etc.)
2. **Scene Lifecycle**: Resources in `create()` initialisieren, in `shutdown()` aufräumen
3. **Input Handling**: Zentralisiert in GameScene, nicht in einzelnen Managern
4. **UI Updates**: Durch Events triggern, nicht durch Polling
5. **Memory Management**: Sprites `destroy()` wenn nicht mehr benötigt

## Siehe auch

- [Multiplayer Sync](../multiplayer/README.md) - Netzwerk-Integration
- [NetworkManager](../network/README.md) - Client-Server-Kommunikation
- [GameServer](../server/README.md) - Server-seitige Logik
- [Phaser 3 Dokumentation](https://photonstorm.github.io/phaser3-docs/) - Phaser API
