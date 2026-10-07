import { describe, expect, it } from "vitest";
import { buildIcs, escapeIcs, googleCalendarUrl, toIcsDate } from "../ics";

const ev = {
	uid: "bookflow-1@bookflow.app",
	title: "Haircut, style; finish",
	description: "Line one\nLine two",
	start: new Date(Date.UTC(2026, 2, 16, 9, 30)),
	end: new Date(Date.UTC(2026, 2, 16, 10, 15)),
	location: "Lumen Studio",
};

describe("ics", () => {
	it("formats UTC timestamps", () => {
		expect(toIcsDate(ev.start)).toBe("20260316T093000Z");
	});

	it("escapes special characters", () => {
		expect(escapeIcs("a,b;c\\d\ne")).toBe("a\\,b\\;c\\\\d\\ne");
	});

	it("builds a valid calendar file with CRLF line endings and an alarm", () => {
		const ics = buildIcs(ev, new Date(Date.UTC(2026, 0, 1)));
		const lines = ics.split("\r\n");
		expect(lines[0]).toBe("BEGIN:VCALENDAR");
		expect(lines).toContain("DTSTART:20260316T093000Z");
		expect(lines).toContain("DTEND:20260316T101500Z");
		expect(lines).toContain("SUMMARY:Haircut\\, style\\; finish");
		expect(lines).toContain("DESCRIPTION:Line one\\nLine two");
		expect(lines).toContain("BEGIN:VALARM");
		expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
	});

	it("builds a Google Calendar link", () => {
		const url = new URL(googleCalendarUrl(ev));
		expect(url.hostname).toBe("calendar.google.com");
		expect(url.searchParams.get("dates")).toBe("20260316T093000Z/20260316T101500Z");
		expect(url.searchParams.get("text")).toBe(ev.title);
		expect(url.searchParams.get("location")).toBe("Lumen Studio");
	});
});
