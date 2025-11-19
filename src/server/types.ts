export interface PlayerData {
  id: string;
  name: string;
  color: number;
  isReady: boolean;
  isHost: boolean;
}

export interface RoomData {
  id: string;
  code: string;
  hostId: string;
  players: Map<string, any>; // PlayerSession type to avoid circular dependency
  gameStarted: boolean;
  createdAt: number;
}

export interface TowerData {
  id: string;
  type: string;
  x: number;
  y: number;
  level: number;
  ownerId: string;
}

export interface EnemyData {
  id: string;
  type: string;
  health: number;
  maxHealth: number;
  x: number;
  y: number;
  pathIndex: number;
  wave: number;
}

export interface GameStateData {
  gold: number;
  lives: number;
  wave: number;
  isWaveActive: boolean;
  towers: TowerData[];
  enemies: EnemyData[];
  playerLevel: number;
  xp: number;
  playerCount: number;
}

// Socket.io event types
export interface ServerToClientEvents {
  // Room events
  'room:created': (roomCode: string) => void;
  'room:joined': (roomData: { code: string; players: PlayerData[]; isHost: boolean }) => void;
  'room:playerJoined': (player: PlayerData) => void;
  'room:playerLeft': (playerId: string) => void;
  'room:playerReady': (data: { playerId: string; name: string; isReady: boolean }) => void;
  'room:error': (message: string) => void;
  
  // Game events
  'game:started': () => void;
  'game:stateUpdate': (state: GameStateData) => void;
  'game:towerPlaced': (tower: TowerData) => void;
  'game:towerUpgraded': (towerId: string, level: number) => void;
  'game:towerSold': (towerId: string, refund: number) => void;
  'game:enemySpawned': (enemy: EnemyData) => void;
  'game:enemyDied': (enemyId: string, gold: number, xp: number) => void;
  'game:waveStarted': (wave: number) => void;
  'game:waveCompleted': (wave: number, bonus: number) => void;
  'game:levelUp': (level: number) => void;
  'game:over': (won: boolean) => void;
}

export interface ClientToServerEvents {
  // Room events
  'room:create': (playerName: string, callback: (response: { success: boolean; code?: string; error?: string }) => void) => void;
  'room:join': (roomCode: string, playerName: string, callback: (response: { success: boolean; error?: string }) => void) => void;
  'room:leave': () => void;
  'room:ready': (isReady: boolean) => void;
  'room:startGame': () => void;
  
  // Game events
  'game:placeTower': (data: { type: string; x: number; y: number }) => void;
  'game:upgradeTower': (towerId: string) => void;
  'game:sellTower': (towerId: string) => void;
  'game:startWave': () => void;
  'game:researchUnlock': (researchType: string) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  playerId: string;
  roomId: string;
  playerName: string;
}
