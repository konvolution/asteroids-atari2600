/**
 * Interaction classes - Polymorphic handlers for entity behavior
 */
import { Bounds, Entity, EntityType, Interaction } from './types.js';
import { Ship } from './ship.js';
import { Saucer } from './saucer.js';
/**
 * IGameWorld - Simple interface for entity management
 */
export interface IGameWorld {
    readonly width: number;
    readonly height: number;
    addEntity(entity: Entity): void;
    removeEntity(entity: Entity): void;
    getEntities<T extends Entity>(type: EntityType): T[];
    checkCollision(a: Bounds, b: Bounds): boolean;
    getAsteroidCount(): number;
    onShipDestroyed?: () => void;
    onScorePoints?: (points: number) => void;
}
/**
 * ShipInteraction - Handles player input, firing, collisions
 */
export declare class ShipInteraction implements Interaction {
    private ship;
    private world;
    constructor(ship: Ship, world: IGameWorld);
    isAlive(): boolean;
    update(): void;
    checkCollisions(): void;
    private destroyShip;
}
/**
 * SaucerInteraction - Handles saucer AI, firing, collisions
 */
export declare class SaucerInteraction implements Interaction {
    private saucer;
    private world;
    private stopped;
    constructor(saucer: Saucer, world: IGameWorld);
    isAlive(): boolean;
    private stop;
    private destroySaucer;
    update(): void;
    checkCollisions(): void;
}
/**
 * AsteroidInteraction - Handles asteroid bullet collisions and splitting
 */
export declare class AsteroidInteraction implements Interaction {
    private world;
    constructor(world: IGameWorld);
    isAlive(): boolean;
    update(): void;
    checkCollisions(): void;
    private destroyAsteroid;
}
//# sourceMappingURL=interactions.d.ts.map