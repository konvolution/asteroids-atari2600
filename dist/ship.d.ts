/**
 * Player Ship class
 */
import { Bounds, Entity, EntityType } from './types.js';
import { Bullet } from './bullet.js';
export declare class Ship implements Entity {
    readonly entityType: EntityType;
    private _alive;
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
    rotationSpeed: number;
    rotationAccum: number;
    thrust: number;
    friction: number;
    maxSpeed: number;
    width: number;
    height: number;
    isThrusting: boolean;
    invulnerable: boolean;
    invulnerableTimer: number;
    visible: boolean;
    blinkTimer: number;
    fireTimer: number;
    fireDelay: number;
    color: string;
    thrustColor: string;
    constructor(x: number, y: number);
    update(gameWidth: number, gameHeight: number): void;
    rotateLeft(): void;
    rotateRight(): void;
    applyThrust(): void;
    stopThrust(): void;
    canFire(): boolean;
    fire(): Bullet | null;
    hyperspace(gameWidth: number, gameHeight: number): boolean;
    makeInvulnerable(frames?: number): void;
    reset(x: number, y: number): void;
    draw(ctx: CanvasRenderingContext2D): void;
    private drawThrustFlame;
    getBounds(): Bounds;
    isAlive(): boolean;
    destroy(): void;
}
//# sourceMappingURL=ship.d.ts.map