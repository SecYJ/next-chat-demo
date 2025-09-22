import { z } from "zod";

export const serverHistoryEntrySchema = z.object({
	id: z.number().positive(),
	roomId: z.string(),
	userName: z.string(),
	text: z.string(),
	timestamp: z.union([z.number().positive(), z.string()]),
});

const messageSchema = z.object({
	id: z.number().positive(),
	userName: z.string().trim().min(1).catch("Unknown"),
	text: z.string().trim().min(1).catch(""),
	timestamp: z.number().int().positive().catch(Date.now()),
});

export const normalizeMessage = (entry: ServerHistoryEntry) => {
	const rawTimestamp = z.number().optional().catch(Date.now()).parse(entry.timestamp);

	return messageSchema.parse({ ...entry, timestamp: rawTimestamp });
};

export type ServerHistoryEntry = z.output<typeof serverHistoryEntrySchema>;
export type Message = z.output<typeof messageSchema>;
