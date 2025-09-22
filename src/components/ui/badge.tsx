import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "outline";

const badgeVariants: Record<BadgeVariant, string> = {
	default:
		"border-transparent bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900",
	secondary:
		"border-transparent bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100",
	outline:
		"border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-200",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
	variant?: BadgeVariant;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
	({ className, variant = "default", ...props }, ref) => (
		<span
			ref={ref}
			className={cn(
				"inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
				badgeVariants[variant],
				className,
			)}
			{...props}
		/>
	),
);
Badge.displayName = "Badge";

export { Badge };
