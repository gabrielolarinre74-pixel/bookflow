import { describe, expect, it } from "vitest";
import { generateSampleBookings } from "../seed";
import { dashboardStats } from "../stats";
import { at, booking } from "./helpers";

// Wednesday 18 March 2026, 12:00
const now = at(2026, 3, 18, 12, 0);

describe("dashboardStats", () => {
	it("counts today's bookings and revenue for the calendar week (Sun–Sat)", () => {
		const list = [
			booking(at(2026, 3, 18, 9, 0), 60, { price: 40, status: "completed" }),
			booking(at(2026, 3, 18, 15, 0), 60, { price: 60 }),
			booking(at(2026, 3, 18, 16, 0), 60, { price: 99, status: "cancelled" }),
			booking(at(2026, 3, 15, 10, 0), 60, { price: 25, status: "completed" }), // Sunday, same week
			booking(at(2026, 3, 22, 10, 0), 60, { price: 500 }), // next Sunday
		];
		const s = dashboardStats(list, now);
		expect(s.todayCount).toBe(2);
		expect(s.todayRemaining).toBe(1);
		expect(s.weekCount).toBe(3);
		expect(s.weekRevenue).toBe(125);
	});

	it("computes no-show rate and online share over the last 30 days", () => {
		const list = [
			booking(at(2026, 3, 10, 10, 0), 60, { status: "completed", source: "online" }),
			booking(at(2026, 3, 11, 10, 0), 60, { status: "completed", source: "staff" }),
			booking(at(2026, 3, 12, 10, 0), 60, { status: "completed", source: "online" }),
			booking(at(2026, 3, 13, 10, 0), 60, { status: "no-show", source: "online" }),
			booking(at(2026, 1, 1, 10, 0), 60, { status: "no-show", source: "online" }), // too old
		];
		const s = dashboardStats(list, now);
		expect(s.noShowRate).toBe(0.25);
		expect(s.onlineShare).toBe(0.75);
	});

	it("handles an empty calendar", () => {
		const s = dashboardStats([], now);
		expect(s).toMatchObject({ todayCount: 0, weekRevenue: 0, onlineShare: 0, noShowRate: 0, upcoming: [] });
	});

	it("lists the next five confirmed bookings in order", () => {
		const s = dashboardStats(generateSampleBookings(now), now);
		expect(s.upcoming.length).toBeLessThanOrEqual(5);
		const starts = s.upcoming.map((b) => new Date(b.startDate).getTime());
		expect(starts).toEqual([...starts].sort((a, b) => a - b));
		expect(starts.every((t) => t > now.getTime())).toBe(true);
	});
});

describe("generateSampleBookings", () => {
	it("is deterministic and never double-books a staff member", () => {
		const a = generateSampleBookings(now);
		const b = generateSampleBookings(now);
		expect(a).toEqual(b);
		const active = a.filter((x) => x.status !== "cancelled");
		for (const x of active) {
			const clash = active.find(
				(y) => y !== x && y.user.id === x.user.id && new Date(y.startDate) < new Date(x.endDate) && new Date(x.startDate) < new Date(y.endDate),
			);
			expect(clash, `${x.title} ${x.startDate}`).toBeUndefined();
		}
		expect(a.every((x) => !x.customer || x.customer.email.endsWith("@example.com"))).toBe(true);
	});
});
