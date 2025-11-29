# Atari 2600 Asteroids

A faithful browser-based recreation of the Atari 2600 version of Asteroids, featuring authentic blocky sprite graphics and TIA chip-style sound synthesis.

![Gameplay](https://img.shields.io/badge/Status-Complete-success)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 🎮 Play the Game

Open `index.html` in a modern web browser or run a local server:

```bash
npx http-server -p 8080 -c-1
```

Then navigate to `http://localhost:8080`

## ✨ Features

### Authentic Atari 2600 Experience
- **Real Sprites**: Extracted from original Atari 2600 sprite sheets
- **16-Direction Ship Rotation**: Generated from 5 base sprites using horizontal/vertical flipping
- **7-Color Asteroid Cycling**: Authentic Atari 2600 color palette
- **TIA-Style Audio**: All sounds synthesized using Web Audio API to mimic the TIA chip
- **Pixel-Perfect Graphics**: 160×210 internal resolution with nearest-neighbor scaling
- **Background Heartbeat**: Iconic two-tone pulse that accelerates as asteroids are destroyed

### Gameplay
- Classic asteroid splitting mechanics (Large → Medium → Small)
- Progressive difficulty with increasing asteroid counts
- UFO/Saucer enemies with targeting AI
- Hyperspace teleportation
- Extra lives at 10,000 points
- High score persistence
- Smooth 60fps gameplay with fixed timestep physics

## 🎯 Controls

| Key | Action |
|-----|--------|
| **Arrow Keys** / **WASD** | Rotate and thrust |
| **Space** | Fire |
| **Shift** / **H** | Hyperspace |
| **P** / **Escape** | Pause |
| **M** | Mute/Unmute |
| **Enter** | Start game |

## 🛠️ Development

### Project Structure
```
Asteroids/
├── src/                    # TypeScript source files
│   ├── game.ts            # Main game loop and coordinator
│   ├── ship.ts            # Player ship entity
│   ├── asteroid.ts        # Asteroid entity with color cycling
│   ├── bullet.ts          # Bullet projectile
│   ├── saucer.ts          # UFO enemy
│   ├── particle.ts        # Explosion particles
│   ├── audio.ts           # TIA-style audio synthesis
│   ├── sprites.ts         # Sprite data and flip functions
│   ├── input.ts           # Keyboard input handling
│   ├── interactions.ts    # Polymorphic entity interactions
│   └── types.ts           # TypeScript interfaces
├── assets/                # Sprite sheets and extracted data
├── css/                   # Retro CRT styling
├── dist/                  # Compiled JavaScript (gitignored)
└── sprite-analyzer.html   # Tool for extracting sprites
```

### Building

```bash
# Install dependencies
npm install

# Compile TypeScript
npx tsc

# Watch mode
npx tsc --watch
```

### Sprite Extraction Tool

The project includes `sprite-analyzer.html`, an interactive tool for extracting sprite data from PNG sheets:
- Load sprite sheets from the `assets/` folder
- Adjust grid position, tile size, and scale
- Use arrow keys or drag to position the grid
- Extract sprites to JSON with metadata
- Supports multiple sprite variations

## 🎨 Technical Highlights

### Graphics Pipeline
- **Dual Canvas**: Internal low-res buffer scaled to display canvas
- **No Interpolation**: `imageSmoothingEnabled = false` for crisp pixels
- **Sprite Flipping**: Generates 16 ship rotations from 5 base sprites
- **Color Cycling**: Static counter for deterministic asteroid coloring

### Audio Engine
- **Square Wave Oscillators**: Pure TIA-style synthesis
- **Dynamic Heartbeat**: Tempo scales from 200ms to 1000ms based on asteroid count
- **Noise Generation**: Buffer-based noise for explosions
- **Continuous Sounds**: Thrust and UFO with sustained oscillators

### Physics & Collision
- **Fixed Timestep**: 60 ticks/second for consistent physics
- **Velocity Damping**: Subtle friction (0.98) for natural feel
- **Screen Wrapping**: Seamless edge teleportation
- **Bounding Box**: Simple rectangle collision detection

### Architecture
- **Polymorphic Interactions**: Each entity type has its own interaction handler
- **Entity-Component Pattern**: Separation of data (Entity) and behavior (Interaction)
- **Single Entity List**: `GameWorld` manages all entities through a unified interface
- **Event Callbacks**: Decoupled game events (scoring, destruction)

## 📝 Implementation Notes

### Sprite Generation
The ship uses a clever sprite generation technique:
- 5 base sprites (0°, 22.5°, 45°, 67.5°, 90°)
- Remaining 11 rotations generated via:
  - Vertical flip for 90°-180°
  - Both flips for 180°-270°
  - Horizontal flip for 270°-360°

### Heartbeat Fix
The background heartbeat initially had issues with continuous restarts. Fixed by:
- Calculating new tempo on each call to `startHeartbeat()`
- Only restarting interval if tempo changed by >10ms
- Single method handles both start and update

### Input Handling
- `e.repeat` check prevents keyboard auto-repeat for fire button
- 2-second delay after game over prevents accidental restart
- Separate "consume" methods for single-press actions

## 📜 License

MIT License - Feel free to use this code for learning or your own projects.

## 🙏 Credits

- Original game by Atari, Inc.
- Sprite sheets from The Spriters Resource
- Reference video: [Atari 2600 Asteroids Gameplay](https://www.youtube.com/watch?v=lTmzKMvr-RI)

---

Made with ❤️ and authentic 1970s technology
