import { BufferAttribute, BufferGeometry } from "three";

import type { AssetLoader } from "@/game/asset-loader";
import { CHUNK_HEIGHT, CHUNK_SIZE } from "@/game/constants";
import type { Chunk } from "@/world/chunk";
import { BlockRegistry } from "./blocks/block-registry";

export class ChunkMesher {
	private chunk: Chunk;
	private assetLoader: AssetLoader;

	constructor(chunk: Chunk, assetLoader: AssetLoader) {
		this.chunk = chunk;
		this.assetLoader = assetLoader;
	}

	public generate(): BufferGeometry {
		const blockPositions: number[] = [];
		const blockUvs: number[] = [];

		for (let x = 0; x < CHUNK_SIZE; x++) {
			for (let y = 0; y < CHUNK_HEIGHT; y++) {
				for (let z = 0; z < CHUNK_SIZE; z++) {
					const currentBlock = this.chunk.getBlock(x, y, z);
					if (currentBlock === 0) continue;
					const currentBlockTexture = BlockRegistry[currentBlock];

					const topUV = this.assetLoader.getUVOffset(
						currentBlockTexture.textures.top.col,
						currentBlockTexture.textures.top.row,
					);
					const sideUV = this.assetLoader.getUVOffset(
						currentBlockTexture.textures.side.col,
						currentBlockTexture.textures.side.row,
					);
					const bottomUV = this.assetLoader.getUVOffset(
						currentBlockTexture.textures.bottom.col,
						currentBlockTexture.textures.bottom.row,
					);

					// TOP FACE
					if (this.chunk.getBlock(x, y + 1, z) === 0) {
						addFace(
							blockPositions,
							blockUvs,
							[x, y + 1, z],
							[x + 1, y + 1, z],
							[x, y + 1, z + 1],
							[x + 1, y + 1, z + 1],
							topUV.u,
							topUV.v,
							topUV.size,
						);
					}

					// BOTTOM FACE
					if (this.chunk.getBlock(x, y - 1, z) === 0) {
						addFace(
							blockPositions,
							blockUvs,
							[x, y, z],
							[x + 1, y, z],
							[x, y, z + 1],
							[x + 1, y, z + 1],
							bottomUV.u,
							bottomUV.v,
							bottomUV.size,
						);
					}

					// RIGHT FACE
					if (this.chunk.getBlock(x + 1, y, z) === 0) {
						addFace(
							blockPositions,
							blockUvs,
							[x + 1, y, z],
							[x + 1, y + 1, z],
							[x + 1, y, z + 1],
							[x + 1, y + 1, z + 1],
							sideUV.u,
							sideUV.v,
							sideUV.size,
						);
					}

					// LEFT FACE
					if (this.chunk.getBlock(x - 1, y, z) === 0) {
						addFace(
							blockPositions,
							blockUvs,
							[x, y, z],
							[x, y + 1, z],
							[x, y, z + 1],
							[x, y + 1, z + 1],
							sideUV.u,
							sideUV.v,
							sideUV.size,
						);
					}

					// FRONT FACE
					if (this.chunk.getBlock(x, y, z + 1) === 0) {
						addFace(
							blockPositions,
							blockUvs,
							[x, y, z + 1],
							[x + 1, y, z + 1],
							[x, y + 1, z + 1],
							[x + 1, y + 1, z + 1],
							sideUV.u,
							sideUV.v,
							sideUV.size,
						);
					}

					// BACK FACE
					if (this.chunk.getBlock(x, y, z - 1) === 0) {
						addFace(
							blockPositions,
							blockUvs,
							[x, y, z],
							[x + 1, y, z],
							[x, y + 1, z],
							[x + 1, y + 1, z],
							sideUV.u,
							sideUV.v,
							sideUV.size,
						);
					}
				}
			}
		}

		const positions = new Float32Array(blockPositions);
		const uvs = new Float32Array(blockUvs);

		const geometry = new BufferGeometry();
		geometry.setAttribute("position", new BufferAttribute(positions, 3));
		geometry.setAttribute("uv", new BufferAttribute(uvs, 2));
		geometry.computeVertexNormals();

		return geometry;
	}
}

function addFace(
	positions: number[],
	uvs: number[],
	v0: number[],
	v1: number[],
	v2: number[],
	v3: number[],
	u: number,
	v: number,
	size: number,
) {
	positions.push(...v0);
	uvs.push(u, v + size); // top-left
	positions.push(...v1);
	uvs.push(u + size, v + size); // top-right
	positions.push(...v2);
	uvs.push(u, v); // bottom-LEFT

	positions.push(...v1);
	uvs.push(u + size, v + size); // top-right
	positions.push(...v3);
	uvs.push(u + size, v); // bottom-RIGHT
	positions.push(...v2);
	uvs.push(u, v); // bottom-left
}
