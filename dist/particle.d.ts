/**
 * Particle class for explosions
 */
import { ExplosionSize, Entity, EntityType, Bounds } from './types.js';
export declare class Particle {
    x: number;
    y: number;
    color: string;
    vx: number;
    vy: number;
    life: number;
    decay: number;
    size: number;
    constructor(x: number, y: number, color?: string);
    update(): void;
    isAlive(): boolean;
    draw(ctx: CanvasRenderingContext2D): void;
}
/**
 * Explosion effect - creates multiple particles
 */
export declare class Explosion implements Entity {
    readonly entityType: EntityType;
    x: number;
    y: number;
    width: number;
    height: number;
    private particles;
    constructor(x: number, y: number, size?: ExplosionSize, color?: string);
    update(_gameWidth: number, _gameHeight: number): void;
    isAlive(): boolean;
    draw(ctx: CanvasRenderingContext2D): void;
    getBounds(): Bounds;
}
//# sourceMappingURL=particle.d.ts.map