import { NetworkManager } from '../../network/NetworkManager';
import { PersistenceManager } from '../../client/PersistenceManager';
import { t } from '@/client/i18n';

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
    this.onLoading(t('room.create_loading'));

    try {
      const roomCode = await this.networkManager.createRoom(playerName);
      this.onSuccess(t('room.created', { code: roomCode }));
      return roomCode;
    } catch (error: any) {
      this.onError(t('room.error_prefix') + error.message);
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
    this.onLoading(t('room.join_loading'));

    try {
      await this.networkManager.joinRoom(roomCode, playerName);
      this.onSuccess(t('room.joined', { code: roomCode }));
      return true;
    } catch (error: any) {
      this.onError(t('room.error_prefix') + error.message);
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
      return { canStart: false, message: t('room.players_not_ready') };
    }

    if (players.size < 1) {
      return { canStart: false, message: t('room.players_min') };
    }

    return { canStart: true };
  }

  private validatePlayerName(playerName: string): boolean {
    if (!playerName) {
      this.onError(t('room.enter_name'));
      return false;
    }

    if (playerName.length < 2 || playerName.length > 20) {
      this.onError(t('room.name_length_error'));
      return false;
    }

    return true;
  }

  private validateRoomCode(roomCode: string): boolean {
    if (!roomCode) {
      this.onError(t('room.enter_code'));
      return false;
    }

    if (!/^[a-z]{2,4}-[a-z]{2,4}$/.test(roomCode)) {
      this.onError(t('room.code_format_error'));
      return false;
    }

    return true;
  }
}
