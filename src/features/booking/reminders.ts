import type { IEvent } from "@/features/calendar/interfaces";

export interface Reminder {
	key: string;
	booking: IEvent;
	hoursBefore: number;
	sendAt: Date;
	status: "due" | "scheduled" | "sent";
}

/** Builds the reminder queue: one reminder per configured offset for every upcoming, confirmed booking. */
export function buildReminderQueue(
	bookings: IEvent[],
	hoursBefore: number[],
	sentKeys: string[],
	now = new Date(),
	horizonHours = 72,
): Reminder[] {
	const sent = new Set(sentKeys);
	const out: Reminder[] = [];
	for (const b of bookings) {
		if (b.status !== "confirmed" || !b.customer) continue;
		const start = new Date(b.startDate).getTime();
		if (start <= now.getTime()) continue;
		for (const h of hoursBefore) {
			const sendAt = new Date(start - h * 3_600_000);
			if (sendAt.getTime() > now.getTime() + horizonHours * 3_600_000) continue;
			const key = `${b.id}:${h}`;
			out.push({
				key,
				booking: b,
				hoursBefore: h,
				sendAt,
				status: sent.has(key) ? "sent" : sendAt <= now ? "due" : "scheduled",
			});
		}
	}
	const order = { due: 0, scheduled: 1, sent: 2 };
	return out.sort((a, b) => order[a.status] - order[b.status] || a.sendAt.getTime() - b.sendAt.getTime());
}

/** Fills {name}, {service}, {date}, {time}, {staff} and {business} placeholders. */
export function renderTemplate(template: string, booking: IEvent, business: string, locale?: string): string {
	const start = new Date(booking.startDate);
	const values: Record<string, string> = {
		name: booking.customer?.name.split(" ")[0] ?? "there",
		service: booking.title,
		date: start.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" }),
		time: start.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }),
		staff: booking.user.name,
		business,
	};
	return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

/** wa.me click-to-chat link. Only digits are kept, so "+1 (555) 010-0200" becomes 15550100200. */
export function whatsappLink(phone: string, message: string): string | null {
	const digits = phone.replace(/\D/g, "");
	if (digits.length < 7 || digits.length > 15) return null;
	return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function mailtoLink(email: string, subject: string, body: string): string {
	return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
