import type { TEventColor } from "@/features/calendar/types";

export interface Service {
	id: string;
	name: string;
	description: string;
	durationMin: number;
	/** Minutes kept free after the appointment (clean-up, travel, notes). */
	bufferMin: number;
	price: number;
	color: TEventColor;
}

export interface StaffMember {
	id: string;
	name: string;
	role: string;
	picturePath: string | null;
	serviceIds: string[];
}

export interface DayHours {
	open: string; // "09:00"
	close: string; // "18:00"
}

/** Index 0 = Sunday … 6 = Saturday. `null` means closed. */
export type WeeklyHours = (DayHours | null)[];

export type BookingStatus = "confirmed" | "completed" | "no-show" | "cancelled";

export interface Customer {
	name: string;
	email: string;
	phone: string;
}

export interface BusinessSettings {
	businessName: string;
	currency: string;
	timeZoneLabel: string;
	slotStepMin: number;
	minNoticeHours: number;
	maxDaysAhead: number;
	reminderHoursBefore: number[];
	reminderTemplate: string;
}

export interface Slot {
	start: Date;
	end: Date;
	staffId: string;
}
