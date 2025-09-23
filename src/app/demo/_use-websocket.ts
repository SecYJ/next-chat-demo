import { useEffect, useRef } from "react";
import { getWsUrl } from "../env";
import { z } from "zod";

type WebSocketArgs = Partial<{
	roomId: string | null;
	userName: string | null;
	token: number;
}>;

const roomSchema = z.object({
	roomId: z.string().trim().catch(""),
	userName: z.string().trim().catch(""),
});

export const useWebSocket = ({ roomId, userName }: WebSocketArgs) => {
	const wsRef = useRef<WebSocket | null>(null);
	const { roomId: normalizedRoom, userName: normalizedUserName } = roomSchema.parse({ roomId, userName });

	useEffect(() => {
		if (!normalizedRoom || !normalizedUserName) {
			wsRef.current?.close();
			wsRef.current = null;
			return;
		}

		const ws = new WebSocket(getWsUrl(normalizedRoom, normalizedUserName));
		wsRef.current = ws;

		ws.onopen = () => {
			console.log(`Connected to server (room: ${normalizedRoom}, user: ${normalizedUserName})`);
		};
		ws.onmessage = (event) => {
			console.log("Message from server", event.data);
		};
		ws.onclose = (event) => {
			console.log(`Disconnected from server (code: ${event.code}, reason: ${event.reason})`);
		};
		ws.onerror = (event) => {
			console.error("Error from server", event);
		};

		return () => {
			ws.close();
			if (wsRef.current) {
				wsRef.current = null;
			}
		};
	}, [normalizedRoom, normalizedUserName]);

	return wsRef.current;
};
