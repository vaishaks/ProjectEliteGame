import { Scene, GameObjects } from 'phaser';
import { ROUND_WARNING_MS } from '../../shared/constants';

/**
 * Visual countdown bar for the 2-minute player round.
 * Styled with sci-fi theme: dark background, neon fill, glow effect.
 */
export class TimerBar {
    private scene: Scene;
    private container: GameObjects.Container;
    private barBg: GameObjects.Rectangle;
    private barFill: GameObjects.Rectangle;
    private barBorder: GameObjects.Graphics;
    private timerText: GameObjects.Text;
    private labelText: GameObjects.Text;
    private maxWidth: number;
    private barHeight: number;
    private duration: number = 0;
    private remaining: number = 0;
    private isRunning: boolean = false;
    private flashTween: Phaser.Tweens.Tween | null = null;

    constructor(scene: Scene, x: number, y: number, width: number, height: number) {
        this.scene = scene;
        this.maxWidth = width;
        this.barHeight = height;

        this.container = scene.add.container(x, y);
        this.container.setDepth(50);

        // Label
        this.labelText = scene.add.text(0, -4, 'TIME', {
            fontSize: '14px',
            color: '#00f0ff',
            fontFamily: 'monospace',
            fontStyle: 'bold',
        });
        this.labelText.setOrigin(0, 1);

        // Background
        this.barBg = scene.add.rectangle(0, 0, width, height, 0x1a1a3e);
        this.barBg.setOrigin(0, 0);
        this.barBg.setStrokeStyle(1, 0x00f0ff, 0.3);

        // Fill
        this.barFill = scene.add.rectangle(2, 2, width - 4, height - 4, 0x00cc44);
        this.barFill.setOrigin(0, 0);

        // Border glow
        this.barBorder = scene.add.graphics();
        this.barBorder.lineStyle(2, 0x00f0ff, 0.5);
        this.barBorder.strokeRoundedRect(-1, -1, width + 2, height + 2, 4);

        // Timer text
        this.timerText = scene.add.text(width / 2, height / 2, '2:00', {
            fontSize: '18px',
            color: '#ffffff',
            fontFamily: 'monospace',
            fontStyle: 'bold',
        });
        this.timerText.setOrigin(0.5, 0.5);

        this.container.add([this.labelText, this.barBg, this.barFill, this.barBorder, this.timerText]);
    }

    start(durationMs: number): void {
        this.duration = durationMs;
        this.remaining = durationMs;
        this.isRunning = true;
        this.barFill.fillColor = 0x00cc44;
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
        this.barFill.width = (this.maxWidth - 4) * ratio;

        // Update timer text
        const seconds = Math.ceil(this.remaining / 1000);
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        this.timerText.setText(`${min}:${sec.toString().padStart(2, '0')}`);

        // Color transitions
        if (ratio > 0.5) {
            this.barFill.fillColor = 0x00cc44; // Green
        } else if (ratio > 0.25) {
            this.barFill.fillColor = 0xffaa00; // Orange
        } else {
            this.barFill.fillColor = 0xff3300; // Red
        }

        // Flash when low on time
        if (this.remaining <= ROUND_WARNING_MS && !this.flashTween) {
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
        this.container.setVisible(visible);
    }
}
