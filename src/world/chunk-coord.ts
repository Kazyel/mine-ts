import { CHUNK_SIZE } from "@/game/constants";

export type ChunkCoord = {
	cx: number;
	cz: number;
};

export function toKey(coord: ChunkCoord): string {
	return `${coord.cx},${coord.cz}`;
}

export function fromKey(key: string): ChunkCoord {
	const [cx, cz] = key.split(",").map(Number);
	return { cx, cz };
}

export function distanceTo(a: ChunkCoord, b: ChunkCoord) {
	const dx = Math.abs(a.cx - b.cx);
	const dz = Math.abs(a.cz - b.cz);
	return Math.max(dx, dz);
}

export function neighbours(coord: ChunkCoord): ChunkCoord[] {
	return [
		{ cx: coord.cx - 1, cz: coord.cz - 1 },
		{ cx: coord.cx - 1, cz: coord.cz },
		{ cx: coord.cx - 1, cz: coord.cz + 1 },
		{ cx: coord.cx, cz: coord.cz - 1 },
		{ cx: coord.cx, cz: coord.cz },
		{ cx: coord.cx, cz: coord.cz + 1 },
		{ cx: coord.cx + 1, cz: coord.cz - 1 },
		{ cx: coord.cx + 1, cz: coord.cz },
		{ cx: coord.cx + 1, cz: coord.cz + 1 },
	];
}

export function fromWorldPosition(x: number, z: number): ChunkCoord {
	return { cx: Math.floor(x / CHUNK_SIZE), cz: Math.floor(z / CHUNK_SIZE) };
}
