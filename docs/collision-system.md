MineJS Physics — How the Collision System Works

### 1. The World Model

Blocks are unit cubes. A block at grid coordinate `(blockX, blockY, blockZ)` occupies the axis-aligned box:

```
X: [blockX,   blockX + 1]
Y: [blockY,   blockY + 1]
Z: [blockZ,   blockZ + 1]
```

The player is also an axis-aligned box (AABB — Axis-Aligned Bounding Box). `position` is the player's **feet**, and the box extends:

```
X: [position.x - 0.3,  position.x + 0.3]   ← 0.6 wide
Y: [position.y,         position.y + 2.0]   ← 2.0 tall
Z: [position.z - 0.3,  position.z + 0.3]   ← 0.6 deep
```

---

### 2. The Frame Loop

Every frame, `moveAndCollide` is called with the current position, current velocity, and `delta` (seconds elapsed since last frame, typically ~0.016 at 60fps).

**Step 0 — Apply gravity:**
```
newVelocity.y = velocity.y - GRAVITY × delta
```
Gravity accelerates the player downward every frame. Without a floor to stop it, `velocity.y` grows more negative over time (the player falls faster).

---

### 3. Per-Axis Resolution

The key architectural decision: **each axis is handled completely independently**. Move X → resolve X. Move Y → resolve Y. Move Z → resolve Z. This prevents wall blocks from interfering with vertical movement and vice versa.

---

### 4. Horizontal Push (X and Z axes)

**Step 1 — Move:**
```
newPosition.x += newVelocity.x × delta
```
The player's feet position moves by velocity × time. This may now overlap solid blocks.

**Step 2 — Find overlapping blocks:**

`playerAABB` computes the range of block grid coordinates that could possibly overlap the player:
```
minX = floor(position.x - 0.3)
maxX = floor(position.x + 0.3)
minY = floor(position.y)
maxY = floor(position.y + 2.0)
minZ = floor(position.z - 0.3)
maxZ = floor(position.z + 0.3)
```
`Math.floor` converts a world position to the block coordinate it sits inside (e.g. world position 4.7 → block 4).

**Step 3 — Compute penetration per block:**

For each solid block in that range, we check three things:

**Y overlap** (does this block share vertical space with the player?):
```
overlapY = min(position.y + 2.0,  blockY + 1)
         - max(position.y,         blockY)
```
This is the classic interval overlap formula: `min(rightA, rightB) - max(leftA, leftB)`. If this is ≤ 0, the intervals don't touch — skip this block. A block that's entirely above the player's head or below the feet has no Y overlap and is irrelevant to horizontal collision.

**Cross-axis overlap** (for X push, this checks Z; for Z push, checks X):
```
overlapCross = min(playerCrossPos + crossHalfWidth,  blockCrossCoord + 1)
             - max(playerCrossPos - crossHalfWidth,  blockCrossCoord)
```
Same formula. A block directly beside the player on X but behind them on Z (no Z overlap) shouldn't generate an X push.

**Axis penetration** (how deeply the player overlaps this block on the axis being resolved):
```
penetration = min(playerAxisPos + halfWidth,  blockAxisCoord + 1)
            - max(playerAxisPos - halfWidth,  blockAxisCoord)
```
If positive, the player is inside this block on the relevant axis by that many units.

**Step 4 — Accumulate maximum push:**

```
if player center < block center:   maxNegativePush = max(maxNegativePush, penetration)
else:                              maxPositivePush = max(maxPositivePush, penetration)
```

The block center comparison determines which side of the block the player is on. If the player is to the left of the block center, they overlapped from the left and need to be pushed left (negative direction). We take the **maximum** penetration across all overlapping blocks — the most deeply embedded block determines how far the player must move to be fully clear.

**Step 5 — Apply push:**
```
if only negative push: push = -maxNegativePush
if only positive push: push = +maxPositivePush
if both (squeezed):    push = whichever is larger
```

After `newPosition.x += push`, the player's edge is flush with the block face. Then `newVelocity.x = 0` — the wall stops horizontal momentum.

---

### 5. Vertical Push (Y axis)

**Step 1 — Move:**
```
newPosition.y += newVelocity.y × delta
```

**Step 2 — Check X and Z overlap first:**

```
overlapX = min(position.x + 0.3,  blockX + 1) - max(position.x - 0.3,  blockX)
overlapZ = min(position.z + 0.3,  blockZ + 1) - max(position.z - 0.3,  blockZ)
```

If either is ≤ 0, skip. This is the critical guard — after the X pass resolves a wall block, the player's X position is moved to be exactly flush with the wall face. When the Y pass runs, that wall block now has `overlapX = 0`, so it's completely ignored. Without this check, wall blocks would create phantom floor pushes and interfere with the jump.

**Step 3 — Classify floor vs ceiling:**

```
playerCenterY = position.y + 1.0   (midpoint of the 2-unit tall player)
blockCenterY  = blockY + 0.5

if playerCenterY ≥ blockCenterY:   floor block  → push UP
else:                              ceiling block → push DOWN
```

If the player's vertical center is above the block's center, the block is below the player — the player is standing on (or sinking into) it. Push up.

**Floor push amount:**
```
floorPush = (blockY + 1) - position.y
```
The block's top surface is at `blockY + 1`. The player's feet are at `position.y`. The push moves the feet up to the surface.

**Ceiling push amount:**
```
ceilingPush = (position.y + 2.0) - blockY
```
The player's head is at `position.y + 2.0`. The block's bottom face is at `blockY`. The push moves the head down to the ceiling.

**Step 4 — Apply, with jump guard:**

```
if floorPush > 0 AND newVelocity.y ≤ 0:
    position.y += floorPush
    isOnGround = true
    velocity.y = 0

if ceilingPush > 0:
    position.y -= ceilingPush
    velocity.y = 0
```

The `newVelocity.y ≤ 0` guard is essential. When the player jumps, `velocity.y = +8.5`. After gravity for one frame, `newVelocity.y ≈ +8.35` — still positive. The guard prevents `isOnGround` from being set during ascent, allowing the jump to complete. Ceiling hits always apply (you always stop at a ceiling regardless of direction).

---

### 6. Why Order Matters (X → Y → Z)

Consider a player jumping into a wall and slightly overlapping the top edge of a block:

```
 ┌──────┐   ← player
 │      │
 └──────┘
      ████  ← wall block (player barely overlaps top-right corner)
```

**With the old minimum-penetration approach:** the Y overlap (0.05 units) was smaller than the X overlap (0.08 units), so the engine resolved on Y — pushed the player up and set `isOnGround = true`. Jump cancelled.

**With the per-axis approach:**
1. X pass: detects X penetration of 0.08 with the wall block. Pushes player left by 0.08. Now the player's right edge is flush with the wall.
2. Y pass: recomputes X overlap for the wall block — it's now exactly 0. Block is skipped entirely. No floor push. Jump continues.

The Y pass always sees the corrected X position, so wall blocks never appear as floor blocks.

---

### 7. `isOnGround` and Jumping

In `player.ts`:
```ts
if (input.jump && this.onGround) {
    this.velocity.y = PLAYER_JUMP_FORCE;   // 8.5
    this.onGround = false;
}
```

`onGround` starts `false`. It becomes `true` only when the Y pass finds a floor block while `newVelocity.y ≤ 0` (falling or stationary). This is re-evaluated every frame — the player is only "on ground" if they're actively in contact with a floor block this frame. Walking off a ledge immediately sets it to `false` (no floor block found), disabling the jump.

---

### 8. Floating Point and the AABB Boundary

`Math.floor` can produce a block at the exact boundary. For example, after an X push: `position.x = 4.7`, and `4.7 + 0.3 = 5.0`, so `Math.floor(5.0) = 5` — the wall block at `blockX = 5` is still in the AABB range. This is why the per-axis overlap checks (overlapX, overlapZ in the Y pass) are critical: even if a block appears in the AABB range, if its penetration is exactly 0 (boundary touch), it's skipped. The `≤ 0` condition (not `< 0`) handles this correctly.
