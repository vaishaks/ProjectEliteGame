import { Scene, GameObjects, Game } from "phaser";
import BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';

export class NewGameScene extends Scene {
    private background!: GameObjects.Image;
    private newGameBtn!: GameObjects.Sprite;
    private newGameBtnActive!: GameObjects.Sprite;
    private joinGameBtn!: GameObjects.Sprite;
    private joingGameBtnActive!: GameObjects.Sprite;
    private nameTextBoxImage!: GameObjects.Sprite;
    private nameTextBox!: BBCodeText;
    private roomCodeTextBoxImage!: GameObjects.Sprite;
    private roomCodeTextBox!: BBCodeText;
    private nextBtn!: GameObjects.Sprite;
    private nextBtnActive!: GameObjects.Sprite;
    private gameBtnLayer!: GameObjects.Layer;
    private nameTextBoxLayer!: GameObjects.Layer;
    private roomCodeTextBoxLayer!: GameObjects.Layer;
    private rexUI!: RexUIPlugin;
    private scaleNumber: number;

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
        this.newGameBtn = this.add.sprite(
            this.background.x,
            this.background.y - (this.background.height / 2 * this.scaleNumber * 0.3),
            'new-game-btn'
        );
        this.newGameBtn.setScale(this.scaleNumber);
        // Animation logic for the new-game button.
        // We'll show a highlighted 'active' button image on hover.
        this.newGameBtn.setInteractive();
        this.newGameBtn.alpha = 0.9;
        this.newGameBtnActive = this.add.sprite(
            this.background.x,
            this.background.y - (this.background.height / 2 * this.scaleNumber * 0.3),
            'new-game-btn-active'
        );
        this.newGameBtnActive.setScale(this.scaleNumber);
        this.newGameBtnActive.alpha = 0;
        this.newGameBtn.on('pointerover', () => {
            this.newGameBtnActive.alpha = 1;
        });
        this.newGameBtn.on('pointerout', () => {
            this.newGameBtnActive.alpha = 0;
        });
        // When the new-game button is clicked, go to details screen.
        this.newGameBtn.on('pointerdown', () => {
            this.gameBtnLayer.setVisible(false);
            this.nameTextBoxLayer.setVisible(true);
            this.roomCodeTextBoxLayer.setVisible(false);
            this.nextBtn.setVisible(true);
        });

        // Place the join-game button relative to the new-game button.
        // We want to place it below the join-game button and give it 0.5 button height as margin.
        this.joinGameBtn = this.add.sprite(
            this.newGameBtn.x,
            this.newGameBtn.y + (this.newGameBtn.height * this.scaleNumber),
            'join-game-btn'
        );
        this.joinGameBtn.setScale(this.scaleNumber);
        // Animation logic for the join-game button.
        // We'll show a highlighted 'active' button image on hover.
        this.joinGameBtn.setInteractive();
        this.joinGameBtn.alpha = 0.9;
        this.joingGameBtnActive = this.add.sprite(
            this.newGameBtn.x,
            this.newGameBtn.y + (this.newGameBtn.height * this.scaleNumber),
            'join-game-btn-active'
        );
        this.joingGameBtnActive.setScale(this.scaleNumber);
        this.joingGameBtnActive.alpha = 0;
        this.joinGameBtn.on('pointerover', () => {
            this.joingGameBtnActive.alpha = 1;
        });
        this.joinGameBtn.on('pointerout', () => {
            this.joingGameBtnActive.alpha = 0;
        });
        // When the join-game button is clicked, go to details screen.
        this.joinGameBtn.on('pointerdown', () => {
            this.gameBtnLayer.setVisible(false);
            this.nameTextBoxLayer.setVisible(true);
            this.roomCodeTextBoxLayer.setVisible(true);
            this.nextBtn.setVisible(true);
        });        

        // Add all sprites that below to the first screen
        this.gameBtnLayer = this.add.layer();
        this.gameBtnLayer.add(this.newGameBtn);
        this.gameBtnLayer.add(this.newGameBtnActive);
        this.gameBtnLayer.add(this.joinGameBtn);
        this.gameBtnLayer.add(this.joingGameBtnActive);
        this.gameBtnLayer.setVisible(true);

        // Place the text-box image
        this.nameTextBoxImage = this.add.sprite(
            this.newGameBtn.x,
            this.newGameBtn.y,
            'name-textbox'
        );
        this.nameTextBoxImage.setScale(this.scaleNumber);

        // Phaser by default only lets you display/draw text. No editing.
        // We use the RexUI plugin to display editable text boxes on the canvas.
        this.nameTextBox = this.rexUI.add.BBCodeText(
            this.nameTextBoxImage.x + (this.nameTextBoxImage.width * this.scaleNumber) * 0.3,
            this.nameTextBoxImage.y,
            '',
            {
                fixedWidth: this.nameTextBoxImage.width * this.scaleNumber,
                fixedHeight: this.nameTextBoxImage.height * this.scaleNumber,
                valign: 'center',
                fontSize: '30px'
            }
        );
        this.nameTextBox.setOrigin(0.5, 0.5);
        this.rexUI.add.textBox({
            text: this.nameTextBox
        });
        this.nameTextBox.setInteractive();
        this.nameTextBox.on('pointerdown', () => {
            const config = {
                onTextChanged: this.nameTextBoxOnTextChanged
            };
            this.rexUI.edit(this.nameTextBox, config);
        });

        this.nameTextBoxLayer = this.add.layer();
        this.nameTextBoxLayer.add(this.nameTextBoxImage);
        this.nameTextBoxLayer.add(this.nameTextBox);
        this.nameTextBoxLayer.setVisible(false);         

        // Place the text-box image
        this.roomCodeTextBoxImage = this.add.sprite(
            this.joinGameBtn.x,
            this.joinGameBtn.y,
            'room-code-textbox'
        );
        this.roomCodeTextBoxImage.setScale(this.scaleNumber);

        // Phaser by default only lets you display/draw text. No editing.
        // We use the RexUI plugin to display editable text boxes on the canvas.
        this.roomCodeTextBox = this.rexUI.add.BBCodeText(
            this.roomCodeTextBoxImage.x + (this.roomCodeTextBoxImage.width * this.scaleNumber) * 0.5,
            this.roomCodeTextBoxImage.y,
            '',
            {
                fixedWidth: this.roomCodeTextBoxImage.width * this.scaleNumber,
                fixedHeight: this.roomCodeTextBoxImage.height * this.scaleNumber,
                valign: 'center',
                fontSize: '30px'
            }
        );
        this.roomCodeTextBox.setOrigin(0.5, 0.5);
        this.rexUI.add.textBox({
            text: this.roomCodeTextBox
        });
        this.roomCodeTextBox.setInteractive();
        this.roomCodeTextBox.on('pointerdown', () => {
            const config = {
                onTextChanged: this.roomCodeTextBoxOnTextChanged
            };
            this.rexUI.edit(this.roomCodeTextBox, config);
        }); 
        
        this.roomCodeTextBoxLayer = this.add.layer();
        this.roomCodeTextBoxLayer.add(this.roomCodeTextBoxImage);
        this.roomCodeTextBoxLayer.add(this.roomCodeTextBox);
        this.roomCodeTextBoxLayer.setVisible(false);

        // Place the next button relative to the room code text box.
        // We want to place it below the room code text box and give it 2x textbox height as margin.
        this.nextBtn = this.add.sprite(
            this.roomCodeTextBoxImage.x,
            this.roomCodeTextBoxImage.y + (this.roomCodeTextBoxImage.height * this.scaleNumber)*2,
            'next-btn'
        );
        this.nextBtn.setScale(this.scaleNumber);
        // Animation logic for the next button.
        // We'll show a highlighted 'active' button image on hover.
        this.nextBtn.setInteractive();
        this.nextBtn.alpha = 0.9;
        this.nextBtnActive = this.add.sprite(
            this.nextBtn.x,
            this.nextBtn.y,
            'next-btn-active'
        );
        this.nextBtnActive.setScale(this.scaleNumber);
        this.nextBtnActive.alpha = 0;
        this.nextBtn.on('pointerover', () => {
            this.nextBtnActive.alpha = 1;
        });
        this.nextBtn.on('pointerout', () => {
            this.nextBtnActive.alpha = 0;
        });
        this.nextBtn.setVisible(false);

        // When the next button is clicked, start the game.
        this.nextBtn.on('pointerdown', () => {
            this.scene.start('loading-scene');
        });
    }

    private nameTextBoxOnTextChanged(textObject: any, text: string) {
        console.log(text);
        textObject.text = text;
    }

    private roomCodeTextBoxOnTextChanged(textObject: any, text: string) {
        console.log(text);
        textObject.text = text;
    }
}