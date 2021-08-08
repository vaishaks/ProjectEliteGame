import { Scene, GameObjects } from "phaser";

export class NewGameScene extends Scene {
    private background!: GameObjects.Image;
    private newGameBtn!: GameObjects.Image;
    private newGameBtnActive!: GameObjects.Image;
    private joinGameBtn!: GameObjects.Image;
    private joingGameBtnActive!: GameObjects.Image;
    private scaleNumber: number;

    constructor() {
        super('new-game-scene');
        this.scaleNumber = 1;
    }

    preload(): void {
        this.load.baseURL = 'assets/'
        this.load.image({ key: 'game-background', url: 'game-background-v1.png' });
        this.load.image({ key: 'new-game-btn', url: 'new-game-btn.png' });
        this.load.image({ key: 'new-game-btn-active', url: 'new-game-btn-active.png' });
        this.load.image({ key: 'join-game-btn', url:'join-game-btn.png' });
        this.load.image({ key: 'join-game-btn-active', url:'join-game-btn-active.png' });
    }

    create(): void {
        // Place the background in the center of the window
        this.background = this.add.image(window.innerWidth/2, window.innerHeight/2, 'game-background');
        // Calculate background scale based on window height
        this.scaleNumber = window.innerHeight/this.background.height;
        this.background.setScale(this.scaleNumber);

        // Place the new-game button relative to the center of the background.
        // We place the btn 30% above the center of the background.
        this.newGameBtn = this.add.sprite(
            this.background.x, 
            this.background.y - (this.background.height/2*this.scaleNumber*0.3), 
            'new-game-btn');
        this.newGameBtn.setScale(this.scaleNumber);
        // Animation logic for the new-game button.
        // We'll show a highlighted 'active' button image on hover.
        this.newGameBtn.setInteractive();
        this.newGameBtn.alpha = 0.9;
        this.newGameBtnActive = this.add.sprite(
            this.background.x, 
            this.background.y - (this.background.height/2*this.scaleNumber*0.3), 
            'new-game-btn-active');
        this.newGameBtnActive.setScale(this.scaleNumber);      
        this.newGameBtnActive.alpha = 0;        
        this.newGameBtn.on('pointerover', () => {
            this.newGameBtnActive.alpha = 1;
        });
        this.newGameBtn.on('pointerout', () => {
            this.newGameBtnActive.alpha = 0;
        });
        // When the new-game button is clicked, start the game.
        this.newGameBtn.on('pointerdown', () => {
            this.scene.start('loading-scene');
        });

        // Place the join-game button relative to the new-game button.
        // We want to place it below the join-game button and give it 0.5 button height as margin.
        this.joinGameBtn = this.add.sprite(
            this.newGameBtn.x, 
            this.newGameBtn.y + (this.newGameBtn.height*this.scaleNumber), 
            'join-game-btn');
        this.joinGameBtn.setScale(this.scaleNumber);
        // Animation logic for the join-game button.
        // We'll show a highlighted 'active' button image on hover.
        this.joinGameBtn.setInteractive();
        this.joinGameBtn.alpha = 0.9;
        this.joingGameBtnActive = this.add.sprite(
            this.newGameBtn.x, 
            this.newGameBtn.y + (this.newGameBtn.height*this.scaleNumber), 
            'join-game-btn-active');
        this.joingGameBtnActive.setScale(this.scaleNumber);      
        this.joingGameBtnActive.alpha = 0;        
        this.joinGameBtn.on('pointerover', () => {
            this.joingGameBtnActive.alpha = 1;
        });
        this.joinGameBtn.on('pointerout', () => {
            this.joingGameBtnActive.alpha = 0;
        });        
    }
}