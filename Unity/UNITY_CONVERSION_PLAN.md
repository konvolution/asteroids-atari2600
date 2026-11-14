# Unity Conversion Plan - Atari 2600 Asteroids

## Overview

This document outlines the detailed plan for converting the TypeScript/Canvas-based Atari 2600 Asteroids game to Unity. The goal is to maintain the exact same visual aesthetic (blocky pixel art, Atari 2600 color palette) while using idiomatic Unity patterns and practices.

## 1. Project Structure

```
Unity/
├── UNITY_CONVERSION_PLAN.md          (This file)
├── README.md                          (Unity-specific documentation)
├── AsteroidsUnity/                    (Unity project root)
    ├── Assets/
    │   ├── Scenes/
    │   │   └── GameScene.unity        (Main game scene)
    │   ├── Scripts/
    │   │   ├── Core/
    │   │   │   ├── GameManager.cs     (Game coordinator, state management)
    │   │   │   ├── EntityManager.cs   (Entity pooling and lifecycle)
    │   │   │   └── ScoreManager.cs    (Score, lives, high score)
    │   │   ├── Entities/
    │   │   │   ├── Ship.cs            (Player ship behavior)
    │   │   │   ├── Asteroid.cs        (Asteroid behavior)
    │   │   │   ├── Bullet.cs          (Bullet projectile)
    │   │   │   ├── Saucer.cs          (UFO enemy)
    │   │   │   └── Explosion.cs       (Particle explosion)
    │   │   ├── Input/
    │   │   │   └── InputManager.cs    (Input handling)
    │   │   ├── Audio/
    │   │   │   └── AudioManager.cs    (TIA-style audio synthesis)
    │   │   ├── Rendering/
    │   │   │   ├── PixelRenderer.cs   (Low-res pixel rendering)
    │   │   │   └── SpriteData.cs      (Sprite definitions)
    │   │   └── UI/
    │   │       └── UIManager.cs       (HUD, menus)
    │   ├── Materials/
    │   │   └── PixelPerfect.mat       (Unfiltered texture material)
    │   ├── Prefabs/
    │   │   ├── Ship.prefab
    │   │   ├── Asteroid.prefab
    │   │   ├── Bullet.prefab
    │   │   ├── Saucer.prefab
    │   │   └── Explosion.prefab
    │   ├── Textures/
    │   │   └── (Generated at runtime)
    │   └── Fonts/
    │       └── PixelFont.asset        (TextMeshPro font asset)
    └── ProjectSettings/
```

## 2. Architecture Translation

### 2.1 TypeScript → C# Component Model

| TypeScript Concept | Unity Implementation | Notes |
|-------------------|---------------------|-------|
| `Entity` interface | `MonoBehaviour` base classes | Unity's component system |
| `Interaction` handlers | Separate behavior components | `ShipController`, `SaucerAI`, etc. |
| `GameWorld` class | `EntityManager` singleton | Manages entity lifecycle |
| Canvas rendering | Unity Sprites + Custom RenderTexture | Low-res buffer approach |
| Fixed timestep loop | Unity's `FixedUpdate()` | Built-in physics timestep |
| Entity list | Object pooling + lists | Unity-idiomatic memory management |

### 2.2 Core Systems Mapping

#### Game Loop (game.ts → GameManager.cs)
```
TypeScript:                          Unity:
─────────────────────────────────────────────────────────────
requestAnimationFrame loop     →     Update() / FixedUpdate()
Fixed timestep accumulator     →     Unity's Time.fixedDeltaTime
GameState enum                 →     GameState enum + state machine
World.update() / render()      →     Component lifecycle methods
```

#### Entity System (types.ts → MonoBehaviour hierarchy)
```
TypeScript:                          Unity:
─────────────────────────────────────────────────────────────
Entity interface                →    BaseEntity : MonoBehaviour
  - entityType                  →      EntityType property
  - update()                    →      FixedUpdate() / Update()
  - draw()                      →      Sprite rendering (automatic)
  - getBounds()                 →      Collider2D components
  - isAlive()                   →      gameObject.activeSelf
```

## 3. Rendering Strategy

### 3.1 Pixel-Perfect Approach

**Original Implementation (Canvas):**
- Internal 160×210 buffer canvas
- Draw to buffer, scale 4× to display
- `imageSmoothingEnabled = false` for crisp pixels

**Unity Implementation:**
```
RenderTexture (160×210, Point filtering)
    ↓
Camera renders to low-res RenderTexture
    ↓
Scale to screen (nearest-neighbor)
    ↓
Display on fullscreen quad or UI RawImage
```

**Components:**
1. **Main Camera**: Orthographic, renders to RenderTexture
2. **RenderTexture**: 160×210, FilterMode.Point, no mipmaps
3. **Display Canvas**: UI RawImage stretches texture to screen
4. **Pixel-Perfect Camera**: Unity's built-in component (optional)

### 3.2 Sprite Rendering

**Original Implementation:**
- Sprites defined as 2D int arrays
- Manual pixel-by-pixel drawing on canvas

**Unity Implementation:**

#### Option A: Dynamic Texture Generation (Chosen Approach)
```csharp
// Generate Texture2D from sprite data at startup
Texture2D GenerateSpriteTexture(int[][] spriteData)
{
    int width = spriteData[0].Length;
    int height = spriteData.Length;
    
    Texture2D texture = new Texture2D(width, height);
    texture.filterMode = FilterMode.Point;
    texture.wrapMode = TextureWrapMode.Clamp;
    
    for (int y = 0; y < height; y++)
    {
        for (int x = 0; x < width; x++)
        {
            Color color = spriteData[y][x] == 1 ? Color.white : Color.clear;
            texture.SetPixel(x, height - 1 - y, color);
        }
    }
    
    texture.Apply();
    return texture;
}

// Create Unity Sprite from texture
Sprite CreateSprite(Texture2D texture)
{
    return Sprite.Create(
        texture,
        new Rect(0, 0, texture.width, texture.height),
        new Vector2(0.5f, 0.5f), // Center pivot
        1.0f // Pixels per unit = 1 (1:1 mapping)
    );
}
```

**Advantages:**
- Simple, direct translation from array data
- Runtime generation (no asset files needed)
- Easy to modify colors via `SpriteRenderer.color`
- Perfect for monochrome sprites

#### Option B: Pre-baked Sprite Assets
- Extract sprite PNGs from original assets
- Import as sprites with Point filtering
- More work upfront, but better for texture atlasing

**We'll use Option A** for maximum flexibility and ease of translation.

### 3.3 Color Management

**Original Implementation:**
- Colors applied during `draw()` via `ctx.fillStyle`
- Asteroids cycle through 7 colors
- Ship: `#6CDCF6` (cyan)

**Unity Implementation:**
```csharp
// Store colors as static fields
public static readonly Color ShipColor = new Color(0.42f, 0.86f, 0.96f); // #6CDCF6
public static readonly Color[] AsteroidColors = new Color[]
{
    new Color(0.82f, 0.82f, 0.82f), // Gray #d2d2d2
    new Color(0.42f, 0.68f, 0.93f), // Blue #6aaeed
    // ... etc
};

// Apply to SpriteRenderer
spriteRenderer.color = GameColors.ShipColor;
```

### 3.4 Ship Rotation System

**Original Implementation:**
- 16 pre-rotated sprites
- 5 base sprites + flipping to generate 11 more
- Rotation index (0-15) maps to sprites

**Unity Implementation:**

**Option A: Sprite Array (Same as Original)**
```csharp
public Sprite[] shipSprites = new Sprite[16]; // Generated at startup
private int rotationIndex = 0; // 0-15

void UpdateRotation()
{
    spriteRenderer.sprite = shipSprites[rotationIndex];
}
```

**Option B: Unity Transform Rotation**
- Use actual rotation: `transform.rotation = Quaternion.Euler(0, 0, angle)`
- Simpler, but may not match pixel-perfect aesthetic
- **We'll use Option A** to maintain exact visual fidelity

## 4. Physics and Collision

### 4.1 Movement System

**Original Implementation:**
- Manual velocity integration
- `x += vx; y += vy;`
- Friction: `vx *= 0.995`
- Screen wrapping via position checks

**Unity Implementation:**

**Option A: Unity Physics2D (Rigidbody2D)**
```csharp
private Rigidbody2D rb;
private float friction = 0.995f;

void FixedUpdate()
{
    // Apply custom friction
    rb.velocity *= friction;
    
    // Thrust
    if (isThrusting)
    {
        Vector2 force = transform.up * thrustForce;
        rb.AddForce(force);
    }
    
    // Clamp speed
    if (rb.velocity.magnitude > maxSpeed)
        rb.velocity = rb.velocity.normalized * maxSpeed;
    
    WrapScreen();
}
```

**Option B: Manual Kinematic Movement**
```csharp
private Vector2 velocity;

void FixedUpdate()
{
    velocity *= friction;
    transform.position += (Vector3)velocity * Time.fixedDeltaTime;
    WrapScreen();
}
```

**We'll use Option B** for:
- Exact match to original physics
- No physics engine overhead
- Simpler debugging

### 4.2 Collision Detection

**Original Implementation:**
- AABB (bounding box) collision
- Manual checks in interaction handlers

**Unity Implementation:**

**Use Unity's 2D Colliders:**
```csharp
// BoxCollider2D on each entity
// Set as trigger: isTrigger = true

void OnTriggerEnter2D(Collider2D other)
{
    if (other.CompareTag("Asteroid"))
    {
        HandleAsteroidCollision();
    }
}
```

**Collision Matrix (Edit → Project Settings → Physics2D):**
- Ship layer collides with: Asteroids, Saucers, EnemyBullets
- PlayerBullets collide with: Asteroids, Saucers
- EnemyBullets collide with: Ship
- Asteroids don't collide with each other

### 4.3 Screen Wrapping

**Original Implementation:**
```typescript
if (this.x < -this.width) this.x = gameWidth;
if (this.x > gameWidth) this.x = -this.width;
```

**Unity Implementation:**
```csharp
private void WrapScreen()
{
    Vector3 pos = transform.position;
    Vector3 viewportPos = Camera.main.WorldToViewportPoint(pos);
    
    // Wrap horizontally
    if (viewportPos.x < -0.1f) viewportPos.x = 1.1f;
    if (viewportPos.x > 1.1f) viewportPos.x = -0.1f;
    
    // Wrap vertically
    if (viewportPos.y < -0.1f) viewportPos.y = 1.1f;
    if (viewportPos.y > 1.1f) viewportPos.y = -0.1f;
    
    transform.position = Camera.main.ViewportToWorldPoint(viewportPos);
}
```

## 5. Entity-Specific Translations

### 5.1 Ship (ship.ts → Ship.cs)

**Components:**
- `Ship.cs` (MonoBehaviour)
- `SpriteRenderer`
- `BoxCollider2D` (trigger)
- Optional: `TrailRenderer` for thrust flame

**Key Translations:**

| TypeScript Feature | Unity Implementation |
|-------------------|---------------------|
| `rotation` (0-15) | `rotationIndex` + sprite array |
| `rotateLeft/Right()` | Modify `rotationIndex`, update sprite |
| `applyThrust()` | Add to velocity, show thrust effect |
| `fire()` | Instantiate bullet prefab |
| `hyperspace()` | `transform.position = randomPos` |
| `invulnerable` + blink | Coroutine + renderer enable/disable |
| Thrust flame drawing | Separate `GameObject` child with sprite |

**Invulnerability Blink:**
```csharp
IEnumerator InvulnerabilityBlink(float duration)
{
    float elapsed = 0;
    while (elapsed < duration)
    {
        spriteRenderer.enabled = !spriteRenderer.enabled;
        yield return new WaitForSeconds(0.1f);
        elapsed += 0.1f;
    }
    spriteRenderer.enabled = true;
}
```

### 5.2 Asteroid (asteroid.ts → Asteroid.cs)

**Components:**
- `Asteroid.cs` (MonoBehaviour)
- `SpriteRenderer`
- `BoxCollider2D` (trigger)

**Key Translations:**

| TypeScript Feature | Unity Implementation |
|-------------------|---------------------|
| `size` enum | `AsteroidSize` enum (Large/Medium/Small) |
| Random sprite selection | Choose from array in `Start()` |
| Color cycling | Static `colorIndex`, assign on spawn |
| `split()` | Instantiate 2 smaller asteroid prefabs |
| `createWave()` | Static method in GameManager |
| Constant velocity | `velocity` field updated in `FixedUpdate()` |

### 5.3 Bullet (bullet.ts → Bullet.cs)

**Components:**
- `Bullet.cs` (MonoBehaviour)
- `SpriteRenderer` (or simple quad mesh)
- `BoxCollider2D` (trigger)

**Key Translations:**

| TypeScript Feature | Unity Implementation |
|-------------------|---------------------|
| `life` countdown | `lifetime` field, destroy after duration |
| `isPlayerBullet` | `isPlayerBullet` bool + layer/tag |
| Screen wrapping | Same `WrapScreen()` method |
| Simple rendering | 2×2 white sprite or quad |

**Note:** Consider object pooling for bullets (high creation/destruction rate).

### 5.4 Saucer (saucer.ts → Saucer.cs)

**Components:**
- `Saucer.cs` (MonoBehaviour)
- `SaucerAI.cs` (separate AI behavior)
- `SpriteRenderer`
- `BoxCollider2D` (trigger)

**Key Translations:**

| TypeScript Feature | Unity Implementation |
|-------------------|---------------------|
| Entry from edge | Spawn off-screen, move across |
| Targeting AI | Calculate angle to player in `Update()` |
| Firing logic | Timer-based, instantiate bullets |
| Warble movement | `Mathf.Sin()` for vertical offset |
| Size variants | `isSmall` bool, different sprites/points |

### 5.5 Explosion (particle.ts → Explosion.cs)

**Original Implementation:**
- Custom particle class
- Array of particles with velocity
- Draw as small squares

**Unity Implementation:**

**Option A: Unity Particle System**
- Configure for blocky, expanding particles
- Set texture to 2×2 pixel sprite
- One-shot burst mode

**Option B: Custom Particle Script**
```csharp
public class Explosion : MonoBehaviour
{
    private List<Particle> particles = new List<Particle>();
    
    struct Particle
    {
        public Vector2 position;
        public Vector2 velocity;
        public float lifetime;
        public Color color;
    }
    
    void Update()
    {
        // Update and draw particles
    }
    
    void OnRenderObject()
    {
        // Draw particles as GL quads
    }
}
```

**We'll use Option B** for:
- Exact match to original look
- Full control over particle behavior
- Maintains blocky aesthetic

## 6. Audio System

### 6.1 TIA-Style Sound Synthesis

**Original Implementation (audio.ts):**
- Web Audio API
- Square wave oscillators
- Noise generation via buffer
- Dynamic heartbeat tempo

**Unity Implementation:**

**Use Unity's `AudioSource.PlayOneShotClip()` with procedurally generated `AudioClip`:**

```csharp
public class AudioManager : MonoBehaviour
{
    private AudioSource audioSource;
    
    // Generate square wave audio clip
    AudioClip GenerateSquareWave(float frequency, float duration)
    {
        int sampleRate = 44100;
        int sampleCount = Mathf.FloorToInt(sampleRate * duration);
        float[] samples = new float[sampleCount];
        
        for (int i = 0; i < sampleCount; i++)
        {
            float phase = (i / (float)sampleRate) * frequency * 2f * Mathf.PI;
            samples[i] = Mathf.Sign(Mathf.Sin(phase)) * 0.5f;
        }
        
        AudioClip clip = AudioClip.Create("SquareWave", sampleCount, 1, sampleRate, false);
        clip.SetData(samples, 0);
        return clip;
    }
    
    // Generate noise
    AudioClip GenerateNoise(float duration)
    {
        int sampleRate = 44100;
        int sampleCount = Mathf.FloorToInt(sampleRate * duration);
        float[] samples = new float[sampleCount];
        
        for (int i = 0; i < sampleCount; i++)
        {
            samples[i] = Random.Range(-1f, 1f) * 0.5f;
        }
        
        AudioClip clip = AudioClip.Create("Noise", sampleCount, 1, sampleRate, false);
        clip.SetData(samples, 0);
        return clip;
    }
    
    public void PlayFire()
    {
        AudioClip clip = GenerateSquareWave(800f, 0.05f);
        audioSource.PlayOneShot(clip);
    }
}
```

**Sound Mapping:**

| Sound | Original | Unity Implementation |
|-------|----------|---------------------|
| **Fire** | 800Hz square, 50ms | `GenerateSquareWave(800, 0.05f)` |
| **Thrust** | 50-100Hz buzz, continuous | Looping AudioClip, start/stop |
| **Explosion** | Noise burst, descending pitch | Noise with pitch modulation |
| **Heartbeat** | 40Hz/50Hz alternating | Coroutine with tempo adjustment |
| **UFO** | Warbling oscillation | Two alternating frequencies |
| **Extra Life** | Ascending tones | Sequence of increasing pitches |

**Heartbeat Implementation:**
```csharp
IEnumerator HeartbeatCoroutine()
{
    while (true)
    {
        float tempo = CalculateTempo(); // Based on asteroid count
        PlayHeartbeatBeat(40f); // Low beat
        yield return new WaitForSeconds(tempo);
        PlayHeartbeatBeat(50f); // High beat
        yield return new WaitForSeconds(tempo);
    }
}

float CalculateTempo()
{
    int asteroidCount = entityManager.GetAsteroidCount();
    return Mathf.Lerp(0.2f, 1.0f, asteroidCount / 12f);
}
```

## 7. Input System

### 7.1 Original Input Handler (input.ts)

**Features:**
- Key state tracking
- `isPressed()` for continuous actions
- `consume()` for one-shot actions
- Multiple key mappings (arrows + WASD)

### 7.2 Unity Implementation

**Option A: Old Input System**
```csharp
public class InputManager : MonoBehaviour
{
    private Dictionary<string, KeyCode[]> keyBindings;
    private HashSet<string> consumedActions = new HashSet<string>();
    
    void Update()
    {
        consumedActions.Clear();
    }
    
    public bool IsPressed(string action)
    {
        foreach (KeyCode key in keyBindings[action])
        {
            if (Input.GetKey(key)) return true;
        }
        return false;
    }
    
    public bool ConsumeAction(string action)
    {
        if (consumedActions.Contains(action)) return false;
        
        foreach (KeyCode key in keyBindings[action])
        {
            if (Input.GetKeyDown(key))
            {
                consumedActions.Add(action);
                return true;
            }
        }
        return false;
    }
}
```

**Option B: New Input System (Unity 2019+)**
- Create Input Actions asset
- Define actions: Move, Fire, Hyperspace, Pause
- Bind multiple keys per action

**We'll use Option A** for simplicity and direct translation.

## 8. Game State Management

### 8.1 State Machine (GameState enum)

**Original Implementation:**
```typescript
enum GameState {
    TITLE = 0,
    PLAYING = 1,
    GAME_OVER = 2,
    PAUSED = 3
}
```

**Unity Implementation:**
```csharp
public enum GameState
{
    Title,
    Playing,
    GameOver,
    Paused
}

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }
    
    private GameState currentState = GameState.Title;
    
    void ChangeState(GameState newState)
    {
        // Exit old state
        switch (currentState)
        {
            case GameState.Playing:
                Time.timeScale = 0;
                AudioManager.Instance.StopAll();
                break;
        }
        
        currentState = newState;
        
        // Enter new state
        switch (newState)
        {
            case GameState.Playing:
                Time.timeScale = 1;
                break;
            case GameState.Paused:
                Time.timeScale = 0;
                break;
        }
    }
}
```

### 8.2 Game Loop Structure

**Original Implementation:**
```
requestAnimationFrame() loop
  ├─ Calculate deltaTime
  ├─ Accumulate time
  ├─ While accumulated > tickDuration:
  │    └─ update() at fixed 60Hz
  └─ render() (variable framerate)
```

**Unity Implementation:**
```csharp
// Unity handles this automatically!

void Update()
{
    // Variable framerate logic (input, rendering)
    HandleInput();
}

void FixedUpdate()
{
    // Fixed timestep logic (physics, game logic)
    if (currentState == GameState.Playing)
    {
        UpdateGameLogic();
    }
}
```

**Configure in Project Settings:**
- Fixed Timestep: 0.01666667 (60 FPS)
- Maximum Allowed Timestep: 0.1

## 9. UI System

### 9.1 Original UI (Canvas text rendering)

**Features:**
- Score display (top-left)
- High score (top-right)
- Lives display (ship icons)
- Title screen text with blink
- Game over overlay

### 9.2 Unity Implementation

**Use Unity UI (Canvas):**
```
Canvas (Screen Space - Overlay)
├─ HUD Panel
│   ├─ Score Text (TextMeshPro)
│   ├─ High Score Text (TextMeshPro)
│   └─ Lives Container
│       └─ Life Icon (Image) × 3
├─ Title Panel
│   ├─ "ASTEROIDS" Text
│   └─ "PRESS FIRE" Text (blinking)
└─ Game Over Panel
    ├─ "GAME OVER" Text
    ├─ Score Display
    └─ "PRESS FIRE" Text (blinking)
```

**Pixel Font:**
- Import custom pixel font (or create TextMeshPro asset from sprite data)
- Set to Point filtering, no smoothing

**Blinking Text:**
```csharp
IEnumerator BlinkText(TextMeshProUGUI text, float interval)
{
    while (true)
    {
        text.enabled = !text.enabled;
        yield return new WaitForSeconds(interval);
    }
}
```

## 10. Object Pooling

For performance optimization (especially bullets, particles):

```csharp
public class ObjectPool<T> where T : MonoBehaviour
{
    private Stack<T> pool = new Stack<T>();
    private T prefab;
    private Transform parent;
    
    public T Get()
    {
        if (pool.Count > 0)
        {
            T obj = pool.Pop();
            obj.gameObject.SetActive(true);
            return obj;
        }
        return GameObject.Instantiate(prefab, parent);
    }
    
    public void Return(T obj)
    {
        obj.gameObject.SetActive(false);
        pool.Push(obj);
    }
}
```

**Pooled Entities:**
- Bullets (high spawn rate)
- Explosion particles
- Asteroids (medium priority)

## 11. Scene Setup

### 11.1 Main Scene Hierarchy

```
GameScene
├─ Main Camera (Orthographic, renders to RenderTexture)
├─ Game Manager (GameManager.cs)
├─ Entity Manager (EntityManager.cs)
├─ Input Manager (InputManager.cs)
├─ Audio Manager (AudioManager.cs)
├─ UI Canvas
│   ├─ HUD
│   ├─ Title Screen
│   └─ Game Over Screen
├─ Display Quad (shows RenderTexture)
└─ Entities (runtime spawned)
```

### 11.2 Camera Setup

**Main Camera:**
- Projection: Orthographic
- Size: 105 (half of 210 height)
- Position: (80, 105, -10)
- Clear Flags: Solid Color (Black)
- Target Texture: RenderTexture (160×210)
- Culling Mask: Everything except UI

**UI Camera:**
- Culling Mask: UI only
- Renders on top of game view

## 12. Data Translation

### 12.1 Sprite Data (sprites.ts → SpriteData.cs)

**Approach:**
- Embed sprite arrays as C# nested arrays
- Generate textures/sprites at runtime in `Awake()`

```csharp
public class SpriteData : MonoBehaviour
{
    public static SpriteData Instance { get; private set; }
    
    public Sprite[] shipSprites;
    public Sprite[] asteroidLargeSprites;
    // ... etc
    
    void Awake()
    {
        Instance = this;
        GenerateAllSprites();
    }
    
    void GenerateAllSprites()
    {
        // Ship sprites
        shipSprites = new Sprite[16];
        for (int i = 0; i < 16; i++)
        {
            Texture2D tex = GenerateSpriteTexture(SHIP_SPRITE_DATA[i]);
            shipSprites[i] = CreateSprite(tex);
        }
        
        // ... etc for other sprite types
    }
    
    // Sprite data arrays (copy from sprites.ts)
    private static readonly int[][][] SHIP_SPRITE_DATA = new int[][][]
    {
        new int[][] // Ship 0
        {
            new int[] {0,0,0,0,0,0,0,0,0},
            new int[] {0,0,0,0,0,0,0,0,0},
            new int[] {0,0,0,0,1,0,0,0,0},
            // ... etc
        },
        // ... more ship rotations
    };
}
```

### 12.2 Color Palette

```csharp
public static class GameColors
{
    // Ship
    public static readonly Color ShipColor = HexToColor("#6CDCF6");
    
    // Asteroids (7-color cycle)
    public static readonly Color[] AsteroidColors = new Color[]
    {
        HexToColor("#d2d2d2"), // Gray
        HexToColor("#6aaeed"), // Blue
        HexToColor("#b4b42a"), // Yellow-green
        HexToColor("#7e8833"), // Olive
        HexToColor("#b12827"), // Red
        HexToColor("#b13b98"), // Magenta
        HexToColor("#5d3dbf")  // Purple
    };
    
    // Helper
    private static Color HexToColor(string hex)
    {
        ColorUtility.TryParseHtmlString(hex, out Color color);
        return color;
    }
}
```

## 13. Testing Strategy

### 13.1 Visual Parity
- Side-by-side comparison with original
- Screenshot matching for key frames
- Verify all 16 ship rotations match
- Confirm color palette accuracy

### 13.2 Gameplay Parity
- Ship movement feel (thrust, rotation speed, max velocity)
- Asteroid split behavior and counts
- Collision detection accuracy
- Score values match original
- Level progression matches

### 13.3 Audio Parity
- Sound effect pitch and duration matching
- Heartbeat tempo progression
- Continuous vs one-shot sounds

## 14. Performance Considerations

### 14.1 Optimization Strategies
- Object pooling for bullets, particles, asteroids
- Sprite batching (all use same material)
- Minimize `GetComponent()` calls (cache references)
- Use `CompareTag()` instead of string comparison
- Disable unused physics features (gravity, etc.)

### 14.2 Target Performance
- 60 FPS stable on mid-range hardware
- Low memory footprint (<100 MB)
- Instant load times

## 15. Future Shader Effects (Post-Launch)

Once the core game is working, consider these visual effects:

### 15.1 CRT Shader
- Scanlines
- Screen curvature
- Color bleed
- Phosphor glow
- Vignette

### 15.2 Shader Implementation
```glsl
// Fragment shader
float scanline = sin(uv.y * _ScreenParams.y * PI) * 0.1;
color.rgb -= scanline;

// Curvature distortion
uv = uv * 2.0 - 1.0;
uv *= 1.0 + pow(length(uv), 2.0) * 0.1;
uv = (uv + 1.0) * 0.5;
```

**Apply as post-process effect** on the scaled-up RenderTexture.

## 16. Build Configuration

### 16.1 Platform Targets
- Windows (Primary)
- macOS
- WebGL (stretch goal)

### 16.2 Build Settings
- Resolution: 640×840 (4× scale) or higher
- Fullscreen: Windowed by default
- V-Sync: On
- Quality: Low (pixel art doesn't need AA/shadows)

## 17. Key Implementation Order

**Phase 1: Foundation** (Week 1)
1. Create Unity project
2. Set up RenderTexture pipeline
3. Implement `SpriteData` generator
4. Create `GameManager` skeleton
5. Test rendering single ship sprite

**Phase 2: Core Entities** (Week 2)
6. Implement `Ship` movement and rotation
7. Implement `Bullet` firing
8. Implement `Asteroid` spawning and movement
9. Implement collision detection
10. Test basic gameplay loop

**Phase 3: Game Logic** (Week 3)
11. Implement asteroid splitting
12. Implement score system
13. Implement lives and respawning
14. Implement level progression
15. Implement `Saucer` enemy

**Phase 4: Polish** (Week 4)
16. Implement UI (HUD, menus)
17. Implement audio system
18. Implement explosions/particles
19. Implement input handling
20. Bug fixes and tuning

**Phase 5: Post-Launch**
21. Shader effects (optional)
22. Additional features

## 18. Key Differences from Original

While maintaining visual and gameplay parity, these Unity-specific differences are acceptable:

### 18.1 Architecture
- Component-based instead of class-based
- Entity lifecycle managed by Unity's scene graph
- Collision via Unity's physics system (more robust)

### 18.2 Rendering
- Sprites rendered by Unity's sprite system (GPU-accelerated)
- No manual pixel drawing
- Automatic batching and culling

### 18.3 Audio
- Procedurally generated AudioClips instead of Web Audio nodes
- Unity's audio mixer for volume control

### 18.4 Performance
- Better performance due to GPU rendering
- Object pooling for reduced GC pressure
- Fewer allocations per frame

## 19. Success Criteria

The Unity version is considered complete when:

1. ✅ Visual appearance is indistinguishable from original
2. ✅ All 16 ship rotations match pixel-perfectly
3. ✅ Asteroid colors cycle correctly through 7 colors
4. ✅ Movement physics feel identical
5. ✅ Collision detection is accurate
6. ✅ Audio sounds authentic to TIA chip
7. ✅ Score system matches original
8. ✅ Level progression matches original
9. ✅ All game states work (title, playing, game over, paused)
10. ✅ Runs at stable 60 FPS

## 20. Additional Notes

### 20.1 Why Unity for This Project?
While the original Canvas implementation is excellent, Unity provides:
- Better performance (GPU rendering)
- Easier cross-platform deployment
- Built-in tools (scene editor, profiler)
- Extensibility for future features
- Component architecture (better code organization)

### 20.2 Maintaining the Retro Aesthetic
The key to success is:
- **Never use anti-aliasing or texture filtering**
- **Strict adherence to 160×210 resolution**
- **Exact color values from Atari 2600 palette**
- **Pixel-perfect sprite alignment**
- **Authentic TIA-style audio**

### 20.3 Learning Opportunities
This conversion demonstrates:
- Unity's sprite rendering pipeline
- Procedural texture generation
- Custom physics implementation
- Audio synthesis in Unity
- State machine patterns
- Object pooling
- Render texture usage

---

## Summary

This conversion plan provides a complete roadmap for translating the TypeScript/Canvas Asteroids implementation to idiomatic Unity C# code while maintaining absolute visual and gameplay fidelity. The architecture leverages Unity's strengths (component system, rendering pipeline, physics) while preserving the authentic Atari 2600 aesthetic through careful technical choices (unfiltered textures, low-res rendering, procedural audio).

The result will be a Unity game that looks, feels, and sounds identical to the original but benefits from Unity's performance, tooling, and cross-platform capabilities.
