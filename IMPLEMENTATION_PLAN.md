# Atari 2600 Asteroids - Browser Port Implementation Plan

## Overview
This document outlines the implementation plan for creating an authentic browser-based port of the **Atari 2600 version** of Asteroids, focusing on recreating the distinctive blocky, raster graphics look and feel of the home console port (not the arcade vector version).

## Reference
- Video Reference: https://www.youtube.com/watch?v=lTmzKMvr-RI

## Research Summary

### Atari 2600 Version Characteristics

#### Visual Style (Raster/Sprite Graphics - NOT Vector)
- **Display Type**: Standard TV raster display with blocky pixel graphics
- **Resolution**: Effective ~160x192 pixels (Atari 2600 native resolution)
- **Color Palette**: Limited Atari 2600 palette (128 colors, but few per sprite)
- **Graphics Style**: Chunky, blocky rectangular sprites - NOT smooth vector lines
- **Objects rendered**:
  - **Player Ship**: Blue/cyan colored blocky arrow/wedge shape
  - **Asteroids**: Blocky, chunky rock shapes in various colors (brown/tan/orange)
  - **Bullets**: Small square pixels
  - **UFO/Saucer**: Simple blocky flying saucer shape
- **Background**: Solid black

#### Atari 2600 Color Scheme (from video reference)
- **Ship**: Cyan/light blue (#00FFFF or similar)
- **Asteroids**: Various - typically brownish/tan/orange tones
- **Bullets**: White or yellow
- **UFO**: Different color from ship (often red or yellow)
- **Score/Text**: White or colored text at top
- **Background**: Pure black (#000000)

#### Gameplay Mechanics (2600 Version Specifics)
- **Ship Controls**: 8 directional rotation (not smooth), thrust, fire, hyperspace/shields
- **Physics**: Simplified inertia - ship drifts but with more "arcade" feel
- **Screen Wrapping**: Objects wrap around edges
- **Asteroid Behavior**: Large→Medium→Small splitting pattern
- **Flip/Shield**: 2600 version has shield option (Game Select variations)
- **Game Variations**: Multiple game modes via Game Select switch

#### Sound Effects (TIA Chip - Atari 2600 Style)
The Atari 2600 uses the TIA (Television Interface Adapter) chip for sound:
- **Engine/Thrust**: Low buzzing tone when thrusting
- **Fire**: Short high-pitched "pew" blip
- **Explosion**: Descending noise burst
- **UFO Sound**: Warbling/oscillating tone
- **Background**: Pulsing low-frequency heartbeat/thump

---

## Implementation Plan

### 1. Project Structure
```
Asteroids/
├── index.html          # Main HTML file
├── css/
│   └── style.css       # Styling and retro CRT effects
├── js/
│   ├── game.js         # Main game loop and state management
│   ├── ship.js         # Player ship class
│   ├── asteroid.js     # Asteroid class
│   ├── bullet.js       # Bullet/projectile class
│   ├── saucer.js       # Enemy saucer class
│   ├── particle.js     # Explosion particles
│   ├── audio.js        # Web Audio API - TIA-style sound synthesis
│   ├── sprites.js      # Pixel sprite definitions
│   └── input.js        # Keyboard input handling
└── IMPLEMENTATION_PLAN.md
```

### 2. Visual Effects to Implement

#### 2.1 Blocky Pixel Graphics Rendering
- **Canvas 2D Context**: Use HTML5 Canvas with `imageSmoothingEnabled = false`
- **Pixel-Perfect Scaling**: Render at low resolution, scale up with nearest-neighbor
- **Internal Resolution**: 160x210 (close to 2600 aspect ratio)
- **Display Scaling**: Scale up 4x or more for modern displays
- **No Anti-aliasing**: Crisp, blocky pixels

#### 2.2 Atari 2600 Aesthetic
| Effect | Implementation |
|--------|----------------|
| **Blocky Pixels** | Render at low res, scale with CSS `image-rendering: pixelated` |
| **Scanlines** | Optional CSS overlay for CRT scanline effect |
| **Color Palette** | Use authentic Atari 2600 color values |
| **Flicker** | Optional subtle flicker to simulate 2600 sprite limits |
| **Screen Border** | Black border around play area |

#### 2.3 Sprite Design (Blocky Style)
```
Ship (pointing up, ~8x8 pixels):
    ██
   ████
  ██  ██
 ██    ██

Asteroid Large (~16x16 pixels):
   ████████
  ██████████
 ████████████
 ████████████
  ██████████
   ████████

Bullet (2x2 pixels):
██
██
```

### 3. Sound Effects Implementation (Web Audio API - TIA Style)

#### 3.1 Audio Engine Architecture
Synthesizing authentic Atari 2600 TIA chip sounds:

| Sound | TIA-Style Synthesis |
|-------|---------------------|
| **Thrust/Engine** | Square wave at low frequency (~50-100Hz), buzzy tone |
| **Fire** | Short square wave blip, high pitch (~800Hz), quick decay |
| **Asteroid Explosion** | Noise burst with rapid pitch descent |
| **Ship Explosion** | Longer noise burst, lower pitch |
| **UFO Sound** | Alternating frequency square wave (warble effect) |
| **Heartbeat** | Two-tone low frequency pulse, speeds up over time |

#### 3.2 TIA Sound Characteristics
- **Waveforms**: Primarily square waves and noise
- **Frequencies**: Limited range, characteristic "buzzy" quality
- **Distortion Types**: Pure tone, buzzy, noise
- **No filtering**: Raw, harsh 8-bit sound quality

### 4. Gameplay Behaviors to Implement

#### 4.1 Ship Mechanics (2600 Style)
| Feature | Behavior |
|---------|----------|
| **Rotation** | 16 or 32 direction rotation (not fully smooth) |
| **Thrust** | Acceleration with visible thrust animation |
| **Inertia** | Ship maintains velocity, friction ~0.995 |
| **Maximum Speed** | Capped speed for playability |
| **Hyperspace/Shield** | Teleport or temporary shield (game variation) |
| **Collision** | Bounding box collision detection |

#### 4.2 Asteroid Mechanics
| Feature | Behavior |
|---------|----------|
| **Sizes** | Large, Medium, Small (3 sizes) |
| **Scoring** | Large: 20pts, Medium: 50pts, Small: 100pts |
| **Splitting** | Large→2 Medium, Medium→2 Small, Small→destroyed |
| **Movement** | Constant velocity, no rotation (2600 style) |
| **Speed** | Smaller = faster |
| **Appearance** | Blocky chunky shapes, limited animation |

#### 4.3 UFO/Saucer Mechanics
| Feature | Behavior |
|---------|----------|
| **Appearance** | Periodic entry from screen edge |
| **Movement** | Horizontal with slight vertical wobble |
| **Shooting** | Fires at player (with varying accuracy) |
| **Points** | Large: 200pts, Small: 1000pts |
| **Sound** | Distinctive warbling tone |

### 5. UI Elements

#### 5.1 HUD Display (2600 Style)
- **Score**: Top of screen, blocky pixel font
- **Lives**: Remaining ships shown as small ship icons
- **Simple Layout**: Minimal UI, score and lives only

#### 5.2 Screens
- **Title Screen**: "ASTEROIDS" in blocky text, "PRESS FIRE" prompt
- **Game Over**: Score display, "GAME OVER" text
- **No elaborate animations**: Keep it simple like 2600

### 6. Technical Implementation Details

#### 6.1 Rendering Pipeline
```javascript
// Low-res canvas for pixel-perfect rendering
const INTERNAL_WIDTH = 160;
const INTERNAL_HEIGHT = 210;
const SCALE = 4;

// Render at low resolution
ctx.imageSmoothingEnabled = false;
```

#### 6.2 Sprite Rendering
```javascript
function drawSprite(ctx, sprite, x, y, color) {
  ctx.fillStyle = color;
  for (let row = 0; row < sprite.length; row++) {
    for (let col = 0; col < sprite[row].length; col++) {
      if (sprite[row][col]) {
        ctx.fillRect(x + col, y + row, 1, 1);
      }
    }
  }
}
```

#### 6.3 Screen Wrapping
```javascript
function wrapPosition(obj, width, height) {
  if (obj.x < -obj.width) obj.x = width;
  if (obj.x > width) obj.x = -obj.width;
  if (obj.y < -obj.height) obj.y = height;
  if (obj.y > height) obj.y = -obj.height;
}
```

### 7. Controls

| Key | Action |
|-----|--------|
| **←** / **A** | Rotate Left |
| **→** / **D** | Rotate Right |
| **↑** / **W** | Thrust |
| **Space** | Fire |
| **Shift** / **H** | Hyperspace |
| **P** | Pause |
| **Enter** | Start Game |

### 8. Atari 2600 Color Palette (Key Colors)

| Element | Color | Hex Value |
|---------|-------|-----------|
| Background | Black | #000000 |
| Ship | Cyan/Light Blue | #6CDCF6 |
| Asteroids | Tan/Brown | #D4A56A |
| Asteroids Alt | Orange | #E87C3F |
| Bullets | White | #FFFFFF |
| UFO | Red | #E83C3C |
| Score Text | White | #FFFFFF |
| Explosion | Yellow/Orange | #FFD800 |

---

## Summary of Key UX Behaviors/Effects

### Visual Effects (Atari 2600 Style)
1. **Blocky Pixel Graphics** - Chunky sprites, no anti-aliasing
2. **Low Resolution** - 160x210 internal, scaled up
3. **Limited Color Palette** - Authentic 2600 colors
4. **No Rotation Animation** - Ships/asteroids use directional sprites
5. **Simple Explosions** - Blocky particle bursts
6. **Scanline Effect** - Optional CRT simulation
7. **Screen Flicker** - Optional 2600 sprite-limit simulation

### Audio Effects (TIA Chip Style)
1. **Thrust Buzz** - Low square wave drone
2. **Fire Blip** - High-pitched short beep
3. **Explosion Noise** - Descending noise burst
4. **UFO Warble** - Alternating frequency oscillation
5. **Heartbeat Thump** - Accelerating two-tone pulse
6. **8-bit Quality** - Harsh, buzzy, characteristic sound

### Gameplay Behaviors
1. **Inertial Movement** - Ship drifts with momentum
2. **Screen Wrapping** - Seamless edge wrapping
3. **Asteroid Splitting** - 3 sizes, splitting on destruction
4. **Hyperspace** - Random teleport with risk
5. **UFO Attacks** - Periodic enemy appearances
6. **Progressive Difficulty** - More asteroids, faster pace
7. **Score System** - Points for asteroid and UFO destruction
