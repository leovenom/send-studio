"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/components/ui/page-header";
import { useLocale, useT } from "@/components/locale/locale-provider";
import { BarChart3 } from "lucide-react";

const FUNNEL_COLORS = ["#8ec5ff", "#a78bfa", "#5eead4", "#34d399"];

function ChartTooltip({
  active,
  payload,
  label,
  locale,
  t,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  locale: string;
  t: (key: "charts.events", vars?: Record<string, string | number>) => string;
}) {
  if (!active || !payload?.length) return null;
  const count = payload[0].value;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      {label && (
        <p className="mb-1 text-xs text-muted">
          {new Date(String(label)).toLocaleDateString(locale, {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </p>
      )}
      <p className="text-sm font-semibold">{t("charts.events", { count })}</p>
    </div>
  );
}

function eventsChartHeight(pointCount: number, variant: "default" | "compact") {
  if (variant === "compact") {
    if (pointCount <= 2) return 128;
    if (pointCount <= 5) return 168;
    if (pointCount <= 10) return 200;
    return 232;
  }
  if (pointCount <= 3) return 200;
  if (pointCount <= 7) return 240;
  return 280;
}

function yAxisWidthForCounts(values: number[]) {
  const max = Math.max(0, ...values);
  const digits = max > 0 ? String(max).length : 1;
  return Math.max(32, digits * 10 + 14);
}

export function EventsChart({
  data,
  variant = "default",
}: {
  data: { day: string; count: number }[];
  variant?: "default" | "compact";
}) {
  const t = useT();
  const { locale } = useLocale();
  const compact = variant === "compact";
  const total = data.reduce((sum, row) => sum + row.count, 0);

  if (data.length === 0) {
    if (compact) {
      return (
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-accent/30 px-4 py-5">
          <BarChart3 className="h-8 w-8 shrink-0 text-[#8ec5ff]" />
          <div>
            <p className="text-sm font-medium">{t("charts.noEvents")}</p>
            <p className="text-xs text-muted">{t("charts.noEventsDesc")}</p>
          </div>
        </div>
      );
    }
    return (
      <EmptyState
        icon={BarChart3}
        title={t("charts.noEvents")}
        description={t("charts.noEventsDesc")}
      />
    );
  }

  const height = eventsChartHeight(data.length, variant);
  const maxBarSize = data.length <= 2 ? 64 : data.length <= 5 ? 52 : 48;
  const yAxisWidth = yAxisWidthForCounts(data.map((row) => row.count));

  return (
    <div className={compact ? "space-y-3" : undefined}>
      {compact && data.length <= 7 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[#8ec5ff]/30 bg-[#8ec5ff]/10 px-2.5 py-1 font-mono text-[11px] text-[#2563eb] dark:text-[#8ec5ff]">
            {total}{" "}
            {t(total === 1 ? "charts.event_one" : "charts.event_other")}
          </span>
          {data.map((row) => (
            <span
              key={row.day}
              className="rounded-md border border-border bg-accent/50 px-2 py-1 font-mono text-[10px] text-muted"
            >
              {new Date(row.day).toLocaleDateString(locale, {
                day: "2-digit",
                month: "short",
              })}
              {" · "}
              {row.count}
            </span>
          ))}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
          barCategoryGap={data.length <= 3 ? "18%" : "12%"}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fill: "var(--muted)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) =>
              new Date(v).toLocaleDateString(locale, {
                day: "2-digit",
                month: "short",
              })
            }
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--muted)" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            width={yAxisWidth}
            tickMargin={6}
          />
          <Tooltip content={<ChartTooltip locale={locale} t={t} />} />
          <Bar dataKey="count" fill="#8ec5ff" radius={[6, 6, 0, 0]} maxBarSize={maxBarSize} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BotHumanChart({
  rates,
}: {
  rates: {
    opened: number;
    openedHuman: number;
    openedBot: number;
    botProbes: number;
  };
}) {
  const t = useT();
  const { locale } = useLocale();

  const data = [
    { stage: t("charts.totalOpens"), value: rates.opened },
    { stage: t("charts.humanOpens"), value: rates.openedHuman },
    { stage: t("charts.botScanners"), value: rates.openedBot },
    { stage: t("charts.honeypotProbe"), value: rates.botProbes },
  ].filter((d) => d.value > 0 || d.stage === t("charts.totalOpens"));

  const hasData = rates.opened > 0 || rates.botProbes > 0;

  if (!hasData) {
    return (
      <EmptyState
        icon={BarChart3}
        title={t("charts.noOpenData")}
        description={t("charts.noOpenDataDesc")}
      />
    );
  }

  const colors = ["#8ec5ff", "#34d399", "#f59e0b", "#f87171"];

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ left: 4, right: 16, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "var(--muted)" }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="stage"
          tick={{ fontSize: 11, fill: "var(--muted)" }}
          axisLine={false}
          tickLine={false}
          width={120}
        />
        <Tooltip content={<ChartTooltip locale={locale} t={t} />} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={28}>
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i] ?? "#0a0a0a"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function FunnelChart({
  rates,
}: {
  rates: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
  };
}) {
  const t = useT();
  const { locale } = useLocale();

  const data = [
    { stage: t("charts.funnelSent"), value: rates.sent },
    { stage: t("charts.funnelDelivered"), value: rates.delivered },
    { stage: t("charts.opened"), value: rates.opened },
    { stage: t("charts.clicked"), value: rates.clicked },
  ];

  const hasData = data.some((d) => d.value > 0);

  if (!hasData) {
    return (
      <EmptyState
        icon={BarChart3}
        title={t("charts.funnelEmpty")}
        description={t("charts.funnelEmptyDesc")}
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ left: 4, right: 16, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "var(--muted)" }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="stage"
          tick={{ fontSize: 11, fill: "var(--muted)" }}
          axisLine={false}
          tickLine={false}
          width={72}
        />
        <Tooltip content={<ChartTooltip locale={locale} t={t} />} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={28}>
          {data.map((_, i) => (
            <Cell key={i} fill={FUNNEL_COLORS[i] ?? "#0a0a0a"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
