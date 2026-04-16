import { Player, Enemy, GameState, CharacterKey } from './types';

export interface Room {
    code: string;
    hostId: string;
    state: GameState;
    roundTimerHandle: ReturnType<typeof setTimeout> | null;
}

function generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

let enemyIdCounter = 0;
function nextEnemyId(): string {
    return `enemy_${++enemyIdCounter}`;
}

const INITIAL_ENEMIES: Array<{ type: 'runner' | 'biter' | 'shooter'; gridPosition: number }> = [
    { type: 'runner', gridPosition: 3 },
    { type: 'runner', gridPosition: 4 },
    { type: 'biter', gridPosition: 5 },
    { type: 'shooter', gridPosition: 6 },
    { type: 'shooter', gridPosition: 7 },
    { type: 'shooter', gridPosition: 8 },
    { type: 'runner', gridPosition: 9 },
    { type: 'biter', gridPosition: 2 },
];

const ENEMY_HEALTH: Record<string, number> = {
    runner: 2,
    biter: 3,
    shooter: 2,
};

export class RoomManager {
    private rooms: Map<string, Room> = new Map();

    createRoom(hostId: string, hostName: string): Room {
        let code = generateRoomCode();
        while (this.rooms.has(code)) {
            code = generateRoomCode();
        }

        const room: Room = {
            code,
            hostId,
            state: {
                roomCode: code,
                players: [{
                    id: hostId,
                    name: hostName,
                    characterKey: 'gherid',
                    gridPosition: 1,
                    health: 5,
                    score: 0,
                    isReady: false,
                }],
                enemies: [],
                currentPhase: 'lobby',
                roundTimer: 0,
                roundNumber: 0,
                totalScore: 0,
            },
            roundTimerHandle: null,
        };
        this.rooms.set(code, room);
        return room;
    }

    joinRoom(roomCode: string, playerId: string, playerName: string): Room | null {
        const room = this.rooms.get(roomCode);
        if (!room) return null;
        if (room.state.currentPhase !== 'lobby') return null;
        if (room.state.players.length >= 4) return null;

        room.state.players.push({
            id: playerId,
            name: playerName,
            characterKey: 'akosha',
            gridPosition: 9,
            health: 4,
            score: 0,
            isReady: false,
        });
        return room;
    }

    selectCharacter(roomCode: string, playerId: string, characterKey: CharacterKey): boolean {
        const room = this.rooms.get(roomCode);
        if (!room) return false;

        // Check no other player has this character
        const taken = room.state.players.some(p => p.id !== playerId && p.characterKey === characterKey);
        if (taken) return false;

        const player = room.state.players.find(p => p.id === playerId);
        if (!player) return false;

        player.characterKey = characterKey;
        player.isReady = true;
        return true;
    }

    initializeEnemies(room: Room): void {
        room.state.enemies = INITIAL_ENEMIES.map(spawn => ({
            id: nextEnemyId(),
            type: spawn.type,
            gridPosition: spawn.gridPosition,
            health: ENEMY_HEALTH[spawn.type],
        }));
    }

    getRoom(roomCode: string): Room | null {
        return this.rooms.get(roomCode) || null;
    }

    getRoomByPlayerId(playerId: string): Room | null {
        for (const room of this.rooms.values()) {
            if (room.state.players.some(p => p.id === playerId)) {
                return room;
            }
        }
        return null;
    }

    removePlayer(playerId: string): Room | null {
        const room = this.getRoomByPlayerId(playerId);
        if (!room) return null;
        room.state.players = room.state.players.filter(p => p.id !== playerId);
        if (room.state.players.length === 0) {
            if (room.roundTimerHandle) clearTimeout(room.roundTimerHandle);
            this.rooms.delete(room.code);
            return null;
        }
        return room;
    }
}
