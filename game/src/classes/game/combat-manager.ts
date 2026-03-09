import { Scene, GameObjects } from 'phaser';

/**
 * Handles attack visual effects on the client side.
 */
export class CombatManager {
    private scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    /**
     * Flash a sprite red to indicate it was hit.
     */
    playHitEffect(sprite: GameObjects.Sprite): void {
        this.scene.tweens.add({
            targets: sprite,
            alpha: 0.2,
            duration: 100,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                sprite.alpha = 1;
            },
        });
    }

    /**
     * Show floating damage number at a position.
     */
    showDamageNumber(x: number, y: number, damage: number, color: string = '#ff0000'): void {
        const text = this.scene.add.text(x, y - 20, `-${damage}`, {
            fontSize: '24px',
            color,
            fontFamily: 'monospace',
            fontStyle: 'bold',
        });
        text.setOrigin(0.5, 0.5);

        this.scene.tweens.add({
            targets: text,
            y: y - 60,
            alpha: 0,
            duration: 800,
            onComplete: () => {
                text.destroy();
            },
        });
    }

    /**
     * Play death animation — fade out and shrink.
     */
    playDeathEffect(sprite: GameObjects.Sprite, onComplete?: () => void): void {
        this.scene.tweens.add({
            targets: sprite,
            alpha: 0,
            scaleX: 0,
            scaleY: 0,
            duration: 500,
            onComplete: () => {
                sprite.destroy();
                if (onComplete) onComplete();
            },
        });
    }
}
