import { Scene, GameObjects } from 'phaser';

const GAME_WIDTH = 1920;
const GAME_HEIGHT = 1080;

/**
 * Full-screen overlay for phase transitions and game end states.
 * Sci-fi styled with dramatic animations.
 */
export class PhaseOverlay {
    private scene: Scene;
    private bg: GameObjects.Rectangle;
    private text: GameObjects.Text;
    private subText: GameObjects.Text;
    private accentLine1: GameObjects.Rectangle;
    private accentLine2: GameObjects.Rectangle;

    constructor(scene: Scene) {
        this.scene = scene;

        this.bg = scene.add.rectangle(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            GAME_WIDTH,
            GAME_HEIGHT,
            0x000000,
            0.8
        );
        this.bg.setDepth(100);
        this.bg.setVisible(false);

        // Accent lines above and below text
        this.accentLine1 = scene.add.rectangle(
            GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, 400, 2, 0x00f0ff
        );
        this.accentLine1.setDepth(101);
        this.accentLine1.setVisible(false);

        this.accentLine2 = scene.add.rectangle(
            GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, 400, 2, 0x00f0ff
        );
        this.accentLine2.setDepth(101);
        this.accentLine2.setVisible(false);

        this.text = scene.add.text(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            '',
            {
                fontSize: '56px',
                color: '#ffffff',
                fontFamily: 'monospace',
                fontStyle: 'bold',
            }
        );
        this.text.setOrigin(0.5, 0.5);
        this.text.setDepth(102);
        this.text.setVisible(false);

        this.subText = scene.add.text(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2 + 70,
            '',
            {
                fontSize: '20px',
                color: '#aaaaaa',
                fontFamily: 'monospace',
            }
        );
        this.subText.setOrigin(0.5, 0.5);
        this.subText.setDepth(102);
        this.subText.setVisible(false);
    }

    /**
     * Show overlay with message, auto-hide after duration (0 = stay visible).
     */
    show(message: string, color: string = '#ffffff', durationMs: number = 2000, sub: string = ''): void {
        // Cancel any pending hide tweens
        this.scene.tweens.killTweensOf(this.bg);
        this.scene.tweens.killTweensOf(this.text);
        this.scene.tweens.killTweensOf(this.subText);
        this.scene.tweens.killTweensOf(this.accentLine1);
        this.scene.tweens.killTweensOf(this.accentLine2);

        this.text.setText(message);
        this.text.setColor(color);
        this.subText.setText(sub);
        this.bg.setVisible(true);
        this.text.setVisible(true);
        this.subText.setVisible(sub.length > 0);
        this.accentLine1.setVisible(true);
        this.accentLine2.setVisible(true);

        // Scale-in animation
        this.text.setScale(0.3);
        this.text.alpha = 0;
        this.bg.alpha = 0;
        this.accentLine1.scaleX = 0;
        this.accentLine2.scaleX = 0;

        this.scene.tweens.add({
            targets: this.bg,
            alpha: 0.8,
            duration: 200,
        });

        this.scene.tweens.add({
            targets: this.text,
            scaleX: 1,
            scaleY: 1,
            alpha: 1,
            duration: 400,
            ease: 'Back.easeOut',
        });

        this.scene.tweens.add({
            targets: [this.accentLine1, this.accentLine2],
            scaleX: 1,
            duration: 300,
            delay: 200,
            ease: 'Power2',
        });

        if (sub.length > 0) {
            this.subText.alpha = 0;
            this.scene.tweens.add({
                targets: this.subText,
                alpha: 1,
                duration: 300,
                delay: 300,
            });
        }

        if (durationMs > 0) {
            this.scene.time.delayedCall(durationMs, () => {
                this.hide();
            });
        }
    }

    hide(): void {
        this.scene.tweens.add({
            targets: [this.bg, this.text, this.subText, this.accentLine1, this.accentLine2],
            alpha: 0,
            duration: 300,
            onComplete: () => {
                this.bg.setVisible(false);
                this.text.setVisible(false);
                this.subText.setVisible(false);
                this.accentLine1.setVisible(false);
                this.accentLine2.setVisible(false);
                this.bg.alpha = 0.8;
                this.text.alpha = 1;
                this.subText.alpha = 1;
                this.accentLine1.scaleX = 1;
                this.accentLine2.scaleX = 1;
            },
        });
    }
}
