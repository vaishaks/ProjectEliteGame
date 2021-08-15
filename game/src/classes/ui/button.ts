import { GameObjects } from "phaser";

export class Button extends GameObjects.Layer {


    private _button: GameObjects.Sprite;
    private _buttonActive: GameObjects.Sprite;
    public get button(): GameObjects.Sprite {
        return this._button;
    }

    constructor(scene: Phaser.Scene, x: number, y: number, normalTexture: string, activeTexture: string, scale: number) {
        super(scene);

        this._button = scene.add.sprite(
            x,
            y,
            normalTexture
        );
        this._button.setScale(scale);
        this._button.setInteractive();
        this._button.alpha = 0.9;
        this._buttonActive = scene.add.sprite(
            x,
            y,
            activeTexture
        );
        this._buttonActive.setScale(scale);
        this._buttonActive.alpha = 0;

        this._button.on('pointerover', () => {
            this._buttonActive.alpha = 1;
        });
        this._button.on('pointerout', () => {
            this._buttonActive.alpha = 0;
        });
    }
}