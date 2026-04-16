import { GRID_ADJACENCY } from '../../shared/constants';
import { GridSquare } from '../../shared/types';

/**
 * Manages the grid squares from the Tiled map data,
 * including adjacency lookups and coordinate calculations.
 */
export class GridManager {
    private squares: Map<number, GridSquare> = new Map();
    private mapScale: number;
    private xOffset: number;
    private yOffset: number;

    constructor(mapScale: number, xOffset: number, yOffset: number = 0) {
        this.mapScale = mapScale;
        this.xOffset = xOffset;
        this.yOffset = yOffset;
    }

    /**
     * Initialize grid squares from Tiled map object points.
     */
    loadFromObjectPoints(points: Array<{ id: number; x: number; y: number; width: number; height: number }>): void {
        for (const point of points) {
            this.squares.set(point.id, {
                id: point.id,
                x: point.x,
                y: point.y,
                width: point.width,
                height: point.height,
            });
        }
    }

    /**
     * Get the screen-space center coordinates for a grid square.
     */
    getSquareCenter(id: number): { x: number; y: number } | null {
        const square = this.squares.get(id);
        if (!square) return null;
        return {
            x: (square.x + square.width / 2) * this.mapScale + this.xOffset,
            y: (square.y + square.height / 2) * this.mapScale + this.yOffset,
        };
    }

    /**
     * Get the screen-space bounds for a grid square (for hit testing / highlighting).
     */
    getSquareBounds(id: number): { x: number; y: number; width: number; height: number } | null {
        const square = this.squares.get(id);
        if (!square) return null;
        return {
            x: square.x * this.mapScale + this.xOffset,
            y: square.y * this.mapScale + this.yOffset,
            width: square.width * this.mapScale,
            height: square.height * this.mapScale,
        };
    }

    getAdjacentSquares(id: number): number[] {
        return GRID_ADJACENCY[id] || [];
    }

    isAdjacent(from: number, to: number): boolean {
        return this.getAdjacentSquares(from).includes(to);
    }

    getAllSquareIds(): number[] {
        return Array.from(this.squares.keys());
    }
}
