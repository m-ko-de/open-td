export {};

declare global {
  interface Window {
    /**
     * Restart the game instance.
     * This is a soft restart (destroys and reinitializes Phaser.Game) when available in app.
     */
    restartGame?: () => void;
  }
}
