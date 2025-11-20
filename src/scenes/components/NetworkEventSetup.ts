import { NetworkManager } from '../../network/NetworkManager';

/**
 * NetworkEventSetup - Sets up all network event listeners
 */
export class NetworkEventSetup {
  constructor(
    private networkManager: NetworkManager,
    private onRoomJoined: (roomCode: string, players: any[]) => void,
    private onPlayerJoined: (player: any) => void,
    private onPlayerReady: (playerId: string, isReady: boolean, name: string) => void,
    private onPlayerLeft: (playerId: string, playerName: string) => void,
    private onGameStarted: (roomCode: string) => void,
    private onError: (message: string) => void,
    private onDisconnect: () => void
  ) {}

  setup(): void {
    this.networkManager.on('room:joined', (data: any) => {
      this.onRoomJoined(data.code, data.players);
    });

    this.networkManager.on('room:playerJoined', (player: any) => {
      this.onPlayerJoined(player);
    });

    this.networkManager.on('room:playerReady', (data: any) => {
      this.onPlayerReady(data.playerId, data.isReady, data.name);
    });

    this.networkManager.on('room:playerLeft', (playerId: string) => {
      const playerName = 'Spieler'; // Will be updated by scene
      this.onPlayerLeft(playerId, playerName);
    });

    this.networkManager.on('room:error', (message: string) => {
      this.onError(message);
    });

    this.networkManager.on('game:started', () => {
      this.onGameStarted(this.networkManager.getCurrentRoom() || '');
    });

    this.networkManager.on('disconnect', () => {
      this.onDisconnect();
    });
  }
}
