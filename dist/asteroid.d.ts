/**
 * Asteroid class
 */
import { Bounds, AsteroidSize, Sprite, Entity, EntityType } from './types.js';
export declare class Asteroid implements Entity {
    readonly entityType: EntityType;
    private _alive;
    x: number;
    y: number;
    size: AsteroidSize;
    sprite: Sprite;
    width: number;
    height: number;
    points: number;
    baseSpeed: number;
    vx: number;
    vy: number;
    color: string;
    private static readonly COLORS;
    private static colorIndex;
    constructor(x: number, y: number, size?: AsteroidSize, vx?: number | null, vy?: number | null);
    update(gameWidth: number, gameHeight: number): void;
    draw(ctx: CanvasRenderingContext2D): void;
    getBounds(): Bounds;
    isAlive(): boolean;
    destroy(): void;
    split(): Asteroid[];
    static createWave(count: number, gameWidth: number, gameHeight: number, shipX: number, shipY: number, safeRadius?: number): Asteroid[];
}
//# sourceMappingURL=asteroid.d.ts.map