import { EnemyType, CharacterKey } from './types';

// === Round Timing ===
export const ROUND_DURATION_MS = 120_000; // 2 minutes
export const ROUND_WARNING_MS = 15_000; // flash timer at 15s remaining

// === Win Condition ===
export const WIN_SCORE = 40;

// === Grid Adjacency Map ===
// Based on the crashed-spaceship-map.json layout:
//   Square 1 (top-left), 3-4 (mid-top row), 5 (mid-center),
//   6-7-8 (mid-right cluster), 9 (bottom-center), 2 (bottom-right)
export const GRID_ADJACENCY: Record<number, number[]> = {
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

// === Enemy Stats ===
export interface EnemyStats {
    health: number;
    damage: number;
    moveSpeed: number; // squares per turn
    attackRange: number; // squares
}

export const ENEMY_STATS: Record<EnemyType, EnemyStats> = {
    runner: { health: 2, damage: 1, moveSpeed: 2, attackRange: 1 },
    biter: { health: 3, damage: 2, moveSpeed: 1, attackRange: 1 },
    shooter: { health: 2, damage: 1, moveSpeed: 0, attackRange: 2 },
};

// === Character Stats ===
export interface CharacterStats {
    health: number;
    damage: number;
    attackRange: number; // squares
    scorePerKill: number;
}

export const CHARACTER_STATS: Record<CharacterKey, CharacterStats> = {
    gherid: { health: 5, damage: 2, attackRange: 1, scorePerKill: 5 },
    akosha: { health: 4, damage: 1, attackRange: 2, scorePerKill: 5 },
};

// === Initial Enemy Spawns ===
export interface EnemySpawn {
    type: EnemyType;
    gridPosition: number;
}

export const INITIAL_ENEMY_SPAWNS: EnemySpawn[] = [
    { type: 'runner', gridPosition: 3 },
    { type: 'runner', gridPosition: 4 },
    { type: 'biter', gridPosition: 5 },
    { type: 'shooter', gridPosition: 6 },
    { type: 'shooter', gridPosition: 7 },
    { type: 'shooter', gridPosition: 8 },
    { type: 'runner', gridPosition: 9 },
    { type: 'biter', gridPosition: 2 },
];

// === Server Config ===
export const SERVER_PORT = 3000;
export const CLIENT_PORT = 5000;
