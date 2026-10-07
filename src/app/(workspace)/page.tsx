"use client";

import { format, isToday } from "date-fns";
import { ArrowRight, ArrowUpRight, CalendarDays, Clock3, Globe2, Plus, UserX, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ReminderQueue } from "@/components/reminder-queue";
import { PageHeader } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { dashboardStats, teamLoadToday } from "@/features/booking/stats";
import { useBookingStore } from "@/features/booking/store";
import { COLOR_DOT } from "@/features/calendar/constants";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
	confirmed: "bg-foreground/[0.06] text-foreground",
	completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
	"no-show": "bg-red-500/10 text-red-700 dark:text-red-400",
};

const initials = (name: string) =>
	name
		.split(" ")
		.map((p) => p[0])
		.join("")
		.slice(0, 2);

export default function TodayPage() {
	const { bookings, settings, staff, hours } = useBookingStore();
	const stats = useMemo(() => dashboardStats(bookings), [bookings]);
	const team = useMemo(() => teamLoadToday(bookings, staff, hours), [bookings, staff, hours]);
	const today = useMemo(
		() =>
			bookings
				.filter((b) => b.status !== "cancelled" && isToday(new Date(b.startDate)))
				.sort((a, b) => a.startDate.localeCompare(b.startDate)),
		[bookings],
	);
	const money = (n: number) =>
		new Intl.NumberFormat(undefined, { style: "currency", currency: settings.currency, maximumFractionDigits: 0 }).format(n);
	const now = useNow();
	const hour = new Date(now).getHours();
	const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

	return (
		<>
			<PageHeader
				eyebrow={format(new Date(), "EEEE, d MMMM")}
				title={`${greeting}.`}
				description={
					today.length
						? `${settings.businessName} has ${today.length} appointment${today.length === 1 ? "" : "s"} today, ${stats.todayRemaining} still to come.`
						: `Nothing booked for ${settings.businessName} today yet.`
				}
				actions={
					<>
						<Button asChild variant="outline" className="rounded-lg">
							<Link href="/calendar">
								<CalendarDays /> Calendar
							</Link>
						</Button>
						<Button asChild className="bg-brand-gradient rounded-lg border-0 shadow-[var(--shadow-glow)]">
							<Link href="/book">
								<Plus /> New booking
							</Link>
						</Button>
					</>
				}
			/>

			<section className="grid overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-card)] sm:grid-cols-2 xl:grid-cols-4">
				<Metric icon={CalendarDays} label="Appointments today" value={String(stats.todayCount)} hint={`${stats.todayRemaining} still to come`} />
				<Metric icon={Wallet} label="Booked this week" value={money(stats.weekRevenue)} hint={`${stats.weekCount} appointments, Sun to Sat`} />
				<Metric icon={Globe2} label="Booked online" value={`${Math.round(stats.onlineShare * 100)}%`} hint="of bookings in the last 30 days" />
				<Metric icon={UserX} label="No-show rate" value={`${Math.round(stats.noShowRate * 100)}%`} hint="of finished appointments, 30 days" />
			</section>

			<div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
				<section>
					<div className="mb-4 flex items-center justify-between">
						<h2 className="text-lg font-semibold">Today&apos;s schedule</h2>
						<Link href="/calendar" className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
							Full calendar <ArrowRight className="size-4" />
						</Link>
					</div>
					{today.length === 0 ? (
						<div className="flex flex-col items-center rounded-2xl border border-dashed bg-card px-6 py-14 text-center">
							<div className="bg-brand-gradient flex size-12 items-center justify-center rounded-2xl text-white shadow-[var(--shadow-glow)]">
								<Clock3 className="size-6" />
							</div>
							<p className="mt-4 font-display text-lg font-semibold">A quiet day so far</p>
							<p className="mt-1 max-w-sm text-sm text-muted-foreground">
								Share your booking page so clients can grab a free slot. New bookings show up here straight away.
							</p>
							<Button asChild variant="outline" className="mt-5 rounded-lg">
								<Link href="/book">
									Open booking page <ArrowUpRight />
								</Link>
							</Button>
						</div>
					) : (
						<ol className="relative space-y-2.5 before:absolute before:bottom-3 before:left-[68px] before:top-3 before:w-px before:bg-border">
							{today.map((b) => {
								const start = new Date(b.startDate);
								const end = new Date(b.endDate);
								const live = start.getTime() <= now && end.getTime() > now;
								const past = end.getTime() <= now;
								return (
									<li key={b.id} className="relative flex items-stretch gap-4">
										<div className={cn("w-[52px] shrink-0 pt-3.5 text-right text-sm font-semibold tabular-nums", past && "text-muted-foreground")}>
											{format(start, "HH:mm")}
										</div>
										<span
											className={cn(
												"relative z-10 mt-[18px] size-2.5 shrink-0 rounded-full ring-4 ring-background",
												live ? "bg-brand-gradient animate-pulse" : COLOR_DOT[b.color],
											)}
										/>
										<div
											className={cn(
												"flex flex-1 items-center gap-4 rounded-xl border bg-card p-3.5 shadow-[var(--shadow-card)] transition hover:-translate-y-px",
												live && "border-red-500/40 ring-1 ring-red-500/20",
												past && "opacity-60",
											)}
										>
											<div className="min-w-0 flex-1">
												<p className="truncate font-medium">{b.title}</p>
												<p className="truncate text-sm text-muted-foreground">
													{b.customer?.name ?? "Walk-in"} · {format(start, "HH:mm")}–{format(end, "HH:mm")}
												</p>
											</div>
											{live ? (
												<span className="bg-brand-gradient rounded-full px-2.5 py-0.5 text-xs font-semibold text-white">In progress</span>
											) : (
												<span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", STATUS_STYLE[b.status ?? "confirmed"])}>
													{b.status === "no-show" ? "No-show" : (b.status ?? "confirmed")}
												</span>
											)}
											<span
												title={b.user.name}
												className="hidden size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background sm:flex"
											>
												{initials(b.user.name)}
											</span>
										</div>
									</li>
								);
							})}
						</ol>
					)}
				</section>

				<aside className="space-y-6">
					<ReminderQueue />

					<section className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
						<h2 className="font-semibold">Team load today</h2>
						<p className="text-xs text-muted-foreground">Booked time as a share of opening hours</p>
						<ul className="mt-4 space-y-3.5">
							{team.map((t) => (
								<li key={t.staffId}>
									<div className="flex items-center justify-between text-sm">
										<span className="font-medium">{t.name}</span>
										<span className="tabular-nums text-muted-foreground">
											{t.appointments} appt · {Math.round(t.load * 100)}%
										</span>
									</div>
									<div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
										<div className="bg-brand-gradient h-full rounded-full transition-all" style={{ width: `${Math.max(2, t.load * 100)}%` }} />
									</div>
								</li>
							))}
						</ul>
					</section>

					<section className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
						<h2 className="font-semibold">Coming up</h2>
						<ul className="mt-3 divide-y">
							{stats.upcoming.map((b) => (
								<li key={b.id} className="flex items-center gap-3 py-2.5 text-sm">
									<div className="flex w-11 shrink-0 flex-col items-center rounded-lg bg-muted py-1 leading-none">
										<span className="text-[10px] font-semibold uppercase text-brand">{format(new Date(b.startDate), "EEE")}</span>
										<span className="mt-0.5 font-display font-semibold">{format(new Date(b.startDate), "d")}</span>
									</div>
									<div className="min-w-0 flex-1">
										<p className="truncate font-medium">{b.customer?.name}</p>
										<p className="truncate text-xs text-muted-foreground">
											{b.title} with {b.user.name.split(" ")[0]}
										</p>
									</div>
									<span className="shrink-0 text-xs font-semibold tabular-nums">{format(new Date(b.startDate), "HH:mm")}</span>
								</li>
							))}
							{stats.upcoming.length === 0 && <li className="py-3 text-sm text-muted-foreground">No upcoming appointments.</li>}
						</ul>
					</section>
				</aside>
			</div>
		</>
	);
}

/** Current time, refreshed every minute so "In progress" stays accurate. */
function useNow() {
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		const id = window.setInterval(() => setNow(Date.now()), 60_000);
		return () => window.clearInterval(id);
	}, []);
	return now;
}

function Metric({ icon: Icon, label, value, hint }: { icon: typeof Wallet; label: string; value: string; hint: string }) {
	return (
		<div className="border-b p-5 last:border-b-0 sm:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r xl:last:border-r-0">
			<div className="flex items-center gap-2 text-sm text-muted-foreground">
				<Icon className="size-4 text-brand" />
				{label}
			</div>
			<p className="mt-3 font-display text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
			<p className="mt-1 text-xs text-muted-foreground">{hint}</p>
		</div>
	);
}
