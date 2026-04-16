import { Scene, GameObjects, Tilemaps } from 'phaser';
import { gameObjectsToObjectPoints } from '../../helpers/gameobject-to-object-point';
import { GridManager } from '../../classes/game/grid-manager';
import { CombatManager } from '../../classes/game/combat-manager';
import { TimerBar } from '../../classes/ui/timer-bar';
import { PhaseOverlay } from '../../classes/ui/phase-overlay';
import { socketService } from '../../services/socket-service';
import { GameState, Player, Enemy, EnemyPhaseAction } from '../../shared/types';

const GW = 1920;
const GH = 1080;

interface SceneData {
    gameState: GameState;
}

const SPRITE_KEYS: Record<string, string> = {
    gherid: 'player-gherid',
    akosha: 'player-akosha',
    runner: 'enemy-runner',
    biter: 'enemy-biter',
    shooter: 'enemy-shooter',
};

export class LoadingScene extends Scene {
    private backgroundLayer!: Tilemaps.TilemapLayer;
    private scaleNumber: number = 0.3;
    private xOffset: number = 0;

    private gridManager!: GridManager;
    private combatManager!: CombatManager;
    private timerBar!: TimerBar;
    private phaseOverlay!: PhaseOverlay;

    // Sprite tracking
    private playerSprites: Map<string, GameObjects.Sprite> = new Map();
    private enemySprites: Map<string, GameObjects.Sprite> = new Map();
    private healthBars: Map<string, { bg: GameObjects.Rectangle; fill: GameObjects.Rectangle }> = new Map();
    private gridHighlights: Map<number, GameObjects.Rectangle> = new Map();
    private attackRangeHighlights: GameObjects.Rectangle[] = [];

    // Game state
    private gameState!: GameState;
    private myPlayerId: string = '';
    private controlsEnabled: boolean = false;

    // HUD
    private hudContainer!: GameObjects.Container;
    private scoreText!: GameObjects.Text;
    private scoreValue!: GameObjects.Text;
    private roundText!: GameObjects.Text;
    private healthText!: GameObjects.Text;
    private healthValue!: GameObjects.Text;

    constructor() {
        super('loading-scene');
    }

    preload(): void {
        this.load.baseURL = 'assets/';
        this.load.image({ key: 'crashed-spaceship-map', url: 'crashed-spaceship-map-v3.png' });
        this.load.image({ key: 'player-gherid', url: 'gherid-v4.png' });
        this.load.image({ key: 'player-akosha', url: 'akosha-v1.png' });
        this.load.image({ key: 'enemy-runner', url: 'runner-v1.png' });
        this.load.image({ key: 'enemy-biter', url: 'biter-v1.png' });
        this.load.image({ key: 'enemy-shooter', url: 'shooter-v1.png' });
        this.load.tilemapTiledJSON('crashed-spaceship-map', 'crashed-spaceship-map.json');

        // Loading progress bar
        const barW = 400;
        const barH = 20;
        const barX = GW / 2 - barW / 2;
        const barY = GH / 2 - barH / 2;

        const progressBg = this.add.rectangle(GW / 2, GH / 2, barW, barH, 0x1a1a3e);
        progressBg.setStrokeStyle(1, 0x00f0ff, 0.5);
        const progressFill = this.add.rectangle(barX + 2, barY + 2, 0, barH - 4, 0x00f0ff);
        progressFill.setOrigin(0, 0);

        const loadText = this.add.text(GW / 2, GH / 2 - 30, 'LOADING MISSION', {
            fontSize: '18px', color: '#00f0ff', fontFamily: 'monospace',
        }).setOrigin(0.5, 0.5);

        this.load.on('progress', (value: number) => {
            progressFill.width = (barW - 4) * value;
        });

        this.load.on('complete', () => {
            progressBg.destroy();
            progressFill.destroy();
            loadText.destroy();
        });

        // Asset error handling
        this.load.on('loaderror', (file: any) => {
            console.error(`Failed to load asset: ${file.key} from ${file.url}`);
        });
    }

    init(data: SceneData): void {
        this.gameState = data.gameState;
        this.myPlayerId = socketService.playerId;
        // Reset state for scene restart
        this.playerSprites = new Map();
        this.enemySprites = new Map();
        this.healthBars = new Map();
        this.gridHighlights = new Map();
        this.attackRangeHighlights = [];
        this.controlsEnabled = false;
    }

    create(): void {
        this.cameras.main.fadeIn(500, 0, 0, 0);

        this.initMap();
        this.initManagers();
        this.initHUD();
        this.initGridInteraction();
        this.spawnEntities();
        this.setupSocketListeners();

        // Signal to server that we're ready for the first round
        socketService.sendPlayerReady();
    }

    update(_time: number, delta: number): void {
        this.timerBar.update(delta);
    }

    // === Map Setup ===

    private initMap(): void {
        // Dark background
        this.add.rectangle(GW / 2, GH / 2, GW, GH, 0x0a0e27);

        const map = this.make.tilemap({ key: 'crashed-spaceship-map', tileWidth: 4100, tileHeight: 2475 });
        const tileset = map.addTilesetImage('crashed-spaceship-map-tileset', 'crashed-spaceship-map');
        if (!tileset) {
            console.error('Failed to load tileset');
            return;
        }

        // Scale map to fit game height, leaving room for HUD
        const mapAreaHeight = GH - 80; // reserve top 80px for HUD
        this.scaleNumber = mapAreaHeight / 2475;
        this.xOffset = (GW - 4100 * this.scaleNumber) / 2;

        this.backgroundLayer = map.createLayer('Background', tileset, this.xOffset, 80);
        this.backgroundLayer.setScale(this.scaleNumber);

        const gridPoints = gameObjectsToObjectPoints(
            map.filterObjects('Grid', (obj: any) => obj.name === 'squares'),
        );
        this.gridManager = new GridManager(this.scaleNumber, this.xOffset, 80);
        this.gridManager.loadFromObjectPoints(gridPoints);
    }

    private initManagers(): void {
        this.combatManager = new CombatManager(this);
        this.timerBar = new TimerBar(this, GW / 2 - 200, 30, 400, 28);
        this.timerBar.setVisible(false);
        this.phaseOverlay = new PhaseOverlay(this);
    }

    private initHUD(): void {
        // Top HUD bar background
        const hudBg = this.add.rectangle(GW / 2, 0, GW, 70, 0x0a0e27, 0.95);
        hudBg.setOrigin(0.5, 0);
        hudBg.setDepth(40);

        const hudLine = this.add.rectangle(GW / 2, 70, GW, 2, 0x00f0ff, 0.3);
        hudLine.setDepth(40);

        // Score (left)
        this.scoreText = this.add.text(30, 18, 'SCORE', {
            fontSize: '12px', color: '#00f0ff', fontFamily: 'monospace',
        });
        this.scoreText.setDepth(41);

        this.scoreValue = this.add.text(30, 35, '0', {
            fontSize: '28px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
        });
        this.scoreValue.setDepth(41);

        // Round (left of center)
        this.roundText = this.add.text(200, 25, 'ROUND 1', {
            fontSize: '18px', color: '#ffaa00', fontFamily: 'monospace', fontStyle: 'bold',
        });
        this.roundText.setDepth(41);

        // Timer bar is in the center (created in initManagers)

        // Health (right)
        this.healthText = this.add.text(GW - 30, 18, 'HEALTH', {
            fontSize: '12px', color: '#00f0ff', fontFamily: 'monospace',
        });
        this.healthText.setOrigin(1, 0);
        this.healthText.setDepth(41);

        this.healthValue = this.add.text(GW - 30, 35, '--', {
            fontSize: '28px', color: '#00ff88', fontFamily: 'monospace', fontStyle: 'bold',
        });
        this.healthValue.setOrigin(1, 0);
        this.healthValue.setDepth(41);
    }

    // === Grid Interaction ===

    private initGridInteraction(): void {
        for (const squareId of this.gridManager.getAllSquareIds()) {
            const bounds = this.gridManager.getSquareBounds(squareId);
            if (!bounds) continue;

            // Hover highlight
            const highlight = this.add.rectangle(
                bounds.x, bounds.y, bounds.width, bounds.height, 0x00f0ff, 0.0
            );
            highlight.setOrigin(0, 0);
            highlight.setDepth(5);
            highlight.setStrokeStyle(2, 0x00f0ff, 0);
            this.gridHighlights.set(squareId, highlight);

            const zone = this.add.zone(bounds.x, bounds.y, bounds.width, bounds.height);
            zone.setOrigin(0, 0);
            zone.setInteractive({ useHandCursor: true });

            zone.on('pointerover', () => {
                if (!this.controlsEnabled) return;
                if (this.isValidMoveTarget(squareId)) {
                    highlight.fillColor = 0x00ff88;
                    highlight.fillAlpha = 0.2;
                    highlight.setStrokeStyle(2, 0x00ff88, 0.8);
                } else if (this.hasEnemyOnSquare(squareId)) {
                    highlight.fillColor = 0xff4444;
                    highlight.fillAlpha = 0.15;
                    highlight.setStrokeStyle(2, 0xff4444, 0.8);
                } else {
                    highlight.fillColor = 0x00f0ff;
                    highlight.fillAlpha = 0.08;
                    highlight.setStrokeStyle(2, 0x00f0ff, 0.3);
                }
            });
            zone.on('pointerout', () => {
                highlight.fillAlpha = 0;
                highlight.setStrokeStyle(2, 0x00f0ff, 0);
            });
            zone.on('pointerdown', () => {
                if (!this.controlsEnabled) return;
                this.handleGridClick(squareId);
            });
        }
    }

    // === Entity Spawning ===

    private spawnEntities(): void {
        for (const player of this.gameState.players) {
            this.spawnPlayerSprite(player);
        }
        for (const enemy of this.gameState.enemies) {
            this.spawnEnemySprite(enemy);
        }
    }

    private spawnPlayerSprite(player: Player): void {
        const center = this.gridManager.getSquareCenter(player.gridPosition);
        if (!center) return;

        const cy = center.y

        const spriteKey = SPRITE_KEYS[player.characterKey] || 'player-gherid';
        const sprite = this.add.sprite(center.x, cy, spriteKey);
        sprite.setScale(this.scaleNumber * 1.2);
        sprite.setDepth(10);

        // Blue tint outline for player
        sprite.setTint(0xaaddff);

        this.playerSprites.set(player.id, sprite);
        this.createHealthBar(player.id, center.x, cy, player.health, player.health, true);
    }

    private spawnEnemySprite(enemy: Enemy): void {
        const center = this.gridManager.getSquareCenter(enemy.gridPosition);
        if (!center) return;

        const cy = center.y;

        const spriteKey = SPRITE_KEYS[enemy.type] || 'enemy-runner';
        const sprite = this.add.sprite(center.x, cy, spriteKey);
        sprite.setScale(this.scaleNumber * 1.2);
        sprite.setDepth(10);

        // Red tint for enemies
        sprite.setTint(0xff8888);

        sprite.setInteractive({ useHandCursor: true });

        sprite.on('pointerdown', () => {
            if (!this.controlsEnabled) return;
            socketService.sendAttack(enemy.id);
        });

        this.enemySprites.set(enemy.id, sprite);

        const health = enemy.health;
        this.createHealthBar(enemy.id, center.x, cy, health, health, false);
    }

    private createHealthBar(
        id: string, x: number, y: number, current: number, max: number, isPlayer: boolean
    ): void {
        const barW = 50;
        const barH = 6;
        const barY = y - 45;

        const bg = this.add.rectangle(x, barY, barW, barH, 0x222244);
        bg.setDepth(15);

        const fillW = (current / max) * barW;
        const color = isPlayer ? 0x00ff88 : 0xff4444;
        const fill = this.add.rectangle(x - barW / 2, barY, fillW, barH - 2, color);
        fill.setOrigin(0, 0.5);
        fill.setDepth(15);

        this.healthBars.set(id, { bg, fill });
    }

    private updateHealthBar(id: string, current: number, max: number, isPlayer: boolean): void {
        const bar = this.healthBars.get(id);
        if (!bar) return;

        const barW = 50;
        const fillW = Math.max(0, (current / max) * barW);
        const color = isPlayer ? 0x00ff88 : 0xff4444;
        bar.fill.fillColor = color;
        this.tweens.add({
            targets: bar.fill,
            width: fillW,
            duration: 200,
        });

        if (current <= 0) {
            bar.bg.setVisible(false);
            bar.fill.setVisible(false);
        }
    }

    // === Socket Listeners ===

    private setupSocketListeners(): void {
        socketService.onRoundStart((data) => {
            this.gameState = data.gameState;
            this.controlsEnabled = true;
            this.timerBar.setVisible(true);
            this.timerBar.start(data.duration);
            this.phaseOverlay.show(
                `ROUND ${data.roundNumber}`,
                '#00ff88',
                1800,
                'ENGAGE HOSTILES'
            );
            this.updateHUD();
        });

        socketService.onStateUpdate((gameState) => {
            this.gameState = gameState;
            this.syncSprites();
            this.updateHUD();
        });

        socketService.onEnemyPhase((data) => {
            this.controlsEnabled = false;
            this.timerBar.stop();
            this.timerBar.setVisible(false);
            this.gameState = data.gameState;
            this.phaseOverlay.show('ENEMY  PHASE', '#ff3300', 1500, 'BRACE FOR CONTACT');
            this.animateEnemyActions(data.actions);
        });

        socketService.onGameOver((data) => {
            this.controlsEnabled = false;
            this.timerBar.stop();
            this.timerBar.setVisible(false);
            this.gameState = data.gameState;

            if (data.won) {
                this.phaseOverlay.show(
                    'MISSION  COMPLETE',
                    '#ffcc00',
                    0,
                    `Final Score: ${data.totalScore}`
                );
            } else {
                this.phaseOverlay.show(
                    'MISSION  FAILED',
                    '#ff0000',
                    0,
                    'All operatives KIA'
                );
            }
        });
    }

    // === Game Logic ===

    private handleGridClick(squareId: number): void {
        const myPlayer = this.gameState.players.find(p => p.id === this.myPlayerId);
        if (!myPlayer || myPlayer.health <= 0) return;

        if (this.isValidMoveTarget(squareId)) {
            socketService.sendMove(squareId);
        }
    }

    private isValidMoveTarget(squareId: number): boolean {
        const myPlayer = this.gameState.players.find(p => p.id === this.myPlayerId);
        if (!myPlayer) return false;
        return this.gridManager.isAdjacent(myPlayer.gridPosition, squareId);
    }

    private hasEnemyOnSquare(squareId: number): boolean {
        return this.gameState.enemies.some(e => e.gridPosition === squareId && e.health > 0);
    }

    // === Sprite Sync ===

    private syncSprites(): void {
        for (const player of this.gameState.players) {
            const sprite = this.playerSprites.get(player.id);
            if (!sprite) continue;

            const center = this.gridManager.getSquareCenter(player.gridPosition);
            if (!center) continue;

            const cy = center.y;

            this.tweens.add({
                targets: sprite,
                x: center.x,
                y: cy,
                duration: 300,
                ease: 'Power2',
            });

            // Move health bar
            const bar = this.healthBars.get(player.id);
            if (bar) {
                this.tweens.add({
                    targets: [bar.bg],
                    x: center.x,
                    y: cy - 45,
                    duration: 300,
                    ease: 'Power2',
                });
                this.tweens.add({
                    targets: [bar.fill],
                    x: center.x - 25,
                    y: cy - 45,
                    duration: 300,
                    ease: 'Power2',
                });
            }

            if (player.health <= 0) {
                sprite.alpha = 0.3;
            }

            const maxHp = player.characterKey === 'gherid' ? 5 : 4;
            this.updateHealthBar(player.id, player.health, maxHp, true);
        }

        for (const enemy of this.gameState.enemies) {
            const sprite = this.enemySprites.get(enemy.id);
            if (!sprite) continue;

            if (enemy.health <= 0) {
                const bar = this.healthBars.get(enemy.id);
                if (bar) {
                    bar.bg.destroy();
                    bar.fill.destroy();
                    this.healthBars.delete(enemy.id);
                }
                this.combatManager.playDeathEffect(sprite, () => {
                    this.enemySprites.delete(enemy.id);
                });
                continue;
            }

            const center = this.gridManager.getSquareCenter(enemy.gridPosition);
            if (!center) continue;

            const cy = center.y;

            this.tweens.add({
                targets: sprite,
                x: center.x,
                y: cy,
                duration: 300,
                ease: 'Power2',
            });

            // Move health bar
            const bar = this.healthBars.get(enemy.id);
            if (bar) {
                this.tweens.add({
                    targets: [bar.bg],
                    x: center.x,
                    y: cy - 45,
                    duration: 300,
                    ease: 'Power2',
                });
                this.tweens.add({
                    targets: [bar.fill],
                    x: center.x - 25,
                    y: cy - 45,
                    duration: 300,
                    ease: 'Power2',
                });
            }

            const maxHp = enemy.type === 'biter' ? 3 : 2;
            this.updateHealthBar(enemy.id, enemy.health, maxHp, false);
        }
    }

    private animateEnemyActions(actions: EnemyPhaseAction[]): void {
        let delay = 1600; // Wait for overlay to clear
        for (const action of actions) {
            this.time.delayedCall(delay, () => {
                if (action.type === 'move' && action.targetGrid) {
                    const sprite = this.enemySprites.get(action.enemyId);
                    if (sprite) {
                        const center = this.gridManager.getSquareCenter(action.targetGrid);
                        if (center) {
                            const cy = center.y;
                            this.tweens.add({
                                targets: sprite,
                                x: center.x,
                                y: cy,
                                duration: 400,
                                ease: 'Power2',
                            });
                            // Move health bar
                            const bar = this.healthBars.get(action.enemyId);
                            if (bar) {
                                this.tweens.add({
                                    targets: [bar.bg],
                                    x: center.x,
                                    y: cy - 45,
                                    duration: 400,
                                    ease: 'Power2',
                                });
                                this.tweens.add({
                                    targets: [bar.fill],
                                    x: center.x - 25,
                                    y: cy - 45,
                                    duration: 400,
                                    ease: 'Power2',
                                });
                            }
                        }
                    }
                } else if (action.type === 'attack' && action.targetPlayerId && action.damage) {
                    const playerSprite = this.playerSprites.get(action.targetPlayerId);
                    if (playerSprite) {
                        this.combatManager.playHitEffect(playerSprite);
                        this.combatManager.showDamageNumber(playerSprite.x, playerSprite.y, action.damage);
                        // Screen shake on hit
                        this.cameras.main.shake(200, 0.005);
                    }
                }
            });
            delay += 600;
        }

        this.time.delayedCall(delay, () => {
            this.syncSprites();
            this.updateHUD();
        });
    }

    private updateHUD(): void {
        const myPlayer = this.gameState.players.find(p => p.id === this.myPlayerId);
        this.scoreValue.setText(`${this.gameState.totalScore}`);
        this.roundText.setText(`ROUND ${this.gameState.roundNumber}`);
        if (myPlayer) {
            this.healthValue.setText(`${myPlayer.health}`);
            this.healthValue.setColor(myPlayer.health <= 2 ? '#ff3300' : '#00ff88');
        }
    }
}
