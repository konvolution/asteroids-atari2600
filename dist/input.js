/**
 * Input Handler
 * Manages keyboard input for the game
 */
import { audio } from './audio.js';
export class InputHandler {
    constructor() {
        this.keys = {
            left: false,
            right: false,
            up: false,
            fire: false,
            hyperspace: false
        };
        this.keyMap = {
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
        this.firePressed = false;
        this.hyperspacePressed = false;
        this.startPressed = false;
        this.pausePressed = false;
        this.setupEventListeners();
    }
    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }
    handleKeyDown(e) {
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
    handleKeyUp(e) {
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
    isPressed(action) {
        return this.keys[action];
    }
    consumeFire() {
        if (this.firePressed && this.keys.fire) {
            this.firePressed = false;
            return true;
        }
        return false;
    }
    consumeHyperspace() {
        const pressed = this.hyperspacePressed;
        this.hyperspacePressed = false;
        return pressed;
    }
    consumeStart() {
        const pressed = this.startPressed;
        this.startPressed = false;
        return pressed;
    }
    consumePause() {
        const pressed = this.pausePressed;
        this.pausePressed = false;
        return pressed;
    }
    reset() {
        for (const key of Object.keys(this.keys)) {
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
//# sourceMappingURL=input.js.map