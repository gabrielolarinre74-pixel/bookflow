"use client";

import { PageHeader } from "@/components/site-nav";
import { Calendar } from "@/features/calendar/calendar";

export default function CalendarPage() {
	return (
		<>
			<PageHeader
				eyebrow="Team calendar"
				title="Calendar"
				description="Drag appointments to reschedule. BookFlow blocks moves that would double-book a team member."
			/>
			<Calendar />
		</>
	);
}
