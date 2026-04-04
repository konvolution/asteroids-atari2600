/**
 * Interaction classes - Polymorphic handlers for entity behavior
 */

import { Bounds, Entity, EntityType, Interaction } from './types.js';
import { Ship } from './ship.js';
import { Saucer } from './saucer.js';
import { Asteroid } from './asteroid.js';
import { Bullet } from './bullet.js';
import { Explosion } from './particle.js';
import { input } from './input.js';
import { audio } from './audio.js';

/**
 * IGameWorld - Simple interface for entity management
 */
export interface IGameWorld {
    readonly width: number;
    readonly height: number;
    
    // Generic entity operations
    addEntity(entity: Entity): void;
    removeEntity(entity: Entity): void;
    getEntities<T extends Entity>(type: EntityType): T[];
    
    // Collision helper
    checkCollision(a: Bounds, b: Bounds): boolean;
    
    // Asteroid count (for heartbeat tempo)
    getAsteroidCount(): number;
    
    // Game events (callbacks set by game coordinator)
    onShipDestroyed?: () => void;
    onScorePoints?: (points: number) => void;
}

/**
 * ShipInteraction - Handles player input, firing, collisions
 */
export class ShipInteraction implements Interaction {
    constructor(private ship: Ship, private world: IGameWorld) {}

    isAlive(): boolean {
        return this.ship.isAlive();
    }

    update(): void {
        if (!this.ship.isAlive()) return;

        // Rotation
        if (input.isPressed('left')) this.ship.rotateLeft();
        if (input.isPressed('right')) this.ship.rotateRight();

        // Thrust
        if (input.isPressed('up')) {
            this.ship.applyThrust();
            audio.startThrust();
        } else {
            this.ship.stopThrust();
            audio.stopThrust();
        }

        // Fire (unlimited bullets, requires key release between shots)
        if (input.consumeFire() && this.ship.canFire()) {
            const bullet = this.ship.fire();
            if (bullet) {
                this.world.addEntity(bullet);
                audio.playFire();
            }
        }

        // Hyperspace
        if (input.consumeHyperspace()) {
            audio.playHyperspace();
            if (this.ship.hyperspace(this.world.width, this.world.height)) {
                this.destroyShip();
            }
        }

        this.ship.update(this.world.width, this.world.height);
    }

    checkCollisions(): void {
        if (!this.ship.isAlive() || this.ship.invulnerable) return;

        const shipBounds = this.ship.getBounds();

        // Check asteroid collisions
        for (const asteroid of this.world.getEntities<Asteroid>('asteroid')) {
            if (this.world.checkCollision(shipBounds, asteroid.getBounds())) {
                this.destroyShip();
                return;
            }
        }

        // Check saucer collision
        for (const saucer of this.world.getEntities<Saucer>('saucer')) {
            if (this.world.checkCollision(shipBounds, saucer.getBounds())) {
                this.destroyShip();
                return;
            }
        }

        // Check enemy bullets
        for (const bullet of this.world.getEntities<Bullet>('bullet')) {
            if (bullet.isPlayerBullet) continue;
            if (this.world.checkCollision(shipBounds, bullet.getBounds())) {
                this.world.removeEntity(bullet);
                this.destroyShip();
                return;
            }
        }
    }

    private destroyShip(): void {
        this.world.addEntity(new Explosion(
            this.ship.x + this.ship.width / 2,
            this.ship.y + this.ship.height / 2,
            'large',
            this.ship.color
        ));
        audio.stopThrust();
        audio.playShipExplosion();
        this.ship.destroy();
        this.world.onShipDestroyed?.();
    }
}

/**
 * SaucerInteraction - Handles saucer AI, firing, collisions
 */
export class SaucerInteraction implements Interaction {
    private stopped = false;
    
    constructor(private saucer: Saucer, private world: IGameWorld) {}

    isAlive(): boolean {
        return !this.stopped;
    }

    private stop(): void {
        if (this.stopped) return;
        this.stopped = true;
        this.world.removeEntity(this.saucer);
        audio.stopSaucer();
    }

    private destroySaucer(): void {
        this.world.addEntity(new Explosion(
            this.saucer.x + this.saucer.width / 2,
            this.saucer.y + this.saucer.height / 2,
            'medium',
            this.saucer.color
        ));
        audio.playExplosion('medium');
        this.world.onScorePoints?.(this.saucer.points);
        this.stop();
    }

    update(): void {
        if (this.stopped) return;

        const ships = this.world.getEntities<Ship>('ship');
        const ship = ships.find(s => s.isAlive());
        const targetX = ship ? ship.x : this.world.width / 2;
        const targetY = ship ? ship.y : this.world.height / 2;

        this.saucer.update(targetX, targetY);

        if (!this.saucer.isAlive()) {
            this.stop();
            return;
        }

        if (this.saucer.shouldFire() && ship) {
            const bullet = this.saucer.createBullet(ship.x, ship.y);
            this.world.addEntity(bullet);
            audio.playSaucerFire();
        }
    }

    checkCollisions(): void {
        if (this.stopped) return;

        for (const bullet of this.world.getEntities<Bullet>('bullet')) {
            if (!bullet.isPlayerBullet) continue;
            if (this.world.checkCollision(bullet.getBounds(), this.saucer.getBounds())) {
                this.world.removeEntity(bullet);
                this.destroySaucer();
                return;
            }
        }
    }
}

/**
 * AsteroidInteraction - Handles asteroid bullet collisions and splitting
 */
export class AsteroidInteraction implements Interaction {
    constructor(private world: IGameWorld) {}

    isAlive(): boolean {
        // AsteroidInteraction is always alive (handles all asteroids collectively)
        return true;
    }

    update(): void {
        // Asteroids update themselves in the entity loop
    }

    checkCollisions(): void {
        const bullets = this.world.getEntities<Bullet>('bullet');
        const asteroids = this.world.getEntities<Asteroid>('asteroid');

        for (const bullet of bullets) {
            if (!bullet.isPlayerBullet || !bullet.isAlive()) continue;

            for (const asteroid of asteroids) {
                if (!asteroid.isAlive()) continue;

                if (this.world.checkCollision(bullet.getBounds(), asteroid.getBounds())) {
                    this.world.removeEntity(bullet);
                    this.destroyAsteroid(asteroid);
                    break;
                }
            }
        }
    }

    private destroyAsteroid(asteroid: Asteroid): void {
        // Create explosion
        this.world.addEntity(new Explosion(
            asteroid.x + asteroid.width / 2,
            asteroid.y + asteroid.height / 2,
            asteroid.size,
            asteroid.color
        ));

        audio.playExplosion(asteroid.size);
        this.world.onScorePoints?.(asteroid.points);

        // Split into smaller asteroids
        for (const child of asteroid.split()) {
            this.world.addEntity(child);
        }

        this.world.removeEntity(asteroid);
        
        // Update heartbeat tempo based on remaining asteroids
        audio.startHeartbeat(this.world.getAsteroidCount());
    }
}
