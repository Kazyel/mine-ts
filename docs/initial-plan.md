# MineJS — Project Foundation & Folder Structure

## Context
Starting a Minecraft clone with Three.js (already installed) + React 19. The user chose Option A: React owns only the UI layer; Three.js owns the canvas and game loop. These two systems must never import from each other — they talk through a thin typed bridge.

---

## Recommended Folder Structure

```
src/
├── main.tsx                        # React entry point (keep as-is)
├── App.tsx                         # Mounts <canvas> + UI, creates Game instance
│
├── game/                           # Pure Three.js engine — zero React imports
│   ├── Game.ts                     # Root class: owns scene, renderer, camera, loop
│   ├── GameLoop.ts                 # requestAnimationFrame abstraction + delta time
│   ├── InputManager.ts             # Keyboard/mouse input + pointer lock
│   ├── AssetLoader.ts              # Texture atlas loading, material cache
│   └── constants.ts                # CHUNK_SIZE, CHUNK_HEIGHT, RENDER_DISTANCE, etc.
│
├── world/                          # Voxel data model and chunk management
│   ├── World.ts                    # Owns all chunks, handles load/unload
│   ├── Chunk.ts                    # 16×256×16 block data (Uint8Array)
│   ├── ChunkMesher.ts              # Mesh generation from block data
│   ├── ChunkCoord.ts               # Value type {cx, cz} + coord helpers
│   └── blocks/
│       ├── BlockRegistry.ts        # Maps BlockId → definition (name, solid, faces)
│       └── BlockType.ts            # Enum of all block IDs
│
├── entities/
│   ├── Player.ts                   # Position, velocity, camera, calls Physics
│   └── Physics.ts                  # Pure fn: AABB collision against world voxels
│
├── bridge/                         # The ONLY place game ↔ React talk
│   ├── GameEventEmitter.ts         # Typed EventEmitter, zero dependencies
│   └── useGameState.ts             # React hook — subscribes to game events
│
└── ui/                             # React-only components, no Three.js imports
    ├── HUD.tsx
    ├── Hotbar.tsx
    ├── PauseMenu.tsx
    └── DebugOverlay.tsx
```

---

## Key Architectural Rules

1. **`game/` and `world/` and `entities/` never import React** — if React is stripped out, these folders still compile.
2. **`ui/` never imports Three.js** — UI components receive only plain JS values.
3. **All cross-boundary communication flows through `bridge/`** — this is the only seam.

---

## Data Flow

### Game → React (state updates)
```
Game.ts (rAF loop)
  │  ~once/sec: emit('state:update', snapshot)   ← throttled, not 60fps
  ▼
GameEventEmitter.ts
  │  subscribe
  ▼
useGameState.ts (React hook) → setState()
  ▼
HUD.tsx / DebugOverlay.tsx / etc.
```

`GameStateSnapshot` contains only plain values (no Three.js types):
```ts
{ playerPosition, playerChunk, selectedSlot, hotbarItems, fps, loadedChunks }
```

### React → Game (user actions)
`App.tsx` holds `gameRef = useRef<Game>`. UI components receive an `actions` object with imperative methods (e.g. `actions.pause()`, `actions.selectSlot(i)`).

---

## Game Loop Order (per tick)

```
1. inputManager.capture()            ← snapshot input state
2. world.update(player.position)     ← load/unload chunks
3. player.update(dt, input, world)   ← movement, physics, camera
4. world.flushMeshUploads()          ← upload new chunk geometry to GPU
5. renderer.render(scene, camera)    ← Three.js draw call
6. [throttled] emitter.emit(...)     ← push state to React
```

Delta time is capped at 100ms to prevent physics tunnelling on tab blur.

---

## Chunk System

- **Storage**: `Uint8Array(16 * 256 * 16)` per chunk, index = `x | (z << 4) | (y << 8)`
- **Map key**: `"cx,cz"` string in a `Map<string, Chunk>`
- **Meshing**: naive face culling first (skip faces adjacent to opaque blocks); `ChunkMesher` interface is isolated so greedy meshing can replace it without touching callers
- **Loading**: load chunks within `RENDER_DISTANCE`; unload at `RENDER_DISTANCE + 2` (hysteresis to avoid thrashing)

---

## App.tsx Wiring

```
<div style="position:relative; width:100vw; height:100vh">
  <canvas ref={canvasRef} style="position:absolute; inset:0" />
  <div style="position:absolute; inset:0; pointer-events:none">
    <HUD />
    <PauseMenu />   ← opts into pointer-events:auto
    <DebugOverlay />
  </div>
</div>
```

`useEffect` on `canvasRef`: create `Game`, call `start()`, return `destroy()` for cleanup. `Game.destroy()` must fully stop rAF and dispose Three.js resources (React 19 StrictMode mounts/unmounts twice in dev).

---
# MineJS — Project Foundation & Folder Structure

## Context
Starting a Minecraft clone with Three.js (already installed) + React 19. The user chose Option A: React owns only the UI layer; Three.js owns the canvas and game loop. These two systems must never import from each other — they talk through a thin typed bridge.

---

## Recommended Folder Structure

```
src/
├── main.tsx                        # React entry point (keep as-is)
├── App.tsx                         # Mounts <canvas> + UI, creates Game instance
│
├── game/                           # Pure Three.js engine — zero React imports
│   ├── Game.ts                     # Root class: owns scene, renderer, camera, loop
│   ├── GameLoop.ts                 # requestAnimationFrame abstraction + delta time
│   ├── InputManager.ts             # Keyboard/mouse input + pointer lock
│   ├── AssetLoader.ts              # Texture atlas loading, material cache
│   └── constants.ts                # CHUNK_SIZE, CHUNK_HEIGHT, RENDER_DISTANCE, etc.
│
├── world/                          # Voxel data model and chunk management
│   ├── World.ts                    # Owns all chunks, handles load/unload
│   ├── Chunk.ts                    # 16×256×16 block data (Uint8Array)
│   ├── ChunkMesher.ts              # Mesh generation from block data
│   ├── ChunkCoord.ts               # Value type {cx, cz} + coord helpers
│   └── blocks/
│       ├── BlockRegistry.ts        # Maps BlockId → definition (name, solid, faces)
│       └── BlockType.ts            # Enum of all block IDs
│
├── entities/
│   ├── Player.ts                   # Position, velocity, camera, calls Physics
│   └── Physics.ts                  # Pure fn: AABB collision against world voxels
│
├── bridge/                         # The ONLY place game ↔ React talk
│   ├── GameEventEmitter.ts         # Typed EventEmitter, zero dependencies
│   └── useGameState.ts             # React hook — subscribes to game events
│
└── ui/                             # React-only components, no Three.js imports
    ├── HUD.tsx
    ├── Hotbar.tsx
    ├── PauseMenu.tsx
    └── DebugOverlay.tsx
```

---

## Key Architectural Rules

1. **`game/` and `world/` and `entities/` never import React** — if React is stripped out, these folders still compile.
2. **`ui/` never imports Three.js** — UI components receive only plain JS values.
3. **All cross-boundary communication flows through `bridge/`** — this is the only seam.

---

## Data Flow

### Game → React (state updates)
```
Game.ts (rAF loop)
  │  ~once/sec: emit('state:update', snapshot)   ← throttled, not 60fps
  ▼
GameEventEmitter.ts
  │  subscribe
  ▼
useGameState.ts (React hook) → setState()
  ▼
HUD.tsx / DebugOverlay.tsx / etc.
```

`GameStateSnapshot` contains only plain values (no Three.js types):
```ts
{ playerPosition, playerChunk, selectedSlot, hotbarItems, fps, loadedChunks }
```

### React → Game (user actions)
`App.tsx` holds `gameRef = useRef<Game>`. UI components receive an `actions` object with imperative methods (e.g. `actions.pause()`, `actions.selectSlot(i)`).

---

## Game Loop Order (per tick)

```
1. inputManager.capture()            ← snapshot input state
2. world.update(player.position)     ← load/unload chunks
3. player.update(dt, input, world)   ← movement, physics, camera
4. world.flushMeshUploads()          ← upload new chunk geometry to GPU
5. renderer.render(scene, camera)    ← Three.js draw call
6. [throttled] emitter.emit(...)     ← push state to React
```

Delta time is capped at 100ms to prevent physics tunnelling on tab blur.

---

## Chunk System

- **Storage**: `Uint8Array(16 * 256 * 16)` per chunk, index = `x | (z << 4) | (y << 8)`
- **Map key**: `"cx,cz"` string in a `Map<string, Chunk>`
- **Meshing**: naive face culling first (skip faces adjacent to opaque blocks); `ChunkMesher` interface is isolated so greedy meshing can replace it without touching callers
- **Loading**: load chunks within `RENDER_DISTANCE`; unload at `RENDER_DISTANCE + 2` (hysteresis to avoid thrashing)

---

## App.tsx Wiring

```
<div style="position:relative; width:100vw; height:100vh">
  <canvas ref={canvasRef} style="position:absolute; inset:0" />
  <div style="position:absolute; inset:0; pointer-events:none">
    <HUD />
    <PauseMenu />   ← opts into pointer-events:auto
    <DebugOverlay />
  </div>
</div>
```

`useEffect` on `canvasRef`: create `Game`, call `start()`, return `destroy()` for cleanup. `Game.destroy()` must fully stop rAF and dispose Three.js resources (React 19 StrictMode mounts/unmounts twice in dev).

---

## Build Order (dependency graph)

1. `constants.ts` — no deps
2. `BlockType.ts` + `BlockRegistry.ts` — plain data
3. `GameEventEmitter.ts` — zero deps
4. `InputManager.ts` — browser APIs only
5. `ChunkCoord.ts` + `Chunk.ts`
6. `ChunkMesher.ts`
7. `World.ts`
8. `Physics.ts` + `Player.ts`
9. `GameLoop.ts` + `AssetLoader.ts`
10. `Game.ts` — wires everything
11. `useGameState.ts`
12. UI components (`HUD.tsx`, etc.)
13. `App.tsx` — final integration

---

## Critical Files (start here)

- `src/game/Game.ts` — root orchestrator interface
- `src/world/Chunk.ts` — core voxel data structure
- `src/world/World.ts` — chunk lifecycle
- `src/bridge/GameEventEmitter.ts` — the boundary contract

## Build Order (dependency graph)

1. `constants.ts` — no deps
2. `BlockType.ts` + `BlockRegistry.ts` — plain data
3. `GameEventEmitter.ts` — zero deps
4. `InputManager.ts` — browser APIs only
5. `ChunkCoord.ts` + `Chunk.ts`
6. `ChunkMesher.ts`
7. `World.ts`
8. `Physics.ts` + `Player.ts`
9. `GameLoop.ts` + `AssetLoader.ts`
10. `Game.ts` — wires everything
11. `useGameState.ts`
12. UI components (`HUD.tsx`, etc.)
13. `App.tsx` — final integration

---

## Critical Files (start here)

- `src/game/Game.ts` — root orchestrator interface
- `src/world/Chunk.ts` — core voxel data structure
- `src/world/World.ts` — chunk lifecycle
- `src/bridge/GameEventEmitter.ts` — the boundary contract
