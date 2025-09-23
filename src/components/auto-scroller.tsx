import { ReactNode, useEffect, useRef } from "react";

interface Props {
	children: ReactNode;
	className?: string;
}

const AutoScroller = ({ children, className }: Props) => {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const mutationObserver = new MutationObserver(() => {
			if (ref.current) {
				ref.current.scrollTo({
					behavior: "smooth",
					top: ref.current.scrollHeight,
				});
			}
		});

		if (ref.current) {
			mutationObserver.observe(ref.current, {
				childList: true,
				subtree: true,
			});
		}
	}, [ref.current]);

	return (
		<div ref={ref} className={className}>
			{children}
		</div>
	);
};

export default AutoScroller;
