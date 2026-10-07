const pad = (n: number) => String(n).padStart(2, "0");

/** Formats a date as an iCalendar UTC timestamp, e.g. 20260315T093000Z */
export function toIcsDate(d: Date): string {
	return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

/** Escapes text per RFC 5545 (backslash, semicolon, comma, new lines). */
export function escapeIcs(text: string): string {
	return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

export interface IcsEvent {
	uid: string;
	title: string;
	description: string;
	start: Date;
	end: Date;
	location?: string;
}

export function buildIcs(ev: IcsEvent, now = new Date()): string {
	const lines = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//BookFlow//Booking//EN",
		"CALSCALE:GREGORIAN",
		"METHOD:PUBLISH",
		"BEGIN:VEVENT",
		`UID:${ev.uid}`,
		`DTSTAMP:${toIcsDate(now)}`,
		`DTSTART:${toIcsDate(ev.start)}`,
		`DTEND:${toIcsDate(ev.end)}`,
		`SUMMARY:${escapeIcs(ev.title)}`,
		`DESCRIPTION:${escapeIcs(ev.description)}`,
		...(ev.location ? [`LOCATION:${escapeIcs(ev.location)}`] : []),
		"BEGIN:VALARM",
		"TRIGGER:-PT1H",
		"ACTION:DISPLAY",
		`DESCRIPTION:${escapeIcs(ev.title)}`,
		"END:VALARM",
		"END:VEVENT",
		"END:VCALENDAR",
	];
	return `${lines.join("\r\n")}\r\n`;
}

export function googleCalendarUrl(ev: IcsEvent): string {
	const params = new URLSearchParams({
		action: "TEMPLATE",
		text: ev.title,
		details: ev.description,
		dates: `${toIcsDate(ev.start)}/${toIcsDate(ev.end)}`,
		...(ev.location ? { location: ev.location } : {}),
	});
	return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadIcs(filename: string, ics: string) {
	const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}
