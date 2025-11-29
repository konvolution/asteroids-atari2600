/**
 * Particle class for explosions
 */

import { ExplosionSize, Entity, EntityType, Bounds } from './types.js';

export class Particle {
    x: number;
    y: number;
    color: string;
    vx: number;
    vy: number;
    life: number;
    decay: number;
    size: number;

    constructor(x: number, y: number, color: string = '#FFD800') {
        this.x = x;
        this.y = y;
        this.color = color;
        
        // Random velocity
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 1.5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        // Lifetime
        this.life = 1.0;
        this.decay = 0.02 + Math.random() * 0.02;
        
        // Size
        this.size = 1 + Math.floor(Math.random() * 2);
    }

    update(): void {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        
        // Slow down
        this.vx *= 0.98;
        this.vy *= 0.98;
    }

    isAlive(): boolean {
        return this.life > 0;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        if (this.life <= 0) return;
        
        // Fade out
        const alpha = Math.min(1, this.life);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(Math.floor(this.x), Math.floor(this.y), this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

/**
 * Explosion effect - creates multiple particles
 */
export class Explosion implements Entity {
    readonly entityType: EntityType = 'explosion';
    x: number;
    y: number;
    width = 1;
    height = 1;
    private particles: Particle[];

    constructor(x: number, y: number, size: ExplosionSize = 'medium', color: string = '#FFD800') {
        this.x = x;
        this.y = y;
        this.particles = [];
        
        // Number of particles based on size
        const particleCount = size === 'large' ? 20 : size === 'small' ? 6 : 12;
        
        // Create particles
        for (let i = 0; i < particleCount; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    update(_gameWidth: number, _gameHeight: number): void {
        this.particles.forEach(p => p.update());
        this.particles = this.particles.filter(p => p.isAlive());
    }

    isAlive(): boolean {
        return this.particles.length > 0;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        this.particles.forEach(p => p.draw(ctx));
    }

    getBounds(): Bounds {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }
}
