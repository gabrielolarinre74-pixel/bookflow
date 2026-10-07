"use client";

import { format, parseISO } from "date-fns";
import { Calendar, CalendarPlus, Clock, Mail, MessageCircle, Phone, Text, User, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { buildIcs, downloadIcs } from "@/features/booking/ics";
import { renderTemplate, whatsappLink } from "@/features/booking/reminders";
import { useBookingStore } from "@/features/booking/store";
import type { BookingStatus } from "@/features/booking/types";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import { AddEditEventDialog } from "@/features/calendar/dialogs/add-edit-event-dialog";
import { formatTime } from "@/features/calendar/helpers";
import type { IEvent } from "@/features/calendar/interfaces";

interface IProps {
	event: IEvent;
	children: ReactNode;
}

const STATUS_LABEL: Record<BookingStatus, string> = {
	confirmed: "Confirmed",
	completed: "Completed",
	"no-show": "No-show",
	cancelled: "Cancelled",
};

export function EventDetailsDialog({ event, children }: IProps) {
	const startDate = parseISO(event.startDate);
	const endDate = parseISO(event.endDate);
	const { use24HourFormat, removeEvent } = useCalendar();
	const setStatus = useBookingStore((s) => s.setStatus);
	const settings = useBookingStore((s) => s.settings);
	const status = event.status ?? "confirmed";
	const reminder = renderTemplate(settings.reminderTemplate, event, settings.businessName);
	const wa = event.customer?.phone ? whatsappLink(event.customer.phone, reminder) : null;

	const changeStatus = (next: BookingStatus) => {
		setStatus(event.id, next);
		toast.success(`Marked as ${STATUS_LABEL[next].toLowerCase()}`);
	};

	return (
		<Dialog>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						{event.title}
						<Badge variant={status === "confirmed" ? "default" : "secondary"}>{STATUS_LABEL[status]}</Badge>
						{event.source === "online" && <Badge variant="outline">Booked online</Badge>}
					</DialogTitle>
				</DialogHeader>

				<ScrollArea className="max-h-[70vh]">
					<div className="grid gap-4 p-4 sm:grid-cols-2">
						<Row icon={User} label="Customer" value={event.customer?.name ?? "—"} />
						<Row icon={User} label="With" value={event.user.name} />
						<Row
							icon={Calendar}
							label="Starts"
							value={`${format(startDate, "EEEE d MMMM")} at ${formatTime(startDate, use24HourFormat)}`}
						/>
						<Row icon={Clock} label="Ends" value={formatTime(endDate, use24HourFormat)} />
						{event.customer?.email && <Row icon={Mail} label="Email" value={event.customer.email} />}
						{event.customer?.phone && <Row icon={Phone} label="Phone" value={event.customer.phone} />}
						{event.price !== undefined && (
							<Row icon={Wallet} label="Price" value={event.price === 0 ? "Free" : `${settings.currency} ${event.price}`} />
						)}
						{event.description && <Row icon={Text} label="Notes" value={event.description} />}
					</div>
				</ScrollArea>

				<div className="flex flex-wrap gap-2 border-t pt-4">
					{wa && (
						<Button variant="outline" size="sm" asChild>
							<a href={wa} target="_blank" rel="noopener noreferrer">
								<MessageCircle /> WhatsApp reminder
							</a>
						</Button>
					)}
					<Button
						variant="outline"
						size="sm"
						onClick={() =>
							downloadIcs(
								`appointment-${event.id}.ics`,
								buildIcs({
									uid: `bookflow-${event.id}@bookflow.app`,
									title: `${event.title} with ${event.user.name}`,
									description: `${settings.businessName} · ${event.customer?.name ?? ""}`,
									start: startDate,
									end: endDate,
									location: settings.businessName,
								}),
							)
						}
					>
						<CalendarPlus /> .ics
					</Button>
					{status === "confirmed" ? (
						<>
							<Button variant="outline" size="sm" onClick={() => changeStatus("completed")}>
								Mark completed
							</Button>
							<Button variant="outline" size="sm" onClick={() => changeStatus("no-show")}>
								No-show
							</Button>
							<Button variant="outline" size="sm" onClick={() => changeStatus("cancelled")}>
								Cancel booking
							</Button>
						</>
					) : (
						<Button variant="outline" size="sm" onClick={() => changeStatus("confirmed")}>
							Reopen
						</Button>
					)}
				</div>
				<div className="flex justify-end gap-2">
					<AddEditEventDialog event={event}>
						<Button variant="outline">Edit</Button>
					</AddEditEventDialog>
					<Button
						variant="destructive"
						onClick={() => {
							removeEvent(event.id);
							toast.success("Appointment deleted");
						}}
					>
						Delete
					</Button>
				</div>
				<DialogClose />
			</DialogContent>
		</Dialog>
	);
}

function Row({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
	return (
		<div className="flex items-start gap-2">
			<Icon className="mt-1 size-4 shrink-0 text-muted-foreground" />
			<div className="min-w-0">
				<p className="text-sm font-medium">{label}</p>
				<p className="break-words text-sm text-muted-foreground">{value}</p>
			</div>
		</div>
	);
}
