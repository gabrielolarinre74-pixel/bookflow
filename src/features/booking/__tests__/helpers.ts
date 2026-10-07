import type { IEvent } from "@/features/calendar/interfaces";

let id = 1;
export function booking(start: Date, minutes: number, overrides: Partial<IEvent> = {}): IEvent {
	return {
		id: id++,
		title: "Haircut & style",
		description: "",
		startDate: start.toISOString(),
		endDate: new Date(start.getTime() + minutes * 60_000).toISOString(),
		color: "teal",
		user: { id: "amara", name: "Amara Cole", picturePath: null },
		customer: { name: "Maya Brooks", email: "maya@example.com", phone: "+1 555 0100" },
		status: "confirmed",
		price: 35,
		bufferMin: 0,
		source: "online",
		...overrides,
	};
}

/** A local-time date, e.g. at(2026, 3, 16, 9, 30) = Monday 16 March 2026 09:30 */
export const at = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min);
