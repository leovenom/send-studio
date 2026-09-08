"use client";

import { useCallback, useState } from "react";
import { EmptyState, PageHeader, SectionCard, Skeleton, StatCard } from "@/components/ui/page-header";
import { BotHumanChart, EventsChart, FunnelChart } from "@/components/analytics/charts-lazy";
import { ChannelBadge, StatusBadge } from "@/components/ui/status-badges";
import { Select } from "@/components/ui/select";
import { useLocale, useT } from "@/components/locale/locale-provider";
import type { AnalyticsCampaignOption, AnalyticsData } from "@/lib/analytics/types";
import { cn, formatDate, formatPercent } from "@/lib/utils";
import { apiFetch } from "@/lib/api-fetch";
import {
  Activity,
  AlertTriangle,
  Bot,
  Download,
  Loader2,
  MailCheck,
  MousePointerClick,
  Eye,
  UserCheck,
} from "lucide-react";

interface AnalyticsContentProps {
  initialAnalytics: AnalyticsData;
  campaigns: AnalyticsCampaignOption[];
}

export function AnalyticsContent({
  initialAnalytics,
  campaigns,
}: AnalyticsContentProps) {
  const t = useT();
  const { locale } = useLocale();
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [analytics, setAnalytics] = useState<AnalyticsData>(initialAnalytics);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const isEmailView =
    analytics.channel === "all" || analytics.channel === "email";

  const loadAnalytics = useCallback(async (campaignId: string) => {
    setLoading(true);
    try {
      const qs = campaignId !== "all" ? `?campaignId=${encodeURIComponent(campaignId)}` : "";
      const res = await apiFetch(`/api/analytics${qs}`);
      const data = await res.json();
      setAnalytics(data);
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleCampaignChange(campaignId: string) {
    setSelectedCampaign(campaignId);
    await loadAnalytics(campaignId);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const qs =
        selectedCampaign !== "all"
          ? `?campaignId=${encodeURIComponent(selectedCampaign)}`
          : "";
      const res = await apiFetch(`/api/analytics/export${qs}`);
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? "send-studio-analytics.csv";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  const { rates } = analytics;

  const humanOpenPct = formatPercent(rates.openedHuman, rates.opened || rates.delivered);
  const botOpenPct = formatPercent(rates.openedBot, rates.opened || rates.delivered);

  const emailMetrics = [
    {
      label: t("analytics.deliveryRate"),
      value: formatPercent(rates.delivered, rates.sent),
      detail: t("analytics.deliveryDetail", { delivered: rates.delivered, sent: rates.sent }),
      icon: MailCheck,
      tone: "cyan" as const,
    },
    {
      label: t("analytics.humanOpens"),
      value: humanOpenPct,
      detail: t("analytics.humanOpensDetail", { human: rates.openedHuman, total: rates.opened }),
      icon: UserCheck,
      tone: "emerald" as const,
    },
    {
      label: t("analytics.botOpens"),
      value: botOpenPct,
      detail: t("analytics.botOpensDetail", { bots: rates.openedBot, probes: rates.botProbes }),
      icon: Bot,
      tone: "amber" as const,
    },
    {
      label: t("analytics.clickRate"),
      value: formatPercent(rates.clicked, rates.openedHuman || rates.opened),
      detail: t("analytics.clickDetail", { clicked: rates.clicked }),
      icon: MousePointerClick,
      tone: "violet" as const,
    },
  ];

  const messageMetrics = [
    {
      label: t("analytics.messagesSent"),
      value: String(rates.delivered),
      detail: t("analytics.messagesSentDetail", { total: rates.sent }),
      icon: MailCheck,
      tone: "cyan" as const,
    },
    {
      label: t("analytics.messagesFailed"),
      value: String(rates.bounced),
      detail: t("analytics.messagesFailedDetail"),
      icon: AlertTriangle,
      tone: "amber" as const,
    },
    {
      label: t("analytics.messagesSkipped"),
      value: String(rates.openedBot),
      detail: t("analytics.messagesSkippedDetail"),
      icon: Bot,
      tone: "violet" as const,
    },
    {
      label: t("analytics.messagesDemo"),
      value: String(rates.botProbes),
      detail: t("analytics.messagesDemoDetail"),
      icon: Activity,
      tone: "blue" as const,
    },
  ];

  const metrics = isEmailView ? emailMetrics : messageMetrics;

  const secondaryMetrics = isEmailView
    ? [
        {
          label: t("analytics.totalOpens"),
          value: String(rates.opened),
          detail: t("analytics.totalOpensDetail"),
          icon: Eye,
          tone: "blue" as const,
        },
        {
          label: t("analytics.bounces"),
          value: String(rates.bounced),
          detail: t("analytics.bouncesDetail"),
          icon: AlertTriangle,
          tone: "amber" as const,
        },
      ]
    : [];

  const chartData = Object.entries(
    analytics.eventsByDay.reduce<Record<string, number>>((acc, row) => {
      acc[row.day] = (acc[row.day] ?? 0) + row.count;
      return acc;
    }, {}),
  ).map(([day, count]) => ({ day, count }));

  const selectedCampaignMeta = campaigns.find((c) => c.id === selectedCampaign);

  return (
    <>
      <PageHeader
        accent
        label={t("analytics.label")}
        title={t("analytics.title")}
        description={t("analytics.description")}
        action={
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || loading}
            className="btn-accent-secondary px-4 py-2.5 text-sm disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4 text-[#8ec5ff]" />
            )}
            {exporting ? t("analytics.exporting") : t("analytics.downloadCsv")}
          </button>
        }
      />

      <div className="accent-panel mb-8 flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="label-caps">{t("analytics.filterCampaign")}</p>
          <Select
            value={selectedCampaign}
            onChange={(e) => handleCampaignChange(e.target.value)}
            className="max-w-md"
            disabled={loading}
          >
            <option value="all">{t("analytics.allCampaigns")}</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name} · {campaign.channel} · {campaign.eventCount}{" "}
                {t("analytics.eventsShort")}
              </option>
            ))}
          </Select>
          {selectedCampaignMeta && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <ChannelBadge channel={selectedCampaignMeta.channel} />
              <span>{selectedCampaignMeta.templateName}</span>
              {selectedCampaignMeta.sentAt && (
                <span>
                  {t("common.sent")} · {formatDate(selectedCampaignMeta.sentAt, locale)}
                </span>
              )}
            </div>
          )}
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("common.loading")}
          </div>
        )}
      </div>

      {isEmailView && (
        <div className="accent-callout mb-8 px-5 py-4 text-sm leading-relaxed text-muted">
          <strong className="gradient-text font-medium">{t("analytics.honeypotTitle")}</strong>{" "}
          {t("analytics.honeypotBody")}
        </div>
      )}

      {!isEmailView && (
        <div className="accent-callout mb-8 px-5 py-4 text-sm leading-relaxed text-muted">
          {t("analytics.messageChannelNote")}
        </div>
      )}

      <div
        className={cn(
          "mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
          loading && "pointer-events-none opacity-60",
        )}
      >
        {metrics.map((metric, i) => (
          <div key={metric.label} style={{ animationDelay: `${i * 50}ms` }} className="animate-fade-in">
            <StatCard {...metric} />
          </div>
        ))}
      </div>

      {secondaryMetrics.length > 0 && (
        <div
          className={cn(
            "mb-8 grid gap-4 sm:grid-cols-2",
            loading && "pointer-events-none opacity-60",
          )}
        >
          {secondaryMetrics.map((metric, i) => (
            <div
              key={metric.label}
              style={{ animationDelay: `${(i + 4) * 50}ms` }}
              className="animate-fade-in"
            >
              <StatCard {...metric} />
            </div>
          ))}
        </div>
      )}

      {isEmailView && (
        <div
          className={cn(
            "mb-8 grid gap-6 lg:grid-cols-2",
            loading && "pointer-events-none opacity-60",
          )}
        >
          <SectionCard title={t("analytics.funnel")} label={t("analytics.funnelLabel")} tone="blue">
            <FunnelChart rates={rates} />
          </SectionCard>

          <SectionCard
            title={t("analytics.humanVsBot")}
            label={t("analytics.classificationLabel")}
            tone="violet"
          >
            <BotHumanChart rates={rates} />
          </SectionCard>
        </div>
      )}

      <div className={cn("mb-8", loading && "pointer-events-none opacity-60")}>
        <SectionCard title={t("analytics.timeline")} label={t("analytics.timelineLabel")} tone="cyan">
          {loading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : (
            <EventsChart data={chartData} />
          )}
        </SectionCard>
      </div>

      <SectionCard
        title={t("analytics.eventLog")}
        label={t("analytics.logLabel")}
        tone="emerald"
        className="overflow-hidden"
      >
        {loading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : analytics.allEvents.length === 0 ? (
          <EmptyState
            icon={Activity}
            title={t("analytics.noEventsTitle")}
            description={t("analytics.noEventsDesc")}
          />
        ) : (
          <div className="-mx-6 -mb-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gradient-to-r from-[#8ec5ff]/8 via-[#a78bfa]/6 to-[#5eead4]/8 text-left">
                  <th className="label-caps px-6 py-3 !text-[10px]">
                    {t("analytics.colEvent")}
                  </th>
                  <th className="label-caps px-6 py-3 !text-[10px]">
                    {t("analytics.colContact")}
                  </th>
                  <th className="label-caps px-6 py-3 !text-[10px]">
                    {t("analytics.colSubject")}
                  </th>
                  {selectedCampaign === "all" && (
                    <th className="label-caps px-6 py-3 !text-[10px]">
                      {t("analytics.colCampaign")}
                    </th>
                  )}
                  <th className="label-caps px-6 py-3 !text-[10px]">
                    {t("analytics.colDate")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {analytics.allEvents.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b border-border/80 transition-colors hover:bg-[#8ec5ff]/5"
                  >
                    <td className="px-6 py-4">
                      <StatusBadge status={event.type} />
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{event.contactName}</p>
                      <p className="text-xs text-muted">{event.contactEmail}</p>
                    </td>
                    <td className="max-w-xs truncate px-6 py-4 text-muted">
                      {event.emailSubject ?? "—"}
                    </td>
                    {selectedCampaign === "all" && (
                      <td className="max-w-[10rem] truncate px-6 py-4 text-xs text-muted">
                        {event.campaignName ?? "—"}
                      </td>
                    )}
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-muted-foreground">
                      {formatDate(event.createdAt, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </>
  );
}
