export type InputState = {
	forward: boolean;
	backward: boolean;
	left: boolean;
	right: boolean;
	jump: boolean;
	mouseData: { x: number; y: number };
	isPointerLocked: boolean;
};

export class InputManager {
	private state: InputState;
	private heldKeys: Set<string>;
	private document: Document | null = null;
	private canvas: HTMLCanvasElement | null = null;

	private onPointerLockChange: (() => void) | null = null;
	private onRequestPointerLock: (() => void) | null = null;

	private onKeyDown = (e: KeyboardEvent) => {
		this.heldKeys.add(e.key);
	};
	private onKeyUp = (e: KeyboardEvent) => {
		this.heldKeys.delete(e.key);
	};
	private onMouseMove = (e: MouseEvent) => {
		if (!this.state.isPointerLocked) return;
		this.state.mouseData.x = e.movementX;
		this.state.mouseData.y = e.movementY;
	};

	constructor() {
		this.state = {
			forward: false,
			backward: false,
			left: false,
			right: false,
			jump: false,
			mouseData: { x: 0, y: 0 },
			isPointerLocked: false,
		};

		this.heldKeys = new Set();
	}

	public getState(): InputState {
		this.state.forward = false;
		this.state.backward = false;
		this.state.left = false;
		this.state.right = false;
		this.state.jump = false;

		for (const key of this.heldKeys) {
			switch (key) {
				case "w":
					this.state.forward = true;
					break;
				case "s":
					this.state.backward = true;
					break;
				case "a":
					this.state.left = true;
					break;
				case "d":
					this.state.right = true;
					break;
				case " ":
					this.state.jump = true;
					break;
				default:
					break;
			}
		}

		const snapshot = { ...this.state };
		this.state.mouseData = { x: 0, y: 0 };

		return snapshot;
	}

	public start(canvas: HTMLCanvasElement, document: Document) {
		this.document = document;
		this.canvas = canvas;

		this.onPointerLockChange = () => {
			this.state.isPointerLocked = document.pointerLockElement === canvas;
		};

		this.onRequestPointerLock = () => {
			if (!this.canvas) return;
			if (this.state.isPointerLocked) return;
			this.canvas.requestPointerLock();
		};

		this.canvas.addEventListener("click", this.onRequestPointerLock);
		this.document.addEventListener("keydown", this.onKeyDown);
		this.document.addEventListener("keyup", this.onKeyUp);
		this.document.addEventListener(
			"pointerlockchange",
			this.onPointerLockChange,
		);
		this.document.addEventListener("mousemove", this.onMouseMove);
	}

	public destroy() {
		if (!this.document || !this.canvas) return;

		if (this.onPointerLockChange) {
			this.document.removeEventListener(
				"pointerlockchange",
				this.onPointerLockChange,
			);
		}

		if (this.onRequestPointerLock) {
			this.canvas.removeEventListener("click", this.onRequestPointerLock);
		}

		this.document.removeEventListener("keydown", this.onKeyDown);
		this.document.removeEventListener("keyup", this.onKeyUp);
		this.document.removeEventListener("mousemove", this.onMouseMove);
	}
}
