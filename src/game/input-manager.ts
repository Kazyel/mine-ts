export type InputState = {
	forward: boolean;
	backward: boolean;
	left: boolean;
	right: boolean;
	jump: boolean;
	attack: boolean;
	mouseData: { x: number; y: number };
	isPointerLocked: boolean;
};

const EDGE_DAMPEN_THRESHOLD = 50;

export class InputManager {
	private state: InputState;
	private heldKeys: Set<string> = new Set();
	private document: Document | null = null;
	private canvas: HTMLCanvasElement | null = null;

	private onPointerLockChange: (() => void) | null = null;

	constructor() {
		this.state = {
			forward: false,
			backward: false,
			left: false,
			right: false,
			jump: false,
			attack: false,
			mouseData: { x: 0, y: 0 },
			isPointerLocked: false,
		};
	}

	private onKeyDown = (e: KeyboardEvent) => this.heldKeys.add(e.key);
	private onKeyUp = (e: KeyboardEvent) => this.heldKeys.delete(e.key);

	private onMouseMove = (e: MouseEvent) => {
		if (!this.state.isPointerLocked) return;

		this.state.mouseData.x =
			Math.abs(e.movementX) > EDGE_DAMPEN_THRESHOLD
				? e.movementX * 0.5
				: e.movementX;
		this.state.mouseData.y = e.movementY;
	};

	private onMouseDown = (e: MouseEvent) => {
		e.stopPropagation();
		if (!this.state.isPointerLocked) {
			e.preventDefault();
			this.canvas?.requestPointerLock();
			return;
		}
		if (e.button === 0) this.state.attack = true;
	};

	private onContextMenu = (e: Event) => {
		if (this.state.isPointerLocked) e.preventDefault();
	};

	public start(canvas: HTMLCanvasElement, document: Document) {
		this.document = document;
		this.canvas = canvas;

		this.onPointerLockChange = () => {
			this.state.isPointerLocked = document.pointerLockElement === canvas;
			if (!this.state.isPointerLocked) this.heldKeys.clear();
		};

		this.document.addEventListener(
			"pointerlockchange",
			this.onPointerLockChange,
		);

		this.document.addEventListener("keydown", this.onKeyDown);
		this.document.addEventListener("keyup", this.onKeyUp);

		this.canvas.addEventListener("contextmenu", this.onContextMenu);
		this.document.addEventListener("mousemove", this.onMouseMove);
		this.canvas.addEventListener("mousedown", this.onMouseDown, {
			capture: true,
		});
	}

	public getState(): InputState {
		this.state.forward = this.heldKeys.has("w");
		this.state.backward = this.heldKeys.has("s");
		this.state.left = this.heldKeys.has("a");
		this.state.right = this.heldKeys.has("d");
		this.state.jump = this.heldKeys.has(" ");

		const snapshot = { ...this.state };
		this.state.mouseData = { x: 0, y: 0 };
		this.state.attack = false;
		return snapshot;
	}

	public destroy() {
		if (!this.document || !this.canvas) return;

		this.document.removeEventListener("keydown", this.onKeyDown);
		this.document.removeEventListener("keyup", this.onKeyUp);

		if (this.onPointerLockChange)
			this.document.removeEventListener(
				"pointerlockchange",
				this.onPointerLockChange,
			);

		this.canvas.removeEventListener("contextmenu", this.onContextMenu);
		this.document.removeEventListener("mousemove", this.onMouseMove);
		this.canvas.removeEventListener("mousedown", this.onMouseDown, {
			capture: true,
		});
	}
}
