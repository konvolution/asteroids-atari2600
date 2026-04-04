/**
 * Asteroid class
 */

import { Bounds, AsteroidSize, Sprite, Entity, EntityType } from './types.js';
import { SPRITES } from './sprites.js';

export class Asteroid implements Entity {
    readonly entityType: EntityType = 'asteroid';
    private _alive = true;
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

    // Atari 2600 asteroid color palette (cycles through these 7 colors)
    private static readonly COLORS = [
        '#d2d2d2', // Gray
        '#6aaeed', // Blue
        '#b4b42a', // Yellow-green
        '#7e8833', // Olive
        '#b12827', // Red
        '#b13b98', // Magenta
        '#5d3dbf'  // Purple
    ];
    private static colorIndex = 0;

    constructor(x: number, y: number, size: AsteroidSize = 'large', vx: number | null = null, vy: number | null = null) {
        this.x = x;
        this.y = y;
        this.size = size;
        
        // Size-based properties
        switch (size) {
            case 'large':
                this.sprite = SPRITES.asteroidLarge[Math.floor(Math.random() * SPRITES.asteroidLarge.length)];
                this.width = 16;
                this.height = 16;
                this.points = 20;
                this.baseSpeed = 0.15;
                break;
            case 'medium':
                this.sprite = SPRITES.asteroidMedium[Math.floor(Math.random() * SPRITES.asteroidMedium.length)];
                this.width = 10;
                this.height = 10;
                this.points = 50;
                this.baseSpeed = 0.3;
                break;
            case 'small':
                this.sprite = SPRITES.asteroidSmall[Math.floor(Math.random() * SPRITES.asteroidSmall.length)];
                this.width = 6;
                this.height = 6;
                this.points = 100;
                this.baseSpeed = 0.5;
                break;
        }
        
        // Velocity
        if (vx !== null && vy !== null) {
            this.vx = vx;
            this.vy = vy;
        } else {
            const angle = Math.random() * Math.PI * 2;
            const speed = this.baseSpeed + Math.random() * 0.3;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
        }
        
        // Cycle through colors
        this.color = Asteroid.COLORS[Asteroid.colorIndex];
        Asteroid.colorIndex = (Asteroid.colorIndex + 1) % Asteroid.COLORS.length;
    }

    update(gameWidth: number, gameHeight: number): void {
        this.x += this.vx;
        this.y += this.vy;
        
        // Screen wrapping
        if (this.x < -this.width) this.x = gameWidth;
        if (this.x > gameWidth) this.x = -this.width;
        if (this.y < -this.height) this.y = gameHeight;
        if (this.y > gameHeight) this.y = -this.height;
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

    // Get bounding box for collision
    getBounds(): Bounds {
        return {
            x: this.x + 1,
            y: this.y + 1,
            width: this.width - 2,
            height: this.height - 2
        };
    }

    isAlive(): boolean {
        return this._alive;
    }

    destroy(): void {
        this._alive = false;
    }

    // Split into smaller asteroids
    split(): Asteroid[] {
        const children: Asteroid[] = [];
        
        if (this.size === 'large') {
            // Spawn 2 medium asteroids
            for (let i = 0; i < 2; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 0.3 + Math.random() * 0.2;
                children.push(new Asteroid(
                    this.x + this.width / 2,
                    this.y + this.height / 2,
                    'medium',
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed
                ));
            }
        } else if (this.size === 'medium') {
            // Spawn 2 small asteroids
            for (let i = 0; i < 2; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 0.5 + Math.random() * 0.25;
                children.push(new Asteroid(
                    this.x + this.width / 2,
                    this.y + this.height / 2,
                    'small',
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed
                ));
            }
        }
        // Small asteroids don't split
        
        return children;
    }

    // Create asteroids for new level
    static createWave(count: number, gameWidth: number, gameHeight: number, shipX: number, shipY: number, safeRadius = 40): Asteroid[] {
        const asteroids: Asteroid[] = [];
        
        for (let i = 0; i < count; i++) {
            let x: number, y: number;
            let attempts = 0;
            
            // Find position away from ship
            do {
                x = Math.random() * gameWidth;
                y = Math.random() * gameHeight;
                attempts++;
            } while (
                Math.hypot(x - shipX, y - shipY) < safeRadius && 
                attempts < 50
            );
            
            asteroids.push(new Asteroid(x, y, 'large'));
        }
        
        return asteroids;
    }
}
