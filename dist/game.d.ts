/**
 * Atari 2600 Asteroids - Main Game
 * A browser-based port with authentic blocky graphics and TIA-style sound
 */
import { Bounds, Entity, EntityType } from './types.js';
import { Ship } from './ship.js';
import { Saucer } from './saucer.js';
import { IGameWorld } from './interactions.js';
/**
 * GameWorld - Single entity list with generic operations
 */
export declare class GameWorld implements IGameWorld {
    readonly width: number;
    readonly height: number;
    private entities;
    onShipDestroyed?: () => void;
    onScorePoints?: (points: number) => void;
    constructor(width: number, height: number);
    addEntity(entity: Entity): void;
    removeEntity(entity: Entity): void;
    getEntities<T extends Entity>(type: EntityType): T[];
    checkCollision(a: Bounds, b: Bounds): boolean;
    update(): void;
    render(ctx: CanvasRenderingContext2D): void;
    clear(): void;
    getShip(): Ship | null;
    getSaucer(): Saucer | null;
    getAsteroidCount(): number;
}
/**
 * AsteroidsGame - Main game coordinator
 * Manages game state, rendering, and orchestrates interactions
 */
export declare class AsteroidsGame {
    private canvas;
    private ctx;
    private buffer;
    private bufferCtx;
    private state;
    private score;
    private highScore;
    private lives;
    private level;
    private extraLifeScore;
    private nextExtraLife;
    private world;
    private interactions;
    private saucerTimer;
    private saucerInterval;
    private titleBlink;
    private gameOverTimer;
    private readonly TICK_DURATION;
    private lastTime;
    private accumulator;
    private frameCount;
    constructor();
    private setupWorldCallbacks;
    private handleShipDestroyed;
    private loadHighScore;
    private saveHighScore;
    private gameLoop;
    private update;
    private updateTitle;
    private updatePaused;
    private updateGameOver;
    private updatePlaying;
    private updateSaucer;
    private addScore;
    private respawnShip;
    private gameOver;
    private startGame;
    private nextLevel;
    private spawnAsteroids;
    private render;
    private renderTitle;
    private renderGame;
    private renderHUD;
    private renderPaused;
    private renderGameOver;
    private drawSprite;
    private drawText;
    private drawNumber;
}
//# sourceMappingURL=game.d.ts.map