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
		<div className="min-h-screen bg-background lg:grid lg:grid-cols-[400px_minmax(0,1fr)]">
			<aside className="relative overflow-hidden bg-[oklch(0.145_0_0)] px-6 py-6 text-white lg:sticky lg:top-0 lg:h-screen lg:px-10 lg:py-10">
				<div className="bg-brand-gradient pointer-events-none absolute -left-24 -top-24 size-72 rounded-full opacity-30 blur-3xl" />
				<div className="bg-brand-gradient pointer-events-none absolute -bottom-32 -right-20 hidden size-80 rounded-full opacity-20 blur-3xl lg:block" />
				<div className="relative flex h-full flex-col">
					<Logo name="Online booking" inverted />
					<div className="mt-8 lg:mt-16">
						<p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-300">Book with</p>
						<h1 className="mt-2 text-3xl font-semibold leading-tight lg:text-4xl">{settings.businessName}</h1>
						<p className="mt-3 max-w-sm text-sm leading-relaxed text-white/60">
							Pick a service and a time that suits you. You&apos;ll get a confirmation straight away and a reminder before your visit.
						</p>
					</div>
					{service && step !== "service" && (
						<div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
							<p className="text-xs uppercase tracking-wider text-white/45">Your booking</p>
							<p className="mt-1.5 font-display font-semibold">{service.name}</p>
							<div className="mt-2 space-y-1 text-sm text-white/70">
								<p className="flex items-center gap-2">
									<Clock className="size-3.5" /> {service.durationMin} min · {money(service.price)}
								</p>
								{slot && (
									<p className="flex items-center gap-2">
										<CalendarPlus className="size-3.5" /> {format(slot.start, "EEE d MMM, HH:mm")}
									</p>
								)}
								{slot && (
									<p className="flex items-center gap-2">
										<User className="size-3.5" /> {staff.find((s) => s.id === slot.staffId)?.name}
									</p>
								)}
							</div>
						</div>
					)}
					<ul className="mt-auto hidden space-y-3 pt-10 text-sm text-white/65 lg:block">
						<li className="flex items-center gap-3">
							<span className="flex size-7 items-center justify-center rounded-full bg-white/10"><Check className="size-3.5" /></span>
							Only real, free times are shown
						</li>
						<li className="flex items-center gap-3">
							<span className="flex size-7 items-center justify-center rounded-full bg-white/10"><Check className="size-3.5" /></span>
							Add it to Google, Apple or Outlook calendar
						</li>
						<li className="flex items-center gap-3">
							<span className="flex size-7 items-center justify-center rounded-full bg-white/10"><Check className="size-3.5" /></span>
							Times shown in your local time
						</li>
					</ul>
				</div>
			</aside>
			<main className="mx-auto w-full max-w-3xl px-5 py-8 lg:px-12 lg:py-14">
				<Steps step={step} />
				<div className="mt-8">
					{step === "service" && (
						<section>
							<h2 className="text-2xl font-semibold">Choose a service</h2>
							<p className="mt-1 text-muted-foreground">Select what you&apos;d like to book. You&apos;ll see open times next.</p>
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
										className="group relative rounded-2xl border bg-card p-5 text-left shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-red-400/60 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
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
							<h2 className="text-2xl font-semibold">Pick a time</h2>
							<p className="mt-1 text-muted-foreground">
								{service.name} · {service.durationMin} min · {money(service.price)}
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
											staffId === s.id ? "border-foreground bg-foreground text-background" : "bg-card hover:border-foreground/40",
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
												isSameDay(d, day) ? "bg-brand-gradient border-transparent text-white shadow-[var(--shadow-glow)]" : "bg-card hover:border-foreground/40",
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
											className="rounded-xl border bg-card py-2.5 text-sm font-semibold tabular-nums transition hover:border-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/10 dark:hover:text-red-300"
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
							<h2 className="text-2xl font-semibold">Your details</h2>
							<p className="mb-6 mt-1 text-muted-foreground">We only use these to confirm and remind you about this appointment.</p>
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
								<Button type="submit" size="lg" className="bg-brand-gradient h-12 rounded-xl border-0 text-base shadow-[var(--shadow-glow)]">
									Confirm booking
								</Button>
								<p className="text-center text-xs text-muted-foreground">
									You will get a reminder {settings.reminderHoursBefore.join(" and ")} hours before your appointment.
								</p>
							</form>
						</section>
					)}

					{step === "done" && confirmed && icsEvent && (
						<section className="rounded-3xl border bg-card px-6 py-12 text-center shadow-[var(--shadow-card)]">
							<div className="bg-brand-gradient mx-auto flex size-16 items-center justify-center rounded-full text-white shadow-[var(--shadow-glow)]">
								<Check className="size-7" />
							</div>
							<h2 className="mt-5 text-3xl font-semibold">You&apos;re booked, {confirmed.customer?.name.split(" ")[0]}!</h2>
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
				<p className="mt-10 border-t pt-5 text-xs text-muted-foreground">
					Demo booking page. Bookings are saved in this browser and appear on the Today view and calendar straight away.
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
							i < index && "border-foreground bg-foreground text-background",
							i === index && "bg-brand-gradient border-transparent text-white",
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
