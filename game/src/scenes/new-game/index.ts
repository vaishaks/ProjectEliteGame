import { GameObjects } from "phaser";
import { Textbox } from "../../classes/ui/textbox";
import { Button } from "../../classes/ui/button";
import { EliteScene } from "../elite";
import { socketService } from "../../services/socket-service";

export class NewGameScene extends EliteScene {
    private background!: GameObjects.Image;
    private scaleNumber: number;
    private newGameBtn!: Button;
    private joinGameBtn!: Button;
    private nextBtn!: Button;
    private nameTextBox!: Textbox;
    private roomCodeTextBox!: Textbox;
    private isJoining: boolean = false;

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
    }

    create(): void {
        // Place the background in the center of the window
        this.background = this.add.image(window.innerWidth / 2, window.innerHeight / 2, 'game-background');
        // Calculate background scale based on window height
        this.scaleNumber = window.innerHeight / this.background.height;
        this.background.setScale(this.scaleNumber);

        // Place the new-game button relative to the center of the background.
        // We place the btn 30% above the center of the background.
        this.newGameBtn = new Button(
            this,
            this.background.x,
            this.background.y - (this.background.height / 2 * this.scaleNumber * 0.3),
            'new-game-btn',
            'new-game-btn-active',
            this.scaleNumber
        );
        // When the new-game button is clicked, go to details screen.
        this.newGameBtn.onClick(() => {
            this.isJoining = false;
            this.newGameBtn.setVisible(false);
            this.joinGameBtn.setVisible(false);
            this.nameTextBox.setVisible(true);
            this.roomCodeTextBox.setVisible(false);
            this.nextBtn.setVisible(true);
        });

        // Place the join-game button relative to the new-game button.
        // We want to place it below the join-game button and give it 0.5 button height as margin.
        this.joinGameBtn = new Button(
            this,
            this.background.x,
            this.newGameBtn.button.y + (this.newGameBtn.button.height * this.scaleNumber),
            'join-game-btn',
            'join-game-btn-active',
            this.scaleNumber
        );
        // When the join-game button is clicked, go to details screen.
        this.joinGameBtn.onClick(() => {
            this.isJoining = true;
            this.newGameBtn.setVisible(false);
            this.joinGameBtn.setVisible(false);
            this.nameTextBox.setVisible(true);
            this.roomCodeTextBox.setVisible(true);
            this.nextBtn.setVisible(true);
        });

        this.nameTextBox = new Textbox(
            this,
            this.newGameBtn.button.x,
            this.newGameBtn.button.y,
            'name-textbox',
            this.scaleNumber,
            0.3
        );
        this.nameTextBox.setVisible(false);

        this.roomCodeTextBox = new Textbox(
            this,
            this.joinGameBtn.button.x,
            this.joinGameBtn.button.y,
            'room-code-textbox',
            this.scaleNumber,
            0.5
        );
        this.roomCodeTextBox.setVisible(false);

        // Place the next button relative to the room code text box.
        // We want to place it below the room code text box and give it 2x textbox height as margin.
        this.nextBtn = new Button(
            this,
            this.background.x,
            this.roomCodeTextBox.textBoxImage.y + (this.roomCodeTextBox.textBoxImage.height * this.scaleNumber) * 2,
            'next-btn',
            'next-btn',
            this.scaleNumber
        );
        // When the next button is clicked, connect to server and go to character select.
        this.nextBtn.onClick(async () => {
            const playerName = this.nameTextBox.textBox.text || 'Player';

            try {
                if (this.isJoining) {
                    const roomCode = this.roomCodeTextBox.textBox.text;
                    if (!roomCode) return;
                    await socketService.joinRoom(roomCode.toUpperCase(), playerName);
                } else {
                    await socketService.createRoom(playerName);
                }

                this.scene.start('character-select-scene', {
                    playerName,
                    roomCode: socketService.roomCode,
                    isHost: socketService.isHost,
                });
            } catch (err) {
                console.error('Failed to connect:', err);
            }
        });
        this.nextBtn.setVisible(false);
    }
}
