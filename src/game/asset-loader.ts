import {
	DoubleSide,
	MeshBasicMaterial,
	NearestFilter,
	type Texture,
	TextureLoader,
} from "three";

export class AssetLoader {
	private textureLoader: TextureLoader;
	private texture: Texture;
	private textureMaterial: MeshBasicMaterial = new MeshBasicMaterial();
	private totalCols: number = 0;
	private totalRows: number = 0;
	public isTextureLoaded: boolean = false;

	constructor() {
		this.textureLoader = new TextureLoader();
		this.texture = this.textureLoader.load("/textures/atlas.png", (texture) => {
			this.texture = texture;
			this.texture.magFilter = NearestFilter;
			this.texture.minFilter = NearestFilter;
			this.textureMaterial = new MeshBasicMaterial({
				map: this.texture,
				side: DoubleSide,
				vertexColors: true,
			});
			this.totalCols = texture.image.width / 16;
			this.totalRows = texture.image.height / 16;
			this.isTextureLoaded = true;
		});
	}

	public getMaterial(): MeshBasicMaterial {
		return this.textureMaterial;
	}

	public getUVOffset(
		col: number,
		row: number,
	): {
		u: number;
		v: number;
		size: number;
	} {
		return {
			u: col / this.totalCols,
			v: 1 - (row + 1) / this.totalRows,
			size: 1 / this.totalCols,
		};
	}
}
