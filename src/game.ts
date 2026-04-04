/**
 * Atari 2600 Asteroids - Main Game
 * A browser-based port with authentic blocky graphics and TIA-style sound
 */

import { Bounds, Entity, EntityType, GameState, Interaction, Sprite } from './types.js';
import { SPRITES } from './sprites.js';
import { audio } from './audio.js';
import { input } from './input.js';
import { Ship } from './ship.js';
import { Asteroid } from './asteroid.js';
import { Saucer } from './saucer.js';
import {
    IGameWorld,
    ShipInteraction,
    SaucerInteraction,
    AsteroidInteraction
} from './interactions.js';

// Game constants
const INTERNAL_WIDTH = 160;
const INTERNAL_HEIGHT = 210;
const SCALE = 4;
const DISPLAY_WIDTH = INTERNAL_WIDTH * SCALE;
const DISPLAY_HEIGHT = INTERNAL_HEIGHT * SCALE;

/**
 * GameWorld - Single entity list with generic operations
 */
export class GameWorld implements IGameWorld {
    readonly width: number;
    readonly height: number;
    
    private entities: Entity[] = [];
    
    // Game event callbacks
    onShipDestroyed?: () => void;
    onScorePoints?: (points: number) => void;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    addEntity(entity: Entity): void {
        this.entities.push(entity);
    }

    removeEntity(entity: Entity): void {
        const index = this.entities.indexOf(entity);
        if (index !== -1) {
            this.entities.splice(index, 1);
        }
    }

    getEntities<T extends Entity>(type: EntityType): T[] {
        return this.entities.filter(e => e.entityType === type && e.isAlive()) as T[];
    }

    checkCollision(a: Bounds, b: Bounds): boolean {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    update(): void {
        // Update all entities
        for (const entity of this.entities) {
            entity.update(this.width, this.height);
        }
        // Remove dead entities
        this.entities = this.entities.filter(e => e.isAlive());
    }

    render(ctx: CanvasRenderingContext2D): void {
        // Render order: asteroids, saucers, bullets, ship, explosions
        const order: EntityType[] = ['asteroid', 'saucer', 'bullet', 'ship', 'explosion'];
        for (const type of order) {
            for (const entity of this.entities) {
                if (entity.entityType === type) {
                    entity.draw(ctx);
                }
            }
        }
    }

    clear(): void {
        this.entities = [];
    }

    // Convenience getters for game logic
    getShip(): Ship | null {
        const ships = this.getEntities<Ship>('ship');
        return ships.length > 0 ? ships[0] : null;
    }

    getSaucer(): Saucer | null {
        const saucers = this.getEntities<Saucer>('saucer');
        return saucers.length > 0 ? saucers[0] : null;
    }

    getAsteroidCount(): number {
        return this.getEntities<Asteroid>('asteroid').length;
    }
}

/**
 * AsteroidsGame - Main game coordinator
 * Manages game state, rendering, and orchestrates interactions
 */
export class AsteroidsGame {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private buffer: HTMLCanvasElement;
    private bufferCtx: CanvasRenderingContext2D;
    
    // Game state
    private state: GameState = GameState.TITLE;
    private score = 0;
    private highScore: number;
    private lives = 3;
    private level = 1;
    private extraLifeScore = 10000;
    private nextExtraLife: number;
    
    // Game world
    private world: GameWorld;
    
    // Polymorphic interaction handlers
    private interactions: Interaction[] = [];
    
    // Saucer spawn timer
    private saucerTimer = 0;
    private saucerInterval = 1200;
    
    // Title screen animation
    private titleBlink = 0;
    
    // Game over input delay
    private gameOverTimer = 0;
    
    // Fixed timestep game loop (60 ticks per second)
    private readonly TICK_DURATION = 1000 / 60; // ~16.67ms per tick
    private lastTime = 0;
    private accumulator = 0;
    private frameCount = 0;

    constructor() {
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        
        // Set canvas size
        this.canvas.width = DISPLAY_WIDTH;
        this.canvas.height = DISPLAY_HEIGHT;
        this.fitCanvasToViewport();
        window.addEventListener('resize', () => this.fitCanvasToViewport());

        // Create offscreen buffer for pixel-perfect rendering
        this.buffer = document.createElement('canvas');
        this.buffer.width = INTERNAL_WIDTH;
        this.buffer.height = INTERNAL_HEIGHT;
        this.bufferCtx = this.buffer.getContext('2d')!;
        
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

    private fitCanvasToViewport(): void {
        const maxW = window.innerWidth - 90;   // arcade+bezel padding + border
        const maxH = window.innerHeight - 200; // title + padding + controls hint
        const scale = Math.min(1, maxW / DISPLAY_WIDTH, maxH / DISPLAY_HEIGHT);
        this.canvas.style.width = `${Math.floor(DISPLAY_WIDTH * scale)}px`;
        this.canvas.style.height = `${Math.floor(DISPLAY_HEIGHT * scale)}px`;
    }

    private setupWorldCallbacks(): void {
        this.world.onShipDestroyed = () => this.handleShipDestroyed();
        this.world.onScorePoints = (points) => this.addScore(points);
    }

    private handleShipDestroyed(): void {
        this.lives--;

        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Respawn after delay
            setTimeout(() => {
                if (this.state === GameState.PLAYING) {
                    this.respawnShip();
                }
            }, 2000);
        }
    }

    private loadHighScore(): number {
        try {
            return parseInt(localStorage.getItem('asteroidsHighScore') || '0') || 0;
        } catch {
            return 0;
        }
    }

    private saveHighScore(): void {
        try {
            localStorage.setItem('asteroidsHighScore', this.highScore.toString());
        } catch {
            // Ignore storage errors
        }
    }

    private gameLoop(timestamp: number): void {
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

    private update(): void {
        switch (this.state) {
            case GameState.TITLE:
                this.updateTitle();
                break;
            case GameState.PLAYING:
                this.updatePlaying();
                break;
            case GameState.GAME_OVER:
                this.updateGameOver();
                break;
            case GameState.PAUSED:
                this.updatePaused();
                break;
        }
    }

    private updateTitle(): void {
        this.titleBlink++;
        if (input.consumeStart()) {
            this.startGame();
        }
    }

    private updatePaused(): void {
        if (input.consumePause()) {
            this.state = GameState.PLAYING;
            audio.startHeartbeat(this.world.getAsteroidCount());
        }
    }

    private updateGameOver(): void {
        this.gameOverTimer++;
        
        // Ignore input for 2 seconds (120 frames at 60fps)
        if (this.gameOverTimer > 120 && input.consumeStart()) {
            this.state = GameState.TITLE;
        }
    }

    private updatePlaying(): void {
        // Check for pause
        if (input.consumePause()) {
            this.state = GameState.PAUSED;
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

    private updateSaucer(): void {
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

    private addScore(points: number): void {
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

    private respawnShip(): void {
        const ship = new Ship(
            INTERNAL_WIDTH / 2 - 4,
            INTERNAL_HEIGHT / 2 - 4
        );
        ship.makeInvulnerable(180);
        this.world.addEntity(ship);
        this.interactions.push(new ShipInteraction(ship, this.world));
    }

    private gameOver(): void {
        this.state = GameState.GAME_OVER;
        this.gameOverTimer = 0;
        this.interactions = [];
        audio.stopAll();
        audio.playGameOver();
    }

    private startGame(): void {
        audio.init();
        audio.resume();
        audio.playStartGame();
        
        this.state = GameState.PLAYING;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.nextExtraLife = this.extraLifeScore;
        
        // Clear world and interactions
        this.world.clear();
        this.interactions = [];
        
        // Create ship
        const ship = new Ship(
            INTERNAL_WIDTH / 2 - 4,
            INTERNAL_HEIGHT / 2 - 4
        );
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

    private nextLevel(): void {
        this.level++;
        const asteroidCount = Math.min(4 + this.level - 1, 12);
        this.spawnAsteroids(asteroidCount);
        this.saucerTimer = 0;
        audio.startHeartbeat(this.world.getAsteroidCount());
    }

    private spawnAsteroids(count: number): void {
        const ship = this.world.getShip();
        const shipX = ship ? ship.x : INTERNAL_WIDTH / 2;
        const shipY = ship ? ship.y : INTERNAL_HEIGHT / 2;
        
        const asteroids = Asteroid.createWave(
            count,
            INTERNAL_WIDTH,
            INTERNAL_HEIGHT,
            shipX,
            shipY,
            30
        );
        
        for (const asteroid of asteroids) {
            this.world.addEntity(asteroid);
        }
    }

    private render(): void {
        // Clear buffer
        this.bufferCtx.fillStyle = '#000000';
        this.bufferCtx.fillRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);
        
        switch (this.state) {
            case GameState.TITLE:
                this.renderTitle();
                break;
            case GameState.PLAYING:
            case GameState.PAUSED:
                this.renderGame();
                if (this.state === GameState.PAUSED) {
                    this.renderPaused();
                }
                break;
            case GameState.GAME_OVER:
                this.renderGame();
                this.renderGameOver();
                break;
        }
        
        // Scale buffer to display canvas
        this.ctx.drawImage(this.buffer, 0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);
    }

    private renderTitle(): void {
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

    private renderGame(): void {
        this.world.render(this.bufferCtx);
        this.renderHUD();
    }

    private renderHUD(): void {
        const ctx = this.bufferCtx;
        
        this.drawNumber(ctx, this.score, 5, 5, '#FFFFFF');
        
        for (let i = 0; i < this.lives; i++) {
            this.drawSprite(ctx, SPRITES.lifeIcon, 5 + i * 7, 15, '#6CDCF6');
        }
        
        const highScoreStr = this.highScore.toString();
        this.drawNumber(ctx, this.highScore, INTERNAL_WIDTH - 5 - highScoreStr.length * 6, 5, '#C4956A');
    }

    private renderPaused(): void {
        const ctx = this.bufferCtx;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);
        this.drawText(ctx, 'PAUSED', INTERNAL_WIDTH / 2 - 18, INTERNAL_HEIGHT / 2 - 4, '#FFFFFF');
    }

    private renderGameOver(): void {
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

    private drawSprite(ctx: CanvasRenderingContext2D, sprite: Sprite, x: number, y: number, color: string): void {
        ctx.fillStyle = color;
        for (let row = 0; row < sprite.length; row++) {
            for (let col = 0; col < sprite[row].length; col++) {
                if (sprite[row][col]) {
                    ctx.fillRect(x + col, y + row, 1, 1);
                }
            }
        }
    }

    private drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string): void {
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

    private drawNumber(ctx: CanvasRenderingContext2D, num: number, x: number, y: number, color: string): void {
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
let game: AsteroidsGame;
window.addEventListener('load', () => {
    game = new AsteroidsGame();
});

// Handle visibility change (pause when tab hidden)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && game && (game as unknown as { state: GameState }).state === GameState.PLAYING) {
        (game as unknown as { state: GameState }).state = GameState.PAUSED;
        audio.stopAll();
    }
});
