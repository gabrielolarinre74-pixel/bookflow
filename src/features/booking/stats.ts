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

export interface TeamLoad {
	staffId: string;
	name: string;
	role: string;
	appointments: number;
	bookedMin: number;
	openMin: number;
	/** 0–1 share of today's opening hours that is booked */
	load: number;
}

/** How busy each team member is today, as a share of the business's opening hours. */
export function teamLoadToday(
	bookings: IEvent[],
	staff: { id: string; name: string; role: string }[],
	hours: ({ open: string; close: string } | null)[],
	now = new Date(),
): TeamLoad[] {
	const day = hours[now.getDay()];
	const toMin = (v: string) => {
		const [h, m] = v.split(":").map(Number);
		return h * 60 + m;
	};
	const openMin = day ? Math.max(0, toMin(day.close) - toMin(day.open)) : 0;
	const today0 = startOfDay(now).getTime();
	return staff.map((s) => {
		const mine = bookings.filter(
			(b) => b.user.id === s.id && b.status !== "cancelled" && new Date(b.startDate).getTime() >= today0 && new Date(b.startDate).getTime() < today0 + DAY,
		);
		const bookedMin = mine.reduce((sum, b) => sum + (new Date(b.endDate).getTime() - new Date(b.startDate).getTime()) / 60_000, 0);
		return {
			staffId: s.id,
			name: s.name,
			role: s.role,
			appointments: mine.length,
			bookedMin,
			openMin,
			load: openMin ? Math.min(1, bookedMin / openMin) : 0,
		};
	});
}
