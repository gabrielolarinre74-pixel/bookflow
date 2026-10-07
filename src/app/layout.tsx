import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "@/components/app-providers";

export const metadata: Metadata = {
	title: "BookFlow · Online booking & reminders for service businesses",
	description:
		"BookFlow lets salons, clinics, studios and consultants take bookings online 24/7, manage the team calendar and send appointment reminders that cut no-shows.",
	applicationName: "BookFlow",
	authors: [{ name: "Gabriel Zion" }],
	keywords: ["booking system", "appointment scheduling", "salon booking", "reminders", "nextjs", "small business"],
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body>
				<AppProviders>{children}</AppProviders>
			</body>
		</html>
	);
}
