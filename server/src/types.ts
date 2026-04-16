// Re-export shared types for server use.
// These types mirror game/src/shared/types.ts to keep client/server in sync.

export type EnemyType = 'runner' | 'biter' | 'shooter';
export type CharacterKey = 'gherid' | 'akosha';
export type GamePhase = 'lobby' | 'player-round' | 'enemy-round' | 'game-over';

export interface Player {
    id: string;
    name: string;
    characterKey: CharacterKey;
    gridPosition: number;
    health: number;
    score: number;
    isReady: boolean;
}

export interface Enemy {
    id: string;
    type: EnemyType;
    gridPosition: number;
    health: number;
}

export interface GridSquare {
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface GameState {
    roomCode: string;
    players: Player[];
    enemies: Enemy[];
    currentPhase: GamePhase;
    roundTimer: number;
    roundNumber: number;
    totalScore: number;
}

export interface EnemyPhaseAction {
    enemyId: string;
    type: 'move' | 'attack';
    targetGrid?: number;
    targetPlayerId?: string;
    damage?: number;
}

export enum SocketEvent {
    CREATE_ROOM = 'create_room',
    ROOM_CREATED = 'room_created',
    JOIN_ROOM = 'join_room',
    ROOM_JOINED = 'room_joined',
    PLAYER_JOINED = 'player_joined',
    SELECT_CHARACTER = 'select_character',
    CHARACTER_SELECTED = 'character_selected',
    START_GAME = 'start_game',
    GAME_STARTED = 'game_started',
    ROUND_START = 'round_start',
    PLAYER_MOVE = 'player_move',
    PLAYER_ATTACK = 'player_attack',
    STATE_UPDATE = 'state_update',
    ENEMY_PHASE = 'enemy_phase',
    GAME_OVER = 'game_over',
    PLAYER_READY = 'player_ready',
    DISCONNECT = 'disconnect',
    ERROR = 'error',
}
