import { type Camera, Vector3 } from "three";
import { JUMP_FORCE, SEA_LEVEL } from "@/game/constants";
import type { InputState } from "@/game/input-manager";
import type { World } from "@/world/world";
import { moveAndCollide } from "./physics";

const PLAYER_SPEED = 5;
const PLAYER_HEIGHT = 2;

export class Player {
	private position: Vector3;
	private velocity: Vector3;
	private onGround: boolean;
	private camera: Camera;

	constructor(camera: Camera) {
		this.position = new Vector3(0, SEA_LEVEL + 1, 0);
		this.velocity = new Vector3(0, 0, 0);
		this.onGround = false;
		this.camera = camera;
	}

	public getPosition(): Vector3 {
		return this.position;
	}

	public update(delta: number, input: InputState, world: World): void {
		const lookDirection = this.camera.getWorldDirection(new Vector3());
		lookDirection.y = 0;
		lookDirection.normalize();

		const movementDirection = new Vector3(0, 0, 0);
		const rightDirection = new Vector3().crossVectors(
			lookDirection,
			new Vector3(0, 1, 0),
		);

		if (input.forward) movementDirection.add(lookDirection);
		if (input.backward) movementDirection.sub(lookDirection);
		if (input.left) movementDirection.sub(rightDirection);
		if (input.right) movementDirection.add(rightDirection);

		if (input.jump && this.onGround) {
			this.velocity.y = JUMP_FORCE;
			this.onGround = false;
		}

		if (movementDirection.length() > 0) movementDirection.normalize();

		this.velocity.x = movementDirection.x * PLAYER_SPEED;
		this.velocity.z = movementDirection.z * PLAYER_SPEED;

		const result = moveAndCollide(this.position, this.velocity, world, delta);
		this.position = result.position;
		this.velocity = result.velocity;
		this.onGround = result.onGround;

		this.camera.position
			.copy(this.position)
			.add(new Vector3(0, PLAYER_HEIGHT, 0));
	}
}
