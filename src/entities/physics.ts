import type { Vector3 } from "three";
import { PLAYER_BOUNDING_BOX } from "@/entities/player";
import { GRAVITY } from "@/game/constants";
import { BlockRegistry } from "@/world/blocks/block-registry";
import type { World } from "@/world/world";

const EPS = 0.001;
const MAX_STEP = 0.5;

export function moveAndCollide(
	position: Vector3,
	velocity: Vector3,
	world: World,
	delta: number,
): { position: Vector3; velocity: Vector3; onGround: boolean } {
	const pos = position.clone();
	const vel = velocity.clone();

	let onGround = false;

	vel.y -= GRAVITY * delta;

	const maxMove = Math.max(
		Math.abs(vel.x * delta),
		Math.abs(vel.y * delta),
		Math.abs(vel.z * delta),
	);

	const steps = Math.max(1, Math.ceil(maxMove / MAX_STEP));
	const stepDelta = delta / steps;

	for (let i = 0; i < steps; i++) {
		if (vel.x !== 0) {
			const nextX = pos.x + vel.x * stepDelta;
			const safeX = sweepAxis(pos, world, nextX, "x");

			if (safeX !== nextX) vel.x = 0;
			pos.x = safeX;
		}

		if (vel.y !== 0) {
			const nextY = pos.y + vel.y * stepDelta;
			const result = sweepY(pos, world, nextY, vel.y);

			if (result.collided) {
				if (vel.y < 0) onGround = true;
				vel.y = 0;
			}

			pos.y = result.y;
		}

		if (vel.z !== 0) {
			const nextZ = pos.z + vel.z * stepDelta;
			const safeZ = sweepAxis(pos, world, nextZ, "z");

			if (safeZ !== nextZ) vel.z = 0;
			pos.z = safeZ;
		}
	}

	return { position: pos, velocity: vel, onGround };
}

function sweepAxis(
	position: Vector3,
	world: World,
	target: number,
	axis: "x" | "z",
): number {
	const dir = Math.sign(target - position[axis]);
	if (dir === 0) return position[axis];

	const half = PLAYER_BOUNDING_BOX[axis];
	const minY = Math.floor(position.y);
	const maxY = Math.floor(position.y + PLAYER_BOUNDING_BOX.y);

	const crossMin = Math.floor(
		position[axis === "x" ? "z" : "x"] -
			PLAYER_BOUNDING_BOX[axis === "x" ? "z" : "x"],
	);
	const crossMax = Math.floor(
		position[axis === "x" ? "z" : "x"] +
			PLAYER_BOUNDING_BOX[axis === "x" ? "z" : "x"],
	);

	const edge = target + dir * half;

	const blockCoord = dir > 0 ? Math.floor(edge) : Math.floor(edge);

	for (let y = minY; y <= maxY; y++) {
		for (let c = crossMin; c <= crossMax; c++) {
			const x = axis === "x" ? blockCoord : c;
			const z = axis === "z" ? blockCoord : c;

			const block = world.getBlock(x, y, z);
			if (!BlockRegistry[block].solid) continue;

			if (dir > 0) {
				return blockCoord - half - EPS;
			} else {
				return blockCoord + 1 + half + EPS;
			}
		}
	}

	return target;
}

function sweepY(
	position: Vector3,
	world: World,
	targetY: number,
	velocityY: number,
): { y: number; collided: boolean } {
	const dir = Math.sign(velocityY);
	if (dir === 0) return { y: targetY, collided: false };

	const minX = Math.floor(position.x - PLAYER_BOUNDING_BOX.x);
	const maxX = Math.floor(position.x + PLAYER_BOUNDING_BOX.x);
	const minZ = Math.floor(position.z - PLAYER_BOUNDING_BOX.z);
	const maxZ = Math.floor(position.z + PLAYER_BOUNDING_BOX.z);

	const halfY = PLAYER_BOUNDING_BOX.y;

	const edge = dir > 0 ? targetY + halfY : targetY;

	const blockY = Math.floor(edge);

	for (let x = minX; x <= maxX; x++) {
		for (let z = minZ; z <= maxZ; z++) {
			const block = world.getBlock(x, blockY, z);
			if (!BlockRegistry[block].solid) continue;

			if (dir > 0) {
				return {
					y: blockY - halfY - EPS,
					collided: true,
				};
			} else {
				return {
					y: blockY + 1 + EPS,
					collided: true,
				};
			}
		}
	}

	return { y: targetY, collided: false };
}
