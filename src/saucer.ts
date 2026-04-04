/**
 * UFO/Saucer class
 */

import { Bounds, Sprite, Entity, EntityType } from './types.js';
import { SPRITES } from './sprites.js';
import { Bullet } from './bullet.js';

export class Saucer implements Entity {
    readonly entityType: EntityType = 'saucer';
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

    constructor(gameWidth: number, gameHeight: number, isSmall = false) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.isSmall = isSmall;
        
        // Size based on type
        if (isSmall) {
            this.sprite = SPRITES.saucerSmall;
            this.width = 8;
            this.height = 4;
            this.points = 1000;
            this.accuracy = 0.8; // More accurate
        } else {
            this.sprite = SPRITES.saucer;
            this.width = 12;
            this.height = 6;
            this.points = 200;
            this.accuracy = 0.3; // Less accurate
        }
        
        // Start from left or right edge
        this.fromLeft = Math.random() < 0.5;
        this.x = this.fromLeft ? -this.width : gameWidth;
        this.y = 20 + Math.random() * (gameHeight - 40);
        
        // Velocity
        this.vx = (this.fromLeft ? 1 : -1) * (isSmall ? 0.6 : 0.4);
        this.vy = 0;
        this.verticalTimer = 0;
        this.verticalDirection = Math.random() < 0.5 ? 1 : -1;
        
        // Firing
        this.fireTimer = 0;
        this.fireInterval = isSmall ? 60 : 90; // Frames between shots
        
        // Color
        this.color = isSmall ? '#FF6B6B' : '#E83C3C';
        
        // Active state
        this.active = true;
    }

    update(_shipX: number, _shipY: number): void {
        this.x += this.vx;
        this.y += this.vy;
        
        // Vertical movement changes
        this.verticalTimer++;
        if (this.verticalTimer > 30 + Math.random() * 30) {
            this.verticalTimer = 0;
            this.verticalDirection = -this.verticalDirection;
            this.vy = this.verticalDirection * (0.15 + Math.random() * 0.15);
        }
        
        // Keep in vertical bounds
        if (this.y < 15) {
            this.y = 15;
            this.vy = Math.abs(this.vy);
        }
        if (this.y > this.gameHeight - this.height - 5) {
            this.y = this.gameHeight - this.height - 5;
            this.vy = -Math.abs(this.vy);
        }
        
        // Check if off screen
        if (this.fromLeft && this.x > this.gameWidth + this.width) {
            this.active = false;
        }
        if (!this.fromLeft && this.x < -this.width) {
            this.active = false;
        }
        
        // Firing logic
        this.fireTimer++;
    }

    shouldFire(): boolean {
        if (this.fireTimer >= this.fireInterval) {
            this.fireTimer = 0;
            return true;
        }
        return false;
    }

    createBullet(shipX: number, shipY: number): Bullet {
        let angle: number;
        
        if (Math.random() < this.accuracy) {
            // Aim at player
            angle = Math.atan2(shipY - this.y, shipX - this.x);
            // Add some inaccuracy
            angle += (Math.random() - 0.5) * (this.isSmall ? 0.3 : 0.8);
        } else {
            // Random direction
            angle = Math.random() * Math.PI * 2;
        }
        
        return new Bullet(
            this.x + this.width / 2,
            this.y + this.height / 2,
            angle,
            false // Not player bullet
        );
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = this.color;
        
        const drawX = Math.floor(this.x);
        const drawY = Math.floor(this.y);
        
        for (let row = 0; row < this.sprite.length; row++) {
            for (let col = 0; col < this.sprite[row].length; col++) {
                if (this.sprite[row][col]) {
                    ctx.fillRect(drawX + col, drawY + row, 1, 1);
                }
            }
        }
    }

    getBounds(): Bounds {
        return {
            x: this.x + 1,
            y: this.y + 1,
            width: this.width - 2,
            height: this.height - 2
        };
    }

    isAlive(): boolean {
        return this.active;
    }
}
