import {
	AmbientLight,
	Color,
	DirectionalLight,
	MeshLambertMaterial,
	PerspectiveCamera,
	Scene,
	WebGLRenderer,
} from "three";

import type { GameEventEmitter } from "@/bridge/game-event-emitter";
import { Player } from "@/entities/player";
import { GameLoop } from "@/game/game-loop";
import { InputManager } from "@/game/input-manager";
import { World } from "@/world/world";

export class Game {
	private renderer: WebGLRenderer;
	private scene: Scene;
	private camera: PerspectiveCamera;

	private world: World;
	private player: Player;

	private inputManager: InputManager;
	private loop: GameLoop;
	private events: GameEventEmitter;

	constructor(canvas: HTMLCanvasElement, events: GameEventEmitter) {
		const ambient = new AmbientLight(0xffffff, 0.5);
		const sun = new DirectionalLight(0xffffff, 1);
		sun.position.set(10, 20, 10);
		this.scene = new Scene();
		this.scene.background = new Color(0x87ceeb);
		this.scene.add(ambient, sun);

		this.renderer = new WebGLRenderer({ canvas });
		this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
		this.camera = new PerspectiveCamera(
			75,
			canvas.width / canvas.height,
			0.1,
			1000,
		);

		this.world = new World(
			this.scene,
			new MeshLambertMaterial({ color: 0x88bb88 }),
		);
		this.player = new Player(this.camera);

		this.inputManager = new InputManager();
		this.loop = new GameLoop();
		this.events = events;
	}

	private tick = (delta: number): void => {
		this.world.update(this.player.getPosition());
		this.player.update(delta, this.inputManager.getState(), this.world);
		this.renderer.render(this.scene, this.camera);
	};

	public start(): void {
		this.inputManager.start(
			this.renderer.domElement,
			this.renderer.domElement.ownerDocument,
		);

		this.loop.start(this.tick);
	}

	public destroy(): void {
		this.loop.stop();
		this.inputManager.destroy();
		this.renderer.dispose();
	}
}
