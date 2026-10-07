"use client";

import { type ReactNode, useEffect, useState } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { useBookingStore } from "@/features/booking/store";

/**
 * Restores saved data from localStorage before rendering the app, so the
 * statically exported HTML never mismatches what the browser has stored.
 */
export function AppProviders({ children }: { children: ReactNode }) {
	const [ready, setReady] = useState(false);
	useEffect(() => {
		Promise.resolve(useBookingStore.persist.rehydrate()).finally(() => setReady(true));
	}, []);
	return (
		<ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
			{ready ? (
				children
			) : (
				<div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>
			)}
			<Toaster richColors closeButton />
		</ThemeProvider>
	);
}
