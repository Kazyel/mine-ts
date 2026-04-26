import { type Material, Mesh, type Scene } from "three";
import type { PlayerPosition } from "@/bridge/game-event-emitter";
import { CHUNK_HEIGHT, CHUNK_SIZE, RENDER_DISTANCE } from "@/game/constants";
import type { BlockId } from "@/world/blocks/block-type";
import { Chunk } from "@/world/chunk";
import {
	type ChunkCoord,
	distanceTo,
	fromKey,
	fromWorldPosition,
	toKey,
} from "@/world/chunk-coord";
import { ChunkMesher } from "@/world/chunk-mesher";

export class World {
	private loadedChunks: Map<string, Chunk> = new Map();
	private loadedMeshes: Map<string, Mesh> = new Map();
	private scene: Scene;
	private material: Material;

	constructor(scene: Scene, material: Material) {
		this.scene = scene;
		this.material = material;
	}

	private getChunk(coord: ChunkCoord): Chunk | null {
		const chunk = this.loadedChunks.get(toKey(coord));
		return chunk ?? null;
	}

	public getBlock(worldX: number, worldY: number, worldZ: number): BlockId {
		const chunk = this.getChunk(fromWorldPosition(worldX, worldZ));
		if (!chunk) return 0;

		const chunkCoords = fromWorldPosition(worldX, worldZ);
		const localX = worldX - chunkCoords.cx * CHUNK_SIZE;
		const localZ = worldZ - chunkCoords.cz * CHUNK_SIZE;

		return chunk.getBlock(localX, worldY, localZ);
	}

	public setBlock(
		worldX: number,
		worldY: number,
		worldZ: number,
		blockId: BlockId,
	): void {
		const chunk = this.getChunk(fromWorldPosition(worldX, worldZ));
		if (!chunk) return;

		const chunkCoords = fromWorldPosition(worldX, worldZ);
		const localX = worldX - chunkCoords.cx * CHUNK_SIZE;
		const localZ = worldZ - chunkCoords.cz * CHUNK_SIZE;

		chunk.setBlock(localX, worldY, localZ, blockId);
	}

	public loadChunk(coord: ChunkCoord): void {
		const chunk = this.getChunk(coord);
		if (chunk) return;

		let blockCount = 0;
		const newChunk = new Chunk(coord);

		while (blockCount < CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT) {
			newChunk.setBlock(
				blockCount % CHUNK_SIZE,
				Math.floor(blockCount / (CHUNK_SIZE * CHUNK_SIZE)),
				Math.floor(blockCount / CHUNK_SIZE) % CHUNK_SIZE,
				1,
			);
			blockCount++;
		}

		const chunkMesh = new ChunkMesher(newChunk);
		const geometry = chunkMesh.generate();
		const object3d = new Mesh(geometry, this.material);
		object3d.position.set(coord.cx * CHUNK_SIZE, 0, coord.cz * CHUNK_SIZE);

		this.scene.add(object3d);
		this.loadedMeshes.set(toKey(coord), object3d);
		this.loadedChunks.set(toKey(coord), newChunk);
	}

	public unloadChunk(coord: ChunkCoord): void {
		const key = toKey(coord);
		if (!this.loadedChunks.has(key)) return;

		const chunk = this.loadedChunks.get(key);
		if (!chunk) return;

		const mesh = this.loadedMeshes.get(key);
		if (mesh) this.scene.remove(mesh);

		this.loadedMeshes.delete(key);
		this.loadedChunks.delete(key);
	}

	public update(playerPosition: PlayerPosition) {
		const playerChunkCoords = fromWorldPosition(
			playerPosition.x,
			playerPosition.z,
		);

		for (
			let dx = playerChunkCoords.cx - RENDER_DISTANCE;
			dx <= playerChunkCoords.cx + RENDER_DISTANCE;
			dx++
		) {
			for (
				let dz = playerChunkCoords.cz - RENDER_DISTANCE;
				dz <= playerChunkCoords.cz + RENDER_DISTANCE;
				dz++
			) {
				const currentChunkCoord = {
					cx: dx,
					cz: dz,
				};

				const chunk = this.getChunk(currentChunkCoord);
				if (chunk) continue;
				this.loadChunk(currentChunkCoord);
			}
		}

		const toUnload: ChunkCoord[] = [];

		for (const key of this.loadedChunks.keys()) {
			const coord = fromKey(key);
			if (distanceTo(coord, playerChunkCoords) > RENDER_DISTANCE + 2)
				toUnload.push(coord);
		}
		for (const coord of toUnload) {
			this.unloadChunk(coord);
		}
	}
}
