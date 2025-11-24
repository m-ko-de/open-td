import { resolveUrl } from './UrlManager';
import { ConfigManager } from './ConfigManager';

export class SoundManager {
  private static instance: SoundManager;
  private scene: Phaser.Scene | null = null;
  private music: Phaser.Sound.BaseSound | null = null;
  private soundEnabled = false;
  private musicEnabled = false;
  private assetsLoaded = false;

  private constructor() {}

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  public init(scene: Phaser.Scene, soundEnabled: boolean | undefined, musicEnabled: boolean | undefined) {
    this.scene = scene;
    // Use ConfigManager override if available, otherwise honor supplied defaults
    const cfg = ConfigManager.getInstance();
    this.soundEnabled = cfg.isLoaded() ? cfg.isSoundEnabled() : (soundEnabled ?? false);
    this.musicEnabled = cfg.isLoaded() ? cfg.isMusicEnabled() : (musicEnabled ?? false);
    this.checkAndloadAssets();
  }

  private checkAndloadAssets(): boolean {
    if (!this.scene || this.assetsLoaded) return false;
    const cfg = ConfigManager.getInstance();
    // If global sound is disabled, avoid loading any audio files
    if (cfg.isLoaded() && !cfg.isSoundEnabled()) {
      return false;
    }
    if(!this.soundEnabled) {
      return false;
    }
    // Nur einmal laden
    const sounds = [
      ['click', 'assets/sounds/click.mp3'],
      ['music', 'assets/music/menu.mp3'],
      ['tower_basic', 'assets/sounds/tower_basic.mp3'],
      ['tower_fast', 'assets/sounds/tower_fast.mp3'],
      ['tower_fire', 'assets/sounds/tower_fire.mp3'],
      ['tower_frost', 'assets/sounds/tower_frost.mp3'],
      ['tower_sniper', 'assets/sounds/tower_sniper.mp3'],
      ['tower_splash', 'assets/sounds/tower_splash.mp3'],
      ['tower_strong', 'assets/sounds/tower_strong.mp3'],
    ];

    // Use centralized URL resolution helper (imported at top)

    for (const [key, path] of sounds) {
      if (!this.scene.cache.audio.has(key)) {
        this.scene.load.audio(key, resolveUrl(path));
      }
    }
    this.scene.load.start();
    this.assetsLoaded = true;
    return true;
  }

  public playTower(type: string) {
    if(!this.checkAndloadAssets()) return;
    const cfg = ConfigManager.getInstance();
    if ((!this.soundEnabled || !this.scene || !this.scene.sound) || (cfg.isLoaded() && !cfg.isSoundEnabled())) return;
    const soundMap: Record<string, string> = {
      basic: 'tower_basic',
      fast: 'tower_fast',
      fire: 'tower_fire',
      frost: 'tower_frost',
      sniper: 'tower_sniper',
      splash: 'tower_splash',
      strong: 'tower_strong',
    };
    const key = soundMap[type] || 'click';
    this.scene.sound.play(key, { volume: 0.5 });
  }

  public playClick() {
    if(!this.checkAndloadAssets()) return;
    const cfg2 = ConfigManager.getInstance();
    if ((this.soundEnabled && this.scene && this.scene.sound) && (!cfg2.isLoaded() || cfg2.isSoundEnabled())) {
      this.scene.sound.play('click', { volume: 0.5 });
    }
  }

  public playMusic() {
    if(!this.checkAndloadAssets()) return;
    const cfg3 = ConfigManager.getInstance();
    if ((this.musicEnabled && this.scene && this.scene.sound) && (!cfg3.isLoaded() || cfg3.isMusicEnabled())) {
      if (!this.music || !this.music.isPlaying) {
        this.music = this.scene.sound.add('music', { loop: true, volume: 0.3 });
        this.music.play();
      }
    }
  }

  public stopMusic() {
    if (this.music && this.music.isPlaying) {
      this.music.stop();
    }
  }

  public setSoundEnabled(enabled: boolean) {
    const cfg = ConfigManager.getInstance();
    // If global config has sound disabled, disallow enabling at runtime
    if (enabled && cfg.isLoaded() && !cfg.isSoundEnabled()) {
      return false;
    }
    this.soundEnabled = enabled;
    return true;
  }

  public setMusicEnabled(enabled: boolean) {
    const cfg = ConfigManager.getInstance();
    if (enabled && cfg.isLoaded() && !cfg.isMusicEnabled()) {
      return false;
    }
    this.musicEnabled = enabled;
    if (enabled) {
      this.playMusic();
    } else {
      this.stopMusic();
    }
    return true;
  }
}
