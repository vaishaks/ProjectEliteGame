import { Enemy, Player, EnemyPhaseAction } from './types';

// Grid adjacency — must match client-side constants
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

const ENEMY_CONFIG: Record<string, { moveSpeed: number; damage: number; attackRange: number }> = {
    runner: { moveSpeed: 2, damage: 1, attackRange: 1 },
    biter: { moveSpeed: 1, damage: 2, attackRange: 1 },
    shooter: { moveSpeed: 0, damage: 1, attackRange: 2 },
};

/**
 * BFS to find shortest path length between two grid squares.
 */
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

/**
 * Find the nearest player to a given grid position.
 */
function findNearestPlayer(gridPosition: number, players: Player[]): Player | null {
    const alivePlayers = players.filter(p => p.health > 0);
    if (alivePlayers.length === 0) return null;

    let nearest: Player | null = null;
    let minDist = Infinity;
    for (const player of alivePlayers) {
        const dist = bfsDistance(gridPosition, player.gridPosition);
        if (dist < minDist) {
            minDist = dist;
            nearest = player;
        }
    }
    return nearest;
}

/**
 * Move one step toward target using BFS. Returns next grid position.
 */
function moveToward(from: number, target: number): number {
    if (from === target) return from;
    const neighbors = GRID_ADJACENCY[from] || [];
    let bestNeighbor = from;
    let bestDist = bfsDistance(from, target);
    for (const neighbor of neighbors) {
        const dist = bfsDistance(neighbor, target);
        if (dist < bestDist) {
            bestDist = dist;
            bestNeighbor = neighbor;
        }
    }
    return bestNeighbor;
}

/**
 * Compute all enemy actions for the enemy phase.
 */
export function computeEnemyPhase(enemies: Enemy[], players: Player[]): EnemyPhaseAction[] {
    const actions: EnemyPhaseAction[] = [];
    const alivePlayers = players.filter(p => p.health > 0);
    if (alivePlayers.length === 0) return actions;

    for (const enemy of enemies) {
        if (enemy.health <= 0) continue;

        const config = ENEMY_CONFIG[enemy.type];
        const nearest = findNearestPlayer(enemy.gridPosition, players);
        if (!nearest) continue;

        // Move phase
        let currentPos = enemy.gridPosition;
        for (let step = 0; step < config.moveSpeed; step++) {
            const nextPos = moveToward(currentPos, nearest.gridPosition);
            if (nextPos !== currentPos) {
                currentPos = nextPos;
            }
        }
        if (currentPos !== enemy.gridPosition) {
            actions.push({
                enemyId: enemy.id,
                type: 'move',
                targetGrid: currentPos,
            });
            enemy.gridPosition = currentPos;
        }

        // Attack phase — check if any player is within attack range
        for (const player of alivePlayers) {
            const dist = bfsDistance(enemy.gridPosition, player.gridPosition);
            if (dist <= config.attackRange) {
                actions.push({
                    enemyId: enemy.id,
                    type: 'attack',
                    targetPlayerId: player.id,
                    damage: config.damage,
                });
                break; // one attack per enemy per phase
            }
        }
    }

    return actions;
}
