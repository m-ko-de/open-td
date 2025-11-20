# Open TD - Tower Defense Game

Ein Open-Source Tower Defense Spiel, entwickelt mit Phaser 3 und Capacitor für Web und Mobile Plattformen.

## 📚 Dokumentation

- **[Server](src/server/README.md)** - Multiplayer-Server mit Socket.io, GameServer, ServerGameState
- **[Network](src/network/README.md)** - NetworkManager Singleton für Client-Server-Kommunikation
- **[Multiplayer](src/multiplayer/README.md)** - Sync-Layer zwischen Client und Server
- **[Game](src/game/README.md)** - Game Manager (Tower, Wave, Level, Research) und UI-Komponenten
- **[Tests](src/server/__tests__/README.md)** - Test-Dokumentation und Testing-Strategie

## 🎮 Features

- **Tower Defense Gameplay**: Platziere strategisch Türme, um Gegnerwellen abzuwehren
- **Verschiedene Turmtypen**:
  - Basis-Turm: Ausgeglichene Werte (50 Gold)
  - Schnell-Turm: Hohe Feuerrate (75 Gold)
  - Stark-Turm: Hoher Schaden (100 Gold)
- **Progressive Schwierigkeit**: Gegner werden mit jeder Welle stärker
- **Mobile-Ready**: Optimiert für Touch-Steuerung auf Smartphones und Tablets
- **Cross-Platform**: Läuft im Browser und als native App auf iOS/Android

## 🚀 Schnellstart

### Voraussetzungen

- Node.js (v18 oder höher)
- pnpm (schneller Package Manager)
- Für mobile Entwicklung: Xcode (iOS) oder Android Studio (Android)

### Installation

1. pnpm installieren (falls noch nicht vorhanden):

      ```bash
      npm install -g pnpm
      ```

2. Repository klonen und Dependencies installieren:

      ```bash
      pnpm install
      ```

3. Entwicklungsserver starten:

      ```bash
      pnpm dev
      ```

Das Spiel öffnet sich automatisch im Browser unter `http://localhost:3000`.

### Build für Produktion

```bash
pnpm build
```

Der Build-Output befindet sich im `dist/` Verzeichnis.

## 📱 Mobile Deployment

### Capacitor initialisieren

```bash
pnpm cap:init
```

### iOS Build

```bash
# iOS Plattform hinzufügen
pnpm cap:add:ios

# Build erstellen und synchronisieren
pnpm build:mobile

# Xcode öffnen
pnpm cap:open:ios
```

### Android Build

```bash
# Android Plattform hinzufügen
pnpm cap:add:android

# Build erstellen und synchronisieren
pnpm build:mobile

# Android Studio öffnen
pnpm cap:open:android
```

## 🎯 Spielanleitung

1. **Türme platzieren**: Wähle einen Turmtyp aus der unteren Leiste und klicke auf eine freie Stelle
2. **Gold verdienen**: Vernichte Gegner, um Gold zu erhalten
3. **Strategisch denken**: Platziere Türme so, dass sie möglichst lange auf Gegner schießen können
4. **Überleben**: Schütze deinen Endpunkt - wenn zu viele Gegner durchkommen, ist das Spiel vorbei!

## 🏗️ Projektstruktur

```text
open-td/
├── src/
│   ├── main.ts              # Phaser Game Configuration
│   ├── scenes/              # Game Szenen
│   │   ├── PreloaderScene.ts  # Asset Loader
│   │   ├── MainMenuScene.ts   # Hauptmenü
│   │   └── GameScene.ts       # Haupt-Spielszene
│   └── entities/            # Spielentitäten
│       ├── Tower.ts           # Turm-Klasse
│       ├── Enemy.ts           # Gegner-Klasse
│       └── Projectile.ts      # Projektil-Klasse
├── index.html               # HTML Entry Point
├── capacitor.config.json    # Capacitor Konfiguration
├── vite.config.ts           # Vite Build Configuration
└── package.json
```

## 🛠️ Technologie-Stack

- **Game Engine**: [Phaser 3](https://phaser.io/) - HTML5 Game Framework
- **Build Tool**: [Vite](https://vitejs.dev/) - Next Generation Frontend Tooling
- **Language**: TypeScript - Type-Safe JavaScript
- **Mobile**: [Capacitor](https://capacitorjs.com/) - Cross-platform Native Runtime

## 📝 Development

### PNPM Scripts

- `pnpm dev` - Entwicklungsserver starten
- `pnpm build` - Production Build erstellen
- `pnpm preview` - Production Build lokal testen
- `pnpm cap:sync` - Capacitor synchronisieren
- `pnpm build:mobile` - Build und Sync für Mobile

### Warum pnpm?

Dieses Projekt nutzt [pnpm](https://pnpm.io/) als Package Manager:

- ⚡ **Schneller**: Bis zu 3x schnellere Installation
- 💾 **Speichereffizient**: Globaler Shared Store reduziert Disk Space
- 🔒 **Sicher**: Strikte Dependency Resolution verhindert Phantom Dependencies

### Weiterentwicklung

Das Projekt bietet eine solide Grundlage für Tower Defense Entwicklung:

- Füge neue Turmtypen in `src/entities/Tower.ts` hinzu
- Erstelle neue Gegnertypen in `src/entities/Enemy.ts`
- Erweitere das Gameplay in `src/scenes/GameScene.ts`
- Füge Assets (Bilder, Sounds) hinzu und lade sie in `PreloaderScene.ts`

## 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE) Datei für Details.

## 🤝 Contributing

Beiträge sind willkommen! Fühl dich frei, Issues zu erstellen oder Pull Requests einzureichen.
