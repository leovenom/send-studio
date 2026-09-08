import { AppShell } from "@/components/layout/app-shell";
import { AnalyticsContent } from "@/components/analytics/analytics-content";
import { getAnalytics, listAnalyticsCampaigns } from "@/lib/queries";

export default async function AnalyticsPage() {
  const [analytics, campaigns] = await Promise.all([
    getAnalytics(),
    listAnalyticsCampaigns(),
  ]);

  return (
    <AppShell>
      <AnalyticsContent initialAnalytics={analytics} campaigns={campaigns} />
    </AppShell>
  );
}
