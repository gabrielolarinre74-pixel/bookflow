import { memo } from "react";
import { cn } from "@/lib/utils";
import { useCalendar } from "../contexts/calendar-context";
import type { TCalendarView } from "../types";

const VIEWS: { label: string; value: TCalendarView }[] = [
	{ label: "Day", value: "day" },
	{ label: "Week", value: "week" },
	{ label: "Month", value: "month" },
	{ label: "Year", value: "year" },
	{ label: "Agenda", value: "agenda" },
];

/** Segmented control for switching calendar views. */
function Views() {
	const { view, setView } = useCalendar();
	return (
		<div role="tablist" aria-label="Calendar view" className="flex w-full rounded-lg bg-muted p-0.5 sm:w-auto">
			{VIEWS.map(({ label, value }) => (
				<button
					key={value}
					type="button"
					role="tab"
					aria-selected={view === value}
					onClick={() => setView(value)}
					className={cn(
						"flex-1 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all sm:flex-none",
						view === value ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "hover:text-foreground",
					)}
				>
					{label}
				</button>
			))}
		</div>
	);
}

export default memo(Views);
