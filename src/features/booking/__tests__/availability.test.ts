import { describe, expect, it } from "vitest";
import { getAvailableSlots, hasConflict, parseHHMM } from "../availability";
import type { Service, StaffMember, WeeklyHours } from "../types";
import { at, booking } from "./helpers";

const service: Service = { id: "cut", name: "Haircut", description: "", durationMin: 60, bufferMin: 15, price: 35, color: "teal" };
const staff: StaffMember[] = [
	{ id: "amara", name: "Amara Cole", role: "Stylist", picturePath: null, serviceIds: ["cut"] },
	{ id: "nina", name: "Nina Patel", role: "Stylist", picturePath: null, serviceIds: ["cut"] },
	{ id: "leo", name: "Leo Park", role: "Therapist", picturePath: null, serviceIds: ["massage"] },
];
// Monday 09:00–12:00 only
const hours: WeeklyHours = [null, { open: "09:00", close: "12:00" }, null, null, null, null, null];
const monday = at(2026, 3, 16);
const before = at(2026, 3, 1);
const times = (slots: { start: Date }[]) => slots.map((s) => s.start.toTimeString().slice(0, 5));

describe("parseHHMM", () => {
	it("parses valid times", () => {
		expect(parseHHMM("09:30")).toBe(570);
		expect(parseHHMM("0:05")).toBe(5);
	});
	it("rejects invalid input", () => {
		expect(() => parseHHMM("9.30")).toThrow();
		expect(() => parseHHMM("25:00")).toThrow();
		expect(() => parseHHMM("10:75")).toThrow();
	});
});

describe("getAvailableSlots", () => {
	it("returns nothing on a closed day", () => {
		expect(getAvailableSlots({ date: at(2026, 3, 15), service, staffId: "any", staff, hours, bookings: [], now: before })).toEqual([]);
	});

	it("only offers slots where the service and its buffer fit before closing", () => {
		const slots = getAvailableSlots({ date: monday, service, staffId: "amara", staff, hours, bookings: [], now: before, stepMin: 30 });
		// 75 minutes needed, closing 12:00 → last start 10:45, on a 30 min grid → 10:30
		expect(times(slots)).toEqual(["09:00", "09:30", "10:00", "10:30"]);
		expect(slots[0].end.getTime() - slots[0].start.getTime()).toBe(60 * 60_000);
	});

	it("blocks times that overlap an existing booking and its buffer", () => {
		const existing = booking(at(2026, 3, 16, 10, 0), 30, { bufferMin: 30 }); // busy 10:00–11:00
		const slots = getAvailableSlots({ date: monday, service, staffId: "amara", staff, hours, bookings: [existing], now: before, stepMin: 30 });
		// 09:00 slot needs until 10:15 → clash. Nothing fits before 12:00 after 11:00 either (11:00 + 75 > 12:00)
		expect(times(slots)).toEqual([]);
	});

	it("ignores cancelled bookings", () => {
		const cancelled = booking(at(2026, 3, 16, 9, 0), 180, { status: "cancelled" });
		const slots = getAvailableSlots({ date: monday, service, staffId: "amara", staff, hours, bookings: [cancelled], now: before, stepMin: 30 });
		expect(slots).toHaveLength(4);
	});

	it("with 'any' staff, assigns the slot to someone who is free", () => {
		const amaraBusy = booking(at(2026, 3, 16, 9, 0), 180);
		const slots = getAvailableSlots({ date: monday, service, staffId: "any", staff, hours, bookings: [amaraBusy], now: before, stepMin: 30 });
		expect(slots).toHaveLength(4);
		expect(slots.every((s) => s.staffId === "nina")).toBe(true);
	});

	it("never offers staff who do not provide the service", () => {
		const slots = getAvailableSlots({ date: monday, service, staffId: "leo", staff, hours, bookings: [], now: before });
		expect(slots).toEqual([]);
	});

	it("respects the minimum notice period", () => {
		const now = at(2026, 3, 16, 8, 0);
		const slots = getAvailableSlots({ date: monday, service, staffId: "amara", staff, hours, bookings: [], now, stepMin: 30, minNoticeHours: 2 });
		expect(times(slots)).toEqual(["10:00", "10:30"]);
	});
});

describe("hasConflict", () => {
	const existing = booking(at(2026, 3, 16, 10, 0), 60);
	it("detects overlap for the same staff member", () => {
		expect(hasConflict({ staffId: "amara", start: at(2026, 3, 16, 10, 30), end: at(2026, 3, 16, 11, 30) }, [existing])).toBe(true);
	});
	it("allows back-to-back bookings and other staff", () => {
		expect(hasConflict({ staffId: "amara", start: at(2026, 3, 16, 11, 0), end: at(2026, 3, 16, 12, 0) }, [existing])).toBe(false);
		expect(hasConflict({ staffId: "nina", start: at(2026, 3, 16, 10, 0), end: at(2026, 3, 16, 11, 0) }, [existing])).toBe(false);
	});
	it("ignores the booking being edited", () => {
		expect(hasConflict({ id: existing.id, staffId: "amara", start: at(2026, 3, 16, 10, 15), end: at(2026, 3, 16, 11, 15) }, [existing])).toBe(false);
	});
});
