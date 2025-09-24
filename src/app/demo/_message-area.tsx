import { Message } from "@/utils/normalize-message";
import AutoScroller from "@/components/auto-scroller";

interface Props {
	messages: Message[];
	hasSession: boolean;
	currentUser?: string | null;
}

const MessageArea = ({ messages, hasSession, currentUser }: Props) => {
	if (!hasSession) {
		return (
			<div className="flex h-full items-center justify-center text-center text-sm text-neutral-500 dark:text-neutral-400">
				Provide a room ID and username to start chatting.
			</div>
		);
	}

	if (messages.length === 0) {
		return (
			<div className="flex h-full items-center justify-center text-center text-sm text-neutral-500 dark:text-neutral-400">
				No messages yet. Say hello to get the conversation started.
			</div>
		);
	}

	return (
		<AutoScroller className="flex flex-col gap-3">
			{messages.map((message) => {
				const isOwnMessage = currentUser != null && message.userName === currentUser;
				const displayName = isOwnMessage ? "You" : message.userName;

				return (
					<div key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
						<div
							className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm transition-colors ${
								isOwnMessage
									? "bg-blue-600 text-white"
									: "bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
							}`}
						>
							<p className={`text-xs font-medium ${isOwnMessage ? "text-white/80" : "text-neutral-500 dark:text-neutral-400"}`}>
								{displayName}
							</p>
							<p className="break-words whitespace-pre-wrap text-sm leading-relaxed">{message.text}</p>
						</div>
					</div>
				);
			})}
		</AutoScroller>
	);
};

export default MessageArea;
