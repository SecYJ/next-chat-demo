import { Message } from "@/utils/normalize-message";
import AutoScroller from "@/components/auto-scroller";

interface Props {
	messages: Message[];
	hasSession: boolean;
}

const MessageArea = ({ messages, hasSession }: Props) => {
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
				return <div key={message.id}>{message.text}</div>;
			})}
		</AutoScroller>
	);
};

export default MessageArea;
