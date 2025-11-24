import Phaser from 'phaser';
import { Capacitor } from '@capacitor/core';
import { PreloaderScene } from './scenes/PreloaderScene';
import { LoginScene } from './scenes/LoginScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { GameScene } from './scenes/GameScene';
import { OptionsScene } from './scenes/OptionsScene';
import { MultiplayerScene } from './scenes/MultiplayerScene';
import { AdminScene } from './scenes/AdminScene';
import { ConfigManager } from './client/ConfigManager';
import { errorReporter } from './client/ErrorReporter';

// Game configuration
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#2d2d2d',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [PreloaderScene, LoginScene, MainMenuScene, GameScene, OptionsScene, MultiplayerScene, AdminScene],
};

let game: Phaser.Game | null = null;
let lastRestartAt = 0;
let restartAttemptsInWindow = 0;

// Initialize game with config loading
async function initGame() {
  try {
    // Load game configuration first
    const configManager = ConfigManager.getInstance();
    await configManager.load();
    
    // Then start the game
    // Keep a reference so we can restart later
    game = new Phaser.Game(config);
    // Hide any restart overlay if present
    removeRestartOverlay();
    // Install global handlers once — will use restart function
    errorReporter.installGlobalHandlers({
      onRestart: restartGame,
    });
  } catch (error) {
    console.error('Failed to initialize game:', error);
    document.body.innerHTML = '<div style="color: white; text-align: center; padding: 50px;">Failed to load game configuration. Please refresh the page.</div>';
  }
}

function showRestartOverlay() {
  try {
    const id = 'open-td-error-overlay';
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      el.style.position = 'fixed';
      el.style.top = '0';
      el.style.left = '0';
      el.style.right = '0';
      el.style.bottom = '0';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.background = 'rgba(0,0,0,0.7)';
      el.style.color = '#fff';
      el.style.zIndex = '99999';
      el.style.fontSize = '18px';
      el.style.padding = '20px';
      el.textContent = 'An error occurred. Restarting the game automatically...';
      document.body.appendChild(el);
    }
  } catch (e) {
    console.error('Failed to show restart overlay', e);
  }
}

function removeRestartOverlay() {
  try {
    const id = 'open-td-error-overlay';
    const el = document.getElementById(id);
    if (el) el.remove();
  } catch (e) {
    console.error('Failed to remove restart overlay', e);
  }
}

async function restartGame() {
  try {
    const now = Date.now();
    // Allow a maximum of 3 restarts in 30 seconds
    if (now - lastRestartAt > 30_000) {
      restartAttemptsInWindow = 0;
    }
    lastRestartAt = now;
    restartAttemptsInWindow += 1;
    if (restartAttemptsInWindow > 3) {
      console.error('Too many restarts attempted — aborting automatic restart.');
      // Optional: Show a persistent message instructing manual reload
      showRestartOverlay();
      return;
    }

    showRestartOverlay();
    console.warn('Restarting Phaser game (attempt ' + restartAttemptsInWindow + ')');
    if (game) {
      try {
        game.destroy(true, false);
      } catch (e) {
        console.error('Failed to destroy Phaser game instance during restart:', e);
      }
      game = null;
    }
    // Give the browser a beat to free resources
    await new Promise(resolve => setTimeout(resolve, 400));
    initGame();
  } catch (e) {
    console.error('Failed to restart game:', e);
  }
}

// Wait for Capacitor to be ready on mobile
if (Capacitor.isNativePlatform()) {
  document.addEventListener('deviceready', () => {
    initGame();
  });
} else {
  window.addEventListener('load', () => {
    initGame();
  });
}
