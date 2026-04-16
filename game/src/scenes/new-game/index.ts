import { GameObjects } from "phaser";
import { Textbox } from "../../classes/ui/textbox";
import { Button } from "../../classes/ui/button";
import { EliteScene } from "../elite";
import { socketService } from "../../services/socket-service";

const GW = 1920;
const GH = 1080;

export class NewGameScene extends EliteScene {
    private background!: GameObjects.Image;
    private scaleNumber: number;
    private newGameBtn!: Button;
    private joinGameBtn!: Button;
    private nextBtn!: Button;
    private nameTextBox!: Textbox;
    private roomCodeTextBox!: Textbox;
    private isJoining: boolean = false;
    private titleText!: GameObjects.Text;
    private titleGlow!: GameObjects.Text;
    private particles: GameObjects.Arc[] = [];

    constructor() {
        super('new-game-scene');
        this.scaleNumber = 1;
    }

    preload(): void {
        this.load.baseURL = 'assets/'
        this.load.image({ key: 'game-background', url: 'game-background-v2.png' });
        this.load.image({ key: 'new-game-btn', url: 'new-game-btn.png' });
        this.load.image({ key: 'new-game-btn-active', url: 'new-game-btn-active.png' });
        this.load.image({ key: 'join-game-btn', url: 'join-game-btn.png' });
        this.load.image({ key: 'join-game-btn-active', url: 'join-game-btn-active.png' });
        this.load.image({ key: 'name-textbox', url: 'name-textbox.png' });
        this.load.image({ key: 'room-code-textbox', url: 'room-code-textbox.png' });
        this.load.image({ key: 'next-btn', url: 'next-btn.png' });
        this.load.image({ key: 'next-btn-active', url: 'next-btn-active.png' });

        // Asset error handling
        this.load.on('loaderror', (file: any) => {
            console.error(`Failed to load asset: ${file.key} from ${file.url}`);
        });
    }

    create(): void {
        // Fade in
        this.cameras.main.fadeIn(500, 0, 0, 0);

        // Background - fill the game canvas
        this.background = this.add.image(GW / 2, GH / 2, 'game-background');
        this.scaleNumber = Math.max(GW / this.background.width, GH / this.background.height);
        this.background.setScale(this.scaleNumber);

        // Darken overlay for readability
        const overlay = this.add.rectangle(GW / 2, GH / 2, GW, GH, 0x000000, 0.3);
        overlay.setDepth(1);

        // Floating particles
        this.createParticles();

        // Title text with glow
        this.titleGlow = this.add.text(GW / 2, 180, 'PROJECT  ELITE', {
            fontSize: '72px',
            color: '#00f0ff',
            fontFamily: 'monospace',
            fontStyle: 'bold',
        });
        this.titleGlow.setOrigin(0.5, 0.5);
        this.titleGlow.setDepth(10);
        this.titleGlow.setAlpha(0.3);

        this.titleText = this.add.text(GW / 2, 180, 'PROJECT  ELITE', {
            fontSize: '72px',
            color: '#ffffff',
            fontFamily: 'monospace',
            fontStyle: 'bold',
        });
        this.titleText.setOrigin(0.5, 0.5);
        this.titleText.setDepth(10);
        this.titleText.setShadow(0, 0, '#00f0ff', 20, true, true);

        // Subtitle
        const subtitle = this.add.text(GW / 2, 240, 'TACTICAL  COMBAT  EVOLVED', {
            fontSize: '18px',
            color: '#00f0ff',
            fontFamily: 'monospace',
        });
        subtitle.setOrigin(0.5, 0.5);
        subtitle.setDepth(10);
        subtitle.setAlpha(0.7);

        // Decorative lines
        const lineLeft = this.add.rectangle(GW / 2 - 280, 210, 150, 2, 0x00f0ff, 0.5);
        lineLeft.setDepth(10);
        const lineRight = this.add.rectangle(GW / 2 + 280, 210, 150, 2, 0x00f0ff, 0.5);
        lineRight.setDepth(10);

        // Title glow pulse animation
        this.tweens.add({
            targets: this.titleGlow,
            alpha: 0.6,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        // Scale buttons to a reasonable size on the canvas
        // Buttons are 1423px wide; target ~500px rendered width
        const btnScale = 0.38;

        // Vertical layout — use canvas-relative positions, not scaled offsets
        const newGameY = GH * 0.43;
        const joinGameY = GH * 0.56;
        const nextBtnY = GH * 0.69;

        // New Game button
        this.newGameBtn = new Button(
            this,
            GW / 2,
            newGameY,
            'new-game-btn',
            'new-game-btn-active',
            btnScale
        );
        this.newGameBtn.setDepth(10);

        this.newGameBtn.onClick(() => {
            this.isJoining = false;
            this.newGameBtn.setVisible(false);
            this.joinGameBtn.setVisible(false);
            this.nameTextBox.setVisible(true);
            this.roomCodeTextBox.setVisible(false);
            this.nextBtn.setVisible(true);

            // Animate in
            this.tweens.add({
                targets: [this.nameTextBox, this.nextBtn],
                alpha: { from: 0, to: 1 },
                duration: 300,
            });
        });

        // Join Game button
        this.joinGameBtn = new Button(
            this,
            GW / 2,
            joinGameY,
            'join-game-btn',
            'join-game-btn-active',
            btnScale
        );
        this.joinGameBtn.setDepth(10);

        this.joinGameBtn.onClick(() => {
            this.isJoining = true;
            this.newGameBtn.setVisible(false);
            this.joinGameBtn.setVisible(false);
            this.nameTextBox.setVisible(true);
            this.roomCodeTextBox.setVisible(true);
            this.nextBtn.setVisible(true);

            this.tweens.add({
                targets: [this.nameTextBox, this.roomCodeTextBox, this.nextBtn],
                alpha: { from: 0, to: 1 },
                duration: 300,
            });
        });

        // Name textbox — replaces new game button position
        this.nameTextBox = new Textbox(
            this,
            GW / 2,
            newGameY,
            'name-textbox',
            btnScale,
            0.3
        );
        this.nameTextBox.setVisible(false);
        this.nameTextBox.setDepth(10);

        // Room code textbox — replaces join game button position
        this.roomCodeTextBox = new Textbox(
            this,
            GW / 2,
            joinGameY,
            'room-code-textbox',
            btnScale,
            0.5
        );
        this.roomCodeTextBox.setVisible(false);
        this.roomCodeTextBox.setDepth(10);

        // Next button
        this.nextBtn = new Button(
            this,
            GW / 2,
            nextBtnY,
            'next-btn',
            'next-btn-active',
            btnScale
        );
        this.nextBtn.setDepth(10);
        this.nextBtn.onClick(async () => {
            const playerName = this.nameTextBox.textBox.text || 'Player';

            try {
                let players: any[] = [];
                if (this.isJoining) {
                    const roomCode = this.roomCodeTextBox.textBox.text;
                    if (!roomCode) return;
                    const result = await socketService.joinRoom(roomCode.toUpperCase(), playerName);
                    players = result.players;
                } else {
                    const result = await socketService.createRoom(playerName);
                    players = result.players;
                }

                this.cameras.main.fadeOut(400, 0, 0, 0);
                this.time.delayedCall(400, () => {
                    this.scene.start('character-select-scene', {
                        playerName,
                        roomCode: socketService.roomCode,
                        isHost: socketService.isHost,
                        players: players || [],
                    });
                });
            } catch (err) {
                console.error('Failed to connect:', err);
            }
        });
        this.nextBtn.setVisible(false);

        // Version text
        const version = this.add.text(GW - 20, GH - 20, 'v0.2.0', {
            fontSize: '14px',
            color: '#555555',
            fontFamily: 'monospace',
        });
        version.setOrigin(1, 1);
        version.setDepth(10);
    }

    private createParticles(): void {
        // Create floating light particles for atmosphere
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * GW;
            const y = Math.random() * GH;
            const size = 1 + Math.random() * 2;
            const particle = this.add.circle(x, y, size, 0x00f0ff, 0.15 + Math.random() * 0.2);
            particle.setDepth(2);
            this.particles.push(particle);

            // Drift upward slowly
            this.tweens.add({
                targets: particle,
                y: y - 100 - Math.random() * 200,
                alpha: 0,
                duration: 4000 + Math.random() * 6000,
                repeat: -1,
                delay: Math.random() * 5000,
                onRepeat: () => {
                    particle.x = Math.random() * GW;
                    particle.y = GH + 20;
                    particle.alpha = 0.15 + Math.random() * 0.2;
                },
            });
        }
    }
}
