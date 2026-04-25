import type { BlockId } from "./block-type";

export type TextureFaces = {
	top: string;
	side: string;
	bottom: string;
};

export type BlockDefinition = {
	id: BlockId;
	name: string;
	hardness: number;
	texture: string | TextureFaces;
	solid: boolean;
	transparent: boolean;
};

export const BlockRegistry: Record<BlockId, BlockDefinition> = {
	0: {
		id: 0,
		name: "Air",
		hardness: 0,
		texture: "",
		solid: false,
		transparent: true,
	},
	1: {
		id: 1,
		name: "Stone",
		hardness: 1,
		texture: "stone.png",
		solid: true,
		transparent: false,
	},
	2: {
		id: 2,
		name: "Dirt",
		hardness: 0.5,
		texture: "dirt.png",
		solid: true,
		transparent: false,
	},
	3: {
		id: 3,
		name: "Grass",
		hardness: 0.6,
		texture: "grass.png",
		solid: true,
		transparent: false,
	},
};
