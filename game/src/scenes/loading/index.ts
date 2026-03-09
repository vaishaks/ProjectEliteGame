import { Scene, GameObjects, Tilemaps } from 'phaser';
import { gameObjectsToObjectPoints } from '../../helpers/gameobject-to-object-point';
import { GridManager } from '../../classes/game/grid-manager';
import { CombatManager } from '../../classes/game/combat-manager';
import { TimerBar } from '../../classes/ui/timer-bar';
import { PhaseOverlay } from '../../classes/ui/phase-overlay';
import { socketService } from '../../services/socket-service';
import { GameState, Player, Enemy, EnemyPhaseAction } from '../../shared/types';

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
    private gridHighlights: GameObjects.Rectangle[] = [];

    // Game state
    private gameState!: GameState;
    private myPlayerId: string = '';
    private controlsEnabled: boolean = false;

    // HUD
    private scoreText!: GameObjects.Text;
    private roundText!: GameObjects.Text;
    private healthText!: GameObjects.Text;

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
    }

    init(data: SceneData): void {
        this.gameState = data.gameState;
        this.myPlayerId = socketService.playerId;
    }

    create(): void {
        this.initMap();
        this.initManagers();
        this.initHUD();
        this.initGridInteraction();
        this.spawnEntities();
        this.setupSocketListeners();
    }

    update(_time: number, delta: number): void {
        this.timerBar.update(delta);
    }

    // === Map Setup ===

    private initMap(): void {
        const map = this.make.tilemap({ key: 'crashed-spaceship-map', tileWidth: 4100, tileHeight: 2475 });
        const tileset = map.addTilesetImage('crashed-spaceship-map-tileset', 'crashed-spaceship-map');
        this.xOffset = (window.innerWidth - 4100 * this.scaleNumber) / 2;
        this.backgroundLayer = map.createLayer('Background', tileset, this.xOffset, 0);
        this.backgroundLayer.setScale(this.scaleNumber);

        const gridPoints = gameObjectsToObjectPoints(
            map.filterObjects('Grid', (obj: any) => obj.name === 'squares'),
        );
        this.gridManager = new GridManager(this.scaleNumber, this.xOffset);
        this.gridManager.loadFromObjectPoints(gridPoints);
    }

    private initManagers(): void {
        this.combatManager = new CombatManager(this);
        this.timerBar = new TimerBar(this, 20, 20, 300, 24);
        this.timerBar.setVisible(false);
        this.phaseOverlay = new PhaseOverlay(this);
    }

    private initHUD(): void {
        this.scoreText = this.add.text(window.innerWidth - 200, 15, 'Score: 0', {
            fontSize: '20px', color: '#ffffff', fontFamily: 'monospace',
        });
        this.roundText = this.add.text(window.innerWidth - 200, 42, 'Round: 1', {
            fontSize: '20px', color: '#ffffff', fontFamily: 'monospace',
        });
        this.healthText = this.add.text(window.innerWidth - 200, 69, 'HP: --', {
            fontSize: '20px', color: '#00ff00', fontFamily: 'monospace',
        });
    }

    // === Grid Interaction ===

    private initGridInteraction(): void {
        for (const squareId of this.gridManager.getAllSquareIds()) {
            const bounds = this.gridManager.getSquareBounds(squareId);
            if (!bounds) continue;

            const highlight = this.add.rectangle(
                bounds.x, bounds.y, bounds.width, bounds.height, 0x00ff00, 0.15
            );
            highlight.setOrigin(0, 0);
            highlight.setVisible(false);
            highlight.setDepth(5);
            this.gridHighlights.push(highlight);

            const zone = this.add.zone(bounds.x, bounds.y, bounds.width, bounds.height);
            zone.setOrigin(0, 0);
            zone.setInteractive({ useHandCursor: true });

            zone.on('pointerover', () => {
                if (this.controlsEnabled && this.isValidMoveTarget(squareId)) {
                    highlight.setVisible(true);
                }
            });
            zone.on('pointerout', () => {
                highlight.setVisible(false);
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

        const spriteKey = SPRITE_KEYS[player.characterKey] || 'player-gherid';
        const sprite = this.add.sprite(center.x, center.y, spriteKey);
        sprite.setScale(this.scaleNumber);
        sprite.setDepth(10);
        this.playerSprites.set(player.id, sprite);
    }

    private spawnEnemySprite(enemy: Enemy): void {
        const center = this.gridManager.getSquareCenter(enemy.gridPosition);
        if (!center) return;

        const spriteKey = SPRITE_KEYS[enemy.type] || 'enemy-runner';
        const sprite = this.add.sprite(center.x, center.y, spriteKey);
        sprite.setScale(this.scaleNumber);
        sprite.setDepth(10);
        sprite.setInteractive({ useHandCursor: true });

        sprite.on('pointerdown', () => {
            if (!this.controlsEnabled) return;
            socketService.sendAttack(enemy.id);
        });

        this.enemySprites.set(enemy.id, sprite);
    }

    // === Socket Listeners ===

    private setupSocketListeners(): void {
        socketService.onRoundStart((data) => {
            this.gameState = data.gameState;
            this.controlsEnabled = true;
            this.timerBar.setVisible(true);
            this.timerBar.start(data.duration);
            this.phaseOverlay.show(`Round ${data.roundNumber} -- GO!`, '#00ff00', 1500);
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
            this.phaseOverlay.show('Enemy Phase', '#ff3300', 1500);
            this.animateEnemyActions(data.actions);
        });

        socketService.onGameOver((data) => {
            this.controlsEnabled = false;
            this.timerBar.stop();
            this.timerBar.setVisible(false);
            this.gameState = data.gameState;

            if (data.won) {
                this.phaseOverlay.show(`Victory! Score: ${data.totalScore}`, '#ffcc00', 0);
            } else {
                this.phaseOverlay.show('Defeat...', '#ff0000', 0);
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

    // === Sprite Sync ===

    private syncSprites(): void {
        for (const player of this.gameState.players) {
            const sprite = this.playerSprites.get(player.id);
            if (!sprite) continue;

            const center = this.gridManager.getSquareCenter(player.gridPosition);
            if (!center) continue;

            this.tweens.add({
                targets: sprite,
                x: center.x,
                y: center.y,
                duration: 300,
                ease: 'Power2',
            });

            if (player.health <= 0) {
                sprite.alpha = 0.3;
            }
        }

        for (const enemy of this.gameState.enemies) {
            const sprite = this.enemySprites.get(enemy.id);
            if (!sprite) continue;

            if (enemy.health <= 0) {
                this.combatManager.playDeathEffect(sprite, () => {
                    this.enemySprites.delete(enemy.id);
                });
                continue;
            }

            const center = this.gridManager.getSquareCenter(enemy.gridPosition);
            if (!center) continue;

            this.tweens.add({
                targets: sprite,
                x: center.x,
                y: center.y,
                duration: 300,
                ease: 'Power2',
            });
        }
    }

    private animateEnemyActions(actions: EnemyPhaseAction[]): void {
        let delay = 500;
        for (const action of actions) {
            this.time.delayedCall(delay, () => {
                if (action.type === 'move' && action.targetGrid) {
                    const sprite = this.enemySprites.get(action.enemyId);
                    if (sprite) {
                        const center = this.gridManager.getSquareCenter(action.targetGrid);
                        if (center) {
                            this.tweens.add({
                                targets: sprite,
                                x: center.x,
                                y: center.y,
                                duration: 400,
                                ease: 'Power2',
                            });
                        }
                    }
                } else if (action.type === 'attack' && action.targetPlayerId && action.damage) {
                    const playerSprite = this.playerSprites.get(action.targetPlayerId);
                    if (playerSprite) {
                        this.combatManager.playHitEffect(playerSprite);
                        this.combatManager.showDamageNumber(playerSprite.x, playerSprite.y, action.damage);
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
        this.scoreText.setText(`Score: ${this.gameState.totalScore}`);
        this.roundText.setText(`Round: ${this.gameState.roundNumber}`);
        if (myPlayer) {
            this.healthText.setText(`HP: ${myPlayer.health}`);
            this.healthText.setColor(myPlayer.health <= 2 ? '#ff3300' : '#00ff00');
        }
    }
}
