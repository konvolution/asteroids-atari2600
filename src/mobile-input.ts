/**
 * Mobile touch input handler
 * Wires on-screen buttons to the InputHandler via setAction/triggerStart
 */

import { input } from './input.js';
import { InputAction } from './types.js';

type ButtonConfig = {
    id: string;
    action?: InputAction;
    onPress?: () => void;
};

const BUTTONS: ButtonConfig[] = [
    { id: 'btn-left',       action: 'left' },
    { id: 'btn-right',      action: 'right' },
    { id: 'btn-thrust',     action: 'up' },
    { id: 'btn-fire',       action: 'fire', onPress: () => input.triggerStart() },
    { id: 'btn-hyperspace', action: 'hyperspace' },
    { id: 'btn-start',      onPress: () => input.triggerStart() },
];

function bindButton(config: ButtonConfig): void {
    const el = document.getElementById(config.id);
    if (!el) return;

    const press = () => {
        if (config.action) input.setAction(config.action, true);
        if (config.onPress) config.onPress();
    };

    const release = () => {
        if (config.action) input.setAction(config.action, false);
    };

    el.addEventListener('touchstart', (e) => { e.preventDefault(); press(); }, { passive: false });
    el.addEventListener('touchend',   (e) => { e.preventDefault(); release(); }, { passive: false });
    el.addEventListener('touchcancel',(e) => { e.preventDefault(); release(); }, { passive: false });

    // Also support mouse for desktop testing
    el.addEventListener('mousedown', press);
    el.addEventListener('mouseup',   release);
    el.addEventListener('mouseleave',release);
}

export function initMobileInput(): void {
    for (const config of BUTTONS) {
        bindButton(config);
    }
}
