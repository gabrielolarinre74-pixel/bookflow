"use client";

import { addDays, format, isSameDay } from "date-fns";
import { ArrowLeft, CalendarPlus, Check, Clock, ExternalLink, Sparkles, User } from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod/v4";
import { Logo } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getAvailableSlots } from "@/features/booking/availability";
import { buildIcs, downloadIcs, googleCalendarUrl } from "@/features/booking/ics";
import { useBookingStore } from "@/features/booking/store";
import type { Service, Slot } from "@/features/booking/types";
import { COLOR_DOT } from "@/features/calendar/constants";
import type { IEvent } from "@/features/calendar/interfaces";
import { cn } from "@/lib/utils";

const detailsSchema = z.object({
	name: z.string().trim().min(2, "Please enter your name"),
	email: z.email("Please enter a valid email"),
	phone: z
		.string()
		.trim()
		.regex(/^[+()\d\s-]{7,25}$/, "Please enter a valid phone number"),
	notes: z.string().max(500, "Please keep notes under 500 characters"),
});

type Step = "service" | "time" | "details" | "done";

export default function BookPage() {
	const { services, staff, hours, bookings, settings, addBooking } = useBookingStore();
	const [step, setStep] = useState<Step>("service");
	const [service, setService] = useState<Service | null>(null);
	const [staffId, setStaffId] = useState<string | "any">("any");
	const [day, setDay] = useState<Date>(() => new Date());
	const [slot, setSlot] = useState<Slot | null>(null);
	const [details, setDetails] = useState({ name: "", email: "", phone: "", notes: "" });
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [confirmed, setConfirmed] = useState<IEvent | null>(null);

	const days = useMemo(() => Array.from({ length: settings.maxDaysAhead }, (_, i) => addDays(new Date(), i)), [settings.maxDaysAhead]);
	const slots = useMemo(
		() =>
			service
				? getAvailableSlots({
						date: day,
						service,
						staffId,
						staff,
						hours,
						bookings,
						stepMin: settings.slotStepMin,
						minNoticeHours: settings.minNoticeHours,
					})
				: [],
		[service, day, staffId, staff, hours, bookings, settings.slotStepMin, settings.minNoticeHours],
	);
	const staffForService = service ? staff.filter((s) => s.serviceIds.includes(service.id)) : [];
	const money = (n: number) =>
		n === 0 ? "Free" : new Intl.NumberFormat(undefined, { style: "currency", currency: settings.currency, maximumFractionDigits: 0 }).format(n);

	const update = (field: keyof typeof details, value: string) => {
		setDetails((d) => ({ ...d, [field]: value }));
		setErrors((prev) => {
			const next = { ...prev };
			delete next[field];
			return next;
		});
	};

	const confirm = () => {
		const parsed = detailsSchema.safeParse(details);
		if (!parsed.success) {
			setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])));
			return;
		}
		if (!service || !slot) return;
		// Re-check right before saving in case the slot was taken meanwhile
		const stillFree = getAvailableSlots({ date: slot.start, service, staffId: slot.staffId, staff, hours, bookings, stepMin: 1 }).some(
			(s) => s.start.getTime() === slot.start.getTime(),
		);
		if (!stillFree) {
			setErrors({ form: "Sorry, that time was just taken. Please pick another one." });
			setStep("time");
			return;
		}
		const member = staff.find((s) => s.id === slot.staffId)!;
		const booking = addBooking({
			title: service.name,
			description: parsed.data.notes,
			startDate: slot.start.toISOString(),
			endDate: slot.end.toISOString(),
			color: service.color,
			user: { id: member.id, name: member.name, picturePath: member.picturePath },
			serviceId: service.id,
			customer: { name: parsed.data.name, email: parsed.data.email, phone: parsed.data.phone },
			status: "confirmed",
			price: service.price,
			bufferMin: service.bufferMin,
			source: "online",
		});
		setConfirmed(booking);
		setStep("done");
	};

	const icsEvent = confirmed && {
		uid: `bookflow-${confirmed.id}@bookflow.app`,
		title: `${confirmed.title} at ${settings.businessName}`,
		description: `With ${confirmed.user.name}. Booked via BookFlow.`,
		start: new Date(confirmed.startDate),
		end: new Date(confirmed.endDate),
		location: settings.businessName,
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-rose-50 to-background dark:from-rose-950/20">
			<header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
				<Logo name={settings.businessName} />
				<span className="text-xs text-muted-foreground">Times shown in your local time</span>
			</header>
			<main className="mx-auto max-w-3xl px-4 pb-16">
				<Steps step={step} />
				<div className="mt-6 rounded-2xl border bg-background p-5 shadow-sm sm:p-8">
					{step === "service" && (
						<section>
							<h1 className="text-2xl font-bold tracking-tight">Book an appointment</h1>
							<p className="mt-1 text-muted-foreground">Choose a service to see available times. It takes under a minute.</p>
							<div className="mt-6 grid gap-3 sm:grid-cols-2">
								{services.map((s) => (
									<button
										key={s.id}
										type="button"
										onClick={() => {
											setService(s);
											setStaffId("any");
											setSlot(null);
											setStep("time");
										}}
										className="group rounded-xl border p-4 text-left transition hover:border-rose-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
									>
										<div className="flex items-center gap-2">
											<span className={cn("size-2.5 rounded-full", COLOR_DOT[s.color])} />
											<span className="font-semibold">{s.name}</span>
										</div>
										<p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
										<p className="mt-3 flex items-center gap-3 text-sm">
											<span className="flex items-center gap-1 text-muted-foreground">
												<Clock className="size-3.5" /> {s.durationMin} min
											</span>
											<span className="font-semibold">{money(s.price)}</span>
										</p>
									</button>
								))}
							</div>
						</section>
					)}

					{step === "time" && service && (
						<section>
							<BackButton onClick={() => setStep("service")} />
							<h2 className="text-xl font-bold tracking-tight">{service.name}</h2>
							<p className="text-sm text-muted-foreground">
								{service.durationMin} min · {money(service.price)}
							</p>

							<Label className="mt-6 mb-2 block">Who would you like?</Label>
							<div className="flex flex-wrap gap-2">
								{[{ id: "any", name: "Anyone available" }, ...staffForService].map((s) => (
									<button
										key={s.id}
										type="button"
										onClick={() => {
											setStaffId(s.id);
											setSlot(null);
										}}
										className={cn(
											"flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition",
											staffId === s.id ? "border-rose-500 bg-rose-500 text-white" : "hover:border-rose-300",
										)}
									>
										{s.id === "any" ? <Sparkles className="size-3.5" /> : <User className="size-3.5" />}
										{s.name}
									</button>
								))}
							</div>

							<Label className="mt-6 mb-2 block">Pick a day</Label>
							<div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
								{days.map((d) => {
									const closed = !hours[d.getDay()];
									return (
										<button
											key={d.toISOString()}
											type="button"
											disabled={closed}
											onClick={() => {
												setDay(d);
												setSlot(null);
											}}
											className={cn(
												"flex w-16 shrink-0 flex-col items-center rounded-xl border py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-40",
												isSameDay(d, day) ? "border-rose-500 bg-rose-500 text-white" : "hover:border-rose-300",
											)}
										>
											<span className="text-xs uppercase">{format(d, "EEE")}</span>
											<span className="text-lg font-semibold">{format(d, "d")}</span>
											<span className="text-[10px]">{closed ? "Closed" : format(d, "MMM")}</span>
										</button>
									);
								})}
							</div>

							<Label className="mt-6 mb-2 block">Available times on {format(day, "EEEE d MMMM")}</Label>
							{errors.form && <p className="mb-2 text-sm text-destructive">{errors.form}</p>}
							{slots.length === 0 ? (
								<p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
									No times left on this day. Try another day or team member.
								</p>
							) : (
								<div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
									{slots.map((s) => (
										<button
											key={s.start.toISOString()}
											type="button"
											onClick={() => {
												setSlot(s);
												setErrors({});
												setStep("details");
											}}
											className="rounded-lg border py-2 text-sm font-medium transition hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
										>
											{format(s.start, "HH:mm")}
										</button>
									))}
								</div>
							)}
						</section>
					)}

					{step === "details" && service && slot && (
						<section>
							<BackButton onClick={() => setStep("time")} />
							<div className="mb-6 rounded-xl bg-muted/60 p-4 text-sm">
								<p className="font-semibold">{service.name}</p>
								<p className="text-muted-foreground">
									{format(slot.start, "EEEE d MMMM, HH:mm")} – {format(slot.end, "HH:mm")} · with{" "}
									{staff.find((s) => s.id === slot.staffId)?.name}
								</p>
							</div>
							<form
								className="grid gap-4"
								onSubmit={(e) => {
									e.preventDefault();
									confirm();
								}}
								noValidate
							>
								<Field id="name" label="Full name" error={errors.name}>
									<Input id="name" autoComplete="name" value={details.name} onChange={(e) => update("name", e.target.value)} />
								</Field>
								<div className="grid gap-4 sm:grid-cols-2">
									<Field id="email" label="Email" error={errors.email}>
										<Input id="email" type="email" autoComplete="email" value={details.email} onChange={(e) => update("email", e.target.value)} />
									</Field>
									<Field id="phone" label="Phone (for reminders)" error={errors.phone}>
										<Input id="phone" type="tel" autoComplete="tel" value={details.phone} onChange={(e) => update("phone", e.target.value)} />
									</Field>
								</div>
								<Field id="notes" label="Anything we should know? (optional)" error={errors.notes}>
									<Textarea id="notes" value={details.notes} onChange={(e) => update("notes", e.target.value)} />
								</Field>
								<Button type="submit" size="lg" className="bg-rose-600 hover:bg-rose-700">
									Confirm booking
								</Button>
								<p className="text-center text-xs text-muted-foreground">
									You will get a reminder {settings.reminderHoursBefore.join(" and ")} hours before your appointment.
								</p>
							</form>
						</section>
					)}

					{step === "done" && confirmed && icsEvent && (
						<section className="text-center">
							<div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
								<Check className="size-7" />
							</div>
							<h2 className="mt-4 text-2xl font-bold tracking-tight">You&apos;re booked, {confirmed.customer?.name.split(" ")[0]}!</h2>
							<p className="mt-1 text-muted-foreground">
								{confirmed.title} with {confirmed.user.name}
								<br />
								{format(new Date(confirmed.startDate), "EEEE d MMMM 'at' HH:mm")}
							</p>
							<div className="mt-6 flex flex-wrap justify-center gap-2">
								<Button variant="outline" onClick={() => downloadIcs("appointment.ics", buildIcs(icsEvent))}>
									<CalendarPlus /> Add to calendar (.ics)
								</Button>
								<Button variant="outline" asChild>
									<a href={googleCalendarUrl(icsEvent)} target="_blank" rel="noopener noreferrer">
										<ExternalLink /> Google Calendar
									</a>
								</Button>
							</div>
							<Button
								variant="link"
								className="mt-4"
								onClick={() => {
									setStep("service");
									setService(null);
									setSlot(null);
									setDetails({ name: "", email: "", phone: "", notes: "" });
									setConfirmed(null);
								}}
							>
								Book another appointment
							</Button>
						</section>
					)}
				</div>
				<p className="mt-6 text-center text-xs text-muted-foreground">
					Demo booking page. Bookings are saved in this browser and appear instantly on the dashboard.
				</p>
			</main>
		</div>
	);
}

function Steps({ step }: { step: Step }) {
	const items: [Step, string][] = [
		["service", "Service"],
		["time", "Date & time"],
		["details", "Your details"],
		["done", "Confirmed"],
	];
	const index = items.findIndex(([s]) => s === step);
	return (
		<ol className="flex items-center gap-2 text-xs font-medium sm:text-sm">
			{items.map(([s, label], i) => (
				<li key={s} className="flex flex-1 items-center gap-2">
					<span
						className={cn(
							"flex size-6 shrink-0 items-center justify-center rounded-full border text-xs",
							i < index && "border-emerald-500 bg-emerald-500 text-white",
							i === index && "border-rose-500 bg-rose-500 text-white",
						)}
					>
						{i < index ? <Check className="size-3.5" /> : i + 1}
					</span>
					<span className={cn("hidden sm:inline", i === index ? "text-foreground" : "text-muted-foreground")}>{label}</span>
					{i < items.length - 1 && <span className="h-px flex-1 bg-border" />}
				</li>
			))}
		</ol>
	);
}

function BackButton({ onClick }: { onClick: () => void }) {
	return (
		<button type="button" onClick={onClick} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
			<ArrowLeft className="size-4" /> Back
		</button>
	);
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
	return (
		<div className="grid gap-2">
			<Label htmlFor={id}>{label}</Label>
			{children}
			{error && <p className="text-sm text-destructive">{error}</p>}
		</div>
	);
}
