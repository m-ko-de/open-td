# Game

Client-side game logic and UI components for Open TD.

## Overview

The game folder contains all manager classes and UI components that implement core gameplay mechanics on the client side. These classes are tightly integrated with Phaser and manage entities, resources, waves, and user interface.

## Manager Classes

### TowerManager (`TowerManager.ts`)

Manages tower placement, upgrades, and combat logic.

**Responsibilities**:

- Create and position tower sprites
- Tower upgrade system (level, damage, range, fire rate)
- Targeting system (nearest enemy in range)
- Shooting logic and projectiles
- Tower selling and refunds

**Usage**:

```typescript
towerManager.placeTower('basic', 100, 200);
towerManager.upgradeTower(tower);
towerManager.sellTower(tower);
```

**Tower Types**:

- `basic` - Balanced (50 Gold)
- `fast` - High fire rate (75 Gold)
- `strong` - High damage (100 Gold)

### WaveManager (`WaveManager.ts`)

Controls enemy waves and spawning.

**Responsibilities**:

- Wave configuration (count, type, health, speed)
- Enemy spawning with delays
- Wave progression (increasing difficulty)
- Path following for enemies
- Wave completion detection

**Usage**:

```typescript
waveManager.startWave();
waveManager.isWaveActive(); // true/false
```

**Wave Scaling**:

```typescript
// Each wave:
enemyCount = 5 + (waveNumber * 2)
enemyHealth = 100 + (waveNumber * 20)
enemySpeed = 50 + (waveNumber * 5)
goldReward = 10 + (waveNumber * 5)
```

### MapManager (`MapManager.ts`)

Dynamically loads and renders maps from JSON configuration files.

**Responsibilities**:

- Load map JSON from `public/maps/` directory
- Create path from waypoints
- Render background (sky gradient, grass)
- Place decorations (trees, bushes, water, mountains, etc.)
- Path collision detection for decorations
- Convert relative/absolute coordinates

**Map JSON Structure**:

```typescript
{
  name: "Classic Path",
  description: "A simple winding path",
  background: {
    skyHeight: 0.4,
    skyColorTop: "#87ceeb",
    skyColorBottom: "#b0e0e6",
    grassColor: "#3a6b2e"
  },
  path: {
    type: "waypoints",
    waypoints: [
      { x: 50, y: 0.6, type: "start" },
      { x: 300, y: 0.6, type: "line" }
    ]
  },
  decorations: {
    trees: [{ x: 0.15, y: 0.6, size: 40, color: "#2d5016", safeDistance: 60 }],
    water: [{ x: 0.05, y: 0.8, width: 120, height: 80, safeDistance: 80 }]
  }
}
```

**Available Maps**: `classic.json`, `spiral.json`, `zigzag.json`

### ResearchManager (`ResearchManager.ts`)

Implements research/upgrade system.

**Responsibilities**:

- Manage research tree
- Unlock upgrades
- Cost validation
- Apply permanent buffs

**Research Types**:

```typescript
interface Research {
  id: string;
  name: string;
  description: string;
  cost: number;
  unlocked: boolean;
}
```

**Example Research**:

- `damage_boost` - +10% damage for all towers
- `fire_rate_boost` - +15% fire rate
- `range_boost` - +20% range

### GameUI (`GameUI.ts`)

Coordinates all UI components and HUD elements.

**Responsibilities**:

- Create and position UI containers
- Initialize UI components
- Coordinate UI updates
- Event handling between UI and game logic

**Sub-Components**:

- `StatsDisplay` - Resources, wave, lives
- `TowerButtonPanel` - Tower selection
- `TowerActionButtons` - Upgrade/sell
- `ControlButtons` - Pause, menu, sound
- `ResearchButton` & `ResearchOverlay` - Research menu

## UI Components (`ui/`)

### StatsDisplay (`ui/StatsDisplay.ts`)

Displays game statistics in HUD.

**Display**:

- 💰 Gold
- ❤️ Lives
- 🌊 Current wave
- 👥 Player names (Multiplayer)

### TowerButtonPanel (`ui/TowerButtonPanel.ts`)

Tower selection bar at bottom of screen.

**Features**:

- Tower type buttons with icons
- Cost display
- Hover tooltips
- Selection highlighting
- Mobile touch support

### TowerActionButtons (`ui/TowerActionButtons.ts`)

Upgrade and sell buttons for selected towers.

**Features**:

- Appears on tower selection
- Shows upgrade costs and new stats
- Calculate sell value (70% refund)
- Max level display

### ControlButtons (`ui/ControlButtons.ts`)

Game control buttons (pause, menu, etc.).

**Buttons**:

- ⏸️ Pause - Pause/resume game
- 🏠 Menu - Return to main menu
- 🔊 Sound - Toggle sound
- ⚙️ Settings - Open settings

### ResearchButton & ResearchOverlay

**ResearchButton** (`ui/ResearchButton.ts`):

- Opens research menu
- Badge for available research
- Animations for new upgrades

**ResearchOverlay** (`ui/ResearchOverlay.ts`):

- Modal overlay for research tree
- Grid layout of research items
- Unlock buttons with costs
- Visualize dependencies

## Integration with Multiplayer

The game managers are **not directly** connected to the network. Instead:

```adr
NetworkManager ──> MultiplayerCoordinator ──> TowerSync
                                          └──> WaveSync
                                          └──> EnemySync

TowerSync ──> TowerManager (local visualization)
WaveSync ──> WaveManager (local visualization)
```

**Important**: In multiplayer, the server is authoritative. Managers only execute server-confirmed actions.

## Event Flow Example: Place Tower

### Single Player

```adr
1. Player clicks → GameScene.handleClick()
2. GameScene → TowerManager.placeTower()
3. TowerManager creates tower sprite
4. TowerManager deducts gold
```

### Multiplayer

```adr
1. Player clicks → GameScene.handleClick()
2. GameScene → NetworkManager.placeTower()
3. NetworkManager → Server
4. Server validates and broadcasts
5. TowerSync receives 'towerPlaced'
6. TowerSync → TowerManager.createTowerSprite()
```

## Performance Optimizations

### Object Pooling

```typescript
// Projectiles are recycled, not constantly created
projectilePool.get();
projectilePool.release(projectile);
```

### Update Optimization

```typescript
// Only update visible entities
if (enemy.visible && Phaser.Geom.Intersects.RectangleToRectangle(
  enemy.getBounds(),
  this.cameras.main.worldView
)) {
  enemy.update();
}
```

### Batch Rendering

```typescript
// Group sprites in layers
this.add.layer([tower1, tower2, tower3]);
```

## Mobile Optimizations

- **Touch Controls**: All buttons are touch-friendly (min. 44x44px)
- **Responsive UI**: UI scales based on screen size
- **Performance**: Reduced particle effects on mobile devices
- **Battery**: Frame rate limiting during inactivity

## Testing

Game managers are **not directly tested** because:

- ❌ Too tightly coupled with Phaser (Scene, GameObjects, Physics)
- ❌ Primarily visualization code, not business logic
- ❌ Logic is already tested server-side

**Alternative**: Manual QA and playtesting.

## Debugging

### Phaser Debug Mode

```typescript
// In main.ts
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  physics: {
    default: 'arcade',
    arcade: { debug: true } // Shows hitboxes, velocities
  }
};
```

### Visualize Tower Range

```typescript
// In TowerManager
const debugGraphics = this.scene.add.graphics();
debugGraphics.lineStyle(2, 0x00ff00, 0.3);
debugGraphics.strokeCircle(tower.x, tower.y, tower.range);
```

### Performance Monitoring

```typescript
// Display FPS
this.add.text(10, 10, '', { color: '#0f0' })
  .setScrollFactor(0)
  .setDepth(1000);

this.events.on('preupdate', () => {
  text.setText(`FPS: ${this.game.loop.actualFps.toFixed(2)}`);
});
```

## Best Practices

1. **Separation of Concerns**: Managers only manage their domain (towers, waves, etc.)
2. **Scene Lifecycle**: Initialize resources in `create()`, cleanup in `shutdown()`
3. **Input Handling**: Centralized in GameScene, not in individual managers
4. **UI Updates**: Trigger through events, not polling
5. **Memory Management**: `destroy()` sprites when no longer needed

## See Also

- [Multiplayer Sync](../multiplayer/README.md) - Network integration
- [NetworkManager](../network/README.md) - Client-server communication
- [GameServer](../server/README.md) - Server-side logic
- [Phaser 3 Documentation](https://photonstorm.github.io/phaser3-docs/) - Phaser API
