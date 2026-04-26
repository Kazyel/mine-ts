export type PlayerPosition = { x: number; y: number; z: number };

type GameStateSnapshot = {
	playerPosition: PlayerPosition;
	fps: number;
	loadedChunks: number;
};

interface GameEventMap {
	"state:update": GameStateSnapshot;
	"game:paused": undefined;
	"game:resumed": undefined;
}

export class GameEventEmitter {
	private listeners: Map<keyof GameEventMap, Set<(payload: unknown) => void>>;

	constructor() {
		this.listeners = new Map();
	}

	on<K extends keyof GameEventMap>(
		event: K,
		listener: (payload: GameEventMap[K]) => void,
	): void {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, new Set());
		}

		const eventExists = this.listeners.get(event);
		if (eventExists) eventExists.add(listener as (payload: unknown) => void);
	}

	off<K extends keyof GameEventMap>(
		event: K,
		listener: (payload: GameEventMap[K]) => void,
	): void {
		const listeners = this.listeners.get(event);
		if (!listeners) return;

		listeners.delete(listener as (payload: unknown) => void);
	}

	emit<K extends keyof GameEventMap>(
		event: K,
		payload?: GameEventMap[K],
	): void {
		const listeners = this.listeners.get(event);
		if (!listeners) return;

		listeners.forEach((listener) => {
			listener(payload);
		});
	}
}
