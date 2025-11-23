# Open TD - Tower Defense Game

[![Build and Test](https://github.com/m-ko-de/open-td/actions/workflows/build.yml/badge.svg)](https://github.com/m-ko-de/open-td/actions/workflows/build.yml)

An open-source Tower Defense game built with Phaser 3 and Capacitor for web and mobile platforms.

## 📚 Documentation

- **[Server](src/server/README.md)** - Multiplayer server with Socket.io, GameServer, ServerGameState
- **[Network](src/network/README.md)** - NetworkManager singleton for client-server communication
- **[Multiplayer](src/multiplayer/README.md)** - Sync layer between client and server
- **[Game](src/game/README.md)** - Game managers (Tower, Wave, Level, Research) and UI components
- **[Tests](src/server/__tests__/README.md)** - Test documentation and testing strategy

## 🎮 Features

- **Tower Defense Gameplay**: Strategically place towers to defend against enemy waves
- **Multiple Tower Types**:
  - Basic Tower: Balanced stats (50 Gold)
  - Fast Tower: High fire rate (75 Gold)
  - Strong Tower: High damage (100 Gold)
- **Progressive Difficulty**: Enemies become stronger with each wave
- **Mobile-Ready**: Optimized for touch controls on smartphones and tablets
- **Cross-Platform**: Runs in browser and as native app on iOS/Android

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- pnpm (fast package manager)
- For mobile development: Xcode (iOS) or Android Studio (Android)

### Installation

1. Install pnpm (if not already installed):

      ```bash
      npm install -g pnpm
      ```

2. Clone repository and install dependencies:

      ```bash
      pnpm install
      ```

3. Start development server:

      ```bash
      pnpm dev
      ```

The game will automatically open in your browser at `http://localhost:3000`.

### Production Build

```bash
pnpm build
```

Build output will be in the `dist/` directory.

## 📱 Mobile Deployment

### Initialize Capacitor

```bash
pnpm cap:init
```

### iOS Build

```bash
# Add iOS platform
pnpm cap:add:ios

# Create build and sync
pnpm build:mobile

# Open Xcode
pnpm cap:open:ios
```

### Android Build

```bash
# Add Android platform
pnpm cap:add:android

# Create build and sync
pnpm build:mobile

# Open Android Studio
pnpm cap:open:android
```

## 🎯 How to Play

1. **Place Towers**: Select a tower type from the bottom bar and click on an empty spot
2. **Earn Gold**: Destroy enemies to earn gold
3. **Think Strategically**: Place towers where they can shoot enemies for as long as possible
4. **Survive**: Protect your endpoint - if too many enemies get through, the game is over!

## 🏗️ Project Structure

```text
open-td/
├── src/
│   ├── main.ts              # Phaser Game Configuration
│   ├── scenes/              # Game Scenes
│   │   ├── PreloaderScene.ts  # Asset Loader
│   │   ├── MainMenuScene.ts   # Main Menu
│   │   └── GameScene.ts       # Main Game Scene
│   └── entities/            # Game Entities
│       ├── Tower.ts           # Tower Class
│       ├── Enemy.ts           # Enemy Class
│       └── Projectile.ts      # Projectile Class
├── index.html               # HTML Entry Point
├── capacitor.config.json    # Capacitor Configuration
├── vite.config.ts           # Vite Build Configuration
└── package.json
```

## 🛠️ Technology Stack

- **Game Engine**: [Phaser 3](https://phaser.io/) - HTML5 Game Framework
- **Build Tool**: [Vite](https://vitejs.dev/) - Next Generation Frontend Tooling
- **Language**: TypeScript - Type-Safe JavaScript
- **Mobile**: [Capacitor](https://capacitorjs.com/) - Cross-platform Native Runtime

## 📝 Development

### PNPM Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Create production build
- `pnpm preview` - Preview production build locally
- `pnpm cap:sync` - Sync Capacitor
- `pnpm build:mobile` - Build and sync for mobile

### Why pnpm?

This project uses [pnpm](https://pnpm.io/) as package manager:

- ⚡ **Faster**: Up to 3x faster installation
- 💾 **Space Efficient**: Global shared store reduces disk space
- 🔒 **Secure**: Strict dependency resolution prevents phantom dependencies

### Further Development

The project provides a solid foundation for tower defense development:

- Add new tower types in `src/entities/Tower.ts`
- Create new enemy types in `src/entities/Enemy.ts`
- Extend gameplay in `src/scenes/GameScene.ts`
- Add assets (images, sounds) and load them in `PreloaderScene.ts`

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Feel free to create issues or submit pull requests.
