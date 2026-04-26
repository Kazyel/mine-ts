import { Vector3, type Camera } from "three";
import { moveAndCollide } from "@/entities/physics";
import { GRAVITY, SEA_LEVEL } from "@/game/constants";
import type { InputState } from "@/game/input-manager";
import type { World } from "@/world/world";
import { raycastDDA } from "@/world/raycast";

const PLAYER_SPEED = 5;
const ACCELERATION = 100;
const FRICTION = 100;
const AIR_ACCELERATION = 20;
const AIR_FRICTION = 5;

export const PLAYER_HEIGHT = 1.8;
export const PLAYER_EYE_HEIGHT = PLAYER_HEIGHT - 0.2;
export const PLAYER_JUMP_FORCE = Math.sqrt(2 * GRAVITY * 1.25);
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
		this.position = new Vector3(0, SEA_LEVEL + 1, 0);
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
		// Camera Control
		const sensitivity = 0.002;
		this.yaw -= input.mouseData.x * sensitivity;
		this.pitch -= input.mouseData.y * sensitivity;
		this.pitch = Math.max(
			-Math.PI / 2 + 0.01,
			Math.min(Math.PI / 2 - 0.01, this.pitch),
		);
		this.camera.rotation.y = this.yaw;
		this.camera.rotation.x = this.pitch;

		// Movement
		const forward = this.camera.getWorldDirection(new Vector3());
		forward.y = 0;
		forward.normalize();

		const right = new Vector3().crossVectors(forward, new Vector3(0, 1, 0));
		const wishDir = new Vector3();

		if (input.forward) wishDir.add(forward);
		if (input.backward) wishDir.sub(forward);
		if (input.left) wishDir.sub(right);
		if (input.right) wishDir.add(right);

		if (wishDir.lengthSq() > 0) wishDir.normalize();

		const targetVelocityX = wishDir.x * PLAYER_SPEED;
		const targetVelocityZ = wishDir.z * PLAYER_SPEED;

		const acceleration = this.onGround ? ACCELERATION : AIR_ACCELERATION;
		this.velocity.x = approach(
			this.velocity.x,
			targetVelocityX,
			acceleration * delta,
		);
		this.velocity.z = approach(
			this.velocity.z,
			targetVelocityZ,
			acceleration * delta,
		);

		const friction = this.onGround ? FRICTION : AIR_FRICTION;
		if (wishDir.lengthSq() === 0) {
			this.velocity.x = approach(this.velocity.x, 0, friction * delta);
			this.velocity.z = approach(this.velocity.z, 0, friction * delta);
		}

		if (input.jump && this.onGround) {
			this.velocity.y = PLAYER_JUMP_FORCE;
			this.onGround = false;
		}

		if (input.attack) {
			const dir = this.camera.getWorldDirection(new Vector3());
			const result = raycastDDA(this.camera.position, dir, 5, world);
			if (result) {
				world.destroyBlock(
					result.blockPosition.x,
					result.blockPosition.y,
					result.blockPosition.z,
				);
			}
		}

		const result = moveAndCollide(this.position, this.velocity, world, delta);
		if (this.onGround) {
			this.velocity.y = 0;
		}

		this.position = result.position;
		this.velocity = result.velocity;
		this.onGround = result.onGround;

		// Update camera position
		this.camera.position.set(
			this.position.x,
			this.position.y + PLAYER_EYE_HEIGHT,
			this.position.z,
		);
	}
}

function approach(current: number, target: number, maxDelta: number): number {
	if (current < target) {
		return Math.min(current + maxDelta, target);
	}
	if (current > target) {
		return Math.max(current - maxDelta, target);
	}
	return target;
}
