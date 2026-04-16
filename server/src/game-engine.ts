import { Server } from 'socket.io';
import { RoomManager, Room } from './room-manager';
import { SocketEvent, Player } from './types';
import { computeEnemyPhase } from './enemy-ai';

const ROUND_DURATION_MS = 120_000;
const WIN_SCORE = 40;

const GRID_ADJACENCY: Record<number, number[]> = {
    1: [3],
    2: [8, 9],
    3: [1, 4, 5],
    4: [3, 5],
    5: [3, 4, 6, 9],
    6: [5, 7],
    7: [6, 8],
    8: [7, 2],
    9: [5, 2],
};

const CHARACTER_DAMAGE: Record<string, number> = {
    gherid: 2,
    akosha: 1,
};

const CHARACTER_RANGE: Record<string, number> = {
    gherid: 1,
    akosha: 2,
};

const SCORE_PER_KILL = 5;

function bfsDistance(from: number, to: number): number {
    if (from === to) return 0;
    const visited = new Set<number>([from]);
    const queue: Array<{ node: number; dist: number }> = [{ node: from, dist: 0 }];
    while (queue.length > 0) {
        const current = queue.shift()!;
        for (const neighbor of GRID_ADJACENCY[current.node] || []) {
            if (neighbor === to) return current.dist + 1;
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push({ node: neighbor, dist: current.dist + 1 });
            }
        }
    }
    return Infinity;
}

export class GameEngine {
    // Track which players have sent PLAYER_READY per room
    private readyPlayers: Map<string, Set<string>> = new Map();

    constructor(
        private io: Server,
        private roomManager: RoomManager,
    ) {}

    startGame(roomCode: string): void {
        const room = this.roomManager.getRoom(roomCode);
        if (!room) return;

        this.roomManager.initializeEnemies(room);
        room.state.currentPhase = 'player-round';
        room.state.roundNumber = 1;
        room.state.roundTimer = ROUND_DURATION_MS;

        // Initialize ready tracking for this room
        this.readyPlayers.set(roomCode, new Set());

        // Emit GAME_STARTED — client will transition to game scene,
        // then send PLAYER_READY when create() finishes.
        this.io.to(roomCode).emit(SocketEvent.GAME_STARTED, {
            gameState: room.state,
        });

        // Do NOT call startPlayerRound here — wait for all players to be ready.
    }

    handlePlayerReady(playerId: string): void {
        const room = this.roomManager.getRoomByPlayerId(playerId);
        if (!room) return;

        const readySet = this.readyPlayers.get(room.code);
        if (!readySet) return;

        readySet.add(playerId);
        console.log(`Player ${playerId} ready (${readySet.size}/${room.state.players.length})`);

        // When all players are ready, start the first round
        if (readySet.size >= room.state.players.length) {
            this.readyPlayers.delete(room.code);
            this.startPlayerRound(room);
        }
    }

    private startPlayerRound(room: Room): void {
        room.state.currentPhase = 'player-round';
        room.state.roundTimer = ROUND_DURATION_MS;

        this.io.to(room.code).emit(SocketEvent.ROUND_START, {
            roundNumber: room.state.roundNumber,
            duration: ROUND_DURATION_MS,
            gameState: room.state,
        });

        // Set timer for end of player round
        room.roundTimerHandle = setTimeout(() => {
            this.startEnemyPhase(room);
        }, ROUND_DURATION_MS);
    }

    private startEnemyPhase(room: Room): void {
        room.state.currentPhase = 'enemy-round';

        const actions = computeEnemyPhase(room.state.enemies, room.state.players);

        // Apply damage to players
        for (const action of actions) {
            if (action.type === 'attack' && action.targetPlayerId && action.damage) {
                const player = room.state.players.find(p => p.id === action.targetPlayerId);
                if (player) {
                    player.health = Math.max(0, player.health - action.damage);
                }
            }
        }

        this.io.to(room.code).emit(SocketEvent.ENEMY_PHASE, {
            actions,
            gameState: room.state,
        });

        // Check lose condition — all players dead
        const allDead = room.state.players.every(p => p.health <= 0);
        if (allDead) {
            this.endGame(room, false);
            return;
        }

        // Start next round after a brief delay for enemy animations
        setTimeout(() => {
            room.state.roundNumber++;
            this.startPlayerRound(room);
        }, 3000);
    }

    handlePlayerMove(playerId: string, targetGrid: number): void {
        const room = this.roomManager.getRoomByPlayerId(playerId);
        if (!room || room.state.currentPhase !== 'player-round') return;

        const player = room.state.players.find(p => p.id === playerId);
        if (!player || player.health <= 0) return;

        // Validate adjacency
        const adjacent = GRID_ADJACENCY[player.gridPosition] || [];
        if (!adjacent.includes(targetGrid)) return;

        player.gridPosition = targetGrid;
        this.io.to(room.code).emit(SocketEvent.STATE_UPDATE, {
            gameState: room.state,
        });
    }

    handlePlayerAttack(playerId: string, targetEnemyId: string): void {
        const room = this.roomManager.getRoomByPlayerId(playerId);
        if (!room || room.state.currentPhase !== 'player-round') return;

        const player = room.state.players.find(p => p.id === playerId);
        if (!player || player.health <= 0) return;

        const enemy = room.state.enemies.find(e => e.id === targetEnemyId);
        if (!enemy || enemy.health <= 0) return;

        // Validate range
        const dist = bfsDistance(player.gridPosition, enemy.gridPosition);
        const range = CHARACTER_RANGE[player.characterKey] || 1;
        if (dist > range) return;

        const damage = CHARACTER_DAMAGE[player.characterKey] || 1;
        enemy.health = Math.max(0, enemy.health - damage);

        if (enemy.health <= 0) {
            player.score += SCORE_PER_KILL;
            room.state.totalScore += SCORE_PER_KILL;
        }

        this.io.to(room.code).emit(SocketEvent.STATE_UPDATE, {
            gameState: room.state,
        });

        // Check win
        if (room.state.totalScore >= WIN_SCORE) {
            this.endGame(room, true);
        }
    }

    private endGame(room: Room, won: boolean): void {
        room.state.currentPhase = 'game-over';
        if (room.roundTimerHandle) {
            clearTimeout(room.roundTimerHandle);
            room.roundTimerHandle = null;
        }

        this.io.to(room.code).emit(SocketEvent.GAME_OVER, {
            won,
            totalScore: room.state.totalScore,
            gameState: room.state,
        });
    }
}
