"use client";

import type React from "react";
import { createContext, useContext, useMemo, useState } from "react";
import { useBookingStore } from "@/features/booking/store";
import { useLocalStorage } from "@/features/calendar/hooks";
import type { IEvent, IUser } from "@/features/calendar/interfaces";
import type { TCalendarView, TEventColor } from "@/features/calendar/types";

interface ICalendarContext {
  selectedDate: Date;
  view: TCalendarView;
  setView: (view: TCalendarView) => void;
  agendaModeGroupBy: "date" | "color";
  setAgendaModeGroupBy: (groupBy: "date" | "color") => void;
  use24HourFormat: boolean;
  toggleTimeFormat: () => void;
  startOfDayHour: number;
  setStartOfDayHour: (newVal: number) => void;
  setSelectedDate: (date: Date | undefined) => void;
  selectedUserId: IUser["id"] | "all";
  setSelectedUserId: (userId: IUser["id"] | "all") => void;
  badgeVariant: "dot" | "colored";
  setBadgeVariant: (variant: "dot" | "colored") => void;
  selectedColors: TEventColor[];
  filterEventsBySelectedColors: (colors: TEventColor) => void;
  filterEventsBySelectedUser: (userId: IUser["id"] | "all") => void;
  users: IUser[];
  events: IEvent[];
  addEvent: (event: IEvent) => void;
  updateEvent: (event: IEvent) => void;
  removeEvent: (eventId: number) => void;
  clearFilter: () => void;
}

interface CalendarSettings {
  badgeVariant: "dot" | "colored";
  view: TCalendarView;
  use24HourFormat: boolean;
  startOfDayHour: number;
  agendaModeGroupBy: "date" | "color";
}

export const MIN_SCROLL_HOUR = 0;
// With a fixed calendar height, having 16h on top
// of the frame allows to see the rest of the day
export const MAX_SCROLL_HOUR = 16;

const DEFAULT_SETTINGS: CalendarSettings = {
  badgeVariant: "colored",
  view: "day",
  use24HourFormat: true,
  startOfDayHour: 8,
  agendaModeGroupBy: "date",
};

const CalendarContext = createContext({} as ICalendarContext);

export function CalendarProvider({
  children,
  badge = "colored",
  view = "day",
}: {
  children: React.ReactNode;
  view?: TCalendarView;
  badge?: "dot" | "colored";
}) {
  // Bookings and staff come from the persisted booking store, so changes made
  // here, on the public booking page or in settings are always in sync.
  const allEvents = useBookingStore((s) => s.bookings);
  const staff = useBookingStore((s) => s.staff);
  const addBooking = useBookingStore((s) => s.addBooking);
  const updateBooking = useBookingStore((s) => s.updateBooking);
  const removeBooking = useBookingStore((s) => s.removeBooking);
  const users: IUser[] = useMemo(
    () => staff.map((s) => ({ id: s.id, name: s.name, picturePath: s.picturePath })),
    [staff],
  );

  const [rawSettings, setSettings] = useLocalStorage<Partial<CalendarSettings>>("calendar-settings", {});

  const settings: CalendarSettings = {
    ...DEFAULT_SETTINGS,
    badgeVariant: badge,
    view: view,
    ...rawSettings,
  };

  const [badgeVariant, setBadgeVariantState] = useState<"dot" | "colored">(
    settings.badgeVariant,
  );
  const [currentView, setCurrentViewState] = useState<TCalendarView>(
    settings.view,
  );
  const [use24HourFormat, setUse24HourFormatState] = useState<boolean>(
    settings.use24HourFormat,
  );
  const [startOfDayHour, setStartOfDayHourState] = useState<number>(
    settings.startOfDayHour,
  );
  const [agendaModeGroupBy, setAgendaModeGroupByState] = useState<
    "date" | "color"
  >(settings.agendaModeGroupBy);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedUserId, setSelectedUserId] = useState<IUser["id"] | "all">(
    "all",
  );
  const [selectedColors, setSelectedColors] = useState<TEventColor[]>([]);

  // Colour and staff filters now combine instead of overriding each other
  const filteredEvents = useMemo(
    () =>
      allEvents.filter(
        (e) =>
          e.status !== "cancelled" &&
          (selectedColors.length === 0 || selectedColors.includes(e.color || "blue")) &&
          (selectedUserId === "all" || e.user.id === selectedUserId),
      ),
    [allEvents, selectedColors, selectedUserId],
  );

  const updateSettings = (newPartialSettings: Partial<CalendarSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...newPartialSettings,
    }));
  };

  const setBadgeVariant = (variant: "dot" | "colored") => {
    setBadgeVariantState(variant);
    updateSettings({ badgeVariant: variant });
  };

  const setView = (newView: TCalendarView) => {
    setCurrentViewState(newView);
    updateSettings({ view: newView });
  };

  const toggleTimeFormat = () => {
    const newValue = !use24HourFormat;
    setUse24HourFormatState(newValue);
    updateSettings({ use24HourFormat: newValue });
  };

  const setStartOfDayHour = (newVal: number) => {
    if (!isNaN(newVal) && newVal >= MIN_SCROLL_HOUR && newVal <= MAX_SCROLL_HOUR) {
      setStartOfDayHourState(newVal);
      updateSettings({ startOfDayHour: newVal });
    }
  };


  const setAgendaModeGroupBy = (groupBy: "date" | "color") => {
    setAgendaModeGroupByState(groupBy);
    updateSettings({ agendaModeGroupBy: groupBy });
  };

  const filterEventsBySelectedColors = (color: TEventColor) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color],
    );
  };

  const filterEventsBySelectedUser = (userId: IUser["id"] | "all") => {
    setSelectedUserId(userId);
  };

  const handleSelectDate = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
  };

  const addEvent = (event: IEvent) => {
    const { id: _ignored, ...rest } = event;
    void _ignored;
    addBooking(rest);
  };

  const updateEvent = (event: IEvent) => {
    updateBooking({
      ...event,
      startDate: new Date(event.startDate).toISOString(),
      endDate: new Date(event.endDate).toISOString(),
    });
  };

  const removeEvent = (eventId: number) => {
    removeBooking(eventId);
  };

  const clearFilter = () => {
    setSelectedColors([]);
    setSelectedUserId("all");
  };

  const value = {
    selectedDate,
    setSelectedDate: handleSelectDate,
    selectedUserId,
    setSelectedUserId,
    badgeVariant,
    setBadgeVariant,
    users,
    selectedColors,
    filterEventsBySelectedColors,
    filterEventsBySelectedUser,
    events: filteredEvents,
    view: currentView,
    use24HourFormat,
    toggleTimeFormat,
    startOfDayHour,
    setStartOfDayHour,
    setView,
    agendaModeGroupBy,
    setAgendaModeGroupBy,
    addEvent,
    updateEvent,
    removeEvent,
    clearFilter,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar(): ICalendarContext {
  const context = useContext(CalendarContext);
  if (!context)
    throw new Error("useCalendar must be used within a CalendarProvider.");
  return context;
}
