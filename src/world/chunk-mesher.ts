import { BufferAttribute, BufferGeometry } from "three";
import { CHUNK_HEIGHT, CHUNK_SIZE } from "@/game/constants";

import type { Chunk } from "@/world/chunk";

export class ChunkMesher {
	private chunk: Chunk;

	constructor(chunk: Chunk) {
		this.chunk = chunk;
	}

	public generate(): BufferGeometry {
		const blockPositions: number[] = [];
		const blockUvs: number[] = [];

		for (let x = 0; x < CHUNK_SIZE; x++) {
			for (let y = 0; y < CHUNK_HEIGHT; y++) {
				for (let z = 0; z < CHUNK_SIZE; z++) {
					if (this.chunk.getBlock(x, y, z) === 0) continue;

					// TOP FACE
					if (this.chunk.getBlock(x, y + 1, z) === 0) {
						addFace(
							blockPositions,
							blockUvs,
							[x, y + 1, z],
							[x + 1, y + 1, z],
							[x, y + 1, z + 1],
							[x + 1, y + 1, z + 1],
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
) {
	positions.push(...v0);
	uvs.push(0, 1);
	positions.push(...v1);
	uvs.push(1, 1);
	positions.push(...v2);
	uvs.push(1, 0);

	positions.push(...v1);
	uvs.push(1, 1);
	positions.push(...v3);
	uvs.push(0, 0);
	positions.push(...v2);
	uvs.push(1, 0);
}
