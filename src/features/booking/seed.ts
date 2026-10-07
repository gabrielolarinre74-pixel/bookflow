import type { IEvent } from "@/features/calendar/interfaces";
import { getAvailableSlots } from "./availability";
import type { BusinessSettings, Service, StaffMember, WeeklyHours } from "./types";

export const DEFAULT_SERVICES: Service[] = [
	{ id: "svc-consult", name: "Free discovery call", description: "20-minute call to understand your goals.", durationMin: 20, bufferMin: 10, price: 0, color: "blue" },
	{ id: "svc-cut", name: "Haircut & style", description: "Wash, cut and finish.", durationMin: 45, bufferMin: 15, price: 35, color: "purple" },
	{ id: "svc-color", name: "Colour treatment", description: "Full colour with toner and blow-dry.", durationMin: 120, bufferMin: 15, price: 95, color: "orange" },
	{ id: "svc-facial", name: "Signature facial", description: "Cleanse, exfoliate, mask and massage.", durationMin: 60, bufferMin: 15, price: 60, color: "green" },
	{ id: "svc-massage", name: "Deep tissue massage", description: "Targeted pressure for tension relief.", durationMin: 90, bufferMin: 15, price: 80, color: "red" },
	{ id: "svc-nails", name: "Gel manicure", description: "Shape, cuticle care and gel colour.", durationMin: 50, bufferMin: 10, price: 30, color: "yellow" },
];

export const DEFAULT_STAFF: StaffMember[] = [
	{ id: "st-amara", name: "Amara Cole", role: "Senior stylist", picturePath: null, serviceIds: ["svc-consult", "svc-cut", "svc-color"] },
	{ id: "st-leo", name: "Leo Park", role: "Stylist", picturePath: null, serviceIds: ["svc-cut", "svc-color", "svc-nails"] },
	{ id: "st-nina", name: "Nina Patel", role: "Therapist", picturePath: null, serviceIds: ["svc-facial", "svc-massage", "svc-consult"] },
	{ id: "st-sam", name: "Sam Rivera", role: "Nail technician", picturePath: null, serviceIds: ["svc-nails", "svc-facial"] },
];

export const DEFAULT_HOURS: WeeklyHours = [
	null,
	{ open: "09:00", close: "18:00" },
	{ open: "09:00", close: "18:00" },
	{ open: "09:00", close: "20:00" },
	{ open: "09:00", close: "20:00" },
	{ open: "09:00", close: "18:00" },
	{ open: "10:00", close: "16:00" },
];

export const DEFAULT_SETTINGS: BusinessSettings = {
	businessName: "Lumen Studio",
	currency: "USD",
	timeZoneLabel: "Local time",
	slotStepMin: 15,
	minNoticeHours: 2,
	maxDaysAhead: 30,
	reminderHoursBefore: [24, 2],
	reminderTemplate:
		"Hi {name}, this is a reminder of your {service} with {staff} at {business} on {date} at {time}. Reply here if you need to reschedule. See you soon!",
};

const FIRST = ["Maya", "Daniel", "Chloe", "Omar", "Grace", "Lucas", "Zara", "Ethan", "Ivy", "Noah", "Leah", "Kai", "Ruby", "Adam", "Sofia", "Jonah"];
const LAST = ["Brooks", "Hayes", "Reed", "Ali", "Kim", "Ward", "Stone", "Lane", "Cruz", "Fox", "Bell", "Shaw", "Moss", "Grant"];

/** Small deterministic PRNG so the demo looks the same on every visit. */
function rng(seed: number) {
	let s = seed;
	return () => {
		s = (s * 1664525 + 1013904223) % 4294967296;
		return s / 4294967296;
	};
}

/**
 * Fills the calendar with realistic, non-overlapping sample appointments from
 * 10 days ago to 14 days ahead, using the same availability engine customers use.
 * Customer names are randomly generated, not real people.
 */
export function generateSampleBookings(now = new Date()): IEvent[] {
	const rand = rng(42);
	const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
	const bookings: IEvent[] = [];
	let id = 1;
	for (let offset = -10; offset <= 14; offset++) {
		const day = new Date(now);
		day.setDate(now.getDate() + offset);
		day.setHours(0, 0, 0, 0);
		const target = DEFAULT_HOURS[day.getDay()] ? 3 + Math.floor(rand() * 5) : 0;
		for (let i = 0; i < target; i++) {
			const service = pick(DEFAULT_SERVICES.slice(1));
			const slots = getAvailableSlots({
				date: day,
				service,
				staffId: "any",
				staff: DEFAULT_STAFF,
				hours: DEFAULT_HOURS,
				bookings,
				now: new Date(0),
				stepMin: 30,
			});
			if (slots.length === 0) continue;
			const slot = pick(slots);
			const staff = DEFAULT_STAFF.find((s) => s.id === slot.staffId)!;
			const first = pick(FIRST);
			const last = pick(LAST);
			const past = slot.end.getTime() < now.getTime();
			bookings.push({
				id: id++,
				title: service.name,
				description: service.description,
				startDate: slot.start.toISOString(),
				endDate: slot.end.toISOString(),
				color: service.color,
				user: { id: staff.id, name: staff.name, picturePath: null },
				serviceId: service.id,
				customer: {
					name: `${first} ${last}`,
					email: `${first}.${last}@example.com`.toLowerCase(),
					phone: `+1 555 01${String(Math.floor(rand() * 100)).padStart(2, "0")}`,
				},
				status: past ? (rand() < 0.08 ? "no-show" : "completed") : "confirmed",
				price: service.price,
				bufferMin: service.bufferMin,
				source: rand() < 0.65 ? "online" : "staff",
			});
		}
	}
	return bookings;
}
