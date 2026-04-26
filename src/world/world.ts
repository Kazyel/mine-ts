import { type Scene, Mesh } from "three";
import type { PlayerPosition } from "@/bridge/game-event-emitter";
import type { AssetLoader } from "@/game/asset-loader";
import {
	CHUNK_HEIGHT,
	CHUNK_SIZE,
	RENDER_DISTANCE,
	SEA_LEVEL,
} from "@/game/constants";
import type { BlockId } from "@/world/blocks/block-type";
import { Chunk } from "@/world/chunk";
import {
	type ChunkCoord,
	distanceTo,
	coordsFromChunkKey,
	coordsfromWorldPosition,
	coordsToChunkKey,
} from "@/world/chunk-coord";
import { ChunkMesher } from "@/world/chunk-mesher";

export class World {
	private loadedChunks: Map<string, Chunk> = new Map();
	private loadedMeshes: Map<string, Mesh> = new Map();
	private assetLoader: AssetLoader;
	private scene: Scene;

	constructor(scene: Scene, assetLoader: AssetLoader) {
		this.scene = scene;
		this.assetLoader = assetLoader;
	}

	private getChunk(coord: ChunkCoord): Chunk | null {
		const chunk = this.loadedChunks.get(coordsToChunkKey(coord));
		return chunk ?? null;
	}

	public getBlock(worldX: number, worldY: number, worldZ: number): BlockId {
		const chunk = this.getChunk(coordsfromWorldPosition(worldX, worldZ));
		if (!chunk) return 0;

		const chunkCoords = coordsfromWorldPosition(worldX, worldZ);
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
		const chunk = this.getChunk(coordsfromWorldPosition(worldX, worldZ));
		if (!chunk) return;

		const chunkCoords = coordsfromWorldPosition(worldX, worldZ);
		const localX = worldX - chunkCoords.cx * CHUNK_SIZE;
		const localZ = worldZ - chunkCoords.cz * CHUNK_SIZE;
		chunk.setBlock(localX, worldY, localZ, blockId);
	}

	public loadChunk(coord: ChunkCoord): void {
		if (!this.assetLoader.isTextureLoaded) return;

		const chunk = this.getChunk(coord);
		if (chunk) return;

		let blockCount = 0;
		const newChunk = new Chunk(coord);

		while (blockCount < CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT) {
			const blockY = Math.floor(blockCount / (CHUNK_SIZE * CHUNK_SIZE));
			if (blockY <= SEA_LEVEL) {
				newChunk.setBlock(
					blockCount % CHUNK_SIZE,
					blockY,
					Math.floor(blockCount / CHUNK_SIZE) % CHUNK_SIZE,
					1,
				);
			}
			blockCount++;
		}

		const chunkMesh = new ChunkMesher(newChunk, this.assetLoader);
		const meshGeometry = chunkMesh.generate();
		const objectMesh = new Mesh(meshGeometry, this.assetLoader.getMaterial());
		objectMesh.position.set(coord.cx * CHUNK_SIZE, 0, coord.cz * CHUNK_SIZE);
		this.scene.add(objectMesh);
		this.loadedMeshes.set(coordsToChunkKey(coord), objectMesh);
		this.loadedChunks.set(coordsToChunkKey(coord), newChunk);
	}

	public unloadChunk(coord: ChunkCoord): void {
		const key = coordsToChunkKey(coord);
		if (!this.loadedChunks.has(key)) return;

		const chunk = this.loadedChunks.get(key);
		if (!chunk) return;

		const mesh = this.loadedMeshes.get(key);
		if (mesh) this.scene.remove(mesh);

		this.loadedMeshes.delete(key);
		this.loadedChunks.delete(key);
	}

	public remeshChunk(coord: ChunkCoord): void {
		const chunkKey = coordsToChunkKey(coord);
		const existingMesh = this.loadedMeshes.get(chunkKey);
		const existingChunk = this.loadedChunks.get(chunkKey);
		if (!existingMesh || !existingChunk) return;

		existingMesh.geometry.dispose();
		existingMesh.geometry = new ChunkMesher(
			existingChunk,
			this.assetLoader,
		).generate();
	}

	public destroyBlock(worldX: number, worldY: number, worldZ: number): void {
		this.setBlock(worldX, worldY, worldZ, 0);
		const chunkCoord = coordsfromWorldPosition(worldX, worldZ);
		this.remeshChunk(chunkCoord);
	}

	public update(playerPosition: PlayerPosition) {
		const playerChunkCoords = coordsfromWorldPosition(
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

		const chunksToUnload: ChunkCoord[] = [];

		for (const key of this.loadedChunks.keys()) {
			const coord = coordsFromChunkKey(key);
			if (distanceTo(coord, playerChunkCoords) > RENDER_DISTANCE + 2)
				chunksToUnload.push(coord);
		}
		for (const coord of chunksToUnload) {
			this.unloadChunk(coord);
		}
	}
}
