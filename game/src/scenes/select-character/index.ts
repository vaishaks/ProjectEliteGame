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
        this.load.image({ key: 'select-character-background', url: 'select-character-background.png'})
    }

    create(): void {
        // Place the background in the center of the window
        this.background = this.add.image(window.innerWidth / 2, window.innerHeight / 2, 'select-character-background');
        // Calculate background scale based on window height
        this.scaleNumber = window.innerHeight / this.background.height;
        this.background.setScale(this.scaleNumber);        
    }
};
