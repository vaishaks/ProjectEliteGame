import { GameObjects } from 'phaser';
import { EliteScene } from '../elite';
import { socketService } from '../../services/socket-service';
import { Player, CharacterKey } from '../../shared/types';

interface SceneData {
    playerName: string;
    roomCode: string;
    isHost: boolean;
}

export class SelectCharacterScene extends EliteScene {
    private background!: GameObjects.Image;
    private scaleNumber: number;
    private selectedCharacter: CharacterKey = 'gherid';
    private selectionIndicators: GameObjects.Graphics[] = [];
    private playerListTexts: GameObjects.Text[] = [];
    private statusText!: GameObjects.Text;
    private sceneData!: SceneData;

    constructor() {
        super('character-select-scene');
        this.scaleNumber = 1;
    }

    preload(): void {
        this.load.baseURL = 'https://projectelitestorage.blob.core.windows.net/assets/';
        this.load.image({ key: 'select-character-background', url: 'select-character-background.png' });
        this.load.image({ key: 'select-character-corner', url: 'select-character-corner-v3.png' });
        this.load.image({ key: 'activity-box', url: 'activity-box.png' });
        this.load.image({ key: 'start-game-btn', url: 'start-game-btn.png' });
        this.load.image({ key: 'character-gherid', url: 'character-gherid.png' });
        this.load.image({ key: 'room-code-textbox', url: 'room-code-textbox.png' });
    }

    init(data: SceneData): void {
        this.sceneData = data;
    }

    create(): void {
        // Place the background in the center of the window
        this.background = this.add.image(window.innerWidth / 2, window.innerHeight / 2, 'select-character-background');
        this.scaleNumber = window.innerHeight / this.background.height;
        this.background.setScale(this.scaleNumber);

        const cornerImage = this.add.sprite(0, 0, 'select-character-corner');
        cornerImage.setOrigin(0, 0);
        cornerImage.setScale(this.scaleNumber);

        // Room code display
        this.add.text(
            window.innerWidth / 2,
            30,
            `Room: ${this.sceneData.roomCode}`,
            { fontSize: '28px', color: '#ffffff', fontFamily: 'monospace' }
        ).setOrigin(0.5, 0);

        // Activity box on the right side
        const activityBox = this.add.sprite(0, 0, 'activity-box');
        activityBox.setPosition(window.innerWidth - activityBox.width * this.scaleNumber * 0.55, window.innerHeight * 0.45);
        activityBox.setScale(this.scaleNumber);

        // Character selection slots
        const characters: { key: CharacterKey; label: string }[] = [
            { key: 'gherid', label: 'Gherid' },
            { key: 'akosha', label: 'Akosha' },
        ];

        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2 * 0.7;
        const slotSpacing = 250 * this.scaleNumber;

        characters.forEach((char, index) => {
            const x = centerX + (index - 0.5) * slotSpacing;
            const y = centerY;

            // Selection indicator (green border when selected)
            const indicator = this.add.graphics();
            indicator.lineStyle(4, 0x00ff00);
            indicator.strokeRect(
                x - 60 * this.scaleNumber,
                y - 80 * this.scaleNumber,
                120 * this.scaleNumber,
                160 * this.scaleNumber
            );
            indicator.setVisible(char.key === this.selectedCharacter);
            this.selectionIndicators.push(indicator);

            // Character sprite
            const sprite = this.add.sprite(x, y, 'character-gherid');
            sprite.setScale(this.scaleNumber);
            sprite.setInteractive({ useHandCursor: true });

            // Character label
            this.add.text(x, y + 90 * this.scaleNumber, char.label, {
                fontSize: '22px',
                color: '#ffffff',
                fontFamily: 'monospace',
            }).setOrigin(0.5, 0);

            // Click handler
            sprite.on('pointerdown', () => {
                this.selectedCharacter = char.key;
                socketService.selectCharacter(char.key);
                this.updateSelectionIndicators(index);
            });
        });

        // Player list header
        this.statusText = this.add.text(
            window.innerWidth - activityBox.width * this.scaleNumber * 0.55,
            window.innerHeight * 0.25,
            'Players:',
            { fontSize: '20px', color: '#ffffff', fontFamily: 'monospace' }
        ).setOrigin(0.5, 0);

        // Start game button (host only)
        const startGameBtn = this.add.sprite(window.innerWidth / 2, window.innerHeight * 0.93, 'start-game-btn');
        startGameBtn.setScale(this.scaleNumber);
        startGameBtn.setInteractive({ useHandCursor: true });
        startGameBtn.alpha = this.sceneData.isHost ? 0.9 : 0.3;

        if (this.sceneData.isHost) {
            startGameBtn.on('pointerdown', () => {
                socketService.startGame();
            });
            startGameBtn.on('pointerover', () => { startGameBtn.alpha = 1; });
            startGameBtn.on('pointerout', () => { startGameBtn.alpha = 0.9; });
        }

        // Socket event listeners
        socketService.onPlayerJoined((players: Player[]) => {
            this.updatePlayerList(players);
        });

        socketService.onCharacterSelected((players: Player[]) => {
            this.updatePlayerList(players);
        });

        socketService.onGameStarted((data) => {
            this.scene.start('loading-scene', {
                gameState: data.gameState,
            });
        });
    }

    private updateSelectionIndicators(selectedIndex: number): void {
        this.selectionIndicators.forEach((indicator, i) => {
            indicator.setVisible(i === selectedIndex);
        });
    }

    private updatePlayerList(players: Player[]): void {
        this.playerListTexts.forEach(t => t.destroy());
        this.playerListTexts = [];

        const baseX = this.statusText.x;
        const baseY = this.statusText.y + 30;

        players.forEach((player, index) => {
            const readyIcon = player.isReady ? '[ok]' : '[..]';
            const text = this.add.text(
                baseX,
                baseY + index * 28,
                `${readyIcon} ${player.name} (${player.characterKey})`,
                { fontSize: '18px', color: '#cccccc', fontFamily: 'monospace' }
            ).setOrigin(0.5, 0);
            this.playerListTexts.push(text);
        });
    }
}
