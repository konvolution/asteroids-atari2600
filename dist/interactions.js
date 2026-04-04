/**
 * Interaction classes - Polymorphic handlers for entity behavior
 */
import { Explosion } from './particle.js';
import { input } from './input.js';
import { audio } from './audio.js';
/**
 * ShipInteraction - Handles player input, firing, collisions
 */
export class ShipInteraction {
    constructor(ship, world) {
        this.ship = ship;
        this.world = world;
    }
    isAlive() {
        return this.ship.isAlive();
    }
    update() {
        if (!this.ship.isAlive())
            return;
        // Rotation
        if (input.isPressed('left'))
            this.ship.rotateLeft();
        if (input.isPressed('right'))
            this.ship.rotateRight();
        // Thrust
        if (input.isPressed('up')) {
            this.ship.applyThrust();
            audio.startThrust();
        }
        else {
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
    checkCollisions() {
        if (!this.ship.isAlive() || this.ship.invulnerable)
            return;
        const shipBounds = this.ship.getBounds();
        // Check asteroid collisions
        for (const asteroid of this.world.getEntities('asteroid')) {
            if (this.world.checkCollision(shipBounds, asteroid.getBounds())) {
                this.destroyShip();
                return;
            }
        }
        // Check saucer collision
        for (const saucer of this.world.getEntities('saucer')) {
            if (this.world.checkCollision(shipBounds, saucer.getBounds())) {
                this.destroyShip();
                return;
            }
        }
        // Check enemy bullets
        for (const bullet of this.world.getEntities('bullet')) {
            if (bullet.isPlayerBullet)
                continue;
            if (this.world.checkCollision(shipBounds, bullet.getBounds())) {
                this.world.removeEntity(bullet);
                this.destroyShip();
                return;
            }
        }
    }
    destroyShip() {
        this.world.addEntity(new Explosion(this.ship.x + this.ship.width / 2, this.ship.y + this.ship.height / 2, 'large', this.ship.color));
        audio.stopThrust();
        audio.playShipExplosion();
        this.ship.destroy();
        this.world.onShipDestroyed?.();
    }
}
/**
 * SaucerInteraction - Handles saucer AI, firing, collisions
 */
export class SaucerInteraction {
    constructor(saucer, world) {
        this.saucer = saucer;
        this.world = world;
        this.stopped = false;
    }
    isAlive() {
        return !this.stopped;
    }
    stop() {
        if (this.stopped)
            return;
        this.stopped = true;
        this.world.removeEntity(this.saucer);
        audio.stopSaucer();
    }
    destroySaucer() {
        this.world.addEntity(new Explosion(this.saucer.x + this.saucer.width / 2, this.saucer.y + this.saucer.height / 2, 'medium', this.saucer.color));
        audio.playExplosion('medium');
        this.world.onScorePoints?.(this.saucer.points);
        this.stop();
    }
    update() {
        if (this.stopped)
            return;
        const ships = this.world.getEntities('ship');
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
    checkCollisions() {
        if (this.stopped)
            return;
        for (const bullet of this.world.getEntities('bullet')) {
            if (!bullet.isPlayerBullet)
                continue;
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
export class AsteroidInteraction {
    constructor(world) {
        this.world = world;
    }
    isAlive() {
        // AsteroidInteraction is always alive (handles all asteroids collectively)
        return true;
    }
    update() {
        // Asteroids update themselves in the entity loop
    }
    checkCollisions() {
        const bullets = this.world.getEntities('bullet');
        const asteroids = this.world.getEntities('asteroid');
        for (const bullet of bullets) {
            if (!bullet.isPlayerBullet || !bullet.isAlive())
                continue;
            for (const asteroid of asteroids) {
                if (!asteroid.isAlive())
                    continue;
                if (this.world.checkCollision(bullet.getBounds(), asteroid.getBounds())) {
                    this.world.removeEntity(bullet);
                    this.destroyAsteroid(asteroid);
                    break;
                }
            }
        }
    }
    destroyAsteroid(asteroid) {
        // Create explosion
        this.world.addEntity(new Explosion(asteroid.x + asteroid.width / 2, asteroid.y + asteroid.height / 2, asteroid.size, asteroid.color));
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
//# sourceMappingURL=interactions.js.map