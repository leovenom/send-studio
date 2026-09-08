export type AnalyticsRates = {
  sent: number;
  delivered: number;
  opened: number;
  openedHuman: number;
  openedBot: number;
  botProbes: number;
  clicked: number;
  bounced: number;
};

export type AnalyticsEventRow = {
  id: string;
  type: string;
  createdAt: string;
  emailSubject: string | null;
  contactEmail: string;
  contactName: string;
  resendId: string | null;
  campaignId: string | null;
  campaignName: string | null;
};

export type AnalyticsData = {
  campaignId: string | null;
  campaignName: string | null;
  channel: "all" | "email" | "whatsapp" | "telegram";
  eventStats: { type: string; count: number }[];
  allEvents: AnalyticsEventRow[];
  eventsByDay: { day: string; type: string; count: number }[];
  rates: AnalyticsRates;
};

export type AnalyticsCampaignOption = {
  id: string;
  name: string;
  channel: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
  templateName: string;
  emailCount: number;
  eventCount: number;
};

export function computeRates(
  eventStats: { type: string; count: number }[],
): AnalyticsRates {
  const sent = eventStats.find((e) => e.type === "email.sent")?.count ?? 0;
  const delivered = eventStats.find((e) => e.type === "email.delivered")?.count ?? 0;
  const opened = eventStats.find((e) => e.type === "email.opened")?.count ?? 0;
  const openedHuman =
    eventStats.find((e) => e.type === "email.opened_human")?.count ?? 0;
  const openedBot = eventStats.find((e) => e.type === "email.opened_bot")?.count ?? 0;
  const botProbes = eventStats.find((e) => e.type === "email.bot_probe")?.count ?? 0;
  const clicked = eventStats.find((e) => e.type === "email.clicked")?.count ?? 0;
  const bounced = eventStats.find((e) => e.type === "email.bounced")?.count ?? 0;

  const classifiedOpens = openedHuman + openedBot;
  const humanOpenRate =
    classifiedOpens > 0 ? openedHuman : opened > 0 ? Math.max(0, opened - openedBot) : 0;

  return {
    sent,
    delivered,
    opened,
    openedHuman: classifiedOpens > 0 ? openedHuman : humanOpenRate,
    openedBot: classifiedOpens > 0 ? openedBot : botProbes,
    botProbes,
    clicked,
    bounced,
  };
}

export function emptyRates(): AnalyticsRates {
  return {
    sent: 0,
    delivered: 0,
    opened: 0,
    openedHuman: 0,
    openedBot: 0,
    botProbes: 0,
    clicked: 0,
    bounced: 0,
  };
}
