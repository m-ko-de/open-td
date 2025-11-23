import Phaser from 'phaser';
import { Capacitor } from '@capacitor/core';
import { PreloaderScene } from './scenes/PreloaderScene';
import { LoginScene } from './scenes/LoginScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { GameScene } from './scenes/GameScene';
import { OptionsScene } from './scenes/OptionsScene';
import { MultiplayerScene } from './scenes/MultiplayerScene';
import { ConfigManager } from './config/ConfigManager';

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
  scene: [PreloaderScene, LoginScene, MainMenuScene, GameScene, OptionsScene, MultiplayerScene],
};

// Initialize game with config loading
async function initGame() {
  try {
    // Load game configuration first
    const configManager = ConfigManager.getInstance();
    await configManager.load();
    
    // Then start the game
    new Phaser.Game(config);
  } catch (error) {
    console.error('Failed to initialize game:', error);
    document.body.innerHTML = '<div style="color: white; text-align: center; padding: 50px;">Failed to load game configuration. Please refresh the page.</div>';
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
