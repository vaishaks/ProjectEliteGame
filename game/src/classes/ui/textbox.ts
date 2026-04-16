import { GameObjects } from 'phaser';
import BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";
import { EliteScene } from '../../scenes';

export class Textbox extends GameObjects.Layer {

    private _textBoxImage: GameObjects.Sprite;
    private _textBox: BBCodeText;
    private _scene: EliteScene;
    private _gameX: number;
    private _gameY: number;
    private _textWidth: number;
    private _textHeight: number;

    public get textBoxImage(): GameObjects.Sprite {
        return this._textBoxImage;
    }

    public get textBox(): BBCodeText {
        return this._textBox;
    }

    constructor(scene: EliteScene, x: number, y: number, textBoxImage: string, scale: number, textPositionFactor: number) {
        super(scene);
        this._scene = scene;

        this._textBoxImage = scene.add.sprite(x, y, textBoxImage);
        this._textBoxImage.setScale(scale);

        // Position editable text within the textbox image.
        const scaledW = this._textBoxImage.width * scale;
        const scaledH = this._textBoxImage.height * scale;
        const textStartX = x - (scaledW / 2) + (scaledW * textPositionFactor);
        const textWidth = scaledW * (1 - textPositionFactor) * 0.9;

        this._gameX = textStartX;
        this._gameY = y - scaledH / 2;
        this._textWidth = textWidth;
        this._textHeight = scaledH;

        this._textBox = scene.rexUI.add.BBCodeText(
            textStartX,
            y,
            '',
            {
                fixedWidth: textWidth,
                fixedHeight: scaledH,
                valign: 'center',
                fontSize: `${Math.round(26 * scale / 0.4)}px`,
                color: '#ffffff',
            }
        );
        this._textBox.setOrigin(0, 0.5);
        scene.rexUI.add.textBox({ text: this._textBox });
        this._textBox.setInteractive();
        this._textBox.on('pointerdown', () => {
            const config = {
                onTextChanged: this.textBoxOnTextChanged
            };
            scene.rexUI.edit(this._textBox, config);
            // Fix DOM input position to account for Phaser canvas scaling
            this.fixInputPosition();
        });

        scene.add.existing(this);
        this.add(this._textBoxImage);
        this.add(this._textBox);
    }

    /**
     * rexUI.edit() creates a DOM <input> positioned using raw game-pixel
     * coordinates. When Phaser.Scale.FIT scales the canvas via CSS, the
     * input floats to the wrong spot. This repositions it correctly.
     */
    private fixInputPosition(): void {
        setTimeout(() => {
            const input = document.querySelector('input[type="text"]') as HTMLInputElement;
            if (!input) return;

            const canvas = this._scene.game.canvas;
            const rect = canvas.getBoundingClientRect();
            const sx = rect.width / 1920;
            const sy = rect.height / 1080;

            input.style.position = 'fixed';
            input.style.left = `${rect.left + this._gameX * sx}px`;
            input.style.top = `${rect.top + this._gameY * sy}px`;
            input.style.width = `${this._textWidth * sx}px`;
            input.style.height = `${this._textHeight * sy}px`;
            input.style.fontSize = `${Math.round(24 * sy)}px`;
            input.style.background = 'transparent';
            input.style.color = '#ffffff';
            input.style.border = 'none';
            input.style.outline = 'none';
            input.style.fontFamily = 'monospace';
            input.style.caretColor = '#00f0ff';
            input.style.padding = `0 ${Math.round(8 * sx)}px`;
            input.style.zIndex = '9999';
        }, 16);
    }

    private textBoxOnTextChanged(textObject: any, text: string): void {
        textObject.text = text;
    }

}
