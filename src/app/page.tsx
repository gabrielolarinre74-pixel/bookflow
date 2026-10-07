"use client";

import { format } from "date-fns";
import { CalendarDays, Globe, UserX, Wallet } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { ReminderQueue } from "@/components/reminder-queue";
import { SiteNav } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { dashboardStats } from "@/features/booking/stats";
import { useBookingStore } from "@/features/booking/store";
import { Calendar } from "@/features/calendar/calendar";

export default function DashboardPage() {
	const bookings = useBookingStore((s) => s.bookings);
	const settings = useBookingStore((s) => s.settings);
	const stats = useMemo(() => dashboardStats(bookings), [bookings]);
	const money = (n: number) =>
		new Intl.NumberFormat(undefined, { style: "currency", currency: settings.currency, maximumFractionDigits: 0 }).format(n);

	return (
		<>
			<SiteNav />
			<main className="mx-auto max-w-[1500px] space-y-6 px-4 py-6">
				<div className="flex flex-wrap items-end justify-between gap-3">
					<div>
						<p className="text-sm text-muted-foreground">{format(new Date(), "EEEE d MMMM")}</p>
						<h1 className="text-2xl font-bold tracking-tight">Good to see you. Here is your day.</h1>
					</div>
					<Button asChild variant="outline">
						<Link href="/book">Open booking page</Link>
					</Button>
				</div>

				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<Kpi icon={CalendarDays} label="Today" value={String(stats.todayCount)} hint={`${stats.todayRemaining} still to come`} />
					<Kpi icon={Wallet} label="Booked this week" value={money(stats.weekRevenue)} hint={`${stats.weekCount} appointments`} />
					<Kpi icon={Globe} label="Booked online" value={`${Math.round(stats.onlineShare * 100)}%`} hint="of bookings, last 30 days" />
					<Kpi icon={UserX} label="No-show rate" value={`${Math.round(stats.noShowRate * 100)}%`} hint="last 30 days" />
				</div>

				<div className="grid gap-6 xl:grid-cols-[1fr_360px]">
					<Calendar />
					<aside className="space-y-6">
						<ReminderQueue />
						<section className="rounded-xl border bg-background">
							<h2 className="border-b p-4 font-semibold">Next up</h2>
							<ul className="divide-y">
								{stats.upcoming.map((b) => (
									<li key={b.id} className="flex items-center justify-between gap-3 p-3 text-sm">
										<div className="min-w-0">
											<p className="truncate font-medium">{b.customer?.name}</p>
											<p className="truncate text-xs text-muted-foreground">
												{b.title} · {b.user.name}
											</p>
										</div>
										<span className="shrink-0 text-xs font-medium">{format(new Date(b.startDate), "EEE HH:mm")}</span>
									</li>
								))}
								{stats.upcoming.length === 0 && <li className="p-4 text-sm text-muted-foreground">No upcoming appointments.</li>}
							</ul>
						</section>
					</aside>
				</div>
			</main>
		</>
	);
}

function Kpi({ icon: Icon, label, value, hint }: { icon: typeof Wallet; label: string; value: string; hint: string }) {
	return (
		<div className="rounded-xl border bg-background p-4">
			<div className="flex items-center justify-between text-sm text-muted-foreground">
				{label}
				<span className="rounded-md bg-rose-500/10 p-1.5 text-rose-600 dark:text-rose-400">
					<Icon className="size-4" />
				</span>
			</div>
			<p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
			<p className="text-xs text-muted-foreground">{hint}</p>
		</div>
	);
}
