// === Game Entity Types ===

export type EnemyType = 'runner' | 'biter' | 'shooter';
export type CharacterKey = 'gherid' | 'akosha';
export type GamePhase = 'lobby' | 'player-round' | 'enemy-round' | 'game-over';

export interface Player {
    id: string;
    name: string;
    characterKey: CharacterKey;
    gridPosition: number; // 1-8
    health: number;
    score: number;
    isReady: boolean;
}

export interface Enemy {
    id: string;
    type: EnemyType;
    gridPosition: number; // 1-8
    health: number;
}

export interface GridSquare {
    id: number; // 1-8
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
    roundTimer: number; // ms remaining
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

// === Socket Event Types ===

export enum SocketEvent {
    // Lobby events
    CREATE_ROOM = 'create_room',
    ROOM_CREATED = 'room_created',
    JOIN_ROOM = 'join_room',
    ROOM_JOINED = 'room_joined',
    PLAYER_JOINED = 'player_joined',
    SELECT_CHARACTER = 'select_character',
    CHARACTER_SELECTED = 'character_selected',
    START_GAME = 'start_game',
    GAME_STARTED = 'game_started',

    // Gameplay events
    ROUND_START = 'round_start',
    PLAYER_MOVE = 'player_move',
    PLAYER_ATTACK = 'player_attack',
    STATE_UPDATE = 'state_update',
    ENEMY_PHASE = 'enemy_phase',
    GAME_OVER = 'game_over',
    PLAYER_READY = 'player_ready',

    // Connection events
    DISCONNECT = 'disconnect',
    ERROR = 'error',
}

// === Socket Payloads ===

export interface CreateRoomPayload {
    playerName: string;
}

export interface JoinRoomPayload {
    roomCode: string;
    playerName: string;
}

export interface SelectCharacterPayload {
    characterKey: CharacterKey;
}

export interface PlayerMovePayload {
    targetGrid: number;
}

export interface PlayerAttackPayload {
    targetEnemyId: string;
}

export interface RoomCreatedPayload {
    roomCode: string;
    playerId: string;
}

export interface RoomJoinedPayload {
    roomCode: string;
    playerId: string;
    players: Player[];
}

export interface RoundStartPayload {
    roundNumber: number;
    duration: number;
    gameState: GameState;
}

export interface EnemyPhasePayload {
    actions: EnemyPhaseAction[];
    gameState: GameState;
}

export interface GameOverPayload {
    won: boolean;
    totalScore: number;
    gameState: GameState;
}
