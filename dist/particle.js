/**
 * Particle class for explosions
 */
export class Particle {
    constructor(x, y, color = '#FFD800') {
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
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        // Slow down
        this.vx *= 0.98;
        this.vy *= 0.98;
    }
    isAlive() {
        return this.life > 0;
    }
    draw(ctx) {
        if (this.life <= 0)
            return;
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
export class Explosion {
    constructor(x, y, size = 'medium', color = '#FFD800') {
        this.entityType = 'explosion';
        this.width = 1;
        this.height = 1;
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
    update(_gameWidth, _gameHeight) {
        this.particles.forEach(p => p.update());
        this.particles = this.particles.filter(p => p.isAlive());
    }
    isAlive() {
        return this.particles.length > 0;
    }
    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    }
    getBounds() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }
}
//# sourceMappingURL=particle.js.map