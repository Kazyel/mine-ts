# MineJS — Claude Code Instructions

## Project Overview
A Minecraft clone built with **Three.js** (game engine) + **React 19** (UI only).
Architecture: React owns the UI layer; Three.js owns the canvas and game loop.
These two systems **never import from each other** — they communicate only through `src/bridge/`.

---

## Absolute Architectural Rules

1. `game/`, `world/`, `entities/` — **zero React imports**. If React is stripped, these folders still compile.
2. `ui/` — **zero Three.js imports**. Components receive only plain JS values.
3. **All game ↔ React communication flows exclusively through `bridge/`.**
4. `GameStateSnapshot` must contain only plain JS values — no Three.js types (no `Vector3`, no `Object3D`, etc.).

Violating these rules breaks the architecture. Always check import boundaries before adding a new import.

---

## Folder Structure

```
src/
├── main.tsx                        # React entry point (do not modify)
├── App.tsx                         # Mounts <canvas> + UI, creates Game instance
│
├── game/                           # Pure Three.js engine — zero React imports
│   ├── Game.ts                     # Root class: scene, renderer, camera, loop
│   ├── GameLoop.ts                 # rAF abstraction + delta time
│   ├── InputManager.ts             # Keyboard/mouse + pointer lock
│   ├── AssetLoader.ts              # Texture atlas loading, material cache
│   └── constants.ts                # CHUNK_SIZE, CHUNK_HEIGHT, RENDER_DISTANCE
│
├── world/                          # Voxel data model and chunk management
│   ├── World.ts                    # Owns all chunks, load/unload lifecycle
│   ├── Chunk.ts                    # 16×256×16 block data (Uint8Array)
│   ├── ChunkMesher.ts              # Mesh generation from block data
│   ├── ChunkCoord.ts               # Value type {cx, cz} + coord helpers
│   └── blocks/
│       ├── BlockRegistry.ts        # BlockId → definition (name, solid, faces)
│       └── BlockType.ts            # Enum of all block IDs
│
├── entities/
│   ├── Player.ts                   # Position, velocity, camera
│   └── Physics.ts                  # Pure fn: AABB collision against world voxels
│
├── bridge/                         # ONLY place game ↔ React communicate
│   ├── GameEventEmitter.ts         # Typed EventEmitter, zero dependencies
│   └── useGameState.ts             # React hook — subscribes to game events
│
└── ui/                             # React-only, no Three.js imports
    ├── HUD.tsx
    ├── Hotbar.tsx
    ├── PauseMenu.tsx
    └── DebugOverlay.tsx
```

---

## Data Flow

### Game → React

Use this as an example only of how things should be. 

```
Game.ts (rAF loop)
  → emit('state:update', snapshot)   [throttled ~1/sec, NOT every frame]
  → GameEventEmitter.ts
  → useGameState.ts → setState()
  → HUD / DebugOverlay / etc.
```

### React → Game
`App.tsx` holds `gameRef = useRef<Game>()`. UI components receive an `actions` object:
```ts
actions.pause()
actions.selectSlot(i)
// etc.
```
UI never touches the Game instance directly.

---

## Game Loop Order (per tick)

Use this as an example only of how things should be. 

```
1. inputManager.capture()        — snapshot input state
2. world.update(player.position) — load/unload chunks
3. player.update(dt, input, world) — movement, physics, camera
4. world.flushMeshUploads()      — upload chunk geometry to GPU
5. renderer.render(scene, camera) — Three.js draw call
6. [throttled] emitter.emit(...) — push state snapshot to React
```

**Delta time is capped at 100ms** to prevent physics tunnelling on tab blur.

---

## Key Implementation Details

### Linter (Biome)
- Use `unknown` over `any` — Biome enforces explicit handling
- Avoid non-null assertions (`!`) — use `.has()` + `.get()` double-check pattern for Maps

---
