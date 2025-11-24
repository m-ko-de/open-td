import { resolveUrl } from './UrlManager';

export class SoundManager {
  private static instance: SoundManager;
  private scene: Phaser.Scene | null = null;
  private music: Phaser.Sound.BaseSound | null = null;
  private soundEnabled = true;
  private musicEnabled = true;

  private constructor() {}

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  public init(scene: Phaser.Scene, soundEnabled: boolean, musicEnabled: boolean) {
    this.scene = scene;
    this.soundEnabled = soundEnabled;
    this.musicEnabled = musicEnabled;
    this.loadAssets();
  }

  private loadAssets() {
    if (!this.scene) return;
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
  }

  public playTower(type: string) {
    if (!this.soundEnabled || !this.scene || !this.scene.sound) return;
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
    if (this.soundEnabled && this.scene && this.scene.sound) {
      this.scene.sound.play('click', { volume: 0.5 });
    }
  }

  public playMusic() {
    if (this.musicEnabled && this.scene && this.scene.sound) {
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
    this.soundEnabled = enabled;
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (enabled) {
      this.playMusic();
    } else {
      this.stopMusic();
    }
  }
}
