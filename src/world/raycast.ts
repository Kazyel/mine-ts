import type { Vector3 } from "three";
import type { World } from "@/world/world";

type RaycastResult = {
	blockId: number;
	blockPosition: { x: number; y: number; z: number };
	faceHit: { x: number; y: number; z: number };
	adjacentBlock: { x: number; y: number; z: number; blockId: number };
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

	const stepX = direction.x > 0 ? 1 : -1;
	const stepY = direction.y > 0 ? 1 : -1;
	const stepZ = direction.z > 0 ? 1 : -1;

	const tDeltaX = Math.abs(1 / (direction.x || 1e-9));
	const tDeltaY = Math.abs(1 / (direction.y || 1e-9));
	const tDeltaZ = Math.abs(1 / (direction.z || 1e-9));

	let tMaxX =
		stepX > 0 ? (bx + 1 - origin.x) * tDeltaX : (origin.x - bx) * tDeltaX;
	let tMaxY =
		stepY > 0 ? (by + 1 - origin.y) * tDeltaY : (origin.y - by) * tDeltaY;
	let tMaxZ =
		stepZ > 0 ? (bz + 1 - origin.z) * tDeltaZ : (origin.z - bz) * tDeltaZ;

	const initialId = world.getBlock(bx, by, bz);
	if (initialId !== 0) {
		return null;
	}

	let lastHitAxis: number;

	while (true) {
		const tMin = Math.min(tMaxX, tMaxY, tMaxZ);
		if (tMin > maxDistance) break;

		if (tMaxX < tMaxY && tMaxX < tMaxZ) {
			bx += stepX;
			tMaxX += tDeltaX;
			lastHitAxis = 0;
		} else if (tMaxY < tMaxZ) {
			by += stepY;
			tMaxY += tDeltaY;
			lastHitAxis = 1;
		} else {
			bz += stepZ;
			tMaxZ += tDeltaZ;
			lastHitAxis = 2;
		}

		const blockId = world.getBlock(bx, by, bz);
		if (blockId !== 0) {
			const fx = lastHitAxis === 0 ? -stepX : 0;
			const fy = lastHitAxis === 1 ? -stepY : 0;
			const fz = lastHitAxis === 2 ? -stepZ : 0;

			return {
				blockId,
				blockPosition: { x: bx, y: by, z: bz },
				faceHit: { x: fx, y: fy, z: fz },
				adjacentBlock: {
					x: bx + fx,
					y: by + fy,
					z: bz + fz,
					blockId: world.getBlock(bx + fx, by + fy, bz + fz),
				},
			};
		}
	}

	return null;
}
