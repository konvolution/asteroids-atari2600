/**
 * Input Handler
 * Manages keyboard input for the game
 */
import { InputAction } from './types.js';
export declare class InputHandler {
    private keys;
    private keyMap;
    private firePressed;
    private hyperspacePressed;
    private startPressed;
    private pausePressed;
    constructor();
    private setupEventListeners;
    private handleKeyDown;
    private handleKeyUp;
    isPressed(action: InputAction): boolean;
    consumeFire(): boolean;
    consumeHyperspace(): boolean;
    consumeStart(): boolean;
    consumePause(): boolean;
    reset(): void;
}
export declare const input: InputHandler;
//# sourceMappingURL=input.d.ts.map