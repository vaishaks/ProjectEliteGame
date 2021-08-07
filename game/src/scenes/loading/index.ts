import { Scene, GameObjects, Tilemaps } from 'phaser';
import { gameObjectsToObjectPoints } from '../../helpers/gameobject-to-object-point';

export class LoadingScene extends Scene {
    private backgroundImage!: GameObjects.Image;
    private map!: Tilemaps.Tilemap;
    private tileset!: Tilemaps.Tileset;
    private gridLayer!: Tilemaps.TilemapLayer;
    private player!: GameObjects.Image;
    private backgroundLayer!: Tilemaps.TilemapLayer;
    private scaleNumber: number;

    constructor() {
        super('loading-scene');
        this.scaleNumber = 1;
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

    create(): void {
        console.log('Loading scene was created');
        this.initMap();
    }

    private initMap(): void {
        this.map = this.make.tilemap({ key: 'crashed-spaceship-map', tileWidth: 4100, tileHeight: 2475 });
        this.tileset = this.map.addTilesetImage('crashed-spaceship-map-tileset', 'crashed-spaceship-map'); 
        console.log(window.innerHeight);
        let xOffset = (window.innerWidth - 4100*0.3)/2;
        this.backgroundLayer = this.map.createLayer('Background', this.tileset, xOffset, 0);
        this.scaleNumber = 0.3;
        this.backgroundLayer.setScale(this.scaleNumber);


        const gridPoints = gameObjectsToObjectPoints(
            this.map.filterObjects('Grid', obj => obj.name === 'squares'),
        );

        let sprites = ['', 'player-gherid', 'enemy-runner', 'enemy-runner', 'enemy-biter', 'enemy-shooter', 'enemy-shooter', 'enemy-shooter', 'player-akosha']
        for (let ix = 1; ix < 9; ix++)
        {
            this.add
            .sprite(
                (gridPoints[ix].x + gridPoints[ix].width / 2) * this.scaleNumber + xOffset,
                (gridPoints[ix].y + gridPoints[ix].height / 2) * this.scaleNumber,
                sprites[ix]
            )
            .setScale(this.scaleNumber)            
        }
    }
}