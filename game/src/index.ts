import { Game, Types } from 'phaser';
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin';

import { NewGameScene, LoadingScene, SelectCharacterScene } from './scenes';

declare global {
    interface Window {
        game: Phaser.Game;
    }
}

export const GAME_WIDTH = 1920;
export const GAME_HEIGHT = 1080;

export const gameConfig: GameConfigExtended = {
    title: 'Project: ELITE',
    type: Phaser.WEBGL,
    parent: 'game',
    backgroundColor: '#0a0e27',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
        },
    },
    render: {
        antialiasGL: true,
    },
    dom: {
        createContainer: true,
    },
    plugins: {
        scene: [
            {
                key: 'rexUI',
                plugin: RexUIPlugin,
                mapping: 'rexUI',
            },
        ],
    },
    autoFocus: true,
    audio: {
        disableWebAudio: false,
    },
    scene: [NewGameScene, SelectCharacterScene, LoadingScene],
    winScore: 40,
};

type GameConfigExtended = Types.Core.GameConfig & {
    winScore: number;
};

window.game = new Game(gameConfig);
