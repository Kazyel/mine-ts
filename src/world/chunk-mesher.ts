import { BufferAttribute, BufferGeometry } from "three";

import type { AssetLoader } from "@/game/asset-loader";
import { CHUNK_HEIGHT, CHUNK_SIZE } from "@/game/constants";
import { BlockRegistry } from "@/world/blocks/block-registry";
import type { Chunk } from "@/world/chunk";

const AO_BRIGHTNESS = [0.05, 0.25, 0.6, 0.8];

const MAX_VERTICES = CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE * 6 * 4;
const MAX_INDICES = CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE * 6 * 6;

const _positions = new Float32Array(MAX_VERTICES * 3);
const _uvs = new Float32Array(MAX_VERTICES * 2);
const _colors = new Float32Array(MAX_VERTICES * 3);
const _indices = new Uint32Array(MAX_INDICES);

let _vertexCount = 0;
let _indexCount = 0;

export class ChunkMesher {
	private chunk: Chunk;
	private assetLoader: AssetLoader;

	constructor(chunk: Chunk, assetLoader: AssetLoader) {
		this.chunk = chunk;
		this.assetLoader = assetLoader;
	}

	public generate(): BufferGeometry {
		_vertexCount = 0;
		_indexCount = 0;

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
						const ao0 = topFaceAmbientOcclusion(this.chunk, x, y, z, -1, -1);
						const ao1 = topFaceAmbientOcclusion(this.chunk, x, y, z, +1, -1);
						const ao2 = topFaceAmbientOcclusion(this.chunk, x, y, z, -1, +1);
						const ao3 = topFaceAmbientOcclusion(this.chunk, x, y, z, +1, +1);

						addFace(
							ao0,
							ao1,
							ao2,
							ao3,
							x,
							y + 1,
							z,
							x + 1,
							y + 1,
							z,
							x,
							y + 1,
							z + 1,
							x + 1,
							y + 1,
							z + 1,
							topUV.u,
							topUV.v,
							topUV.size,
						);
					}

					// BOTTOM FACE
					if (this.chunk.getBlock(x, y - 1, z) === 0) {
						const ao0 = bottomFaceAmbientOcclusion(this.chunk, x, y, z, -1, -1);
						const ao1 = bottomFaceAmbientOcclusion(this.chunk, x, y, z, +1, -1);
						const ao2 = bottomFaceAmbientOcclusion(this.chunk, x, y, z, -1, +1);
						const ao3 = bottomFaceAmbientOcclusion(this.chunk, x, y, z, +1, +1);

						addFace(
							ao0,
							ao1,
							ao2,
							ao3,
							x,
							y,
							z,
							x + 1,
							y,
							z,
							x,
							y,
							z + 1,
							x + 1,
							y,
							z + 1,
							bottomUV.u,
							bottomUV.v,
							bottomUV.size,
						);
					}

					// RIGHT FACE
					if (this.chunk.getBlock(x + 1, y, z) === 0) {
						const ao0 = rightFaceAmbientOcclusion(this.chunk, x, y, z, -1, -1);
						const ao1 = rightFaceAmbientOcclusion(this.chunk, x, y, z, +1, -1);
						const ao2 = rightFaceAmbientOcclusion(this.chunk, x, y, z, -1, +1);
						const ao3 = rightFaceAmbientOcclusion(this.chunk, x, y, z, +1, +1);

						addFace(
							ao0,
							ao1,
							ao2,
							ao3,
							x + 1,
							y,
							z,
							x + 1,
							y + 1,
							z,
							x + 1,
							y,
							z + 1,
							x + 1,
							y + 1,
							z + 1,
							sideUV.u,
							sideUV.v,
							sideUV.size,
						);
					}

					// LEFT FACE
					if (this.chunk.getBlock(x - 1, y, z) === 0) {
						const ao0 = leftFaceAmbientOcclusion(this.chunk, x, y, z, -1, -1);
						const ao1 = leftFaceAmbientOcclusion(this.chunk, x, y, z, +1, -1);
						const ao2 = leftFaceAmbientOcclusion(this.chunk, x, y, z, -1, +1);
						const ao3 = leftFaceAmbientOcclusion(this.chunk, x, y, z, +1, +1);

						addFace(
							ao0,
							ao1,
							ao2,
							ao3,
							x,
							y,
							z,
							x,
							y + 1,
							z,
							x,
							y,
							z + 1,
							x,
							y + 1,
							z + 1,
							sideUV.u,
							sideUV.v,
							sideUV.size,
						);
					}

					// FRONT FACE
					if (this.chunk.getBlock(x, y, z + 1) === 0) {
						const ao0 = frontFaceAmbientOcclusion(
							this.chunk,
							x,
							y,
							z + 1,
							-1,
							-1,
						);
						const ao1 = frontFaceAmbientOcclusion(
							this.chunk,
							x,
							y,
							z + 1,
							+1,
							-1,
						);
						const ao2 = frontFaceAmbientOcclusion(
							this.chunk,
							x,
							y,
							z + 1,
							-1,
							+1,
						);
						const ao3 = frontFaceAmbientOcclusion(
							this.chunk,
							x,
							y,
							z + 1,
							+1,
							+1,
						);

						addFace(
							ao0,
							ao1,
							ao2,
							ao3,
							x,
							y,
							z + 1,
							x + 1,
							y,
							z + 1,
							x,
							y + 1,
							z + 1,
							x + 1,
							y + 1,
							z + 1,
							sideUV.u,
							sideUV.v,
							sideUV.size,
						);
					}

					// BACK FACE
					if (this.chunk.getBlock(x, y, z - 1) === 0) {
						const ao0 = backFaceAmbientOcclusion(
							this.chunk,
							x,
							y,
							z - 1,
							-1,
							-1,
						);
						const ao1 = backFaceAmbientOcclusion(
							this.chunk,
							x,
							y,
							z - 1,
							+1,
							-1,
						);
						const ao2 = backFaceAmbientOcclusion(
							this.chunk,
							x,
							y,
							z - 1,
							-1,
							+1,
						);
						const ao3 = backFaceAmbientOcclusion(
							this.chunk,
							x,
							y,
							z - 1,
							+1,
							+1,
						);

						addFace(
							ao0,
							ao1,
							ao2,
							ao3,
							x,
							y,
							z,
							x + 1,
							y,
							z,
							x,
							y + 1,
							z,
							x + 1,
							y + 1,
							z,
							sideUV.u,
							sideUV.v,
							sideUV.size,
						);
					}
				}
			}
		}

		const geometry = new BufferGeometry();

		geometry.setAttribute(
			"position",
			new BufferAttribute(_positions.slice(0, _vertexCount * 3), 3),
		);
		geometry.setAttribute(
			"color",
			new BufferAttribute(_colors.slice(0, _vertexCount * 3), 3),
		);
		geometry.setAttribute(
			"uv",
			new BufferAttribute(_uvs.slice(0, _vertexCount * 2), 2),
		);

		geometry.setIndex(new BufferAttribute(_indices.slice(0, _indexCount), 1));

		return geometry;
	}
}

function pushVertex(
	x: number,
	y: number,
	z: number,
	ao: number,
	u: number,
	v: number,
): void {
	const brightness = AO_BRIGHTNESS[ao];
	const pi = _vertexCount * 3;
	const ui = _vertexCount * 2;

	_positions[pi] = x;
	_positions[pi + 1] = y;
	_positions[pi + 2] = z;

	_uvs[ui] = u;
	_uvs[ui + 1] = v;

	_colors[pi] = brightness;
	_colors[pi + 1] = brightness;
	_colors[pi + 2] = brightness;

	_vertexCount++;
}

function addFace(
	ao0: number,
	ao1: number,
	ao2: number,
	ao3: number,
	x0: number,
	y0: number,
	z0: number,
	x1: number,
	y1: number,
	z1: number,
	x2: number,
	y2: number,
	z2: number,
	x3: number,
	y3: number,
	z3: number,
	u: number,
	v: number,
	size: number,
): void {
	const vOffset = _vertexCount;

	pushVertex(x0, y0, z0, ao0, u, v + size); // v0
	pushVertex(x1, y1, z1, ao1, u + size, v + size); // v1
	pushVertex(x2, y2, z2, ao2, u, v); // v2
	pushVertex(x3, y3, z3, ao3, u + size, v); // v3

	if (ao0 + ao3 < ao1 + ao2) {
		_indices[_indexCount++] = vOffset + 0;
		_indices[_indexCount++] = vOffset + 1;
		_indices[_indexCount++] = vOffset + 3;

		_indices[_indexCount++] = vOffset + 0;
		_indices[_indexCount++] = vOffset + 3;
		_indices[_indexCount++] = vOffset + 2;
	} else {
		_indices[_indexCount++] = vOffset + 0;
		_indices[_indexCount++] = vOffset + 1;
		_indices[_indexCount++] = vOffset + 2;

		_indices[_indexCount++] = vOffset + 1;
		_indices[_indexCount++] = vOffset + 3;
		_indices[_indexCount++] = vOffset + 2;
	}
}

function computeAmbientOcclusion(
	side1: boolean,
	side2: boolean,
	corner: boolean,
): number {
	if (side1 && side2) return 0;
	return 3 - ((side1 ? 1 : 0) + (side2 ? 1 : 0) + (corner ? 1 : 0));
}

function topFaceAmbientOcclusion(
	chunk: Chunk,
	x: number,
	y: number,
	z: number,
	xOffset: number,
	zOffset: number,
): number {
	const side1 = chunk.getBlock(x + xOffset, y + 1, z) !== 0;
	const side2 = chunk.getBlock(x, y + 1, z + zOffset) !== 0;
	const corner = chunk.getBlock(x + xOffset, y + 1, z + zOffset) !== 0;

	return computeAmbientOcclusion(side1, side2, corner);
}

function rightFaceAmbientOcclusion(
	chunk: Chunk,
	x: number,
	y: number,
	z: number,
	yOffset: number,
	zOffset: number,
): number {
	const side1 = chunk.getBlock(x + 1, y + yOffset, z) !== 0;
	const side2 = chunk.getBlock(x + 1, y, z + zOffset) !== 0;
	const corner = chunk.getBlock(x + 1, y + yOffset, z + zOffset) !== 0;

	return computeAmbientOcclusion(side1, side2, corner);
}

function frontFaceAmbientOcclusion(
	chunk: Chunk,
	x: number,
	y: number,
	z: number,
	xOffset: number,
	yOffset: number,
): number {
	const side1 = chunk.getBlock(x + xOffset, y, z) !== 0;
	const side2 = chunk.getBlock(x, y + yOffset, z) !== 0;
	const corner = chunk.getBlock(x + xOffset, y + yOffset, z) !== 0;

	return computeAmbientOcclusion(side1, side2, corner);
}

function leftFaceAmbientOcclusion(
	chunk: Chunk,
	x: number,
	y: number,
	z: number,
	yOffset: number,
	zOffset: number,
): number {
	const side1 = chunk.getBlock(x - 1, y + yOffset, z) !== 0;
	const side2 = chunk.getBlock(x - 1, y, z + zOffset) !== 0;
	const corner = chunk.getBlock(x - 1, y + yOffset, z + zOffset) !== 0;

	return computeAmbientOcclusion(side1, side2, corner);
}

function bottomFaceAmbientOcclusion(
	chunk: Chunk,
	x: number,
	y: number,
	z: number,
	xOffset: number,
	zOffset: number,
): number {
	const side1 = chunk.getBlock(x + xOffset, y - 1, z) !== 0;
	const side2 = chunk.getBlock(x, y - 1, z + zOffset) !== 0;
	const corner = chunk.getBlock(x + xOffset, y - 1, z + zOffset) !== 0;

	return computeAmbientOcclusion(side1, side2, corner);
}

function backFaceAmbientOcclusion(
	chunk: Chunk,
	x: number,
	y: number,
	z: number,
	xOffset: number,
	yOffset: number,
): number {
	const side1 = chunk.getBlock(x + xOffset, y, z) !== 0;
	const side2 = chunk.getBlock(x, y + yOffset, z) !== 0;
	const corner = chunk.getBlock(x + xOffset, y + yOffset, z) !== 0;

	return computeAmbientOcclusion(side1, side2, corner);
}
