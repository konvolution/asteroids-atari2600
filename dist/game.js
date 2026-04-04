/**
 * Atari 2600 Asteroids - Main Game
 * A browser-based port with authentic blocky graphics and TIA-style sound
 */
import { SPRITES } from './sprites.js';
import { audio } from './audio.js';
import { input } from './input.js';
import { Ship } from './ship.js';
import { Asteroid } from './asteroid.js';
import { Saucer } from './saucer.js';
import { ShipInteraction, SaucerInteraction, AsteroidInteraction } from './interactions.js';
// Game constants
const INTERNAL_WIDTH = 160;
const INTERNAL_HEIGHT = 210;
const SCALE = 4;
const DISPLAY_WIDTH = INTERNAL_WIDTH * SCALE;
const DISPLAY_HEIGHT = INTERNAL_HEIGHT * SCALE;
/**
 * GameWorld - Single entity list with generic operations
 */
export class GameWorld {
    constructor(width, height) {
        this.entities = [];
        this.width = width;
        this.height = height;
    }
    addEntity(entity) {
        this.entities.push(entity);
    }
    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index !== -1) {
            this.entities.splice(index, 1);
        }
    }
    getEntities(type) {
        return this.entities.filter(e => e.entityType === type && e.isAlive());
    }
    checkCollision(a, b) {
        return a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y;
    }
    update() {
        // Update all entities
        for (const entity of this.entities) {
            entity.update(this.width, this.height);
        }
        // Remove dead entities
        this.entities = this.entities.filter(e => e.isAlive());
    }
    render(ctx) {
        // Render order: asteroids, saucers, bullets, ship, explosions
        const order = ['asteroid', 'saucer', 'bullet', 'ship', 'explosion'];
        for (const type of order) {
            for (const entity of this.entities) {
                if (entity.entityType === type) {
                    entity.draw(ctx);
                }
            }
        }
    }
    clear() {
        this.entities = [];
    }
    // Convenience getters for game logic
    getShip() {
        const ships = this.getEntities('ship');
        return ships.length > 0 ? ships[0] : null;
    }
    getSaucer() {
        const saucers = this.getEntities('saucer');
        return saucers.length > 0 ? saucers[0] : null;
    }
    getAsteroidCount() {
        return this.getEntities('asteroid').length;
    }
}
/**
 * AsteroidsGame - Main game coordinator
 * Manages game state, rendering, and orchestrates interactions
 */
export class AsteroidsGame {
    constructor() {
        // Game state
        this.state = 0 /* GameState.TITLE */;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.extraLifeScore = 10000;
        // Polymorphic interaction handlers
        this.interactions = [];
        // Saucer spawn timer
        this.saucerTimer = 0;
        this.saucerInterval = 1200;
        // Title screen animation
        this.titleBlink = 0;
        // Game over input delay
        this.gameOverTimer = 0;
        // Fixed timestep game loop (60 ticks per second)
        this.TICK_DURATION = 1000 / 60; // ~16.67ms per tick
        this.lastTime = 0;
        this.accumulator = 0;
        this.frameCount = 0;
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        // Set canvas size
        this.canvas.width = DISPLAY_WIDTH;
        this.canvas.height = DISPLAY_HEIGHT;
        // Create offscreen buffer for pixel-perfect rendering
        this.buffer = document.createElement('canvas');
        this.buffer.width = INTERNAL_WIDTH;
        this.buffer.height = INTERNAL_HEIGHT;
        this.bufferCtx = this.buffer.getContext('2d');
        // Disable image smoothing for crisp pixels
        this.ctx.imageSmoothingEnabled = false;
        this.bufferCtx.imageSmoothingEnabled = false;
        this.highScore = this.loadHighScore();
        this.nextExtraLife = this.extraLifeScore;
        // Create game world
        this.world = new GameWorld(INTERNAL_WIDTH, INTERNAL_HEIGHT);
        this.setupWorldCallbacks();
        // Start game loop
        requestAnimationFrame((t) => this.gameLoop(t));
    }
    setupWorldCallbacks() {
        this.world.onShipDestroyed = () => this.handleShipDestroyed();
        this.world.onScorePoints = (points) => this.addScore(points);
    }
    handleShipDestroyed() {
        this.lives--;
        if (this.lives <= 0) {
            this.gameOver();
        }
        else {
            // Respawn after delay
            setTimeout(() => {
                if (this.state === 1 /* GameState.PLAYING */) {
                    this.respawnShip();
                }
            }, 2000);
        }
    }
    loadHighScore() {
        try {
            return parseInt(localStorage.getItem('asteroidsHighScore') || '0') || 0;
        }
        catch {
            return 0;
        }
    }
    saveHighScore() {
        try {
            localStorage.setItem('asteroidsHighScore', this.highScore.toString());
        }
        catch {
            // Ignore storage errors
        }
    }
    gameLoop(timestamp) {
        // Calculate delta time
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        // Accumulate time and run fixed updates
        this.accumulator += deltaTime;
        // Cap accumulator to prevent spiral of death
        if (this.accumulator > 200) {
            this.accumulator = 200;
        }
        // Run game logic at fixed timestep
        while (this.accumulator >= this.TICK_DURATION) {
            this.update();
            this.accumulator -= this.TICK_DURATION;
            this.frameCount++;
        }
        // Render as fast as possible
        this.render();
        requestAnimationFrame((t) => this.gameLoop(t));
    }
    update() {
        switch (this.state) {
            case 0 /* GameState.TITLE */:
                this.updateTitle();
                break;
            case 1 /* GameState.PLAYING */:
                this.updatePlaying();
                break;
            case 2 /* GameState.GAME_OVER */:
                this.updateGameOver();
                break;
            case 3 /* GameState.PAUSED */:
                this.updatePaused();
                break;
        }
    }
    updateTitle() {
        this.titleBlink++;
        if (input.consumeStart()) {
            this.startGame();
        }
    }
    updatePaused() {
        if (input.consumePause()) {
            this.state = 1 /* GameState.PLAYING */;
            audio.startHeartbeat(this.world.getAsteroidCount());
        }
    }
    updateGameOver() {
        this.gameOverTimer++;
        // Ignore input for 2 seconds (120 frames at 60fps)
        if (this.gameOverTimer > 120 && input.consumeStart()) {
            this.state = 0 /* GameState.TITLE */;
        }
    }
    updatePlaying() {
        // Check for pause
        if (input.consumePause()) {
            this.state = 3 /* GameState.PAUSED */;
            audio.stopHeartbeat();
            return;
        }
        // Remove dead interactions
        this.interactions = this.interactions.filter(i => i.isAlive());
        // Update all interactions (polymorphic)
        for (const interaction of this.interactions) {
            interaction.update();
        }
        // Update all entities
        this.world.update();
        // Saucer spawning
        this.updateSaucer();
        // Check all collisions (polymorphic)
        for (const interaction of this.interactions) {
            interaction.checkCollisions();
        }
        // Check for level complete
        if (this.world.getAsteroidCount() === 0 && !this.world.getSaucer()) {
            this.nextLevel();
        }
        // Update heartbeat tempo
        audio.startHeartbeat(this.world.getAsteroidCount());
    }
    updateSaucer() {
        if (!this.world.getSaucer()) {
            this.saucerTimer++;
            if (this.saucerTimer >= this.saucerInterval && this.world.getAsteroidCount() > 0) {
                this.saucerTimer = 0;
                const isSmall = this.score >= 40000 || (this.score >= 10000 && Math.random() < 0.3);
                const saucer = new Saucer(INTERNAL_WIDTH, INTERNAL_HEIGHT, isSmall);
                this.world.addEntity(saucer);
                this.interactions.push(new SaucerInteraction(saucer, this.world));
                audio.startSaucer();
            }
        }
    }
    addScore(points) {
        this.score += points;
        if (this.score >= this.nextExtraLife) {
            this.lives++;
            this.nextExtraLife += this.extraLifeScore;
            audio.playExtraLife();
        }
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
        }
    }
    respawnShip() {
        const ship = new Ship(INTERNAL_WIDTH / 2 - 4, INTERNAL_HEIGHT / 2 - 4);
        ship.makeInvulnerable(180);
        this.world.addEntity(ship);
        this.interactions.push(new ShipInteraction(ship, this.world));
    }
    gameOver() {
        this.state = 2 /* GameState.GAME_OVER */;
        this.gameOverTimer = 0;
        this.interactions = [];
        audio.stopAll();
        audio.playGameOver();
    }
    startGame() {
        audio.init();
        audio.resume();
        audio.playStartGame();
        this.state = 1 /* GameState.PLAYING */;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.nextExtraLife = this.extraLifeScore;
        // Clear world and interactions
        this.world.clear();
        this.interactions = [];
        // Create ship
        const ship = new Ship(INTERNAL_WIDTH / 2 - 4, INTERNAL_HEIGHT / 2 - 4);
        ship.makeInvulnerable(120);
        this.world.addEntity(ship);
        // Create interaction handlers
        this.interactions.push(new ShipInteraction(ship, this.world));
        this.interactions.push(new AsteroidInteraction(this.world));
        this.saucerTimer = 0;
        // Create initial asteroids
        this.spawnAsteroids(4);
        audio.startHeartbeat(this.world.getAsteroidCount());
    }
    nextLevel() {
        this.level++;
        const asteroidCount = Math.min(4 + this.level - 1, 12);
        this.spawnAsteroids(asteroidCount);
        this.saucerTimer = 0;
        audio.startHeartbeat(this.world.getAsteroidCount());
    }
    spawnAsteroids(count) {
        const ship = this.world.getShip();
        const shipX = ship ? ship.x : INTERNAL_WIDTH / 2;
        const shipY = ship ? ship.y : INTERNAL_HEIGHT / 2;
        const asteroids = Asteroid.createWave(count, INTERNAL_WIDTH, INTERNAL_HEIGHT, shipX, shipY, 30);
        for (const asteroid of asteroids) {
            this.world.addEntity(asteroid);
        }
    }
    render() {
        // Clear buffer
        this.bufferCtx.fillStyle = '#000000';
        this.bufferCtx.fillRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);
        switch (this.state) {
            case 0 /* GameState.TITLE */:
                this.renderTitle();
                break;
            case 1 /* GameState.PLAYING */:
            case 3 /* GameState.PAUSED */:
                this.renderGame();
                if (this.state === 3 /* GameState.PAUSED */) {
                    this.renderPaused();
                }
                break;
            case 2 /* GameState.GAME_OVER */:
                this.renderGame();
                this.renderGameOver();
                break;
        }
        // Scale buffer to display canvas
        this.ctx.drawImage(this.buffer, 0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);
    }
    renderTitle() {
        const ctx = this.bufferCtx;
        this.drawText(ctx, 'ASTEROIDS', INTERNAL_WIDTH / 2 - 27, 50, '#6CDCF6');
        if (Math.floor(this.titleBlink / 30) % 2 === 0) {
            this.drawText(ctx, 'PRESS FIRE', INTERNAL_WIDTH / 2 - 30, 100, '#FFFFFF');
        }
        this.drawText(ctx, 'HIGH SCORE', INTERNAL_WIDTH / 2 - 30, 140, '#C4956A');
        this.drawNumber(ctx, this.highScore, INTERNAL_WIDTH / 2 - 15, 155, '#FFFFFF');
        this.drawText(ctx, 'ARROWS MOVE', INTERNAL_WIDTH / 2 - 33, 180, '#888888');
        this.drawText(ctx, 'SPACE FIRE', INTERNAL_WIDTH / 2 - 30, 192, '#888888');
    }
    renderGame() {
        this.world.render(this.bufferCtx);
        this.renderHUD();
    }
    renderHUD() {
        const ctx = this.bufferCtx;
        this.drawNumber(ctx, this.score, 5, 5, '#FFFFFF');
        for (let i = 0; i < this.lives; i++) {
            this.drawSprite(ctx, SPRITES.lifeIcon, 5 + i * 7, 15, '#6CDCF6');
        }
        const highScoreStr = this.highScore.toString();
        this.drawNumber(ctx, this.highScore, INTERNAL_WIDTH - 5 - highScoreStr.length * 6, 5, '#C4956A');
    }
    renderPaused() {
        const ctx = this.bufferCtx;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);
        this.drawText(ctx, 'PAUSED', INTERNAL_WIDTH / 2 - 18, INTERNAL_HEIGHT / 2 - 4, '#FFFFFF');
    }
    renderGameOver() {
        const ctx = this.bufferCtx;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);
        this.drawText(ctx, 'GAME OVER', INTERNAL_WIDTH / 2 - 27, INTERNAL_HEIGHT / 2 - 20, '#FF6B6B');
        this.drawText(ctx, 'SCORE', INTERNAL_WIDTH / 2 - 15, INTERNAL_HEIGHT / 2, '#FFFFFF');
        this.drawNumber(ctx, this.score, INTERNAL_WIDTH / 2 - 15, INTERNAL_HEIGHT / 2 + 12, '#6CDCF6');
        if (Math.floor(this.frameCount / 30) % 2 === 0) {
            this.drawText(ctx, 'PRESS FIRE', INTERNAL_WIDTH / 2 - 30, INTERNAL_HEIGHT / 2 + 40, '#FFFFFF');
        }
    }
    drawSprite(ctx, sprite, x, y, color) {
        ctx.fillStyle = color;
        for (let row = 0; row < sprite.length; row++) {
            for (let col = 0; col < sprite[row].length; col++) {
                if (sprite[row][col]) {
                    ctx.fillRect(x + col, y + row, 1, 1);
                }
            }
        }
    }
    drawText(ctx, text, x, y, color) {
        ctx.fillStyle = color;
        let offsetX = 0;
        for (const char of text.toUpperCase()) {
            const sprite = SPRITES.letters[char] || SPRITES.numbers[char];
            if (sprite) {
                for (let row = 0; row < sprite.length; row++) {
                    for (let col = 0; col < sprite[row].length; col++) {
                        if (sprite[row][col]) {
                            ctx.fillRect(x + offsetX + col, y + row, 1, 1);
                        }
                    }
                }
            }
            offsetX += 6;
        }
    }
    drawNumber(ctx, num, x, y, color) {
        const str = num.toString();
        ctx.fillStyle = color;
        let offsetX = 0;
        for (const char of str) {
            const sprite = SPRITES.numbers[char];
            if (sprite) {
                for (let row = 0; row < sprite.length; row++) {
                    for (let col = 0; col < sprite[row].length; col++) {
                        if (sprite[row][col]) {
                            ctx.fillRect(x + offsetX + col, y + row, 1, 1);
                        }
                    }
                }
            }
            offsetX += 6;
        }
    }
}
// Start game when page loads
let game;
window.addEventListener('load', () => {
    game = new AsteroidsGame();
});
// Handle visibility change (pause when tab hidden)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && game && game.state === 1 /* GameState.PLAYING */) {
        game.state = 3 /* GameState.PAUSED */;
        audio.stopAll();
    }
});
//# sourceMappingURL=game.js.map