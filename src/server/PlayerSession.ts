import { PlayerData } from './types';

export class PlayerSession {
  public id: string;
  public name: string;
  public color: number;
  public isReady: boolean;
  public isHost: boolean;
  public socketId: string;
  public joinedAt: number;

  constructor(id: string, name: string, socketId: string, isHost: boolean = false) {
    this.id = id;
    this.name = name;
    this.socketId = socketId;
    this.isHost = isHost;
    this.isReady = false;
    this.joinedAt = Date.now();
    
    // Assign random color for player identification
    this.color = this.generatePlayerColor();
  }

  private generatePlayerColor(): number {
    const colors = [
      0x3498db, // Blue
      0xe74c3c, // Red
      0x2ecc71, // Green
      0xf39c12, // Orange
      0x9b59b6, // Purple
      0x1abc9c, // Turquoise
      0xe67e22, // Dark Orange
      0x34495e  // Dark Gray
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  public setReady(ready: boolean): void {
    this.isReady = ready;
  }

  public toPlayerData(): PlayerData {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      isReady: this.isReady,
      isHost: this.isHost
    };
  }

  public updateSocketId(socketId: string): void {
    this.socketId = socketId;
  }
}
