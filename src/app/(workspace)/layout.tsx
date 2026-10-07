import { AppShell } from "@/components/site-nav";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
	return <AppShell>{children}</AppShell>;
}
