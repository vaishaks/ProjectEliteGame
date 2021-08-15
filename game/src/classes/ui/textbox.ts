import { GameObjects } from 'phaser';
import BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';
import { EliteScene } from 'src/scenes';

export class Textbox extends GameObjects.Layer {

    private _textBoxImage: GameObjects.Sprite;
    private _textBox:  BBCodeText;

    public get textBoxImage(){
        return this._textBoxImage;
    }

    public get textBox(){
        return this._textBox;
    }

    /**
     * Add a layer with a text box and a text box image
     * @param  {Phaser.Scene} scene - the scene you want to add the button layer to
     * @param  {number} x - x coordinate of button
     * @param  {number} y - y coordinate of button
     * @param  {string} textBoxImage - text box image
     * @param  {number} scale - scale factor
     * @param  {number} textPositionFactor - point in text box image we want text to start from
     */
    constructor(scene: EliteScene, x: number, y: number, textBoxImage: string, scale: number, textPositionFactor: number) {
        super(scene);

        this._textBoxImage = scene.add.sprite(
            x,
            y,
            textBoxImage
        );
        this._textBoxImage.setScale(scale);

        // Phaser by default only lets you display/draw text. No editing.
        // We use the RexUI plugin to display editable text boxes on the canvas.
        this._textBox = scene._rexUI.add.BBCodeText(
            x + (this._textBoxImage.width * scale) * textPositionFactor,
            this._textBoxImage.y,
            '',
            {
                fixedWidth: this._textBoxImage.width * scale,
                fixedHeight: this._textBoxImage.height * scale,
                valign: 'center',
                fontSize: '30px'
            }
        );
        this._textBox.setOrigin(0.5, 0.5);
        scene._rexUI.add.textBox({
            text: this._textBox
        });
        this._textBox.setInteractive();
        this._textBox.on('pointerdown', () => {
            const config = {
                onTextChanged: this.textBoxOnTextChanged
            };
            scene._rexUI.edit(this._textBox, config);
        });

        scene.add.existing(this);
        this.add(this._textBoxImage);
        this.add(this._textBox);
    }

    private textBoxOnTextChanged(textObject: any, text: string) {
        textObject.text = text;
    }

} 