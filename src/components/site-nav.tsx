"use client";

import { CalendarDays, Copy, ExternalLink, Moon, Settings2, Sparkles, Sun, SunMedium } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useBookingStore } from "@/features/booking/store";
import { cn } from "@/lib/utils";

const LINKS = [
	{ href: "/", label: "Today", icon: SunMedium },
	{ href: "/calendar", label: "Calendar", icon: CalendarDays },
	{ href: "/settings", label: "Settings", icon: Settings2 },
];

export function LogoMark({ className }: { className?: string }) {
	return (
		<div className={cn("bg-brand-gradient flex size-9 items-center justify-center rounded-xl text-white shadow-[var(--shadow-glow)]", className)}>
			<svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
				<rect x="3.5" y="5" width="17" height="15" rx="3" />
				<path d="M8 3v4M16 3v4M3.5 10h17M9 15l2 2 4-4" />
			</svg>
		</div>
	);
}

export function Logo({ name, inverted }: { name?: string; inverted?: boolean }) {
	return (
		<div className="flex items-center gap-2.5">
			<LogoMark />
			<div className="leading-tight">
				<p className="font-display text-[15px] font-semibold">BookFlow</p>
				<p className={cn("text-xs", inverted ? "text-white/55" : "text-muted-foreground")}>{name ?? "by Gabriel.ATH"}</p>
			</div>
		</div>
	);
}

function ThemeButton({ className }: { className?: string }) {
	const { resolvedTheme, setTheme } = useTheme();
	const dark = resolvedTheme === "dark";
	return (
		<button
			type="button"
			onClick={() => setTheme(dark ? "light" : "dark")}
			aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
			className={cn("flex size-9 items-center justify-center rounded-lg transition-colors", className)}
		>
			{dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
		</button>
	);
}

function useBookingUrl() {
	if (typeof window === "undefined") return "/book/";
	const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
	return `${window.location.origin}${base}/book/`;
}

/** Application frame: black sidebar on desktop, compact top bar on mobile. */
export function AppShell({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const business = useBookingStore((s) => s.settings.businessName);
	const bookingUrl = useBookingUrl();
	const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

	const copyLink = async () => {
		try {
			await navigator.clipboard.writeText(bookingUrl);
			toast.success("Booking link copied");
		} catch {
			toast.error("Could not copy. Select the link and copy it manually.");
		}
	};

	return (
		<div className="min-h-screen lg:pl-64">
			<aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-sidebar p-4 text-sidebar-foreground lg:flex">
				<Link href="/" className="px-2 py-1.5">
					<Logo name={business} inverted />
				</Link>

				<nav className="mt-8 space-y-1" aria-label="Main">
					<p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">Workspace</p>
					{LINKS.map(({ href, label, icon: Icon }) => (
						<Link
							key={href}
							href={href}
							className={cn(
								"group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/65 transition-colors hover:bg-sidebar-accent hover:text-white",
								isActive(href) && "bg-sidebar-accent text-white",
							)}
						>
							<Icon className={cn("size-4", isActive(href) && "text-red-400")} />
							{label}
							{isActive(href) && <span className="bg-brand-gradient ml-auto size-1.5 rounded-full" />}
						</Link>
					))}
				</nav>

				<div className="mt-auto space-y-3">
					<div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-4">
						<div className="bg-brand-gradient pointer-events-none absolute -right-8 -top-8 size-24 rounded-full opacity-40 blur-2xl" />
						<p className="flex items-center gap-1.5 text-xs font-semibold text-white">
							<Sparkles className="size-3.5 text-orange-300" /> Your booking page
						</p>
						<p className="mt-1 text-xs leading-relaxed text-white/55">Share it on Instagram, Google or WhatsApp. Clients book 24/7.</p>
						<div className="mt-3 flex gap-2">
							<Link
								href="/book"
								className="bg-brand-gradient flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold text-white"
							>
								<ExternalLink className="size-3.5" /> Open
							</Link>
							<button
								type="button"
								onClick={copyLink}
								className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/10 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
							>
								<Copy className="size-3.5" /> Copy link
							</button>
						</div>
					</div>
					<div className="flex items-center justify-between px-2">
						<p className="text-xs text-white/40">Demo workspace</p>
						<ThemeButton className="text-white/70 hover:bg-white/10 hover:text-white" />
					</div>
				</div>
			</aside>

			<header className="sticky top-0 z-30 flex items-center gap-2 border-b bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
				<Link href="/">
					<LogoMark className="size-8" />
				</Link>
				<nav className="flex flex-1 items-center gap-1 overflow-x-auto" aria-label="Main">
					{LINKS.map(({ href, label, icon: Icon }) => (
						<Link
							key={href}
							href={href}
							className={cn(
								"flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground",
								isActive(href) && "bg-foreground text-background",
							)}
						>
							<Icon className="size-4" />
							{label}
						</Link>
					))}
				</nav>
				<ThemeButton className="hover:bg-muted" />
			</header>

			<main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
		</div>
	);
}

/** Page heading used across the workspace. */
export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: React.ReactNode }) {
	return (
		<div className="mb-8 flex flex-wrap items-end justify-between gap-4">
			<div>
				{eyebrow && <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-brand">{eyebrow}</p>}
				<h1 className="text-[28px] font-semibold leading-tight sm:text-[32px]">{title}</h1>
				{description && <p className="mt-1.5 max-w-xl text-muted-foreground">{description}</p>}
			</div>
			{actions && <div className="flex flex-wrap gap-2">{actions}</div>}
		</div>
	);
}
