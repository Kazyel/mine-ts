import { BufferAttribute, BufferGeometry } from "three";

import type { AssetLoader } from "@/game/asset-loader";
import { CHUNK_HEIGHT, CHUNK_SIZE } from "@/game/constants";
import { BlockRegistry } from "@/world/blocks/block-registry";
import type { Chunk } from "@/world/chunk";

const AO_BRIGHTNESS = [0.05, 0.25, 0.6, 0.8];

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
		const blockColors: number[] = [];

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
						const ao0 = topFaceAmbientOcclusion(this.chunk, x, y, z, -1, -1); // v0: left, back
						const ao1 = topFaceAmbientOcclusion(this.chunk, x, y, z, +1, -1); // v1: right, back
						const ao2 = topFaceAmbientOcclusion(this.chunk, x, y, z, -1, +1); // v2: left, front
						const ao3 = topFaceAmbientOcclusion(this.chunk, x, y, z, +1, +1); // v3: right, front

						addFace(
							blockPositions,
							blockUvs,
							blockColors,
							ao0,
							ao1,
							ao2,
							ao3,
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
						const ao0 = bottomFaceAmbientOcclusion(this.chunk, x, y, z, -1, -1); // v0: left, back
						const ao1 = bottomFaceAmbientOcclusion(this.chunk, x, y, z, +1, -1); // v1: right, back
						const ao2 = bottomFaceAmbientOcclusion(this.chunk, x, y, z, -1, +1); // v2: left, front
						const ao3 = bottomFaceAmbientOcclusion(this.chunk, x, y, z, +1, +1); // v3: right, front

						addFace(
							blockPositions,
							blockUvs,
							blockColors,
							ao0,
							ao1,
							ao2,
							ao3,
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
						const ao0 = rightFaceAmbientOcclusion(this.chunk, x, y, z, -1, -1); // v0: left, back
						const ao1 = rightFaceAmbientOcclusion(this.chunk, x, y, z, +1, -1); // v1: right, back
						const ao2 = rightFaceAmbientOcclusion(this.chunk, x, y, z, -1, +1); // v2: left, front
						const ao3 = rightFaceAmbientOcclusion(this.chunk, x, y, z, +1, +1); // v3: right, front

						addFace(
							blockPositions,
							blockUvs,
							blockColors,
							ao0,
							ao1,
							ao2,
							ao3,
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
						const ao0 = leftFaceAmbientOcclusion(this.chunk, x, y, z, -1, -1); // v0: left, back
						const ao1 = leftFaceAmbientOcclusion(this.chunk, x, y, z, +1, -1); // v1: right, back
						const ao2 = leftFaceAmbientOcclusion(this.chunk, x, y, z, -1, +1); // v2: left, front
						const ao3 = leftFaceAmbientOcclusion(this.chunk, x, y, z, +1, +1); // v3: right, front

						addFace(
							blockPositions,
							blockUvs,
							blockColors,
							ao0,
							ao1,
							ao2,
							ao3,
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
						const ao0 = frontFaceAmbientOcclusion(
							this.chunk,
							x,
							y,
							z + 1,
							-1,
							-1,
						); // v0: left, back
						const ao1 = frontFaceAmbientOcclusion(
							this.chunk,
							x,
							y,
							z + 1,
							+1,
							-1,
						); // v1: right, back
						const ao2 = frontFaceAmbientOcclusion(
							this.chunk,
							x,
							y,
							z + 1,
							-1,
							+1,
						); // v2: left, front
						const ao3 = frontFaceAmbientOcclusion(
							this.chunk,
							x,
							y,
							z + 1,
							+1,
							+1,
						); // v3: right, front

						addFace(
							blockPositions,
							blockUvs,
							blockColors,
							ao0,
							ao1,
							ao2,
							ao3,
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
						const ao0 = backFaceAmbientOcclusion(
							this.chunk,
							x,
							y,
							z - 1,
							-1,
							-1,
						); // v0: left, back
						const ao1 = backFaceAmbientOcclusion(
							this.chunk,
							x,
							y,
							z - 1,
							+1,
							-1,
						); // v1: right, back
						const ao2 = backFaceAmbientOcclusion(
							this.chunk,
							x,
							y,
							z - 1,
							-1,
							+1,
						); // v2: left, front
						const ao3 = backFaceAmbientOcclusion(
							this.chunk,
							x,
							y,
							z - 1,
							+1,
							+1,
						); // v3: right, front

						addFace(
							blockPositions,
							blockUvs,
							blockColors,
							ao0,
							ao1,
							ao2,
							ao3,
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
		const colors = new Float32Array(blockColors);

		const geometry = new BufferGeometry();
		geometry.setAttribute("position", new BufferAttribute(positions, 3));
		geometry.setAttribute("color", new BufferAttribute(colors, 3));
		geometry.setAttribute("uv", new BufferAttribute(uvs, 2));

		return geometry;
	}
}

function addFace(
	positions: number[],
	uvs: number[],
	colors: number[],
	ao0: number,
	ao1: number,
	ao2: number,
	ao3: number,
	v0: number[],
	v1: number[],
	v2: number[],
	v3: number[],
	u: number,
	v: number,
	size: number,
) {
	if (ao0 + ao3 < ao1 + ao2) {
		// Triangle 1
		positions.push(...v0);
		colors.push(AO_BRIGHTNESS[ao0], AO_BRIGHTNESS[ao0], AO_BRIGHTNESS[ao0]);
		uvs.push(u, v + size); // top-left

		positions.push(...v1);
		colors.push(AO_BRIGHTNESS[ao1], AO_BRIGHTNESS[ao1], AO_BRIGHTNESS[ao1]);
		uvs.push(u + size, v + size); // top-right

		positions.push(...v3);
		colors.push(AO_BRIGHTNESS[ao3], AO_BRIGHTNESS[ao3], AO_BRIGHTNESS[ao3]);
		uvs.push(u + size, v); // bottom-RIGHT

		// Triangle 2
		positions.push(...v0);
		colors.push(AO_BRIGHTNESS[ao0], AO_BRIGHTNESS[ao0], AO_BRIGHTNESS[ao0]);
		uvs.push(u, v + size); // top-left

		positions.push(...v3);
		colors.push(AO_BRIGHTNESS[ao3], AO_BRIGHTNESS[ao3], AO_BRIGHTNESS[ao3]);
		uvs.push(u + size, v); // bottom-RIGHT

		positions.push(...v2);
		colors.push(AO_BRIGHTNESS[ao2], AO_BRIGHTNESS[ao2], AO_BRIGHTNESS[ao2]);
		uvs.push(u, v); // bottom-left
	} else {
		// Triangle 1
		positions.push(...v0);
		colors.push(AO_BRIGHTNESS[ao0], AO_BRIGHTNESS[ao0], AO_BRIGHTNESS[ao0]);
		uvs.push(u, v + size); // top-left

		positions.push(...v1);
		colors.push(AO_BRIGHTNESS[ao1], AO_BRIGHTNESS[ao1], AO_BRIGHTNESS[ao1]);
		uvs.push(u + size, v + size); // top-right

		positions.push(...v2);
		colors.push(AO_BRIGHTNESS[ao2], AO_BRIGHTNESS[ao2], AO_BRIGHTNESS[ao2]);
		uvs.push(u, v); // bottom-LEFT

		// Triangle 2
		positions.push(...v1);
		colors.push(AO_BRIGHTNESS[ao1], AO_BRIGHTNESS[ao1], AO_BRIGHTNESS[ao1]);
		uvs.push(u + size, v + size); // top-right

		positions.push(...v3);
		colors.push(AO_BRIGHTNESS[ao3], AO_BRIGHTNESS[ao3], AO_BRIGHTNESS[ao3]);
		uvs.push(u + size, v); // bottom-RIGHT

		positions.push(...v2);
		colors.push(AO_BRIGHTNESS[ao2], AO_BRIGHTNESS[ao2], AO_BRIGHTNESS[ao2]);
		uvs.push(u, v); // bottom-left
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
