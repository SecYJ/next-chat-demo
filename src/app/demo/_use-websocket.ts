import { useEffect, useRef, useState } from "react";
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
	const [socket, setSocket] = useState<WebSocket | null>(null);
	const { roomId: normalizedRoom, userName: normalizedUserName } = roomSchema.parse({ roomId, userName });

	useEffect(() => {
		if (!normalizedRoom || !normalizedUserName) {
			if (wsRef.current) {
				wsRef.current.close();
				wsRef.current = null;
			}
			setSocket(null);
			return;
		}

		const ws = new WebSocket(getWsUrl(normalizedRoom, normalizedUserName));
		wsRef.current = ws;
		setSocket(ws);

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
			if (wsRef.current === ws) {
				wsRef.current = null;
			}
			setSocket((current) => (current === ws ? null : current));
		};
	}, [normalizedRoom, normalizedUserName]);

	return socket;
};
