import { ReactNode, useEffect, useRef } from "react";

interface Props {
	children: ReactNode;
	className?: string;
}

const AutoScroller = ({ children, className }: Props) => {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const target = ref.current;
		if (!target) {
			return;
		}

		const mutationObserver = new MutationObserver(() => {
			target.scrollTo({
				behavior: "smooth",
				top: target.scrollHeight,
			});
		});

		mutationObserver.observe(target, {
			childList: true,
			subtree: true,
		});

		return () => {
			mutationObserver.disconnect();
		};
	}, []);

	return (
		<div ref={ref} className={className}>
			{children}
		</div>
	);
};

export default AutoScroller;
