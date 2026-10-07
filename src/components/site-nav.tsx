"use client";

import { CalendarCheck2, LayoutDashboard, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModeToggle } from "@/components/mode-toggle";
import { useBookingStore } from "@/features/booking/store";
import { cn } from "@/lib/utils";

const LINKS = [
	{ href: "/", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/book", label: "Booking page", icon: CalendarCheck2 },
	{ href: "/settings", label: "Settings", icon: Settings },
];

export function Logo({ name }: { name?: string }) {
	return (
		<div className="flex items-center gap-2.5">
			<div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-orange-400 text-white shadow-md shadow-rose-500/20">
				<CalendarCheck2 className="size-5" />
			</div>
			<div className="leading-tight">
				<p className="font-bold tracking-tight">BookFlow</p>
				<p className="text-xs text-muted-foreground">{name ?? "by Gabriel.ATH"}</p>
			</div>
		</div>
	);
}

export function SiteNav() {
	const pathname = usePathname();
	const business = useBookingStore((s) => s.settings.businessName);
	return (
		<header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
			<div className="mx-auto flex max-w-[1500px] items-center gap-4 px-4 py-3">
				<Link href="/">
					<Logo name={business} />
				</Link>
				<nav className="ml-auto flex items-center gap-1">
					{LINKS.map(({ href, label, icon: Icon }) => {
						const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
						return (
							<Link
								key={href}
								href={href}
								className={cn(
									"flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
									active && "bg-muted text-foreground",
								)}
							>
								<Icon className="size-4" />
								<span className="hidden sm:inline">{label}</span>
							</Link>
						);
					})}
					<ModeToggle />
				</nav>
			</div>
		</header>
	);
}
