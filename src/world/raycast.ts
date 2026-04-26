import type { Vector3 } from "three";
import type { World } from "@/world/world";

type RaycastResult = {
	blockId: number;
	blockPosition: {
		x: number;
		y: number;
		z: number;
	};
	faceHit: {
		x: number;
		y: number;
		z: number;
	};
	adjacentBlock: {
		x: number;
		y: number;
		z: number;
		blockId: number;
	};
};

export function raycastDDA(
	origin: Vector3,
	direction: Vector3,
	maxDistance: number,
	world: World,
): RaycastResult | null {
	let bx = Math.floor(origin.x);
	let by = Math.floor(origin.y);
	let bz = Math.floor(origin.z);

	const stepX = Math.sign(direction.x);
	const stepY = Math.sign(direction.y);
	const stepZ = Math.sign(direction.z);

	const tDeltaX = Math.abs(1 / direction.x);
	const tDeltaY = Math.abs(1 / direction.y);
	const tDeltaZ = Math.abs(1 / direction.z);

	let tMaxX = 0;
	if (stepX === 0) tMaxX = Infinity;
	if (stepX > 0) tMaxX = (1 - (origin.x - bx)) * tDeltaX;
	if (stepX < 0) tMaxX = (origin.x - bx) * tDeltaX;

	let tMaxY = 0;
	if (stepY === 0) tMaxY = Infinity;
	if (stepY > 0) tMaxY = (1 - (origin.y - by)) * tDeltaY;
	if (stepY < 0) tMaxY = (origin.y - by) * tDeltaY;

	let tMaxZ = 0;
	if (stepZ === 0) tMaxZ = Infinity;
	if (stepZ > 0) tMaxZ = (1 - (origin.z - bz)) * tDeltaZ;
	if (stepZ < 0) tMaxZ = (origin.z - bz) * tDeltaZ;

	while (Math.min(tMaxX, tMaxY, tMaxZ) < maxDistance) {
		const tMin = Math.min(tMaxX, tMaxY, tMaxZ);

		const faceHit: { x: number; y: number; z: number } = {
			x: 0,
			y: 0,
			z: 0,
		};

		if (tMin === tMaxX) {
			bx += stepX;
			tMaxX += tDeltaX;
			faceHit.x = -stepX;
		} else if (tMin === tMaxY) {
			by += stepY;
			tMaxY += tDeltaY;
			faceHit.y = -stepY;
		} else if (tMin === tMaxZ) {
			bz += stepZ;
			tMaxZ += tDeltaZ;
			faceHit.z = -stepZ;
		}

		const blockId = world.getBlock(bx, by, bz);
		if (blockId !== 0) {
			return {
				blockId,
				blockPosition: { x: bx, y: by, z: bz },
				faceHit,
				adjacentBlock: {
					x: bx + faceHit.x,
					y: by + faceHit.y,
					z: bz + faceHit.z,
					blockId: world.getBlock(
						bx + faceHit.x,
						by + faceHit.y,
						bz + faceHit.z,
					),
				},
			};
		}
	}

	return null;
}
