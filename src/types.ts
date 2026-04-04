/**
 * Shared types for Asteroids game
 */

// Bounding box for collision detection
export interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

// Sprite is a 2D array of 0s and 1s
export type Sprite = number[][];

// Asteroid sizes
export type AsteroidSize = 'large' | 'medium' | 'small';

// Explosion sizes
export type ExplosionSize = 'large' | 'medium' | 'small';

// Game states
export const enum GameState {
    TITLE = 0,
    PLAYING = 1,
    GAME_OVER = 2,
    PAUSED = 3
}

// Input actions
export type InputAction = 'left' | 'right' | 'up' | 'fire' | 'hyperspace';

// Key state map
export type KeyState = Record<InputAction, boolean>;

// Key mapping
export type KeyMap = Record<string, InputAction>;

// Sprites collection interface
export interface SpritesCollection {
    ship: Sprite[];
    shipExplode: Sprite[];
    thrustFlame: Sprite[];
    asteroidLarge: Sprite[];
    asteroidMedium: Sprite[];
    asteroidSmall: Sprite[];
    saucer: Sprite;
    saucerSmall: Sprite;
    particle: Sprite;
    bullet: Sprite;
    numbers: Record<string, Sprite>;
    letters: Record<string, Sprite>;
    lifeIcon: Sprite;
}

// Entity types for type discrimination
export type EntityType = 'ship' | 'asteroid' | 'bullet' | 'saucer' | 'explosion';

// Base Entity interface - all game objects implement this
export interface Entity {
    readonly entityType: EntityType;
    x: number;
    y: number;
    width: number;
    height: number;
    
    update(gameWidth: number, gameHeight: number): void;
    draw(ctx: CanvasRenderingContext2D): void;
    getBounds(): Bounds;
    isAlive(): boolean;
}

// Interaction interface - polymorphic behavior for entity interactions
export interface Interaction {
    update(): void;
    checkCollisions(): void;
    isAlive(): boolean;
}
