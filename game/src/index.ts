import { Game, Types } from 'phaser';
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin';

import { NewGameScene, LoadingScene, EliteScene } from './scenes';

declare global {
    interface Window {
        sizeChanged: () => void;
        game: Phaser.Game;
    }
}

export const gameConfig: GameConfigExtended = {
    title: 'Project: ELITE',
    type: Phaser.WEBGL,
    parent: 'game',
    backgroundColor: '#000',
    scale: {
        mode: Phaser.Scale.ScaleModes.NONE,
        width: window.innerWidth,
        height: window.innerHeight
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
        },
    },
    render: {
        antialiasGL: false
    },
    callbacks: {
        postBoot: () => {
            window.sizeChanged();
        },
    },
	dom: {
        createContainer: true
    },
	plugins: {
		scene: [
			{
				key: 'rexUI',
				plugin: RexUIPlugin,
				mapping: 'rexUI'
			}
		]
    },        
    canvasStyle: `display: block; width: 100%; height: 100%;`,
    autoFocus: true,
    audio: {
        disableWebAudio: false,
    },
    scene: [NewGameScene, LoadingScene, EliteScene],
    winScore: 40
};

type GameConfigExtended = Types.Core.GameConfig & {
    winScore: number;
};

window.sizeChanged = () => {
    if (window.game.isBooted) {
        setTimeout(() => {
            window.game.scale.resize(window.innerWidth, window.innerHeight);

            window.game.canvas.setAttribute(
                'style',
                `display: block; width: ${window.innerWidth}px; height: ${window.innerHeight}px;`,
            );
        }, 100);
    }
};

window.onresize = () => window.sizeChanged();

window.game = new Game(gameConfig);