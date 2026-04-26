export class GameLoop {
	private rafHandle: number | undefined;
	private lastTime: number = 0;
	private callback: (delta: number) => void = () => {};

	constructor() {
		this.rafHandle = undefined;
		this.lastTime = 0;
		this.callback = () => {};
	}

	private tick = (now: number) => {
		let delta = (now - this.lastTime) / 1000;
		delta = Math.min(delta, 0.1);

		this.lastTime = now;
		this.callback(delta);
		this.rafHandle = requestAnimationFrame(this.tick);
	};

	public start(callback: (delta: number) => void) {
		this.lastTime = performance.now();
		this.callback = callback;
		this.rafHandle = requestAnimationFrame(this.tick);
	}

	public stop() {
		if (this.rafHandle !== undefined) {
			cancelAnimationFrame(this.rafHandle);
			this.rafHandle = undefined;
		}
	}
}
