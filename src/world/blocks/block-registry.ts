import type { BlockId } from "@/world/blocks/block-type";

export type TextureFaces = {
	top: { col: number; row: number };
	side: { col: number; row: number };
	bottom: { col: number; row: number };
};

export type BlockDefinition = {
	id: BlockId;
	name: string;
	hardness: number;
	textures: TextureFaces;
	solid: boolean;
	transparent: boolean;
};

export const BlockRegistry: Record<BlockId, BlockDefinition> = {
	0: {
		id: 0,
		name: "Air",
		hardness: 0,
		textures: {
			top: { col: 0, row: 0 },
			side: { col: 0, row: 0 },
			bottom: { col: 0, row: 0 },
		},
		solid: false,
		transparent: true,
	},
	1: {
		id: 1,
		name: "Stone",
		hardness: 1,
		textures: {
			top: { col: 1, row: 0 },
			side: { col: 1, row: 0 },
			bottom: { col: 1, row: 0 },
		},
		solid: true,
		transparent: false,
	},
	2: {
		id: 2,
		name: "Dirt",
		hardness: 0.5,
		textures: {
			top: { col: 1, row: 0 },
			side: { col: 1, row: 0 },
			bottom: { col: 1, row: 0 },
		},
		solid: true,
		transparent: false,
	},
	3: {
		id: 3,
		name: "Grass",
		hardness: 0.6,
		textures: {
			top: { col: 1, row: 0 },
			side: { col: 1, row: 0 },
			bottom: { col: 1, row: 0 },
		},
		solid: true,
		transparent: false,
	},
};
