/**
 * Atari 2600 Style Audio Engine
 * Uses Web Audio API to synthesize TIA chip-like sounds
 */
import { ExplosionSize } from './types.js';
export declare class AudioEngine {
    private audioContext;
    private masterGain;
    private initialized;
    private muted;
    private heartbeatInterval;
    private heartbeatTempo;
    private heartbeatPhase;
    private thrustOscillator;
    private thrustOscillator2;
    private saucerOscillator;
    private saucerLfo;
    private saucerGain;
    init(): void;
    resume(): void;
    toggleMute(): boolean;
    private createSquareOscillator;
    private createNoiseBuffer;
    playFire(): void;
    startThrust(): void;
    stopThrust(): void;
    playExplosion(size?: ExplosionSize): void;
    playShipExplosion(): void;
    startSaucer(): void;
    stopSaucer(): void;
    playSaucerFire(): void;
    playHyperspace(): void;
    playExtraLife(): void;
    private playHeartbeat;
    private calculateHeartbeatTempo;
    startHeartbeat(asteroidCount?: number): void;
    stopHeartbeat(): void;
    playGameOver(): void;
    playStartGame(): void;
    stopAll(): void;
}
export declare const audio: AudioEngine;
//# sourceMappingURL=audio.d.ts.map