import { z } from "zod";

export const nodeEnv = z.enum(["development", "test", "production"]).parse(process.env.NODE_ENV ?? "development");

const clientSchema = z.object({
	NEXT_PUBLIC_WS_URL: z.url().optional(),
	NEXT_PUBLIC_WS_PORT: z.coerce.number().int().positive().optional(),
});

export const clientEnv = clientSchema.parse({
	NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
	NEXT_PUBLIC_WS_PORT: process.env.NEXT_PUBLIC_WS_PORT,
});

export const getWsBaseUrl = () => {
	if (typeof window === "undefined") return "";

	const { protocol, hostname } = window.location;
	const wsProtocol = protocol === "https:" ? "wss:" : "ws:";

	if (nodeEnv === "production") {
		if (!clientEnv.NEXT_PUBLIC_WS_URL) {
			throw new Error("NEXT_PUBLIC_WS_URL is required in production.");
		}
		return clientEnv.NEXT_PUBLIC_WS_URL;
	}

	// development
	return `${wsProtocol}//${hostname}:${clientEnv.NEXT_PUBLIC_WS_PORT}`;
};

export const getWsUrl = (roomId: string, userName: string) => {
	const base = getWsBaseUrl();
	const params = new URLSearchParams({ roomId, userName });
	return `${base}/?${params.toString()}`;
};
