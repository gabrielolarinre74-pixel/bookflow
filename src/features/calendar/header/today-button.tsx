import { Button } from "@/components/ui/button";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";

export function TodayButton() {
	const { setSelectedDate } = useCalendar();
	return (
		<Button variant="outline" size="sm" className="rounded-lg font-semibold" onClick={() => setSelectedDate(new Date())}>
			Today
		</Button>
	);
}
