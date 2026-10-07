import type { TEventColor } from "@/features/calendar/types";

export const COLORS: TEventColor[] = ["blue", "green", "red", "yellow", "teal", "orange"];

/**
 * Static class names so Tailwind can see them at build time
 * (template strings like `bg-${color}-600` are never generated).
 */
export const COLOR_DOT: Record<TEventColor, string> = {
	blue: "bg-blue-600 dark:bg-blue-500",
	green: "bg-green-600 dark:bg-green-500",
	red: "bg-red-600 dark:bg-red-500",
	yellow: "bg-yellow-500 dark:bg-yellow-400",
	teal: "bg-teal-600 dark:bg-teal-500",
	orange: "bg-orange-600 dark:bg-orange-500",
};
