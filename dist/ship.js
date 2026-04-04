/**
 * Player Ship class
 */
import { SPRITES } from './sprites.js';
import { Bullet } from './bullet.js';
export class Ship {
    constructor(x, y) {
        this.entityType = 'ship';
        this._alive = true;
        this.x = x;
        this.y = y;
        // Velocity
        this.vx = 0;
        this.vy = 0;
        // Rotation (16 directions)
        this.rotation = 0; // 0-15 (0 = up)
        this.rotationSpeed = 0.3; // How fast to rotate
        this.rotationAccum = 0; // Accumulator for smooth rotation
        // Movement
        this.thrust = 0.015;
        this.friction = 0.995;
        this.maxSpeed = 1.5;
        // Ship size (matches sprite)
        this.width = 9;
        this.height = 9;
        // State
        this.isThrusting = false;
        this.invulnerable = false;
        this.invulnerableTimer = 0;
        this.visible = true;
        this.blinkTimer = 0;
        // Firing
        this.fireTimer = 0;
        this.fireDelay = 10; // Frames between shots (~0.17s at 60fps)
        // Colors
        this.color = '#6CDCF6'; // Cyan like 2600
        this.thrustColor = '#FF6B00';
    }
    update(gameWidth, gameHeight) {
        // Apply friction
        this.vx *= this.friction;
        this.vy *= this.friction;
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        // Screen wrapping
        if (this.x < -this.width)
            this.x = gameWidth;
        if (this.x > gameWidth)
            this.x = -this.width;
        if (this.y < -this.height)
            this.y = gameHeight;
        if (this.y > gameHeight)
            this.y = -this.height;
        // Fire cooldown
        if (this.fireTimer > 0)
            this.fireTimer--;
        // Invulnerability
        if (this.invulnerable) {
            this.invulnerableTimer--;
            if (this.invulnerableTimer <= 0) {
                this.invulnerable = false;
                this.visible = true;
            }
            else {
                // Blink effect
                this.blinkTimer++;
                if (this.blinkTimer > 5) {
                    this.blinkTimer = 0;
                    this.visible = !this.visible;
                }
            }
        }
    }
    rotateLeft() {
        this.rotationAccum -= this.rotationSpeed;
        if (this.rotationAccum <= -1) {
            this.rotationAccum += 1;
            this.rotation = (this.rotation - 1 + 16) % 16;
        }
    }
    rotateRight() {
        this.rotationAccum += this.rotationSpeed;
        if (this.rotationAccum >= 1) {
            this.rotationAccum -= 1;
            this.rotation = (this.rotation + 1) % 16;
        }
    }
    applyThrust() {
        // Convert rotation to angle (0 = up = -PI/2)
        const angle = (this.rotation / 16) * Math.PI * 2 - Math.PI / 2;
        this.vx += Math.cos(angle) * this.thrust;
        this.vy += Math.sin(angle) * this.thrust;
        // Limit speed
        const speed = Math.hypot(this.vx, this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        }
        this.isThrusting = true;
    }
    stopThrust() {
        this.isThrusting = false;
    }
    canFire() {
        return this.fireTimer <= 0;
    }
    fire() {
        if (!this.canFire())
            return null;
        this.fireTimer = this.fireDelay;
        // Convert rotation to angle
        const angle = (this.rotation / 16) * Math.PI * 2 - Math.PI / 2;
        // Bullet starts at ship's nose
        const noseDistance = 5;
        const bulletX = this.x + this.width / 2 + Math.cos(angle) * noseDistance;
        const bulletY = this.y + this.height / 2 + Math.sin(angle) * noseDistance;
        return new Bullet(bulletX, bulletY, angle, true);
    }
    hyperspace(gameWidth, gameHeight) {
        // Random teleport
        this.x = Math.random() * (gameWidth - this.width);
        this.y = Math.random() * (gameHeight - this.height);
        // Stop movement
        this.vx = 0;
        this.vy = 0;
        // Small chance of death
        return Math.random() < 0.1; // 10% chance
    }
    makeInvulnerable(frames = 180) {
        this.invulnerable = true;
        this.invulnerableTimer = frames;
        this.blinkTimer = 0;
        this.visible = true;
    }
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.rotation = 0;
        this.rotationAccum = 0;
        this.isThrusting = false;
        this.fireTimer = 0;
        this.makeInvulnerable(180); // 3 seconds at 60fps
    }
    draw(ctx) {
        if (!this.visible)
            return;
        const sprite = SPRITES.ship[this.rotation];
        const drawX = Math.floor(this.x);
        const drawY = Math.floor(this.y);
        // Draw ship
        ctx.fillStyle = this.color;
        for (let row = 0; row < sprite.length; row++) {
            for (let col = 0; col < sprite[row].length; col++) {
                if (sprite[row][col]) {
                    ctx.fillRect(drawX + col, drawY + row, 1, 1);
                }
            }
        }
        // Draw thrust flame
        if (this.isThrusting && Math.random() > 0.3) {
            this.drawThrustFlame(ctx, drawX, drawY);
        }
    }
    drawThrustFlame(ctx, shipX, shipY) {
        ctx.fillStyle = this.thrustColor;
        // Get opposite direction of ship facing
        const flameRotation = (this.rotation + 8) % 16;
        const angle = (flameRotation / 16) * Math.PI * 2 - Math.PI / 2;
        // Simple flame behind ship
        const flameX = shipX + this.width / 2 + Math.cos(angle) * 4;
        const flameY = shipY + this.height / 2 + Math.sin(angle) * 4;
        // Random flame size for flicker effect
        const size = 2 + Math.floor(Math.random() * 2);
        ctx.fillRect(Math.floor(flameX) - 1, Math.floor(flameY) - 1, size, size);
    }
    getBounds() {
        return {
            x: this.x + 2,
            y: this.y + 2,
            width: this.width - 4,
            height: this.height - 4
        };
    }
    isAlive() {
        return this._alive;
    }
    destroy() {
        this._alive = false;
    }
}
//# sourceMappingURL=ship.js.map