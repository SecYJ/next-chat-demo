"use client";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SOCKET_STATUS } from "@/constants/socket-status";
import { Message, normalizeMessage, serverHistoryEntrySchema } from "@/utils/normalize-message";
import { FormEvent, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import FooterButton from "./_form/footer-button";
import { formControl } from "./_form/form-control";
import FormInput from "./_form/form-input";
import HeaderButton from "./_form/header-button";
import MessageArea from "./_message-area";
import { useWebSocket } from "./_use-websocket";

const DemoPage = () => {
	const form = useForm({
		formControl,
	});

	const [roomId, setRoomId] = useState<string | null>(null);
	const [userName, setUserName] = useState<string | null>(null);
	// const [connectionToken, setConnectionToken] = useState(0);
	const ws = useWebSocket({ roomId, userName, token: 0 });
	const [messages, setMessages] = useState<Message[]>([]);
	const [connectionStatus, setConnectionStatus] = useState("Enter room info");
	const [serverError, setServerError] = useState<string | null>(null);

	useEffect(() => {
		if (!ws) {
			setConnectionStatus(roomId && userName ? "Connecting" : "Enter room info");
			return;
		}

		const updateStatus = () => {
			setConnectionStatus(SOCKET_STATUS[ws.readyState] ?? "Connecting");
		};

		updateStatus();

		const handleMessage = (event: MessageEvent) => {
			const raw = z.string().safeParse(event.data);

			const schema = z.object({
				type: z.enum(["joined", "history", "message", "error"]),
				payload: serverHistoryEntrySchema.optional(),
				messages: serverHistoryEntrySchema.array().optional(),
				message: z.string().optional(),
				code: z.number().optional(),
			});

			if (!raw.success) {
				console.error("Failed to parse message", raw.error);
				setServerError("Received malformed data from server.");
				return;
			}

			const result = schema.safeParse(JSON.parse(raw.data));

			if (!result.success) return;

			if (result.data.type === "joined") {
				setServerError(null);
				setConnectionStatus("Connected");
				return;
			}

			if (result.data.type === "history") {
				const historyMessages = result.data.messages?.map(normalizeMessage) ?? [];
				setMessages(historyMessages);
				setServerError(null);
				setConnectionStatus("Connected");
				return;
			}

			if (result.data.type === "message" && result.data.payload) {
				const incoming = normalizeMessage(result.data.payload);
				setMessages((prev) => {
					const alreadyExists = prev.some((message) => message.id === incoming.id);
					if (alreadyExists) {
						return prev.map((message) => (message.id === incoming.id ? incoming : message));
					}
					return [...prev, incoming];
				});
				return;
			}

			if (result.data.type === "error") {
				const errorMessage = z
					.string()
					.trim()
					.min(1)
					.catch("Server reported an error.")
					.parse(result.data.message);
				setServerError(errorMessage);
				setConnectionStatus("Error");

				return;
			}
		};

		const handleOpen = () => {
			setServerError(null);
			updateStatus();
		};

		const handleClose = (event: CloseEvent) => {
			if (event.code === 400) {
				setServerError("Connection rejected: verify room ID and username.");
				setConnectionStatus("Error");

				return;
			}

			updateStatus();
		};

		const handleError = () => {
			setServerError("Connection error: see console for details.");
			setConnectionStatus("Error");
		};

		const abortController = new AbortController();

		ws.addEventListener("message", handleMessage, { signal: abortController.signal });
		ws.addEventListener("open", handleOpen, { signal: abortController.signal });
		ws.addEventListener("close", handleClose, { signal: abortController.signal });
		ws.addEventListener("error", handleError, { signal: abortController.signal });

		return () => abortController.abort();
	}, [ws, roomId, userName]);

	const handleJoinSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const nextRoom = form.getValues("room").trim();
		const nextUserName = form.getValues("username").trim();
		if (!nextRoom || !nextUserName) {
			setServerError("Both room ID and username are required.");
			setConnectionStatus("Enter room info");
			return;
		}

		const currentRoom = roomId ?? "";
		const currentUser = userName ?? "";

		if (nextRoom === currentRoom && nextUserName === currentUser) {
			return;
		}

		setServerError(null);
		setRoomId(nextRoom);
		setUserName(nextUserName);
		// setConnectionToken((token) => token + 1);
		setConnectionStatus("Connecting");
		setMessages([]);
	};

	const hasSession = Boolean(roomId && userName);
	const isSocketReady = ws?.readyState === WebSocket.OPEN;

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const parsedPayload = z.string().trim().min(1).safeParse(form.getValues("message"));
		if (!parsedPayload.success || !isSocketReady) {
			if (!hasSession) {
				setServerError("Join a room before sending messages.");
			}
			return;
		}

		ws?.send(JSON.stringify({ type: "chat", text: parsedPayload.data }));
		form.resetField("message");
	};

	const statusVariant: BadgeProps["variant"] =
		connectionStatus === "Connected" ? "default" : connectionStatus === "Error" ? "outline" : "secondary";

	return (
		<div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center bg-gradient-to-b from-white via-white to-slate-100 px-4 py-10 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900">
			<Card className="w-full max-w-2xl">
				<CardHeader className="mb-4 flex flex-row items-start justify-between gap-4">
					<div>
						<CardTitle>WebSocket Chat</CardTitle>
						<p className="text-sm text-neutral-500 dark:text-neutral-400">
							Send a message to your server to see real-time updates.
						</p>
						<p className="text-xs text-neutral-400 dark:text-neutral-500">
							Active room: {roomId ?? "None"} | User: {userName ?? "None"}
						</p>
					</div>
					<Badge variant={statusVariant}>{connectionStatus}</Badge>
				</CardHeader>
				<CardContent className="flex flex-col gap-3">
					<form onSubmit={handleJoinSubmit} className="flex flex-col gap-3 sm:flex-row">
						<FormInput control={form.control} name="room" placeholder="Enter a room ID..." />
						<FormInput control={form.control} name="username" placeholder="Enter your username..." />
						<HeaderButton>Join chat</HeaderButton>
					</form>

					{serverError && <p className="text-xs text-red-600 dark:text-red-400">{serverError}</p>}

					<ScrollArea className="h-80 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
						<MessageArea messages={messages} hasSession={hasSession} currentUser={userName} />
					</ScrollArea>

					{hasSession && !isSocketReady && (
						<p className="text-xs text-neutral-500 dark:text-neutral-400">
							Waiting for the socket to connect before sending messages.
						</p>
					)}
				</CardContent>
				<CardFooter>
					<form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
						<FormInput
							control={form.control}
							name="message"
							placeholder={hasSession ? "Type a message..." : "Join a room to chat"}
							disabled={!hasSession}
						/>
						<FooterButton disabled={!isSocketReady}>Send</FooterButton>
					</form>
				</CardFooter>
			</Card>
		</div>
	);
};

export default DemoPage;
