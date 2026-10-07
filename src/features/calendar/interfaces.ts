import type { BookingStatus, Customer } from "@/features/booking/types";
import type { TEventColor } from "@/features/calendar/types";

export interface IUser {
	id: string;
	name: string;
	picturePath: string | null;
}

export interface IEvent {
	id: number;
	startDate: string;
	endDate: string;
	title: string;
	color: TEventColor;
	description: string;
	/** The staff member the appointment is with. */
	user: IUser;
	serviceId?: string;
	customer?: Customer;
	status?: BookingStatus;
	price?: number;
	bufferMin?: number;
	source?: "online" | "staff";
}

export interface ICalendarCell {
	day: number;
	currentMonth: boolean;
	date: Date;
}
