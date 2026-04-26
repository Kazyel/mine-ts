import type { Vector3 } from "three";
import { PLAYER_BOUNDING_BOX } from "@/entities/player";
import { GRAVITY } from "@/game/constants";
import { BlockRegistry } from "@/world/blocks/block-registry";
import type { World } from "@/world/world";

export function moveAndCollide(
	position: Vector3,
	velocity: Vector3,
	world: World,
	delta: number,
): { position: Vector3; velocity: Vector3; onGround: boolean } {
	let isPlayerOnGround = false;
	const newPosition = position.clone();
	const newVelocity = velocity.clone();

	newVelocity.y -= GRAVITY * delta;

	newPosition.x += newVelocity.x * delta;
	const pushX = computeHorizontalPush(newPosition, world, "x");
	if (pushX !== 0) {
		newPosition.x += pushX;
		newVelocity.x = 0;
	}

	newPosition.y += newVelocity.y * delta;
	const { floorPush, ceilingPush } = computeVerticalPush(newPosition, world);
	if (floorPush > 0 && newVelocity.y <= 0) {
		newPosition.y += floorPush;
		isPlayerOnGround = true;
		newVelocity.y = 0;
	}
	if (ceilingPush > 0) {
		newPosition.y -= ceilingPush;
		newVelocity.y = 0;
	}

	newPosition.z += newVelocity.z * delta;
	const pushZ = computeHorizontalPush(newPosition, world, "z");
	if (pushZ !== 0) {
		newPosition.z += pushZ;
		newVelocity.z = 0;
	}

	return {
		position: newPosition,
		velocity: newVelocity,
		onGround: isPlayerOnGround,
	};
}

function computeHorizontalPush(
	position: Vector3,
	world: World,
	axis: "x" | "z",
): number {
	const bounds = playerAABB(position);
	let maxNegativePush = 0;
	let maxPositivePush = 0;

	const isXAxis = axis === "x";
	const playerAxisPos = isXAxis ? position.x : position.z;
	const playerCrossPos = isXAxis ? position.z : position.x;
	const playerHalfWidth = PLAYER_BOUNDING_BOX[axis];
	const playerCrossHalfWidth = isXAxis
		? PLAYER_BOUNDING_BOX.z
		: PLAYER_BOUNDING_BOX.x;

	for (let blockX = bounds.minX; blockX <= bounds.maxX; blockX++) {
		for (let blockY = bounds.minY; blockY <= bounds.maxY; blockY++) {
			for (let blockZ = bounds.minZ; blockZ <= bounds.maxZ; blockZ++) {
				const block = world.getBlock(blockX, blockY, blockZ);
				if (!BlockRegistry[block].solid) continue;

				const overlapY =
					Math.min(position.y + PLAYER_BOUNDING_BOX.y, blockY + 1) -
					Math.max(position.y, blockY);
				if (overlapY <= 0) continue;

				const blockAxisCoord = isXAxis ? blockX : blockZ;
				const blockCrossCoord = isXAxis ? blockZ : blockX;

				const overlapCross =
					Math.min(playerCrossPos + playerCrossHalfWidth, blockCrossCoord + 1) -
					Math.max(playerCrossPos - playerCrossHalfWidth, blockCrossCoord);
				if (overlapCross <= 0) continue;

				const penetration =
					Math.min(playerAxisPos + playerHalfWidth, blockAxisCoord + 1) -
					Math.max(playerAxisPos - playerHalfWidth, blockAxisCoord);
				if (penetration <= 0) continue;

				const playerIsLeftOfBlock = playerAxisPos < blockAxisCoord + 0.5;
				if (playerIsLeftOfBlock) {
					maxNegativePush = Math.max(maxNegativePush, penetration);
				} else {
					maxPositivePush = Math.max(maxPositivePush, penetration);
				}
			}
		}
	}

	if (maxNegativePush === 0 && maxPositivePush === 0) return 0;
	if (maxNegativePush >= maxPositivePush) return -maxNegativePush;
	return maxPositivePush;
}

function computeVerticalPush(
	position: Vector3,
	world: World,
): { floorPush: number; ceilingPush: number } {
	const bounds = playerAABB(position);
	let maxFloorPush = 0;
	let maxCeilingPush = 0;

	for (let blockX = bounds.minX; blockX <= bounds.maxX; blockX++) {
		for (let blockY = bounds.minY; blockY <= bounds.maxY; blockY++) {
			for (let blockZ = bounds.minZ; blockZ <= bounds.maxZ; blockZ++) {
				const block = world.getBlock(blockX, blockY, blockZ);
				if (!BlockRegistry[block].solid) continue;

				const overlapX =
					Math.min(position.x + PLAYER_BOUNDING_BOX.x, blockX + 1) -
					Math.max(position.x - PLAYER_BOUNDING_BOX.x, blockX);
				const overlapZ =
					Math.min(position.z + PLAYER_BOUNDING_BOX.z, blockZ + 1) -
					Math.max(position.z - PLAYER_BOUNDING_BOX.z, blockZ);
				if (overlapX <= 0 || overlapZ <= 0) continue;

				const playerCenterY = position.y + PLAYER_BOUNDING_BOX.y / 2;
				const blockCenterY = blockY + 0.5;

				if (playerCenterY >= blockCenterY) {
					const push = blockY + 1 - position.y;
					if (push > 0) maxFloorPush = Math.max(maxFloorPush, push);
				} else {
					const push = position.y + PLAYER_BOUNDING_BOX.y - blockY;
					if (push > 0) maxCeilingPush = Math.max(maxCeilingPush, push);
				}
			}
		}
	}

	return { floorPush: maxFloorPush, ceilingPush: maxCeilingPush };
}

function playerAABB(position: Vector3) {
	return {
		minX: Math.floor(position.x - PLAYER_BOUNDING_BOX.x),
		maxX: Math.floor(position.x + PLAYER_BOUNDING_BOX.x),
		minY: Math.floor(position.y),
		maxY: Math.floor(position.y + PLAYER_BOUNDING_BOX.y),
		minZ: Math.floor(position.z - PLAYER_BOUNDING_BOX.z),
		maxZ: Math.floor(position.z + PLAYER_BOUNDING_BOX.z),
	};
}
