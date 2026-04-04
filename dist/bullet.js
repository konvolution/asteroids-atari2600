/**
 * Bullet class
 */
export class Bullet {
    constructor(x, y, angle, isPlayerBullet = true) {
        this.entityType = 'bullet';
        this.x = x;
        this.y = y;
        this.isPlayerBullet = isPlayerBullet;
        // Bullet speed
        const speed = isPlayerBullet ? 2 : 1.25;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        // Size
        this.width = 2;
        this.height = 2;
        // Lifetime (frames)
        this.life = isPlayerBullet ? 50 : 70;
        // Color
        this.color = isPlayerBullet ? '#FFFFFF' : '#FF6B6B';
    }
    update(gameWidth, gameHeight) {
        this.x += this.vx;
        this.y += this.vy;
        // Screen wrapping
        if (this.x < 0)
            this.x = gameWidth;
        if (this.x > gameWidth)
            this.x = 0;
        if (this.y < 0)
            this.y = gameHeight;
        if (this.y > gameHeight)
            this.y = 0;
        this.life--;
    }
    isAlive() {
        return this.life > 0;
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(Math.floor(this.x), Math.floor(this.y), this.width, this.height);
    }
    // Get bounding box for collision
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}
//# sourceMappingURL=bullet.js.map