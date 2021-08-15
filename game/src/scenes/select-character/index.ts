import { GameObjects, Scene } from 'phaser';

export class SelectCharacterScene extends Scene {
    private background!: GameObjects.Image;
    private scaleNumber: number;

    constructor() {
        super('character-select-scene');
        this.scaleNumber = 1;
    }

    preload(): void {
        this.load.baseURL = 'https://projectelitestorage.blob.core.windows.net/assets/';
        this.load.image({ key: 'select-character-background', url: 'select-character-background.png' })
        this.load.image({ key: 'select-character-corner', url: 'select-character-corner-v3.png' });
        this.load.image({ key: 'activity-box', url: 'activity-box.png' });
        this.load.image({ key: 'start-game-btn', url: 'start-game-btn.png' });
        this.load.image({ key: 'character-gherid', url: 'character-gherid.png' });
        this.load.image({ key: 'room-code-textbox', url: 'room-code-textbox.png' });
    }

    create(): void {
        // Place the background in the center of the window
        this.background = this.add.image(window.innerWidth / 2, window.innerHeight / 2, 'select-character-background');
        // Calculate background scale based on window height
        this.scaleNumber = window.innerHeight / this.background.height;
        console.log(window.innerHeight);
        console.log(this.background.height);
        console.log(this.scaleNumber);
        this.background.setScale(this.scaleNumber);

        const cornerImage = this.add.sprite(0, 0, 'select-character-corner');
        cornerImage.setOrigin(0, 0);
        cornerImage.setScale(this.scaleNumber);

        const roomCodeTextBox = this.add.sprite(window.innerWidth/2*this.scaleNumber, 0, 'room-code-textbox');
        roomCodeTextBox.setOrigin(0, 0);
        roomCodeTextBox.setScale(this.scaleNumber);

        const activityBox = this.add.sprite(0, 0, 'activity-box');
        activityBox.setPosition(window.innerWidth - activityBox.width * this.scaleNumber * 0.55, window.innerHeight * 0.45);
        activityBox.setScale(this.scaleNumber);

        const startGameBtn = this.add.sprite(window.innerWidth / 2, window.innerHeight * 0.93, 'start-game-btn');
        startGameBtn.setScale(this.scaleNumber);

        const characterGherid = this.add.sprite(window.innerWidth / 2, window.innerHeight / 2 * 0.53, 'character-gherid');
        characterGherid.setScale(this.scaleNumber);

        const characterGherid2 = this.add.sprite(window.innerWidth / 2, window.innerHeight / 2 * 1.3, 'character-gherid');
        characterGherid2.setScale(this.scaleNumber);

        const characterGherid3 = this.add.sprite(window.innerWidth / 2 - characterGherid.width * this.scaleNumber, window.innerHeight / 2 * 0.53, 'character-gherid');
        characterGherid3.setScale(this.scaleNumber);

        const characterGherid4 = this.add.sprite(window.innerWidth / 2 + characterGherid.width * this.scaleNumber, window.innerHeight / 2 * 0.53, 'character-gherid');
        characterGherid4.setScale(this.scaleNumber);

        const characterGherid5 = this.add.sprite(window.innerWidth / 2 - characterGherid.width * this.scaleNumber, window.innerHeight / 2 * 1.3, 'character-gherid');
        characterGherid5.setScale(this.scaleNumber);

        const characterGherid6 = this.add.sprite(window.innerWidth / 2 + characterGherid.width * this.scaleNumber, window.innerHeight / 2 * 1.3, 'character-gherid');
        characterGherid6.setScale(this.scaleNumber);
    }
};
