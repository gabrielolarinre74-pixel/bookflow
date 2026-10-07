"use client";

import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { parseHHMM } from "@/features/booking/availability";
import { renderTemplate } from "@/features/booking/reminders";
import { useBookingStore } from "@/features/booking/store";
import type { Service, WeeklyHours } from "@/features/booking/types";
import { COLOR_DOT, COLORS } from "@/features/calendar/constants";
import type { IEvent } from "@/features/calendar/interfaces";
import type { TEventColor } from "@/features/calendar/types";
import { cn } from "@/lib/utils";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const previewStart = new Date();
previewStart.setDate(previewStart.getDate() + 1);
previewStart.setHours(10, 30, 0, 0);

const PREVIEW_BOOKING: IEvent = {
	id: 0,
	title: "Haircut & style",
	description: "",
	startDate: previewStart.toISOString(),
	endDate: new Date(previewStart.getTime() + 45 * 60_000).toISOString(),
	color: "teal",
	user: { id: "x", name: "Amara Cole", picturePath: null },
	customer: { name: "Maya Brooks", email: "maya@example.com", phone: "+1 555 0100" },
};

export default function SettingsPage() {
	const store = useBookingStore();
	const { settings, hours, services } = store;
	const [template, setTemplate] = useState(settings.reminderTemplate);
	const [draftHours, setDraftHours] = useState<WeeklyHours>(hours);
	const [offsets, setOffsets] = useState(settings.reminderHoursBefore.join(", "));

	const saveHours = () => {
		for (const [i, d] of draftHours.entries()) {
			if (!d) continue;
			try {
				if (parseHHMM(d.close) <= parseHHMM(d.open)) throw new Error();
			} catch {
				toast.error(`${DAYS[i]}: closing time must be after opening time`);
				return;
			}
		}
		store.setHours(draftHours);
		toast.success("Opening hours saved");
	};

	const saveReminders = () => {
		const list = offsets
			.split(",")
			.map((x) => Number(x.trim()))
			.filter((n) => Number.isFinite(n) && n > 0 && n <= 168);
		if (list.length === 0) return toast.error("Add at least one reminder time between 1 and 168 hours");
		if (template.trim().length < 10) return toast.error("The reminder message is too short");
		store.updateSettings({ reminderHoursBefore: [...new Set(list)].sort((a, b) => b - a), reminderTemplate: template });
		toast.success("Reminder settings saved");
	};

	return (
		<>
			<PageHeader eyebrow="Workspace" title="Settings" description="Changes apply to your booking page and calendar straight away." />
			<div className="max-w-5xl space-y-6">

				<Card title="Business" description="Shown on your booking page and in reminder messages.">
					<div className="grid gap-4 sm:grid-cols-3">
						<div className="grid gap-2">
							<Label htmlFor="biz">Business name</Label>
							<Input id="biz" defaultValue={settings.businessName} onBlur={(e) => e.target.value.trim().length > 1 && store.updateSettings({ businessName: e.target.value.trim() })} />
						</div>
						<div className="grid gap-2">
							<Label>Currency</Label>
							<Select value={settings.currency} onValueChange={(v) => store.updateSettings({ currency: v })}>
								<SelectTrigger className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{["USD", "EUR", "GBP", "CAD", "AUD", "ZAR", "AED"].map((c) => (
										<SelectItem key={c} value={c}>
											{c}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="notice">Minimum notice (hours)</Label>
							<Input
								id="notice"
								type="number"
								min={0}
								max={72}
								defaultValue={settings.minNoticeHours}
								onBlur={(e) => store.updateSettings({ minNoticeHours: Math.min(72, Math.max(0, Number(e.target.value) || 0)) })}
							/>
						</div>
					</div>
				</Card>

				<Card title="Opening hours" description="Customers can only book inside these hours." action={<Button onClick={saveHours}>Save hours</Button>}>
					<div className="divide-y">
						{DAYS.map((name, i) => {
							const d = draftHours[i];
							return (
								<div key={name} className="flex flex-wrap items-center gap-3 py-2.5">
									<span className="w-28 text-sm font-medium">{name}</span>
									<Switch
										checked={!!d}
										aria-label={`${name} open`}
										onCheckedChange={(on) =>
											setDraftHours((h) => h.map((x, j) => (j === i ? (on ? { open: "09:00", close: "17:00" } : null) : x)))
										}
									/>
									{d ? (
										<div className="flex items-center gap-2">
											<Input
												type="time"
												className="w-32"
												value={d.open}
												aria-label={`${name} opens`}
												onChange={(e) => setDraftHours((h) => h.map((x, j) => (j === i && x ? { ...x, open: e.target.value } : x)))}
											/>
											<span className="text-muted-foreground">to</span>
											<Input
												type="time"
												className="w-32"
												value={d.close}
												aria-label={`${name} closes`}
												onChange={(e) => setDraftHours((h) => h.map((x, j) => (j === i && x ? { ...x, close: e.target.value } : x)))}
											/>
										</div>
									) : (
										<span className="text-sm text-muted-foreground">Closed</span>
									)}
								</div>
							);
						})}
					</div>
				</Card>

				<Card
					title="Services"
					description="Duration and buffer time decide which slots customers see."
					action={
						<Button
							variant="outline"
							onClick={() =>
								store.saveService({
									id: `svc-${Date.now().toString(36)}`,
									name: "New service",
									description: "Describe what is included.",
									durationMin: 30,
									bufferMin: 10,
									price: 25,
									color: "blue",
								})
							}
						>
							<Plus /> Add service
						</Button>
					}
				>
					<div className="space-y-3">
						{services.map((s) => (
							<ServiceRow key={s.id} service={s} onSave={store.saveService} onRemove={() => store.removeService(s.id)} />
						))}
					</div>
				</Card>

				<Card title="Automatic reminders" description="Queued on the dashboard for every confirmed booking." action={<Button onClick={saveReminders}>Save reminders</Button>}>
					<div className="grid gap-4 lg:grid-cols-2">
						<div className="space-y-4">
							<div className="grid gap-2">
								<Label htmlFor="offsets">Send reminders (hours before, comma separated)</Label>
								<Input id="offsets" value={offsets} onChange={(e) => setOffsets(e.target.value)} />
							</div>
							<div className="grid gap-2">
								<Label htmlFor="tpl">Message</Label>
								<Textarea id="tpl" rows={5} value={template} onChange={(e) => setTemplate(e.target.value)} />
								<p className="text-xs text-muted-foreground">Placeholders: {"{name} {service} {staff} {date} {time} {business}"}</p>
							</div>
						</div>
						<div>
							<Label className="mb-2 block">Preview</Label>
							<div className="rounded-2xl rounded-tl-sm bg-emerald-100 p-4 text-sm text-emerald-950 shadow-sm dark:bg-emerald-900/40 dark:text-emerald-50">
								{renderTemplate(template, PREVIEW_BOOKING, settings.businessName)}
							</div>
						</div>
					</div>
				</Card>

				<Card title="Demo data" description="Restore the sample team, services and appointments.">
					<Button
						variant="outline"
						onClick={() => {
							if (!window.confirm("Replace all data with the sample data?")) return;
							store.resetDemo();
							window.location.reload();
						}}
					>
						<RotateCcw /> Reset demo data
					</Button>
				</Card>
			</div>
		</>
	);
}

function Card({ title, description, action, children }: { title: string; description: string; action?: React.ReactNode; children: React.ReactNode }) {
	return (
		<section className="overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-card)]">
			<header className="flex flex-wrap items-start justify-between gap-3 border-b bg-muted/30 px-6 py-5">
				<div>
					<h2 className="text-base font-semibold">{title}</h2>
					<p className="text-sm text-muted-foreground">{description}</p>
				</div>
				{action}
			</header>
			<div className="p-6">{children}</div>
		</section>
	);
}

function ServiceRow({ service, onSave, onRemove }: { service: Service; onSave: (s: Service) => void; onRemove: () => void }) {
	const [s, setS] = useState(service);
	const dirty = JSON.stringify(s) !== JSON.stringify(service);
	const num = (v: string, min: number, max: number) => Math.min(max, Math.max(min, Math.round(Number(v) || 0)));
	return (
		<div className="grid items-end gap-3 rounded-lg border p-3 md:grid-cols-[1fr_90px_90px_90px_auto]">
			<div className="grid gap-1.5">
				<Label className="text-xs">Name</Label>
				<div className="flex items-center gap-2">
					<Select value={s.color} onValueChange={(v) => setS({ ...s, color: v as TEventColor })}>
						<SelectTrigger className="w-14" aria-label="Colour">
							<span className={cn("size-3 rounded-full", COLOR_DOT[s.color])} />
						</SelectTrigger>
						<SelectContent>
							{COLORS.map((c) => (
								<SelectItem key={c} value={c}>
									<span className={cn("size-3 rounded-full", COLOR_DOT[c])} /> {c}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Input value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} />
				</div>
			</div>
			<NumberField label="Minutes" value={s.durationMin} onChange={(v) => setS({ ...s, durationMin: num(v, 5, 480) })} />
			<NumberField label="Buffer" value={s.bufferMin} onChange={(v) => setS({ ...s, bufferMin: num(v, 0, 120) })} />
			<NumberField label="Price" value={s.price} onChange={(v) => setS({ ...s, price: num(v, 0, 100000) })} />
			<div className="flex gap-2">
				<Button
					disabled={!dirty || s.name.trim().length < 2}
					onClick={() => {
						onSave({ ...s, name: s.name.trim() });
						toast.success(`${s.name} saved`);
					}}
				>
					Save
				</Button>
				<Button variant="ghost" size="icon" aria-label={`Delete ${s.name}`} onClick={onRemove}>
					<Trash2 />
				</Button>
			</div>
		</div>
	);
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: string) => void }) {
	return (
		<div className="grid gap-1.5">
			<Label className="text-xs">{label}</Label>
			<Input type="number" value={value} onChange={(e) => onChange(e.target.value)} />
		</div>
	);
}
