/**
 * Atari 2600 Style Audio Engine
 * Uses Web Audio API to synthesize TIA chip-like sounds
 */

import { ExplosionSize } from './types.js';

export class AudioEngine {
    private audioContext: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private initialized = false;
    private muted = false;
    
    // Heartbeat state
    private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
    private heartbeatTempo = 1000; // ms between beats
    private heartbeatPhase = 0; // 0 or 1 for alternating tones
    
    // Active sounds
    private thrustOscillator: OscillatorNode | null = null;
    private thrustOscillator2: OscillatorNode | null = null;
    private saucerOscillator: OscillatorNode | null = null;
    private saucerLfo: OscillatorNode | null = null;
    private saucerGain: GainNode | null = null;

    init(): void {
        if (this.initialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.audioContext.destination);
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }

    resume(): void {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    toggleMute(): boolean {
        this.muted = !this.muted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.muted ? 0 : 0.3;
        }
        return this.muted;
    }

    // Create a square wave oscillator (TIA-like)
    private createSquareOscillator(frequency: number): OscillatorNode {
        const osc = this.audioContext!.createOscillator();
        osc.type = 'square';
        osc.frequency.value = frequency;
        return osc;
    }

    // Create noise for explosions
    private createNoiseBuffer(duration: number): AudioBuffer {
        const sampleRate = this.audioContext!.sampleRate;
        const bufferSize = sampleRate * duration;
        const buffer = this.audioContext!.createBuffer(1, bufferSize, sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        return buffer;
    }

    // Fire sound - short high-pitched blip
    playFire(): void {
        if (!this.initialized || this.muted || !this.audioContext || !this.masterGain) return;
        this.resume();

        const osc = this.createSquareOscillator(880);
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        const now = this.audioContext.currentTime;
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);
        
        osc.start(now);
        osc.stop(now + 0.08);
    }

    // Thrust sound - continuous low buzz
    startThrust(): void {
        if (!this.initialized || this.muted || !this.audioContext || !this.masterGain) return;
        if (this.thrustOscillator) return; // Already playing
        this.resume();

        // Create noise-like thrust sound
        const osc = this.createSquareOscillator(60);
        const osc2 = this.createSquareOscillator(63);
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(this.masterGain);
        
        gain.gain.value = 0.15;
        
        osc.start();
        osc2.start();
        
        this.thrustOscillator = osc;
        this.thrustOscillator2 = osc2;
    }

    stopThrust(): void {
        if (this.thrustOscillator) {
            this.thrustOscillator.stop();
            this.thrustOscillator2?.stop();
            this.thrustOscillator = null;
            this.thrustOscillator2 = null;
        }
    }

    // Explosion sound - noise burst with decay
    playExplosion(size: ExplosionSize = 'medium'): void {
        if (!this.initialized || this.muted || !this.audioContext || !this.masterGain) return;
        this.resume();

        const duration = size === 'large' ? 0.5 : size === 'small' ? 0.15 : 0.3;
        const buffer = this.createNoiseBuffer(duration);
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = size === 'large' ? 800 : size === 'small' ? 2000 : 1200;
        
        const gain = this.audioContext.createGain();
        
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        const now = this.audioContext.currentTime;
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
        
        filter.frequency.setValueAtTime(filter.frequency.value, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + duration);
        
        source.start(now);
        source.stop(now + duration);
    }

    // Player ship explosion - longer, more dramatic
    playShipExplosion(): void {
        if (!this.initialized || this.muted || !this.audioContext || !this.masterGain) return;
        this.resume();

        const duration = 0.8;
        const buffer = this.createNoiseBuffer(duration);
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1500;
        
        const gain = this.audioContext.createGain();
        
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        const now = this.audioContext.currentTime;
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
        
        filter.frequency.setValueAtTime(1500, now);
        filter.frequency.exponentialRampToValueAtTime(50, now + duration);
        
        source.start(now);
        source.stop(now + duration);
    }

    // Saucer sound - warbling oscillator
    startSaucer(): void {
        if (!this.initialized || this.muted || !this.audioContext || !this.masterGain) return;
        // Stop any existing saucer sound first
        this.stopSaucer();
        this.resume();

        const osc = this.createSquareOscillator(400);
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        const gain = this.audioContext.createGain();
        
        lfo.type = 'sine';
        lfo.frequency.value = 8;
        lfoGain.gain.value = 100;
        
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        gain.gain.value = 0.15;
        
        lfo.start();
        osc.start();
        
        this.saucerOscillator = osc;
        this.saucerLfo = lfo;
        this.saucerGain = gain;
    }

    stopSaucer(): void {
        if (this.saucerOscillator) {
            try {
                this.saucerOscillator.disconnect();
                this.saucerOscillator.stop();
            } catch (e) {
                // Already stopped
            }
        }
        if (this.saucerLfo) {
            try {
                this.saucerLfo.disconnect();
                this.saucerLfo.stop();
            } catch (e) {
                // Already stopped  
            }
        }
        if (this.saucerGain) {
            try {
                this.saucerGain.disconnect();
            } catch (e) {
                // Already disconnected
            }
        }
        this.saucerOscillator = null;
        this.saucerLfo = null;
        this.saucerGain = null;
    }

    // Saucer fire sound
    playSaucerFire(): void {
        if (!this.initialized || this.muted || !this.audioContext || !this.masterGain) return;
        this.resume();

        const osc = this.createSquareOscillator(600);
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        const now = this.audioContext.currentTime;
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        
        osc.start(now);
        osc.stop(now + 0.1);
    }

    // Hyperspace sound
    playHyperspace(): void {
        if (!this.initialized || this.muted || !this.audioContext || !this.masterGain) return;
        this.resume();

        const osc = this.createSquareOscillator(1200);
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        const now = this.audioContext.currentTime;
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
        
        osc.start(now);
        osc.stop(now + 0.3);
    }

    // Extra life sound
    playExtraLife(): void {
        if (!this.initialized || this.muted || !this.audioContext || !this.masterGain) return;
        this.resume();

        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        
        notes.forEach((freq, i) => {
            const osc = this.createSquareOscillator(freq);
            const gain = this.audioContext!.createGain();
            
            osc.connect(gain);
            gain.connect(this.masterGain!);
            
            const startTime = this.audioContext!.currentTime + (i * 0.1);
            gain.gain.setValueAtTime(0.2, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
            
            osc.start(startTime);
            osc.stop(startTime + 0.15);
        });
    }

    // Heartbeat - the iconic two-tone pulse
    private playHeartbeat(): void {
        if (!this.initialized || this.muted || !this.audioContext || !this.masterGain) return;
        this.resume();

        const freq = this.heartbeatPhase === 0 ? 40 : 50;
        this.heartbeatPhase = 1 - this.heartbeatPhase;
        
        const osc = this.createSquareOscillator(freq);
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        const now = this.audioContext.currentTime;
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        osc.start(now);
        osc.stop(now + 0.1);
    }

    private calculateHeartbeatTempo(asteroidCount: number): number {
        return 200 + (800 * Math.min(asteroidCount / 24, 1));
    }

    startHeartbeat(asteroidCount = 12): void {
        if (!this.initialized) return;
        
        const newTempo = this.calculateHeartbeatTempo(asteroidCount);
        
        // Only restart if tempo has changed significantly or not running
        if (!this.heartbeatInterval || Math.abs(newTempo - this.heartbeatTempo) > 10) {
            this.stopHeartbeat();
            this.heartbeatTempo = newTempo;
            
            this.heartbeatInterval = setInterval(() => {
                this.playHeartbeat();
            }, this.heartbeatTempo);
        }
    }

    stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    // Game over sound
    playGameOver(): void {
        if (!this.initialized || this.muted || !this.audioContext || !this.masterGain) return;
        this.resume();

        const notes = [400, 350, 300, 250, 200];
        
        notes.forEach((freq, i) => {
            const osc = this.createSquareOscillator(freq);
            const gain = this.audioContext!.createGain();
            
            osc.connect(gain);
            gain.connect(this.masterGain!);
            
            const startTime = this.audioContext!.currentTime + (i * 0.2);
            gain.gain.setValueAtTime(0.25, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);
            
            osc.start(startTime);
            osc.stop(startTime + 0.25);
        });
    }

    // Start game sound
    playStartGame(): void {
        if (!this.initialized || this.muted || !this.audioContext || !this.masterGain) return;
        this.resume();

        const notes = [262, 330, 392, 523]; // C4, E4, G4, C5
        
        notes.forEach((freq, i) => {
            const osc = this.createSquareOscillator(freq);
            const gain = this.audioContext!.createGain();
            
            osc.connect(gain);
            gain.connect(this.masterGain!);
            
            const startTime = this.audioContext!.currentTime + (i * 0.08);
            gain.gain.setValueAtTime(0.2, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.12);
            
            osc.start(startTime);
            osc.stop(startTime + 0.12);
        });
    }

    stopAll(): void {
        this.stopThrust();
        this.stopSaucer();
        this.stopHeartbeat();
    }
}

// Global audio instance
export const audio = new AudioEngine();
