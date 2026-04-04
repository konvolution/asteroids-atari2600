/**
 * Shared types for Asteroids game
 */
export interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}
export type Sprite = number[][];
export type AsteroidSize = 'large' | 'medium' | 'small';
export type ExplosionSize = 'large' | 'medium' | 'small';
export declare const enum GameState {
    TITLE = 0,
    PLAYING = 1,
    GAME_OVER = 2,
    PAUSED = 3
}
export type InputAction = 'left' | 'right' | 'up' | 'fire' | 'hyperspace';
export type KeyState = Record<InputAction, boolean>;
export type KeyMap = Record<string, InputAction>;
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
export type EntityType = 'ship' | 'asteroid' | 'bullet' | 'saucer' | 'explosion';
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
export interface Interaction {
    update(): void;
    checkCollisions(): void;
    isAlive(): boolean;
}
//# sourceMappingURL=types.d.ts.map