import { Scene, GameObjects, Tilemaps } from 'phaser';
import { gameObjectsToObjectPoints } from '../../helpers/gameobject-to-object-point';

export class LoadingScene extends Scene {
    private backgroundImage!: GameObjects.Image;
    private map!: Tilemaps.Tilemap;
    private tileset!: Tilemaps.Tileset;
    private gridLayer!: Tilemaps.TilemapLayer;
    private player!: GameObjects.Image;
    private backgroundLayer!: Tilemaps.TilemapLayer;
    constructor() {
        super('loading-scene');
    }

    preload(): void {
        this.load.baseURL = 'assets/';
        this.load.image({ key: 'project-elite-map-tiles', url: 'project-elite-03.png' });
        this.load.image({ key: 'player-gherid', url: 'gherid-v3.png' });
        this.load.tilemapTiledJSON('project-elite-map', 'crashed-map-1.json');
    }

    create(): void {
        console.log('Loading scene was created');
        this.initMap();
    }

    private initMap(): void {
        this.map = this.make.tilemap({ key: 'project-elite-map', tileWidth: 2040, tileHeight: 1212 });
        this.tileset = this.map.addTilesetImage('project-elite-map', 'project-elite-map-tiles');
        this.backgroundLayer = this.map.createLayer('Background', this.tileset, 0, 0);
        this.backgroundLayer.setScale(0.6);
        

        const gridPoints = gameObjectsToObjectPoints(
            this.map.filterObjects('Grid', obj => obj.name === 'point'),
        );

        const ix = 1;
        this.player = this.add.sprite(gridPoints[ix].x*0.6, gridPoints[ix].y*0.6, 'player-gherid');
        this.player.setScale(0.3);

        console.log(gridPoints);
    }
}