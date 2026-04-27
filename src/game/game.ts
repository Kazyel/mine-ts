import { Color, Fog, PerspectiveCamera, Scene, WebGLRenderer } from "three";

import type { GameEventEmitter } from "@/bridge/game-event-emitter";
import { Player } from "@/entities/player";
import { AssetLoader } from "@/game/asset-loader";
import { GameLoop } from "@/game/game-loop";
import { InputManager } from "@/game/input-manager";
import { World } from "@/world/world";

export class Game {
	private renderer: WebGLRenderer;
	private scene: Scene;
	private camera: PerspectiveCamera;
	private assetLoader: AssetLoader;

	private world: World;
	private player: Player;

	private inputManager: InputManager;
	private loop: GameLoop;
	private events: GameEventEmitter;

	constructor(canvas: HTMLCanvasElement, events: GameEventEmitter) {
		this.scene = new Scene();
		this.scene.background = new Color(0x87ceeb);
		this.scene.fog = new Fog(0x87ceeb, 0, 80);

		this.renderer = new WebGLRenderer({ canvas });
		this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);

		this.camera = new PerspectiveCamera(
			75,
			canvas.width / canvas.height,
			0.1,
			1000,
		);

		this.loop = new GameLoop();
		this.inputManager = new InputManager();
		this.assetLoader = new AssetLoader();
		this.events = events;

		this.world = new World(this.scene, this.assetLoader);
		this.player = new Player(this.camera);
	}

	private tick = (delta: number): void => {
		this.world.update(this.player.getPosition());
		this.player.update(delta, this.inputManager.getState(), this.world);
		this.renderer.render(this.scene, this.camera);
	};

	public start(): void {
		this.loop.start(this.tick);
		this.inputManager.start(
			this.renderer.domElement,
			this.renderer.domElement.ownerDocument,
		);
	}

	public destroy(): void {
		this.loop.stop();
		this.inputManager.destroy();
		this.renderer.dispose();
	}
}
