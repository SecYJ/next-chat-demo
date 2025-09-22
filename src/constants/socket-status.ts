export const SOCKET_STATUS: Record<number, string> = {
	[WebSocket.CONNECTING]: "Connecting",
	[WebSocket.OPEN]: "Connected",
	[WebSocket.CLOSING]: "Closing",
	[WebSocket.CLOSED]: "Disconnected",
};
