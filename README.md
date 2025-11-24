# Open TD - Tower Defense Game

[![Build](https://github.com/m-ko-de/open-td/actions/workflows/build.yml/badge.svg)](https://github.com/m-ko-de/open-td/actions/workflows/build.yml)
[![Coverage](https://img.shields.io/codecov/c/github/m-ko-de/open-td?logo=codecov)](https://app.codecov.io/gh/m-ko-de/open-td)

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
  - Frost Tower: Slows enemies with frost projectiles (90 Gold)
  - Fire Tower: Deals fire damage over time (110 Gold)
  - Splash Tower: Area damage attacks (130 Gold)
  - Sniper Tower: Long range, high damage (150 Gold)
- **Tower Upgrade System**: Upgrade towers up to level 5 with increasing costs and stats
- **Tower Selling**: Sell towers for 70% refund of total invested gold
- **Progressive Difficulty**: Enemies become stronger with each wave
- **Multiplayer Support**: Play with friends via dedicated game server
- **Mobile-Ready**: Optimized for touch controls on smartphones and tablets
- **Cross-Platform**: Runs in browser and as native app on iOS/Android
- **User Authentication**: Register and login with persistent user accounts

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
2. **Earn Gold**: Destroy enemies to earn gold for more towers
3. **Upgrade Towers**: Click on placed towers to upgrade them (up to level 5) for better stats
4. **Sell Towers**: Right-click towers or use the sell button to get 70% gold refund
5. **Think Strategically**: Place towers where they can shoot enemies for as long as possible
6. **Choose Tower Types**: Each tower type has unique strengths (damage, range, special effects)
7. **Survive**: Protect your endpoint - if too many enemies get through, the game is over!

## 🏗️ Project Structure

```text
open-td/
├── src/
│   ├── auth/              # User authentication system
│   ├── client/            # Client-side persistence
│   ├── components/        # Reusable UI components
│   ├── config/            # Game configuration
│   ├── entities/          # Game entities
│   │   ├── towers/        # Tower classes with upgrade system
│   │   └── enemies/       # Enemy classes
│   ├── game/              # Game managers and UI
│   │   ├── ui/            # UI components (buttons, panels)
│   │   └── managers/      # Game state managers
│   ├── main.ts            # Phaser Game Configuration
│   ├── multiplayer/       # Multiplayer synchronization
│   ├── network/           # Network communication
│   ├── scenes/            # Game Scenes
│   └── server/            # Dedicated game server
├── index.html             # HTML Entry Point
├── capacitor.config.json  # Capacitor Configuration
├── vite.config.ts         # Vite Build Configuration
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

The project provides a solid foundation for tower defense development with advanced features already implemented:

- ✅ **Tower Upgrade System**: Towers can be upgraded up to level 5 with increasing costs and improved stats
- ✅ **Tower Selling**: Sell towers for 70% refund of total invested gold
- ✅ **Multiple Tower Types**: 7 different tower types with unique abilities (Basic, Fast, Strong, Frost, Fire, Splash, Sniper)
- ✅ **Multiplayer Support**: Dedicated game server with Socket.io for real-time multiplayer
- ✅ **User Authentication**: Complete user registration and login system with persistent accounts
- ✅ **Mobile Deployment**: Capacitor support for iOS and Android native apps
- ✅ **Comprehensive Testing**: Unit tests, integration tests, and CI/CD pipeline

**Future Enhancements:**

- Add new tower types in `src/entities/towers/`
- Create new enemy types in `src/entities/enemies/`
- Extend gameplay in `src/scenes/GameScene.ts`
- Add assets (images, sounds) and load them in `PreloaderScene.ts`

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Feel free to create issues or submit pull requests.

## Credits

Music in menu:
Written by Kevin MacLeod. Neutral and nice. This music is available for commercial and non-commercial purposes.

Sound effects:
Splash Sound Effect by <a href="https://pixabay.com/users/freesound_community-46691455/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=96223">freesound_community</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=96223">Pixabay</a>
Basic Sound Effect by <a href="https://pixabay.com/users/freesound_community-46691455/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=6471">freesound_community</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=6471">Pixabay</a>
Sniper Sound Effect by <a href="https://pixabay.com/users/freesound_community-46691455/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=5989">freesound_community</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=5989">Pixabay</a>
Fire Sound Effect by <a href="https://pixabay.com/users/freesound_community-46691455/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=95177">freesound_community</a> from <a href="https://pixabay.com/sound-effects//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=95177">Pixabay</a>
Click Sound Effect by <a href="https://pixabay.com/users/universfield-28281460/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=351398">Universfield</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=351398">Pixabay</a>