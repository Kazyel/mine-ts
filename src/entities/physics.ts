import { Vector3 } from "three";
import { PLAYER_BOUNDING_BOX } from "@/entities/player";
import { GRAVITY } from "@/game/constants";
import { BlockRegistry } from "@/world/blocks/block-registry";
import type { World } from "@/world/world";

const EPSILON = 0.001;
const MAX_STEP = 0.5;

export function moveAndCollide(
	position: Vector3,
	velocity: Vector3,
	world: World,
	delta: number,
): { position: Vector3; velocity: Vector3; onGround: boolean } {
	let posX = position.x;
	let posY = position.y;
	let posZ = position.z;
	let velX = velocity.x;
	let velY = velocity.y;
	let velZ = velocity.z;

	let onGround = false;

	velY -= GRAVITY * delta;

	const maxMove = Math.max(
		Math.abs(velX * delta),
		Math.abs(velY * delta),
		Math.abs(velZ * delta),
	);

	const steps = Math.max(1, Math.ceil(maxMove / MAX_STEP));
	const stepDelta = delta / steps;

	for (let i = 0; i < steps; i++) {
		if (velX !== 0) {
			const nextX = posX + velX * stepDelta;
			const safeX = sweepAxis(posX, posY, posZ, world, nextX, "x");

			if (safeX !== nextX) velX = 0;
			posX = safeX;
		}

		if (velY !== 0) {
			const nextY = posY + velY * stepDelta;
			const result = sweepY(posX, posZ, world, nextY, velY);

			if (result.collided) {
				if (velY < 0) onGround = true;
				velY = 0;
			}

			posY = result.y;
		}

		if (velZ !== 0) {
			const nextZ = posZ + velZ * stepDelta;
			const safeZ = sweepAxis(posX, posY, posZ, world, nextZ, "z");

			if (safeZ !== nextZ) velZ = 0;
			posZ = safeZ;
		}
	}

	return {
		position: new Vector3(posX, posY, posZ),
		velocity: new Vector3(velX, velY, velZ),
		onGround,
	};
}

function sweepAxis(
	posX: number,
	posY: number,
	posZ: number,
	world: World,
	target: number,
	axis: "x" | "z",
): number {
	const currentPos = axis === "x" ? posX : posZ;
	const direction = Math.sign(target - currentPos);
	if (direction === 0) return currentPos;

	const halfExtent = PLAYER_BOUNDING_BOX[axis];
	const perpendicularAxis = axis === "x" ? "z" : "x";
	const perpendicularHalfExtent = PLAYER_BOUNDING_BOX[perpendicularAxis];
	const perpendicularPos = axis === "x" ? posZ : posX;

	const blockMinY = Math.floor(posY);
	const blockMaxY = Math.floor(posY + PLAYER_BOUNDING_BOX.y);
	const crossBlockMin = Math.floor(perpendicularPos - perpendicularHalfExtent);
	const crossBlockMax =
		Math.ceil(perpendicularPos + perpendicularHalfExtent) - 1;

	const leadingEdge = target + direction * halfExtent;
	const leadingBlock = Math.floor(leadingEdge);

	for (let blockY = blockMinY; blockY <= blockMaxY; blockY++) {
		for (
			let crossBlock = crossBlockMin;
			crossBlock <= crossBlockMax;
			crossBlock++
		) {
			const blockX = axis === "x" ? leadingBlock : crossBlock;
			const blockZ = axis === "z" ? leadingBlock : crossBlock;

			const block = world.getBlock(blockX, blockY, blockZ);
			if (!BlockRegistry[block].solid) continue;

			if (direction > 0) {
				return leadingBlock - halfExtent - EPSILON;
			} else {
				return leadingBlock + 1 + halfExtent + EPSILON;
			}
		}
	}

	return target;
}

function sweepY(
	posX: number,
	posZ: number,
	world: World,
	targetY: number,
	velocityY: number,
): { y: number; collided: boolean } {
	const direction = Math.sign(velocityY);
	if (direction === 0) return { y: targetY, collided: false };

	const blockMinX = Math.floor(posX - PLAYER_BOUNDING_BOX.x);
	const blockMaxX = Math.ceil(posX + PLAYER_BOUNDING_BOX.x) - 1;
	const blockMinZ = Math.floor(posZ - PLAYER_BOUNDING_BOX.z);
	const blockMaxZ = Math.ceil(posZ + PLAYER_BOUNDING_BOX.z) - 1;

	const height = PLAYER_BOUNDING_BOX.y;

	const leadingEdge = direction > 0 ? targetY + height : targetY;
	const leadingBlock = Math.floor(leadingEdge);

	for (let blockX = blockMinX; blockX <= blockMaxX; blockX++) {
		for (let blockZ = blockMinZ; blockZ <= blockMaxZ; blockZ++) {
			const block = world.getBlock(blockX, leadingBlock, blockZ);
			if (!BlockRegistry[block].solid) continue;

			if (direction > 0) {
				return { y: leadingBlock - height - EPSILON, collided: true };
			} else {
				return { y: leadingBlock + 1 + EPSILON, collided: true };
			}
		}
	}

	return { y: targetY, collided: false };
}
