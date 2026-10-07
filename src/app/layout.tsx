import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/app-providers";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

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
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<AppProviders>{children}</AppProviders>
			</body>
		</html>
	);
}
