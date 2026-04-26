import { useEffect, useRef } from "react";

import { GameEventEmitter } from "@/bridge/game-event-emitter";
import { Game } from "@/game/game";

export default function App() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const gameRef = useRef<Game>(null);

	useEffect(() => {
		if (!canvasRef.current) return;

		if (!gameRef.current) {
			const events = new GameEventEmitter();
			gameRef.current = new Game(canvasRef.current, events);
		}
		gameRef.current.start();

		return () => {
			gameRef.current?.destroy();
			gameRef.current = null;
		};
	}, []);

	return (
		<div className="relative w-screen h-screen overflow-hidden">
			<canvas
				ref={canvasRef}
				className="h-full w-full absolute inset-0"
			></canvas>

			<div className="absolute inset-0 pointer-events-none"></div>
		</div>
	);
}
