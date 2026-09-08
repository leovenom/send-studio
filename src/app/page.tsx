import { AppShell } from "@/components/layout/app-shell";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { createPageMetadata } from "@/lib/seo/metadata";
import { getDashboardStats } from "@/lib/queries";

export const metadata = createPageMetadata({
  title: "Dashboard",
  description:
    "Overview of your email CRM — contacts, templates, campaigns, and real-time delivery analytics.",
  path: "/",
});

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <AppShell>
      <DashboardContent stats={stats} />
    </AppShell>
  );
}
