/**
 * UFO/Saucer class
 */
import { Bounds, Sprite, Entity, EntityType } from './types.js';
import { Bullet } from './bullet.js';
export declare class Saucer implements Entity {
    readonly entityType: EntityType;
    gameWidth: number;
    gameHeight: number;
    isSmall: boolean;
    sprite: Sprite;
    width: number;
    height: number;
    points: number;
    accuracy: number;
    fromLeft: boolean;
    x: number;
    y: number;
    vx: number;
    vy: number;
    verticalTimer: number;
    verticalDirection: number;
    fireTimer: number;
    fireInterval: number;
    color: string;
    active: boolean;
    constructor(gameWidth: number, gameHeight: number, isSmall?: boolean);
    update(_shipX: number, _shipY: number): void;
    shouldFire(): boolean;
    createBullet(shipX: number, shipY: number): Bullet;
    draw(ctx: CanvasRenderingContext2D): void;
    getBounds(): Bounds;
    isAlive(): boolean;
}
//# sourceMappingURL=saucer.d.ts.map