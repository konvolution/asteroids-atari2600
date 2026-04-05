/**
 * Input Handler
 * Manages keyboard input for the game
 */

import { InputAction, KeyState, KeyMap } from './types.js';
import { audio } from './audio.js';

export class InputHandler {
    private keys: KeyState = {
        left: false,
        right: false,
        up: false,
        fire: false,
        hyperspace: false
    };
    
    private keyMap: KeyMap = {
        'ArrowLeft': 'left',
        'ArrowRight': 'right',
        'ArrowUp': 'up',
        'KeyA': 'left',
        'KeyD': 'right',
        'KeyW': 'up',
        'Space': 'fire',
        'ShiftLeft': 'hyperspace',
        'ShiftRight': 'hyperspace',
        'KeyH': 'hyperspace'
    };
    
    private firePressed = false;
    private hyperspacePressed = false;
    private startPressed = false;
    private pausePressed = false;

    constructor() {
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    private handleKeyDown(e: KeyboardEvent): void {
        const action = this.keyMap[e.code];
        
        if (action) {
            this.keys[action] = true;
            e.preventDefault();
        }
        
        // Handle single-press actions (prevent key repeat)
        if (e.code === 'Space' && !e.repeat) {
            this.firePressed = true;
        }
        
        if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyH') && !e.repeat) {
            if (!this.hyperspacePressed) {
                this.hyperspacePressed = true;
            }
        }
        
        if ((e.code === 'Enter' || e.code === 'Space') && !e.repeat) {
            this.startPressed = true;
        }
        
        if ((e.code === 'KeyP' || e.code === 'Escape') && !e.repeat) {
            this.pausePressed = true;
        }
        
        if (e.code === 'KeyM' && !e.repeat) {
            audio.toggleMute();
        }
    }

    private handleKeyUp(e: KeyboardEvent): void {
        const action = this.keyMap[e.code];
        
        if (action) {
            this.keys[action] = false;
            e.preventDefault();
        }
        
        if (e.code === 'Space') {
            this.firePressed = false;
        }
        
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyH') {
            this.hyperspacePressed = false;
        }
    }

    isPressed(action: InputAction): boolean {
        return this.keys[action];
    }

    setAction(action: InputAction, pressed: boolean): void {
        this.keys[action] = pressed;
        if (action === 'fire' && pressed) this.firePressed = true;
        if (action === 'hyperspace' && pressed) this.hyperspacePressed = true;
    }

    triggerStart(): void {
        this.startPressed = true;
    }

    consumeFire(): boolean {
        if (this.firePressed) {
            this.firePressed = false;
            return true;
        }
        return false;
    }

    consumeHyperspace(): boolean {
        const pressed = this.hyperspacePressed;
        this.hyperspacePressed = false;
        return pressed;
    }

    consumeStart(): boolean {
        const pressed = this.startPressed;
        this.startPressed = false;
        return pressed;
    }

    consumePause(): boolean {
        const pressed = this.pausePressed;
        this.pausePressed = false;
        return pressed;
    }

    reset(): void {
        for (const key of Object.keys(this.keys) as InputAction[]) {
            this.keys[key] = false;
        }
        this.firePressed = false;
        this.hyperspacePressed = false;
        this.startPressed = false;
        this.pausePressed = false;
    }
}

// Global input instance
export const input = new InputHandler();
