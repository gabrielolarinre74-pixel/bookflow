"use client";

import { format } from "date-fns";
import { BellRing, CheckCheck, Mail, MessageCircle } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildReminderQueue, mailtoLink, renderTemplate, whatsappLink } from "@/features/booking/reminders";
import { useBookingStore } from "@/features/booking/store";

export function ReminderQueue() {
	const bookings = useBookingStore((s) => s.bookings);
	const settings = useBookingStore((s) => s.settings);
	const sent = useBookingStore((s) => s.sentReminders);
	const markSent = useBookingStore((s) => s.markReminderSent);
	const queue = useMemo(
		() => buildReminderQueue(bookings, settings.reminderHoursBefore, sent).slice(0, 6),
		[bookings, settings.reminderHoursBefore, sent],
	);
	const due = queue.filter((r) => r.status === "due").length;

	return (
		<section className="overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-card)]">
			<header className="flex items-center justify-between border-b p-5">
				<div>
					<h2 className="flex items-center gap-2 font-semibold">
						<span className="bg-brand-gradient flex size-6 items-center justify-center rounded-md text-white"><BellRing className="size-3.5" /></span> Reminders
					</h2>
					<p className="text-xs text-muted-foreground">
						{settings.reminderHoursBefore.map((h) => `${h}h`).join(" & ")} before each appointment · next 72 hours
					</p>
				</div>
				{due > 0 && <Badge className="bg-brand-gradient rounded-full border-0 text-white">{due} due</Badge>}
			</header>
			<ul className="divide-y">
				{queue.length === 0 && <li className="px-5 py-8 text-center text-sm text-muted-foreground">All caught up. No reminders due in the next 72 hours.</li>}
				{queue.map((r) => {
					const message = renderTemplate(settings.reminderTemplate, r.booking, settings.businessName);
					const wa = r.booking.customer?.phone ? whatsappLink(r.booking.customer.phone, message) : null;
					const mail = r.booking.customer?.email
						? mailtoLink(r.booking.customer.email, `Reminder: ${r.booking.title} at ${settings.businessName}`, message)
						: null;
					return (
						<li key={r.key} className="flex items-center gap-3 p-3">
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium">
									{r.booking.customer?.name} · {r.booking.title}
								</p>
								<p className="text-xs text-muted-foreground">
									{r.hoursBefore}h before · {r.status === "due" ? <span className="font-medium text-brand">due now</span> : `sends ${format(r.sendAt, "EEE HH:mm")}`}
								</p>
							</div>
							{r.status === "sent" ? (
								<span className="flex items-center gap-1 text-xs text-emerald-600">
									<CheckCheck className="size-4" /> Sent
								</span>
							) : (
								<div className="flex gap-1">
									{wa && (
										<Button size="icon" variant="outline" className="size-8 rounded-lg" asChild aria-label="Send on WhatsApp">
											<a href={wa} target="_blank" rel="noopener noreferrer" onClick={() => markSent(r.key)}>
												<MessageCircle />
											</a>
										</Button>
									)}
									{mail && (
										<Button size="icon" variant="outline" className="size-8 rounded-lg" asChild aria-label="Send by email">
											<a href={mail} onClick={() => markSent(r.key)}>
												<Mail />
											</a>
										</Button>
									)}
									<Button
										size="icon"
										variant="ghost"
										className="size-8 rounded-lg"
										aria-label="Mark as sent"
										onClick={() => {
											markSent(r.key);
											toast.success("Reminder marked as sent");
										}}
									>
										<CheckCheck />
									</Button>
								</div>
							)}
						</li>
					);
				})}
			</ul>
		</section>
	);
}
