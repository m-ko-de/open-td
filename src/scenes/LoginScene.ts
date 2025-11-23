import { AuthManager } from '../auth/AuthManager';
import { BackgroundEffects } from './components/BackgroundEffects';

export class LoginScene extends Phaser.Scene {
  private authManager: AuthManager;
  private isRegistering: boolean = false;

  constructor() {
    super({ key: 'LoginScene' });
    this.authManager = AuthManager.getInstance();
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Check if already logged in
    if (this.authManager.isLoggedIn()) {
      console.log('Already logged in, going to main menu');
      this.scene.start('MainMenuScene');
      return;
    }

    // Fade in
    this.cameras.main.fadeIn(500);

    // Background
    const background = new BackgroundEffects(this);
    background.createGradientBackground(width, height);
    background.createParticles(width, height, 20);

    // Title
    const title = this.add.text(width / 2, 120, 'OPEN TD', {
      fontSize: '64px',
      fontFamily: 'Arial Black',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6,
    });
    title.setOrigin(0.5);
    title.setAlpha(0);

    this.tweens.add({
      targets: title,
      alpha: 1,
      scale: { from: 0.8, to: 1 },
      duration: 800,
      ease: 'Back.easeOut',
    });

    // Login/Register toggle
    this.createLoginForm(width, height);
  }

  private createLoginForm(width: number, height: number): void {
    const centerX = width / 2;
    const startY = height / 2 - 80;

    // Form container background
    const formBg = this.add.graphics();
    formBg.fillStyle(0x000000, 0.7);
    formBg.fillRoundedRect(centerX - 200, startY - 40, 400, 380, 15);
    formBg.lineStyle(3, 0x00ff00, 0.8);
    formBg.strokeRoundedRect(centerX - 200, startY - 40, 400, 380, 15);

    // Mode title
    const modeTitle = this.add.text(centerX, startY, 'ANMELDEN', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#00ff00',
    });
    modeTitle.setOrigin(0.5);

    // Username label
    this.add.text(centerX - 150, startY + 60, 'Benutzername:', {
      fontSize: '18px',
      color: '#ffffff',
    });

    // Username input (simulated with DOM element)
    const usernameInput = this.createInput(centerX - 150, startY + 90, 300, 'username');

    // Password label
    this.add.text(centerX - 150, startY + 140, 'Passwort:', {
      fontSize: '18px',
      color: '#ffffff',
    });

    // Password input
    const passwordInput = this.createInput(centerX - 150, startY + 170, 300, 'password');

    // Email label (only for registration)
    const emailLabel = this.add.text(centerX - 150, startY + 220, 'E-Mail (optional):', {
      fontSize: '18px',
      color: '#ffffff',
    });
    emailLabel.setVisible(false);

    // Email input
    const emailInput = this.createInput(centerX - 150, startY + 250, 300, 'email');
    emailInput.style.display = 'none';

    // Submit button
    const submitButton = this.add.text(centerX, startY + 290, 'ANMELDEN', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#00aa00',
      padding: { x: 30, y: 10 },
    });
    submitButton.setOrigin(0.5);
    submitButton.setInteractive({ useHandCursor: true });

    submitButton.on('pointerover', () => {
      submitButton.setStyle({ backgroundColor: '#00ff00' });
    });

    submitButton.on('pointerout', () => {
      submitButton.setStyle({ backgroundColor: '#00aa00' });
    });

    submitButton.on('pointerdown', async () => {
      const username = usernameInput.value.trim();
      const password = passwordInput.value.trim();
      const email = emailInput.value.trim();

      if (!username || !password) {
        this.showMessage('Bitte alle Felder ausfüllen!', '#ff0000');
        return;
      }

      submitButton.disableInteractive();
      
      if (this.isRegistering) {
        const result = await this.authManager.register(username, password, email || undefined);
        if (result.success) {
          this.showMessage('Registrierung erfolgreich!', '#00ff00');
          this.time.delayedCall(1000, () => {
            this.cameras.main.fadeOut(500);
            this.cameras.main.once('camerafadeoutcomplete', () => {
              this.scene.start('MainMenuScene');
            });
          });
        } else {
          this.showMessage(result.message || 'Registrierung fehlgeschlagen', '#ff0000');
          submitButton.setInteractive();
        }
      } else {
        const result = await this.authManager.login(username, password);
        if (result.success) {
          this.showMessage('Anmeldung erfolgreich!', '#00ff00');
          this.time.delayedCall(1000, () => {
            this.cameras.main.fadeOut(500);
            this.cameras.main.once('camerafadeoutcomplete', () => {
              this.scene.start('MainMenuScene');
            });
          });
        } else {
          this.showMessage(result.message || 'Anmeldung fehlgeschlagen', '#ff0000');
          submitButton.setInteractive();
        }
      }
    });

    // Toggle button
    const toggleButton = this.add.text(centerX, startY + 270, 'Noch kein Account? Registrieren', {
      fontSize: '16px',
      color: '#aaaaaa',
    });
    toggleButton.setOrigin(0.5);
    toggleButton.setInteractive({ useHandCursor: true });

    toggleButton.on('pointerover', () => {
      toggleButton.setStyle({ color: '#ffffff' });
    });

    toggleButton.on('pointerout', () => {
      toggleButton.setStyle({ color: '#aaaaaa' });
    });

    toggleButton.on('pointerdown', () => {
      this.isRegistering = !this.isRegistering;
      
      if (this.isRegistering) {
        modeTitle.setText('REGISTRIEREN');
        submitButton.setText('REGISTRIEREN');
        toggleButton.setText('Bereits registriert? Anmelden');
        emailLabel.setVisible(true);
        emailInput.style.display = 'block';
      } else {
        modeTitle.setText('ANMELDEN');
        submitButton.setText('ANMELDEN');
        toggleButton.setText('Noch kein Account? Registrieren');
        emailLabel.setVisible(false);
        emailInput.style.display = 'none';
      }
    });

    // Skip login button (for testing)
    const skipButton = this.add.text(width - 20, height - 20, 'Als Gast fortfahren →', {
      fontSize: '14px',
      color: '#666666',
    });
    skipButton.setOrigin(1, 1);
    skipButton.setInteractive({ useHandCursor: true });

    skipButton.on('pointerover', () => {
      skipButton.setStyle({ color: '#aaaaaa' });
    });

    skipButton.on('pointerout', () => {
      skipButton.setStyle({ color: '#666666' });
    });

    skipButton.on('pointerdown', () => {
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MainMenuScene');
      });
    });
  }

  private createInput(x: number, y: number, width: number, type: string): HTMLInputElement {
    const input = document.createElement('input');
    input.type = type === 'password' ? 'password' : type === 'email' ? 'email' : 'text';
    input.placeholder = type === 'username' ? 'Benutzername' : type === 'password' ? 'Passwort' : 'E-Mail';
    input.style.position = 'absolute';
    input.style.width = width + 'px';
    input.style.height = '35px';
    input.style.fontSize = '16px';
    input.style.padding = '5px 10px';
    input.style.backgroundColor = '#333333';
    input.style.color = '#ffffff';
    input.style.border = '2px solid #00aa00';
    input.style.borderRadius = '5px';
    input.style.outline = 'none';
    input.style.fontFamily = 'Arial';
    input.style.boxSizing = 'border-box';

    // Position relative to game canvas
    const canvas = this.game.canvas;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate scale factor if canvas is scaled
    const scaleX = rect.width / this.cameras.main.width;
    const scaleY = rect.height / this.cameras.main.height;
    
    input.style.left = (rect.left + (x * scaleX)) + 'px';
    input.style.top = (rect.top + (y * scaleY)) + 'px';
    input.style.width = (width * scaleX) + 'px';
    input.style.height = (35 * scaleY) + 'px';

    document.body.appendChild(input);

    // Clean up on scene shutdown
    this.events.once('shutdown', () => {
      input.remove();
    });

    return input;
  }

  private showMessage(text: string, color: string): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const message = this.add.text(width / 2, height / 2 + 200, text, {
      fontSize: '20px',
      color: color,
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 },
    });
    message.setOrigin(0.5);
    message.setAlpha(0);

    this.tweens.add({
      targets: message,
      alpha: 1,
      duration: 300,
    });

    this.time.delayedCall(3000, () => {
      this.tweens.add({
        targets: message,
        alpha: 0,
        duration: 300,
        onComplete: () => message.destroy(),
      });
    });
  }
}
