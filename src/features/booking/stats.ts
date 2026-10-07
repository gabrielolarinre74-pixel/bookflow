import type { IEvent } from "@/features/calendar/interfaces";

const DAY = 86_400_000;

const startOfDay = (d: Date) => {
	const x = new Date(d);
	x.setHours(0, 0, 0, 0);
	return x;
};

/** Sunday-based week start, matching the calendar's week view */
const startOfWeek = (d: Date) => {
	const x = startOfDay(d);
	x.setDate(x.getDate() - x.getDay());
	return x;
};

export function dashboardStats(bookings: IEvent[], now = new Date()) {
	const active = bookings.filter((b) => b.status !== "cancelled");
	const today0 = startOfDay(now).getTime();
	const week0 = startOfWeek(now).getTime();
	const t = (b: IEvent) => new Date(b.startDate).getTime();

	const today = active.filter((b) => t(b) >= today0 && t(b) < today0 + DAY);
	const week = active.filter((b) => t(b) >= week0 && t(b) < week0 + 7 * DAY);
	const last30 = bookings.filter((b) => t(b) >= now.getTime() - 30 * DAY && t(b) <= now.getTime());
	const finished = last30.filter((b) => b.status === "completed" || b.status === "no-show");
	const noShows = finished.filter((b) => b.status === "no-show").length;
	const online = last30.filter((b) => b.source === "online").length;

	return {
		todayCount: today.length,
		todayRemaining: today.filter((b) => t(b) > now.getTime()).length,
		weekRevenue: week.reduce((sum, b) => sum + (b.price ?? 0), 0),
		weekCount: week.length,
		onlineShare: last30.length ? online / last30.length : 0,
		noShowRate: finished.length ? noShows / finished.length : 0,
		upcoming: active
			.filter((b) => t(b) > now.getTime() && b.status === "confirmed")
			.sort((a, b) => t(a) - t(b))
			.slice(0, 5),
	};
}
