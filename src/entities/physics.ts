import type { Vector3 } from "three";
import { GRAVITY, SEA_LEVEL } from "@/game/constants";
import type { World } from "@/world/world";

export function moveAndCollide(
	position: Vector3,
	velocity: Vector3,
	_world: World,
	delta: number,
): { position: Vector3; velocity: Vector3; onGround: boolean } {
	const newPosition = position.clone().addScaledVector(velocity, delta);

	const newVelocity = velocity.clone();
	newVelocity.y -= GRAVITY * delta;

	if (newPosition.y <= SEA_LEVEL) {
		newVelocity.y = 0;
		newPosition.y = SEA_LEVEL;
		return { position: newPosition, velocity: newVelocity, onGround: true };
	}

	return { position: newPosition, velocity: newVelocity, onGround: false };
}
