import { Scene, GameObjects } from 'phaser';
import { ROUND_WARNING_MS } from '../../shared/constants';

/**
 * Visual countdown bar for the 2-minute player round.
 */
export class TimerBar {
    private scene: Scene;
    private barBg: GameObjects.Rectangle;
    private barFill: GameObjects.Rectangle;
    private timerText: GameObjects.Text;
    private maxWidth: number;
    private duration: number = 0;
    private remaining: number = 0;
    private isRunning: boolean = false;
    private flashTween: Phaser.Tweens.Tween | null = null;

    constructor(scene: Scene, x: number, y: number, width: number, height: number) {
        this.scene = scene;
        this.maxWidth = width;

        this.barBg = scene.add.rectangle(x, y, width, height, 0x333333);
        this.barBg.setOrigin(0, 0.5);

        this.barFill = scene.add.rectangle(x, y, width, height - 4, 0x00cc00);
        this.barFill.setOrigin(0, 0.5);

        this.timerText = scene.add.text(x + width / 2, y, '2:00', {
            fontSize: '18px',
            color: '#ffffff',
            fontFamily: 'monospace',
        });
        this.timerText.setOrigin(0.5, 0.5);
    }

    start(durationMs: number): void {
        this.duration = durationMs;
        this.remaining = durationMs;
        this.isRunning = true;
        this.barFill.fillColor = 0x00cc00;
        if (this.flashTween) {
            this.flashTween.stop();
            this.flashTween = null;
        }
        this.barFill.alpha = 1;
    }

    stop(): void {
        this.isRunning = false;
        if (this.flashTween) {
            this.flashTween.stop();
            this.flashTween = null;
        }
    }

    update(delta: number): void {
        if (!this.isRunning) return;

        this.remaining = Math.max(0, this.remaining - delta);
        const ratio = this.remaining / this.duration;
        this.barFill.width = this.maxWidth * ratio;

        // Update timer text
        const seconds = Math.ceil(this.remaining / 1000);
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        this.timerText.setText(`${min}:${sec.toString().padStart(2, '0')}`);

        // Flash when low on time
        if (this.remaining <= ROUND_WARNING_MS && !this.flashTween) {
            this.barFill.fillColor = 0xff3300;
            this.flashTween = this.scene.tweens.add({
                targets: this.barFill,
                alpha: 0.3,
                duration: 300,
                yoyo: true,
                repeat: -1,
            });
        }

        if (this.remaining <= 0) {
            this.isRunning = false;
        }
    }

    setVisible(visible: boolean): void {
        this.barBg.setVisible(visible);
        this.barFill.setVisible(visible);
        this.timerText.setVisible(visible);
    }
}
