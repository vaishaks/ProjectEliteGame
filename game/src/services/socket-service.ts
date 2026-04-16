import { io, Socket } from 'socket.io-client';
import {
    SocketEvent,
    GameState,
    Player,
    RoomCreatedPayload,
    RoomJoinedPayload,
    RoundStartPayload,
    EnemyPhasePayload,
    GameOverPayload,
    CharacterKey,
} from '../shared/types';

const SERVER_URL = window.location.origin;

type StateUpdateCallback = (gameState: GameState) => void;
type PlayersUpdateCallback = (players: Player[]) => void;
type RoundStartCallback = (data: RoundStartPayload) => void;
type EnemyPhaseCallback = (data: EnemyPhasePayload) => void;
type GameOverCallback = (data: GameOverPayload) => void;
type GameStartedCallback = (data: { gameState: GameState }) => void;
type ErrorCallback = (data: { message: string }) => void;

class SocketService {
    private socket: Socket | null = null;
    private _playerId: string = '';
    private _roomCode: string = '';
    private _isHost: boolean = false;

    get playerId(): string { return this._playerId; }
    get roomCode(): string { return this._roomCode; }
    get isHost(): boolean { return this._isHost; }

    connect(): void {
        if (this.socket?.connected) return;
        this.socket = io(SERVER_URL);
    }

    disconnect(): void {
        this.socket?.disconnect();
        this.socket = null;
    }

    createRoom(playerName: string): Promise<RoomCreatedPayload & { players: Player[] }> {
        this.connect();
        return new Promise((resolve, reject) => {
            this.socket!.emit(SocketEvent.CREATE_ROOM, { playerName });
            this.socket!.once(SocketEvent.ROOM_CREATED, (data: RoomCreatedPayload & { players: Player[] }) => {
                this._playerId = data.playerId;
                this._roomCode = data.roomCode;
                this._isHost = true;
                resolve(data);
            });
            this.socket!.once(SocketEvent.ERROR, (data: { message: string }) => {
                reject(new Error(data.message));
            });
        });
    }

    joinRoom(roomCode: string, playerName: string): Promise<RoomJoinedPayload> {
        this.connect();
        return new Promise((resolve, reject) => {
            this.socket!.emit(SocketEvent.JOIN_ROOM, { roomCode, playerName });
            this.socket!.once(SocketEvent.ROOM_JOINED, (data: RoomJoinedPayload) => {
                this._playerId = data.playerId;
                this._roomCode = data.roomCode;
                this._isHost = false;
                resolve(data);
            });
            this.socket!.once(SocketEvent.ERROR, (data: { message: string }) => {
                reject(new Error(data.message));
            });
        });
    }

    selectCharacter(characterKey: CharacterKey): void {
        this.socket?.emit(SocketEvent.SELECT_CHARACTER, { characterKey });
    }

    startGame(): void {
        this.socket?.emit(SocketEvent.START_GAME);
    }

    sendPlayerReady(): void {
        this.socket?.emit(SocketEvent.PLAYER_READY);
    }

    sendMove(targetGrid: number): void {
        this.socket?.emit(SocketEvent.PLAYER_MOVE, { targetGrid });
    }

    sendAttack(targetEnemyId: string): void {
        this.socket?.emit(SocketEvent.PLAYER_ATTACK, { targetEnemyId });
    }

    // === Event Listeners ===

    onPlayerJoined(callback: PlayersUpdateCallback): void {
        this.socket?.on(SocketEvent.PLAYER_JOINED, (data: { players: Player[] }) => {
            callback(data.players);
        });
    }

    onCharacterSelected(callback: PlayersUpdateCallback): void {
        this.socket?.on(SocketEvent.CHARACTER_SELECTED, (data: { players: Player[] }) => {
            callback(data.players);
        });
    }

    onGameStarted(callback: GameStartedCallback): void {
        this.socket?.on(SocketEvent.GAME_STARTED, callback);
    }

    onStateUpdate(callback: StateUpdateCallback): void {
        this.socket?.on(SocketEvent.STATE_UPDATE, (data: { gameState: GameState }) => {
            callback(data.gameState);
        });
    }

    onRoundStart(callback: RoundStartCallback): void {
        this.socket?.on(SocketEvent.ROUND_START, callback);
    }

    onEnemyPhase(callback: EnemyPhaseCallback): void {
        this.socket?.on(SocketEvent.ENEMY_PHASE, callback);
    }

    onGameOver(callback: GameOverCallback): void {
        this.socket?.on(SocketEvent.GAME_OVER, callback);
    }

    onError(callback: ErrorCallback): void {
        this.socket?.on(SocketEvent.ERROR, callback);
    }

    removeAllListeners(): void {
        this.socket?.removeAllListeners();
    }
}

// Singleton instance
export const socketService = new SocketService();
