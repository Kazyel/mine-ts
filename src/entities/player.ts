import { type Camera, Vector3 } from "three";
import { SEA_LEVEL } from "@/game/constants";
import type { InputState } from "@/game/input-manager";
import type { World } from "@/world/world";
import { moveAndCollide } from "./physics";
import { raycastDDA } from "@/world/raycast";

export const PLAYER_SPEED = 5;
export const PLAYER_HEIGHT = 2;
export const PLAYER_EYE_HEIGHT = 1.7;
export const PLAYER_JUMP_FORCE = 8.5;
export const PLAYER_BOUNDING_BOX = {
	x: 0.3,
	y: PLAYER_HEIGHT,
	z: 0.3,
};

export class Player {
	private position: Vector3;
	private velocity: Vector3;
	private onGround: boolean;

	private camera: Camera;
	private yaw: number;
	private pitch: number;

	constructor(camera: Camera) {
		this.position = new Vector3(0, SEA_LEVEL + 10, 0);
		this.velocity = new Vector3(0, 0, 0);
		this.onGround = false;

		this.camera = camera;
		this.camera.rotation.order = "YXZ";
		this.yaw = 0;
		this.pitch = 0;
	}

	public getPosition(): Vector3 {
		return this.position;
	}

	public update(delta: number, input: InputState, world: World): void {
		const sensitivity = 0.002;
		this.yaw -= input.mouseData.x * sensitivity;
		this.pitch -= input.mouseData.y * sensitivity;

		this.pitch = Math.max(
			-Math.PI / 2 + 0.01,
			Math.min(Math.PI / 2 - 0.01, this.pitch),
		);
		this.camera.rotation.y = this.yaw;
		this.camera.rotation.x = this.pitch;

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
			this.velocity.y = PLAYER_JUMP_FORCE;
			this.onGround = false;
		}
		if (input.attack) {
			const cameraDirection = this.camera.getWorldDirection(new Vector3());
			const result = raycastDDA(
				this.camera.position,
				cameraDirection,
				5,
				world,
			);
			if (result) {
				world.destroyBlock(
					result.blockPosition.x,
					result.blockPosition.y,
					result.blockPosition.z,
				);
			}
		}

		if (movementDirection.length() > 0) movementDirection.normalize();
		this.velocity.x = movementDirection.x * PLAYER_SPEED;
		this.velocity.z = movementDirection.z * PLAYER_SPEED;

		const result = moveAndCollide(this.position, this.velocity, world, delta);
		this.position = result.position;
		this.velocity = result.velocity;
		this.onGround = result.onGround;

		this.camera.position.copy(
			this.position.clone().add(new Vector3(0, PLAYER_EYE_HEIGHT, 0)),
		);
	}
}
