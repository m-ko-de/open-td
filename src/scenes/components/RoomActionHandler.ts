import { NetworkManager } from '../../network/NetworkManager';
import { PersistenceManager } from '../../client/PersistenceManager';

/**
 * RoomActionHandler - Handles room actions (create, join, leave, ready, start)
 */
export class RoomActionHandler {
  constructor(
    private networkManager: NetworkManager,
    private onSuccess: (message: string) => void,
    private onError: (message: string) => void,
    private onLoading: (message: string) => void
  ) {}

  async createRoom(playerName: string): Promise<string | null> {
    if (!this.validatePlayerName(playerName)) {
      return null;
    }

    PersistenceManager.getInstance().setLocal('playerName', playerName);
    this.onLoading('Erstelle Raum...');

    try {
      const roomCode = await this.networkManager.createRoom(playerName);
      this.onSuccess(`Raum erstellt: ${roomCode}`);
      return roomCode;
    } catch (error: any) {
      this.onError(`Fehler: ${error.message}`);
      return null;
    }
  }

  async joinRoom(playerName: string, roomCode: string): Promise<boolean> {
    if (!this.validatePlayerName(playerName)) {
      return false;
    }

    if (!this.validateRoomCode(roomCode)) {
      return false;
    }

    PersistenceManager.getInstance().setLocal('playerName', playerName);
    this.onLoading('Trete Raum bei...');

    try {
      await this.networkManager.joinRoom(roomCode, playerName);
      this.onSuccess(`Raum beigetreten: ${roomCode}`);
      return true;
    } catch (error: any) {
      this.onError(`Fehler: ${error.message}`);
      return false;
    }
  }

  leaveRoom(): void {
    this.networkManager.leaveRoom();
  }

  setReady(isReady: boolean): void {
    this.networkManager.setReady(isReady);
  }

  startGame(): boolean {
    console.log('Starting game...');
    this.networkManager.startGame();
    return true;
  }

  validateGameStart(players: Map<string, any>): { canStart: boolean; message?: string } {
    const playerArray = Array.from(players.values());
    const allReady = playerArray.every((p: any) => p.isReady || p.isHost);
    
    console.log('Players:', playerArray.map((p: any) => ({ 
      name: p.name, 
      isHost: p.isHost, 
      isReady: p.isReady 
    })));
    console.log('All ready?', allReady);
    
    if (!allReady) {
      return { canStart: false, message: 'Nicht alle Spieler sind bereit!' };
    }

    if (players.size < 1) {
      return { canStart: false, message: 'Mindestens 1 Spieler benötigt!' };
    }

    return { canStart: true };
  }

  private validatePlayerName(playerName: string): boolean {
    if (!playerName) {
      this.onError('Bitte gib einen Namen ein!');
      return false;
    }

    if (playerName.length < 2 || playerName.length > 20) {
      this.onError('Name muss 2-20 Zeichen lang sein!');
      return false;
    }

    return true;
  }

  private validateRoomCode(roomCode: string): boolean {
    if (!roomCode) {
      this.onError('Bitte gib einen Raum-Code ein!');
      return false;
    }

    if (!/^[a-z]{2,4}-[a-z]{2,4}$/.test(roomCode)) {
      this.onError('Raum-Code Format: wort-wort (z.B. bear-lamp)');
      return false;
    }

    return true;
  }
}
