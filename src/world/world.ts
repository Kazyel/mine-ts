import { type Scene, Mesh } from "three";
import type { PlayerPosition } from "@/bridge/game-event-emitter";
import type { AssetLoader } from "@/game/asset-loader";
import { CHUNK_SIZE, RENDER_DISTANCE, SEA_LEVEL } from "@/game/constants";
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

	private lastPlayerChunk: ChunkCoord = { cx: Infinity, cz: Infinity };
	private chunkQueue: ChunkCoord[] = [];
	private isProcessingQueue = false;

	constructor(scene: Scene, assetLoader: AssetLoader) {
		this.scene = scene;
		this.assetLoader = assetLoader;
	}

	public getBlock(worldX: number, worldY: number, worldZ: number): BlockId {
		const chunkCoords = coordsfromWorldPosition(worldX, worldZ);
		const chunk = this.getChunk(chunkCoords);
		if (!chunk) return 0;

		const localX = ((worldX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
		const localZ = ((worldZ % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

		return chunk.getBlock(localX, worldY, localZ);
	}

	private getChunk(coord: ChunkCoord): Chunk | null {
		return this.loadedChunks.get(coordsToChunkKey(coord)) ?? null;
	}

	public update(playerPosition: PlayerPosition) {
		const currentCoords = coordsfromWorldPosition(
			playerPosition.x,
			playerPosition.z,
		);

		if (
			currentCoords.cx !== this.lastPlayerChunk.cx ||
			currentCoords.cz !== this.lastPlayerChunk.cz
		) {
			this.lastPlayerChunk = currentCoords;
			this.updateVisibleRegion(currentCoords);
		}

		this.processQueue();
	}

	private updateVisibleRegion(playerCoord: ChunkCoord) {
		for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++) {
			for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz++) {
				const coord = { cx: playerCoord.cx + dx, cz: playerCoord.cz + dz };
				const key = coordsToChunkKey(coord);

				if (
					!this.loadedChunks.has(key) &&
					!this.chunkQueue.some((c) => coordsToChunkKey(c) === key)
				) {
					this.chunkQueue.push(coord);
				}
			}
		}

		const chunksToUnload: ChunkCoord[] = [];
		for (const key of this.loadedChunks.keys()) {
			const coord = coordsFromChunkKey(key);
			if (distanceTo(coord, playerCoord) > RENDER_DISTANCE + 1) {
				chunksToUnload.push(coord);
			}
		}
		chunksToUnload.forEach((c) => {
			this.unloadChunk(c);
		});

		this.chunkQueue.sort(
			(a, b) => distanceTo(a, playerCoord) - distanceTo(b, playerCoord),
		);
	}

	private async processQueue() {
		if (this.chunkQueue.length === 0 || !this.assetLoader.isTextureLoaded)
			return;

		const nextCoord = this.chunkQueue.shift();
		if (nextCoord) this.loadChunk(nextCoord);
	}

	public loadChunk(coord: ChunkCoord): void {
		const key = coordsToChunkKey(coord);
		if (this.loadedChunks.has(key)) return;

		const newChunk = new Chunk(coord);

		this.generateTerrain(newChunk);
		this.loadedChunks.set(key, newChunk);
		this.remeshChunk(coord);
	}

	private generateTerrain(chunk: Chunk) {
		chunk.fillToHeight(SEA_LEVEL, 1);
	}

	public unloadChunk(coord: ChunkCoord): void {
		const key = coordsToChunkKey(coord);
		const mesh = this.loadedMeshes.get(key);
		if (mesh) {
			mesh.geometry.dispose();
			this.scene.remove(mesh);
			this.loadedMeshes.delete(key);
		}
		this.loadedChunks.delete(key);
	}

	public setBlock(
		worldX: number,
		worldY: number,
		worldZ: number,
		blockId: BlockId,
	): void {
		const chunkCoords = coordsfromWorldPosition(worldX, worldZ);
		const chunk = this.getChunk(chunkCoords);
		if (!chunk) return;

		const localX = ((worldX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
		const localZ = ((worldZ % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

		chunk.setBlock(localX, worldY, localZ, blockId);
		this.remeshChunk(chunkCoords);

		if (localX === 0)
			this.remeshChunk({ cx: chunkCoords.cx - 1, cz: chunkCoords.cz });
		if (localX === CHUNK_SIZE - 1)
			this.remeshChunk({ cx: chunkCoords.cx + 1, cz: chunkCoords.cz });
		if (localZ === 0)
			this.remeshChunk({ cx: chunkCoords.cx, cz: chunkCoords.cz - 1 });
		if (localZ === CHUNK_SIZE - 1)
			this.remeshChunk({ cx: chunkCoords.cx, cz: chunkCoords.cz + 1 });
	}

	public remeshChunk(coord: ChunkCoord): void {
		const key = coordsToChunkKey(coord);
		const chunk = this.getChunk(coord);
		if (!chunk) return;

		const oldMesh = this.loadedMeshes.get(key);
		if (oldMesh) {
			oldMesh.geometry.dispose();
			this.scene.remove(oldMesh);
		}

		const chunkMesh = new ChunkMesher(chunk, this.assetLoader);
		const meshGeometry = chunkMesh.generate();
		const objectMesh = new Mesh(meshGeometry, this.assetLoader.getMaterial());

		objectMesh.position.set(coord.cx * CHUNK_SIZE, 0, coord.cz * CHUNK_SIZE);
		objectMesh.matrixAutoUpdate = false;
		objectMesh.updateMatrix();

		this.scene.add(objectMesh);
		this.loadedMeshes.set(key, objectMesh);
	}

	public destroyBlock(worldX: number, worldY: number, worldZ: number): void {
		this.setBlock(worldX, worldY, worldZ, 0);
	}
}
