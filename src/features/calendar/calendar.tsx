"use client";

import { CalendarBody } from "@/features/calendar/calendar-body";
import { CalendarProvider } from "@/features/calendar/contexts/calendar-context";
import { DndProvider } from "@/features/calendar/contexts/dnd-context";
import { CalendarHeader } from "@/features/calendar/header/calendar-header";

export function Calendar() {
	return (
		<CalendarProvider view="week">
			<DndProvider>
				<div className="w-full overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-card)]">
					<CalendarHeader />
					<CalendarBody />
				</div>
			</DndProvider>
		</CalendarProvider>
	);
}
