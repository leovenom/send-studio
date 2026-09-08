"use client";

import Link from "next/link";
import { PageHeader, SectionCard, StatCard } from "@/components/ui/page-header";
import { EventsChart } from "@/components/analytics/charts-lazy";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badges";
import { useLocale, useT } from "@/components/locale/locale-provider";
import { accentToneStyles } from "@/lib/accent-styles";
import { cn, formatDate } from "@/lib/utils";
import {
  ArrowRight,
  LayoutTemplate,
  Mail,
  Send,
  Users,
  Zap,
} from "lucide-react";

interface DashboardContentProps {
  stats: Awaited<ReturnType<typeof import("@/lib/queries").getDashboardStats>>;
}

export function DashboardContent({ stats }: DashboardContentProps) {
  const t = useT();
  const { locale } = useLocale();

  const cards = [
    { label: t("dashboard.statContacts"), value: stats.contacts, icon: Users, tone: "blue" as const },
    { label: t("dashboard.statTemplates"), value: stats.templates, icon: LayoutTemplate, tone: "violet" as const },
    { label: t("dashboard.statCampaigns"), value: stats.campaigns, icon: Send, tone: "cyan" as const },
    { label: t("dashboard.statEmailsSent"), value: stats.emails, icon: Mail, tone: "emerald" as const },
  ];

  return (
    <>
      <PageHeader
        accent
        label={t("dashboard.label")}
        title={t("dashboard.title")}
        description={t("dashboard.description")}
        action={
          <Link
            href="/campaigns"
            className="btn-accent px-4 py-2.5 text-sm"
          >
            <Zap className="h-4 w-4" aria-hidden />
            {t("dashboard.newCampaign")}
          </Link>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <div key={card.label} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
            <StatCard {...card} />
          </div>
        ))}
      </div>

      <div className="mb-8 grid items-start gap-6 lg:grid-cols-2">
        <SectionCard title={t("dashboard.eventsPerDay")} label="Gráfico" tone="blue" className="!shadow-sm">
          <EventsChart data={stats.eventsByDay} variant="compact" />
        </SectionCard>

        <SectionCard
          title={t("dashboard.recentActivity")}
          label="Atividade"
          tone="violet"
          className="!shadow-sm"
          action={
            <Link href="/analytics">
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                {t("common.viewAll")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          }
        >
          {stats.recentEvents.length === 0 ? (
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-accent/30 px-4 py-5">
              <Mail className="h-8 w-8 shrink-0 text-[#a78bfa]" />
              <div>
                <p className="text-sm font-medium">{t("dashboard.noEvents")}</p>
                <Link href="/campaigns" className="mt-1 inline-block text-xs font-medium text-[#7c3aed] underline dark:text-[#c4b5fd]">
                  {t("dashboard.sendFirstCampaign")}
                </Link>
              </div>
            </div>
          ) : (
            <ul className="max-h-[220px] space-y-2 overflow-y-auto pr-1">
              {stats.recentEvents.map((event) => (
                <li
                  key={event.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-accent/20 px-3 py-2.5 transition-colors hover:bg-[#8ec5ff]/5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{event.emailSubject}</p>
                    <p className="truncate text-xs text-muted">{event.contactEmail}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <StatusBadge status={event.type} />
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                      {formatDate(event.createdAt, locale)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {[
          { href: "/templates", label: t("dashboard.quickCreateTemplate"), desc: t("dashboard.quickCreateTemplateDesc"), icon: LayoutTemplate, tone: "blue" as const },
          { href: "/contacts", label: t("dashboard.quickManageContacts"), desc: t("dashboard.quickManageContactsDesc"), icon: Users, tone: "violet" as const },
          { href: "/analytics", label: t("dashboard.quickAnalytics"), desc: t("dashboard.quickAnalyticsDesc"), icon: Mail, tone: "cyan" as const },
        ].map(({ href, label, desc, icon: Icon, tone }) => {
          const style = accentToneStyles[tone];
          return (
            <Link key={href} href={href}>
              <div
                className={cn(
                  "group flex h-full items-center gap-3 rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5",
                  style.glow,
                  "border-border hover:border-[#8ec5ff]/25",
                )}
              >
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", style.icon)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="truncate text-xs text-muted">{desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
