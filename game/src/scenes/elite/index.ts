import { Scene } from 'phaser';
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';

export class EliteScene extends Scene {
    private rexUI!: RexUIPlugin;

    
    /**
     * Returns instance of scene plugin rexUI
     */
    public get _rexUI() {
        return this.rexUI;
    }

    constructor(name: string){
        super(name);
    }
}