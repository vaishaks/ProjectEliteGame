import { Scene, GameObjects } from 'phaser';

/**
 * Full-screen overlay for phase transitions and game end states.
 */
export class PhaseOverlay {
    private scene: Scene;
    private bg: GameObjects.Rectangle;
    private text: GameObjects.Text;

    constructor(scene: Scene) {
        this.scene = scene;

        this.bg = scene.add.rectangle(
            window.innerWidth / 2,
            window.innerHeight / 2,
            window.innerWidth,
            window.innerHeight,
            0x000000,
            0.7
        );
        this.bg.setDepth(100);
        this.bg.setVisible(false);

        this.text = scene.add.text(
            window.innerWidth / 2,
            window.innerHeight / 2,
            '',
            {
                fontSize: '48px',
                color: '#ffffff',
                fontFamily: 'monospace',
                fontStyle: 'bold',
            }
        );
        this.text.setOrigin(0.5, 0.5);
        this.text.setDepth(101);
        this.text.setVisible(false);
    }

    /**
     * Show overlay with message, auto-hide after duration (0 = stay visible).
     */
    show(message: string, color: string = '#ffffff', durationMs: number = 2000): void {
        this.text.setText(message);
        this.text.setColor(color);
        this.bg.setVisible(true);
        this.text.setVisible(true);

        // Scale-in animation
        this.text.setScale(0.5);
        this.text.alpha = 0;
        this.scene.tweens.add({
            targets: this.text,
            scaleX: 1,
            scaleY: 1,
            alpha: 1,
            duration: 300,
            ease: 'Back.easeOut',
        });

        if (durationMs > 0) {
            this.scene.time.delayedCall(durationMs, () => {
                this.hide();
            });
        }
    }

    hide(): void {
        this.scene.tweens.add({
            targets: [this.bg, this.text],
            alpha: 0,
            duration: 300,
            onComplete: () => {
                this.bg.setVisible(false);
                this.text.setVisible(false);
                this.bg.alpha = 0.7;
                this.text.alpha = 1;
            },
        });
    }
}
