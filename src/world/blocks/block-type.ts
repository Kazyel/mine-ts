export type BlockId = (typeof BlockType)[keyof typeof BlockType];

export const BlockType = {
	Air: 0,
	Stone: 1,
	Dirt: 2,
	Grass: 3,
} as const;
