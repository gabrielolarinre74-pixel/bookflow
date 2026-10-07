import type { IEvent } from "@/features/calendar/interfaces";
import type { Service, Slot, StaffMember, WeeklyHours } from "./types";

const MIN = 60_000;

export function parseHHMM(value: string): number {
	const m = /^(\d{1,2}):(\d{2})$/.exec(value);
	if (!m) throw new Error(`Invalid time "${value}"`);
	const h = Number(m[1]);
	const min = Number(m[2]);
	if (h > 24 || min > 59) throw new Error(`Invalid time "${value}"`);
	return h * 60 + min;
}

const atMinutes = (day: Date, minutes: number) => {
	const d = new Date(day);
	d.setHours(0, 0, 0, 0);
	d.setMinutes(minutes);
	return d;
};

const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) => aStart < bEnd && bStart < aEnd;

export interface SlotQuery {
	date: Date;
	service: Service;
	/** A specific staff member, or "any" to merge everyone who offers the service. */
	staffId: string | "any";
	staff: StaffMember[];
	hours: WeeklyHours;
	bookings: IEvent[];
	now?: Date;
	stepMin?: number;
	minNoticeHours?: number;
}

/**
 * Returns bookable start times for one day.
 *
 * Rules: inside opening hours, the appointment *and* its buffer must fit before
 * closing, no overlap with that staff member's existing (non-cancelled)
 * bookings plus their buffers, and nothing earlier than the minimum notice.
 * With staffId "any", each time is offered once, assigned to the first free
 * staff member.
 */
export function getAvailableSlots(q: SlotQuery): Slot[] {
	const { date, service, hours, bookings, now = new Date(), stepMin = 15, minNoticeHours = 0 } = q;
	const day = hours[date.getDay()];
	if (!day) return [];

	const candidates = q.staff.filter(
		(s) => s.serviceIds.includes(service.id) && (q.staffId === "any" || s.id === q.staffId),
	);
	if (candidates.length === 0) return [];

	const open = parseHHMM(day.open);
	const close = parseHHMM(day.close);
	const earliest = now.getTime() + minNoticeHours * 60 * MIN;
	const busyByStaff = new Map<string, [number, number][]>();
	for (const b of bookings) {
		if (b.status === "cancelled") continue;
		const list = busyByStaff.get(b.user.id) ?? [];
		list.push([new Date(b.startDate).getTime(), new Date(b.endDate).getTime() + (b.bufferMin ?? 0) * MIN]);
		busyByStaff.set(b.user.id, list);
	}

	const slots: Slot[] = [];
	for (let m = open; m + service.durationMin + service.bufferMin <= close; m += stepMin) {
		const start = atMinutes(date, m);
		const s = start.getTime();
		if (s < earliest) continue;
		const e = s + service.durationMin * MIN;
		const eWithBuffer = e + service.bufferMin * MIN;
		const free = candidates.find((st) =>
			(busyByStaff.get(st.id) ?? []).every(([bs, be]) => !overlaps(s, eWithBuffer, bs, be)),
		);
		if (free) slots.push({ start, end: new Date(e), staffId: free.id });
	}
	return slots;
}

/** True when a proposed booking would clash with another one for the same staff member. */
export function hasConflict(
	candidate: { id?: number; staffId: string; start: Date; end: Date },
	bookings: IEvent[],
): boolean {
	const s = candidate.start.getTime();
	const e = candidate.end.getTime();
	return bookings.some(
		(b) =>
			b.id !== candidate.id &&
			b.status !== "cancelled" &&
			b.user.id === candidate.staffId &&
			overlaps(s, e, new Date(b.startDate).getTime(), new Date(b.endDate).getTime()),
	);
}
