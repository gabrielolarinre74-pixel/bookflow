import { describe, expect, it } from "vitest";
import { buildReminderQueue, mailtoLink, renderTemplate, whatsappLink } from "../reminders";
import { at, booking } from "./helpers";

const now = at(2026, 3, 16, 12, 0);

describe("buildReminderQueue", () => {
	const tomorrow = booking(at(2026, 3, 17, 10, 0), 60); // 22h away
	const inThreeHours = booking(at(2026, 3, 16, 15, 0), 60);
	const farAway = booking(at(2026, 3, 30, 10, 0), 60);
	const past = booking(at(2026, 3, 15, 10, 0), 60);
	const cancelled = booking(at(2026, 3, 17, 11, 0), 60, { status: "cancelled" });

	it("creates one reminder per offset for upcoming confirmed bookings inside the horizon", () => {
		const q = buildReminderQueue([tomorrow, inThreeHours, farAway, past, cancelled], [24, 2], [], now);
		const keys = q.map((r) => r.key).sort();
		expect(keys).toEqual([`${inThreeHours.id}:2`, `${inThreeHours.id}:24`, `${tomorrow.id}:2`, `${tomorrow.id}:24`].sort());
	});

	it("marks reminders as due, scheduled or sent and sorts due first", () => {
		const q = buildReminderQueue([tomorrow, inThreeHours], [24, 2], [`${inThreeHours.id}:24`], now);
		expect(q[0].status).toBe("due");
		const byKey = Object.fromEntries(q.map((r) => [r.key, r.status]));
		expect(byKey[`${tomorrow.id}:24`]).toBe("due");
		expect(byKey[`${tomorrow.id}:2`]).toBe("scheduled");
		expect(byKey[`${inThreeHours.id}:24`]).toBe("sent");
		expect(byKey[`${inThreeHours.id}:2`]).toBe("scheduled");
		expect(q.at(-1)?.status).toBe("sent");
	});
});

describe("renderTemplate", () => {
	it("fills placeholders and leaves unknown ones untouched", () => {
		const b = booking(at(2026, 3, 17, 10, 0), 60);
		const text = renderTemplate("Hi {name}, {service} with {staff} at {business}. {unknown}", b, "Lumen Studio", "en-US");
		expect(text).toBe("Hi Maya, Haircut & style with Amara Cole at Lumen Studio. {unknown}");
	});

	it("includes the date and time", () => {
		const b = booking(at(2026, 3, 17, 10, 0), 60);
		expect(renderTemplate("{date} {time}", b, "x", "en-US")).toMatch(/Tuesday, March 17 10:00 AM/);
	});
});

describe("links", () => {
	it("normalises phone numbers for WhatsApp", () => {
		expect(whatsappLink("+1 (555) 010-0200", "Hi there")).toBe("https://wa.me/15550100200?text=Hi%20there");
	});
	it("rejects numbers that are too short or too long", () => {
		expect(whatsappLink("12345", "x")).toBeNull();
		expect(whatsappLink("1234567890123456", "x")).toBeNull();
	});
	it("encodes mailto links", () => {
		expect(mailtoLink("a@example.com", "Your visit", "See you & thanks")).toBe(
			"mailto:a%40example.com?subject=Your%20visit&body=See%20you%20%26%20thanks",
		);
	});
});
