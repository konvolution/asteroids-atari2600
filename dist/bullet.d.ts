/**
 * Bullet class
 */
import { Bounds, Entity, EntityType } from './types.js';
export declare class Bullet implements Entity {
    readonly entityType: EntityType;
    x: number;
    y: number;
    isPlayerBullet: boolean;
    vx: number;
    vy: number;
    width: number;
    height: number;
    life: number;
    color: string;
    constructor(x: number, y: number, angle: number, isPlayerBullet?: boolean);
    update(gameWidth: number, gameHeight: number): void;
    isAlive(): boolean;
    draw(ctx: CanvasRenderingContext2D): void;
    getBounds(): Bounds;
}
//# sourceMappingURL=bullet.d.ts.map