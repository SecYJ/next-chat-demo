import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, ...props }, ref) => (
		<button
			ref={ref}
			className={cn(
				"inline-flex h-11 items-center justify-center rounded-lg bg-sky-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-sky-500 dark:hover:bg-sky-400",
				className,
			)}
			{...props}
		/>
	),
);
Button.displayName = "Button";

export { Button };
