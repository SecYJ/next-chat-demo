"use client";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SOCKET_STATUS } from "@/constants/socket-status";
import { cn } from "@/lib/utils";
import { Message, normalizeMessage, serverHistoryEntrySchema } from "@/utils/normalize-message";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { useWebSocket } from "./_use-websocket";

const DemoPage = () => {
	const [roomInputValue, setRoomInputValue] = useState("");
	const [userNameInputValue, setUserNameInputValue] = useState("");
	const [roomId, setRoomId] = useState<string | null>(null);
	const [userName, setUserName] = useState<string | null>(null);
	const [connectionToken, setConnectionToken] = useState(0);
	const ws = useWebSocket({ roomId, userName, token: connectionToken });
        const [inputValue, setInputValue] = useState("");
	const [messages, setMessages] = useState<Message[]>([]);
	const [connectionStatus, setConnectionStatus] = useState("Enter room info");
	const [serverError, setServerError] = useState<string | null>(null);

	const socketRef = useRef<WebSocket | null>(null);
	const scrollAreaRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		setMessages([]);
		setServerError(null);
	}, [roomId, userName]);

	useEffect(() => {
		if (!ws) {
			socketRef.current = null;
			setConnectionStatus(roomId && userName ? "Connecting" : "Enter room info");
			return;
		}

		socketRef.current = ws;

		const updateStatus = () => {
			setConnectionStatus(SOCKET_STATUS[ws.readyState] ?? "Connecting");
		};

		updateStatus();

		const handleMessage = (event: MessageEvent) => {
			const raw = z.string().safeParse(event.data);

			const schema = z.object({
				type: z.literal(["joined", "history", "message", "error"]),
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
			socketRef.current = null;
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

	useEffect(() => {
		if (!scrollAreaRef.current) {
			return;
		}

		scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
	}, [messages]);

	const timeFormatter = useMemo(() => new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }), []);

	const handleJoinSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const nextRoom = roomInputValue.trim();
		const nextUserName = userNameInputValue.trim();
		if (!nextRoom || !nextUserName) {
			setServerError("Both room ID and username are required.");
			setConnectionStatus("Enter room info");
			return;
		}

		const currentRoom = roomId ?? "";
		const currentUser = userName ?? "";
		if (
			nextRoom === currentRoom &&
			nextUserName === currentUser &&
			socketRef.current?.readyState === WebSocket.OPEN
		) {
			return;
		}

		setServerError(null);
		setRoomId(nextRoom);
		setUserName(nextUserName);
		setRoomInputValue(nextRoom);
		setUserNameInputValue(nextUserName);
		setConnectionToken((token) => token + 1);
		setConnectionStatus("Connecting");
	};

	const hasSession = Boolean(roomId && userName);
	const isSocketReady = hasSession && socketRef.current?.readyState === WebSocket.OPEN;

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const parsedPayload = z.string().trim().min(1).safeParse(inputValue);
		if (!parsedPayload.success || !isSocketReady) {
			if (!hasSession) {
				setServerError("Join a room before sending messages.");
			}
			return;
		}

		socketRef.current?.send(JSON.stringify({ type: "chat", text: parsedPayload.data }));
		setInputValue("");
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
						<Input
							name="room"
							placeholder="Enter a room ID..."
							value={roomInputValue}
							onChange={(event) => setRoomInputValue(event.target.value)}
							autoComplete="off"
						/>
						<Input
							name="username"
							placeholder="Enter your username..."
							value={userNameInputValue}
							onChange={(event) => setUserNameInputValue(event.target.value)}
							autoComplete="off"
						/>
						<Button type="submit" disabled={!roomInputValue.trim() || !userNameInputValue.trim()}>
							Join chat
						</Button>
					</form>
					{serverError && <p className="text-xs text-red-600 dark:text-red-400">{serverError}</p>}
					<ScrollArea
						ref={scrollAreaRef}
						className="h-80 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/60"
					>
						{!hasSession ? (
							<div className="flex h-full items-center justify-center text-center text-sm text-neutral-500 dark:text-neutral-400">
								Provide a room ID and username to start chatting.
							</div>
						) : messages.length === 0 ? (
							<div className="flex h-full items-center justify-center text-center text-sm text-neutral-500 dark:text-neutral-400">
								No messages yet. Say hello to get the conversation started.
							</div>
						) : (
							<div className="flex flex-col gap-3">
								{messages.map((message) => {
									const isSelf = message.userName === (userName ?? "");
									const timestampLabel = timeFormatter.format(message.timestamp);
									return (
										<div
											key={message.id}
											className={cn("flex", isSelf ? "justify-end" : "justify-start")}
										>
											<div className="max-w-[75%] space-y-1">
												<div
													className={cn(
														"rounded-2xl px-4 py-2 text-sm shadow-sm",
														isSelf
															? "bg-sky-600 text-white dark:bg-sky-500"
															: "bg-white text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
													)}
												>
													<span className="block text-xs font-medium">
														{isSelf ? "You" : message.userName}
													</span>
													<span>{message.text}</span>
												</div>
												<span className="block text-xs text-neutral-400 dark:text-neutral-500">
													{timestampLabel}
												</span>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</ScrollArea>
					{hasSession && !isSocketReady && (
						<p className="text-xs text-neutral-500 dark:text-neutral-400">
							Waiting for the socket to connect before sending messages.
						</p>
					)}
				</CardContent>
				<CardFooter>
					<form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
						<Input
							name="message"
							placeholder={hasSession ? "Type a message..." : "Join a room to chat"}
							value={inputValue}
							onChange={(event) => setInputValue(event.target.value)}
							autoComplete="off"
							disabled={!hasSession}
						/>
						<Button type="submit" disabled={!inputValue.trim() || !isSocketReady}>
							Send
						</Button>
					</form>
				</CardFooter>
			</Card>
		</div>
	);
};

export default DemoPage;
