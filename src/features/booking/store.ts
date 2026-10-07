"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { IEvent } from "@/features/calendar/interfaces";
import { DEFAULT_HOURS, DEFAULT_SERVICES, DEFAULT_SETTINGS, DEFAULT_STAFF, generateSampleBookings } from "./seed";
import type { BookingStatus, BusinessSettings, Service, StaffMember, WeeklyHours } from "./types";

interface BookingState {
	services: Service[];
	staff: StaffMember[];
	hours: WeeklyHours;
	settings: BusinessSettings;
	bookings: IEvent[];
	sentReminders: string[];
	addBooking: (b: Omit<IEvent, "id">) => IEvent;
	updateBooking: (b: IEvent) => void;
	removeBooking: (id: number) => void;
	setStatus: (id: number, status: BookingStatus) => void;
	markReminderSent: (key: string) => void;
	saveService: (s: Service) => void;
	removeService: (id: string) => void;
	setHours: (hours: WeeklyHours) => void;
	updateSettings: (patch: Partial<BusinessSettings>) => void;
	resetDemo: () => void;
}

const nextId = (bookings: IEvent[]) => bookings.reduce((m, b) => Math.max(m, b.id), 0) + 1;

export const useBookingStore = create<BookingState>()(
	persist(
		(set, get) => ({
			services: DEFAULT_SERVICES,
			staff: DEFAULT_STAFF,
			hours: DEFAULT_HOURS,
			settings: DEFAULT_SETTINGS,
			bookings: generateSampleBookings(),
			sentReminders: [],
			addBooking: (b) => {
				const booking = { ...b, id: nextId(get().bookings) };
				set((s) => ({ bookings: [...s.bookings, booking] }));
				return booking;
			},
			updateBooking: (b) => set((s) => ({ bookings: s.bookings.map((x) => (x.id === b.id ? b : x)) })),
			removeBooking: (id) => set((s) => ({ bookings: s.bookings.filter((x) => x.id !== id) })),
			setStatus: (id, status) =>
				set((s) => ({ bookings: s.bookings.map((x) => (x.id === id ? { ...x, status } : x)) })),
			markReminderSent: (key) =>
				set((s) => ({ sentReminders: s.sentReminders.includes(key) ? s.sentReminders : [...s.sentReminders, key] })),
			saveService: (svc) =>
				set((s) => ({
					services: s.services.some((x) => x.id === svc.id)
						? s.services.map((x) => (x.id === svc.id ? svc : x))
						: [...s.services, svc],
				})),
			removeService: (id) =>
				set((s) => ({
					services: s.services.filter((x) => x.id !== id),
					staff: s.staff.map((st) => ({ ...st, serviceIds: st.serviceIds.filter((x) => x !== id) })),
				})),
			setHours: (hours) => set({ hours }),
			updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
			resetDemo: () =>
				set({
					services: DEFAULT_SERVICES,
					staff: DEFAULT_STAFF,
					hours: DEFAULT_HOURS,
					settings: DEFAULT_SETTINGS,
					bookings: generateSampleBookings(),
					sentReminders: [],
				}),
		}),
		{
			name: "bookflow",
			version: 2,
			// v2 retired the purple event colour; map any saved purple items to teal
			migrate: (persisted, version) => {
				const state = persisted as Partial<BookingState>;
				if (version < 2) {
					const fix = <T extends { color: string }>(x: T): T => (x.color === "purple" ? { ...x, color: "teal" } : x);
					state.services = state.services?.map(fix);
					state.bookings = state.bookings?.map(fix);
				}
				return state as BookingState;
			},
			storage: createJSONStorage(() => localStorage),
			// Wait for the client before reading localStorage (static export + SSR-safe)
			skipHydration: true,
		},
	),
);
