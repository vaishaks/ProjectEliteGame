import { Scene } from 'phaser';
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';

export class EliteScene extends Scene {
    public rexUI!: RexUIPlugin;
    
    constructor(name: string){
        super(name);
    }
}