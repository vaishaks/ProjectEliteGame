import { GameObjects } from 'phaser';
import { EliteScene } from '../elite';
import { socketService } from '../../services/socket-service';
import { Player, CharacterKey } from '../../shared/types';
import { CHARACTER_STATS } from '../../shared/constants';

const GW = 1920;
const GH = 1080;

interface SceneData {
    playerName: string;
    roomCode: string;
    isHost: boolean;
    players: Player[];
}

interface CharacterCard {
    key: CharacterKey;
    label: string;
    desc: string;
    container: GameObjects.Container;
    bg: GameObjects.Graphics;
    glow: GameObjects.Graphics;
}

export class SelectCharacterScene extends EliteScene {
    private selectedCharacter: CharacterKey = 'gherid';
    private cards: CharacterCard[] = [];
    private playerListTexts: GameObjects.Text[] = [];
    private playerListHeader!: GameObjects.Text;
    private sceneData!: SceneData;

    constructor() {
        super('character-select-scene');
    }

    preload(): void {
        this.load.baseURL = 'assets/';
        // Load character sprites from local assets (same ones the game scene uses)
        this.load.image({ key: 'char-gherid', url: 'gherid-v4.png' });
        this.load.image({ key: 'char-akosha', url: 'akosha-v1.png' });

        this.load.on('loaderror', (file: any) => {
            console.error(`Failed to load asset: ${file.key} from ${file.url}`);
        });
    }

    init(data: SceneData): void {
        this.sceneData = data;
        this.cards = [];
        this.playerListTexts = [];
    }

    create(): void {
        this.cameras.main.fadeIn(500, 0, 0, 0);

        // Dark background with subtle gradient feel
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0a0e27, 0x0a0e27, 0x141838, 0x141838, 1);
        bg.fillRect(0, 0, GW, GH);

        // Grid pattern overlay for sci-fi feel
        const gridOverlay = this.add.graphics();
        gridOverlay.lineStyle(1, 0x00f0ff, 0.03);
        for (let x = 0; x < GW; x += 60) {
            gridOverlay.lineBetween(x, 0, x, GH);
        }
        for (let y = 0; y < GH; y += 60) {
            gridOverlay.lineBetween(0, y, GW, y);
        }

        // === ROOM CODE (top center) ===
        const roomCodeBg = this.add.graphics();
        roomCodeBg.fillStyle(0x1a1a3e, 0.8);
        roomCodeBg.fillRoundedRect(GW / 2 - 160, 20, 320, 60, 8);
        roomCodeBg.lineStyle(2, 0x00f0ff, 0.6);
        roomCodeBg.strokeRoundedRect(GW / 2 - 160, 20, 320, 60, 8);

        this.add.text(GW / 2, 36, 'ROOM CODE', {
            fontSize: '14px', color: '#00f0ff', fontFamily: 'monospace',
        }).setOrigin(0.5, 0);

        this.add.text(GW / 2, 56, this.sceneData.roomCode, {
            fontSize: '28px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0.5, 0);

        // === TITLE ===
        this.add.text(GW / 2, 120, 'SELECT YOUR OPERATIVE', {
            fontSize: '32px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0.5, 0.5);

        // Decorative line
        const line = this.add.rectangle(GW / 2, 145, 400, 2, 0x00f0ff, 0.4);

        // === CHARACTER CARDS ===
        const characters: { key: CharacterKey; label: string; desc: string; spriteKey: string }[] = [
            { key: 'gherid', label: 'GHERID', desc: 'Heavy assault operative.\nClose-range devastation.', spriteKey: 'char-gherid' },
            { key: 'akosha', label: 'AKOSHA', desc: 'Recon specialist.\nLong-range precision.', spriteKey: 'char-akosha' },
        ];

        const cardWidth = 340;
        const cardHeight = 520;
        const cardSpacing = 100;
        const totalWidth = characters.length * cardWidth + (characters.length - 1) * cardSpacing;
        const startX = (GW - totalWidth) / 2 + cardWidth / 2;
        const cardY = GH / 2 + 20;

        characters.forEach((char, index) => {
            const x = startX + index * (cardWidth + cardSpacing);
            this.createCharacterCard(x, cardY, cardWidth, cardHeight, char);
        });

        // Select gherid by default
        this.updateCardSelection();

        // === PLAYER LIST (right side) ===
        const panelX = GW - 280;
        const panelY = 200;
        const panelW = 240;
        const panelH = 400;

        const playerPanel = this.add.graphics();
        playerPanel.fillStyle(0x1a1a3e, 0.7);
        playerPanel.fillRoundedRect(panelX - panelW / 2, panelY, panelW, panelH, 8);
        playerPanel.lineStyle(1, 0x00f0ff, 0.3);
        playerPanel.strokeRoundedRect(panelX - panelW / 2, panelY, panelW, panelH, 8);

        this.playerListHeader = this.add.text(panelX, panelY + 20, 'SQUAD', {
            fontSize: '18px', color: '#00f0ff', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0.5, 0);

        this.add.rectangle(panelX, panelY + 50, panelW - 40, 1, 0x00f0ff, 0.3);

        // Populate initial player list
        if (this.sceneData.players && this.sceneData.players.length > 0) {
            this.updatePlayerList(this.sceneData.players);
        }

        // === START GAME BUTTON ===
        const btnY = GH - 80;
        const btnW = 280;
        const btnH = 56;

        const btnBg = this.add.graphics();
        const btnContainer = this.add.container(GW / 2, btnY);

        const drawBtn = (hover: boolean) => {
            btnBg.clear();
            const color = this.sceneData.isHost ? (hover ? 0x00ff88 : 0x00cc44) : 0x333355;
            const alpha = this.sceneData.isHost ? 1 : 0.4;
            btnBg.fillStyle(color, alpha);
            btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
            if (this.sceneData.isHost && hover) {
                btnBg.lineStyle(2, 0x00ff88, 0.8);
                btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
            }
        };
        drawBtn(false);

        const btnText = this.add.text(0, 0, this.sceneData.isHost ? 'START  MISSION' : 'WAITING FOR HOST', {
            fontSize: '22px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0.5, 0.5);

        btnContainer.add([btnBg, btnText]);

        const btnZone = this.add.zone(GW / 2, btnY, btnW, btnH).setInteractive({ useHandCursor: this.sceneData.isHost });

        if (this.sceneData.isHost) {
            btnZone.on('pointerover', () => {
                drawBtn(true);
                this.tweens.add({ targets: btnContainer, scaleX: 1.05, scaleY: 1.05, duration: 100 });
            });
            btnZone.on('pointerout', () => {
                drawBtn(false);
                this.tweens.add({ targets: btnContainer, scaleX: 1, scaleY: 1, duration: 100 });
            });
            btnZone.on('pointerdown', () => {
                socketService.startGame();
            });
        }

        // === SOCKET LISTENERS ===
        socketService.onPlayerJoined((players: Player[]) => {
            this.updatePlayerList(players);
        });

        socketService.onCharacterSelected((players: Player[]) => {
            this.updatePlayerList(players);
        });

        socketService.onGameStarted((data) => {
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.time.delayedCall(400, () => {
                this.scene.start('loading-scene', {
                    gameState: data.gameState,
                });
            });
        });
    }

    private createCharacterCard(
        x: number, y: number, w: number, h: number,
        char: { key: CharacterKey; label: string; desc: string; spriteKey: string }
    ): void {
        const container = this.add.container(x, y);

        // Selection glow (behind card)
        const glow = this.add.graphics();
        glow.fillStyle(0x00f0ff, 0.15);
        glow.fillRoundedRect(-w / 2 - 6, -h / 2 - 6, w + 12, h + 12, 14);
        glow.setVisible(false);

        // Card background
        const bg = this.add.graphics();
        bg.fillStyle(0x1a1a3e, 0.9);
        bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
        bg.lineStyle(2, 0x3a3a6e, 0.8);
        bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);

        // Character sprite
        const sprite = this.add.image(0, -h / 2 + 130, char.spriteKey);
        const spriteScale = Math.min(200 / sprite.width, 200 / sprite.height);
        sprite.setScale(spriteScale);

        // Character name
        const nameText = this.add.text(0, -h / 2 + 250, char.label, {
            fontSize: '26px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0.5, 0.5);

        // Separator
        const sep = this.add.rectangle(0, -h / 2 + 275, w - 60, 1, 0x00f0ff, 0.3);

        // Description
        const descText = this.add.text(0, -h / 2 + 305, char.desc, {
            fontSize: '14px', color: '#aaaacc', fontFamily: 'monospace',
            align: 'center',
        }).setOrigin(0.5, 0);

        // Stats
        const stats = CHARACTER_STATS[char.key];
        const statsY = h / 2 - 120;
        this.createStatBar(container, -w / 2 + 30, statsY, w - 60, 'HP', stats.health, 5, 0x00ff88);
        this.createStatBar(container, -w / 2 + 30, statsY + 40, w - 60, 'DMG', stats.damage, 3, 0xff6644);
        this.createStatBar(container, -w / 2 + 30, statsY + 80, w - 60, 'RNG', stats.attackRange, 3, 0x00f0ff);

        container.add([glow, bg, sprite, nameText, sep, descText]);

        // Interaction zone
        const zone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });

        zone.on('pointerover', () => {
            if (char.key !== this.selectedCharacter) {
                this.tweens.add({ targets: container, scaleX: 1.03, scaleY: 1.03, duration: 100 });
            }
        });
        zone.on('pointerout', () => {
            if (char.key !== this.selectedCharacter) {
                this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 });
            }
        });
        zone.on('pointerdown', () => {
            this.selectedCharacter = char.key;
            socketService.selectCharacter(char.key);
            this.updateCardSelection();
        });

        this.cards.push({ key: char.key, label: char.label, desc: char.desc, container, bg, glow });
    }

    private createStatBar(
        container: GameObjects.Container, x: number, y: number, width: number,
        label: string, value: number, max: number, color: number
    ): void {
        const labelText = this.add.text(x, y, label, {
            fontSize: '13px', color: '#888899', fontFamily: 'monospace',
        }).setOrigin(0, 0.5);

        const barX = x + 50;
        const barW = width - 80;
        const barH = 10;

        const barBg = this.add.rectangle(barX, y, barW, barH, 0x222244);
        barBg.setOrigin(0, 0.5);

        const fillW = (value / max) * barW;
        const barFill = this.add.rectangle(barX, y, fillW, barH - 2, color);
        barFill.setOrigin(0, 0.5);

        const valText = this.add.text(barX + barW + 8, y, `${value}`, {
            fontSize: '13px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0, 0.5);

        container.add([labelText, barBg, barFill, valText]);
    }

    private updateCardSelection(): void {
        this.cards.forEach(card => {
            const isSelected = card.key === this.selectedCharacter;
            card.glow.setVisible(isSelected);

            if (isSelected) {
                // Redraw border with glow color
                card.bg.clear();
                card.bg.fillStyle(0x1a1a3e, 0.95);
                card.bg.fillRoundedRect(-170, -260, 340, 520, 10);
                card.bg.lineStyle(2, 0x00f0ff, 1);
                card.bg.strokeRoundedRect(-170, -260, 340, 520, 10);

                this.tweens.add({ targets: card.container, scaleX: 1.05, scaleY: 1.05, duration: 200 });
            } else {
                card.bg.clear();
                card.bg.fillStyle(0x1a1a3e, 0.7);
                card.bg.fillRoundedRect(-170, -260, 340, 520, 10);
                card.bg.lineStyle(2, 0x3a3a6e, 0.5);
                card.bg.strokeRoundedRect(-170, -260, 340, 520, 10);

                this.tweens.add({ targets: card.container, scaleX: 1, scaleY: 1, duration: 200 });
            }
        });
    }

    private updatePlayerList(players: Player[]): void {
        this.playerListTexts.forEach(t => t.destroy());
        this.playerListTexts = [];

        const baseX = GW - 280;
        const baseY = 275;

        players.forEach((player, index) => {
            const readyIcon = player.isReady ? '◆' : '◇';
            const color = player.isReady ? '#00ff88' : '#666688';
            const text = this.add.text(
                baseX,
                baseY + index * 36,
                `${readyIcon}  ${player.name}`,
                { fontSize: '16px', color, fontFamily: 'monospace' }
            ).setOrigin(0.5, 0);

            const charText = this.add.text(
                baseX,
                baseY + index * 36 + 18,
                player.characterKey.toUpperCase(),
                { fontSize: '11px', color: '#00f0ff', fontFamily: 'monospace' }
            ).setOrigin(0.5, 0);

            this.playerListTexts.push(text, charText);
        });
    }
}
