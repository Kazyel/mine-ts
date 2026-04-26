import { CHUNK_HEIGHT, CHUNK_SIZE } from "@/game/constants";

import type { BlockId } from "@/world/blocks/block-type";
import type { ChunkCoord } from "@/world/chunk-coord";

export class Chunk {
	public coord: ChunkCoord;
	private blocks: Uint8Array = new Uint8Array(
		CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT,
	);

	constructor(coord: ChunkCoord) {
		this.coord = coord;
	}

	public getBlock(x: number, y: number, z: number): BlockId {
		if (
			x < 0 ||
			x >= CHUNK_SIZE ||
			y < 0 ||
			y >= CHUNK_HEIGHT ||
			z < 0 ||
			z >= CHUNK_SIZE
		) {
			return 0;
		}

		return this.blocks[x | (z << 4) | (y << 8)] as BlockId;
	}

	public setBlock(x: number, y: number, z: number, blockId: BlockId): void {
		this.blocks[x | (z << 4) | (y << 8)] = blockId;
	}
}
