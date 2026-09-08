import { count, desc, eq, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  campaigns,
  contacts,
  emailEvents,
  emails,
  messages,
  templates,
} from "@/lib/db/schema";
import {
  type AnalyticsCampaignOption,
  type AnalyticsData,
  computeRates,
  emptyRates,
} from "@/lib/analytics/types";

export async function getDashboardStats() {
  const [contactCount] = await db.select({ count: count() }).from(contacts);
  const [templateCount] = await db.select({ count: count() }).from(templates);
  const [campaignCount] = await db.select({ count: count() }).from(campaigns);
  const [emailCount] = await db.select({ count: count() }).from(emails);

  const eventStats = await db
    .select({
      type: emailEvents.type,
      count: count(),
    })
    .from(emailEvents)
    .groupBy(emailEvents.type);

  const recentEvents = await db
    .select({
      id: emailEvents.id,
      type: emailEvents.type,
      createdAt: emailEvents.createdAt,
      emailSubject: emails.subject,
      contactEmail: contacts.email,
    })
    .from(emailEvents)
    .innerJoin(emails, eq(emailEvents.emailId, emails.id))
    .innerJoin(contacts, eq(emails.contactId, contacts.id))
    .orderBy(sql`${emailEvents.createdAt} DESC`)
    .limit(10);

  const eventsByDay = await db
    .select({
      day: sql<string>`date(${emailEvents.createdAt})`.as("day"),
      count: count(),
    })
    .from(emailEvents)
    .groupBy(sql`date(${emailEvents.createdAt})`)
    .orderBy(sql`date(${emailEvents.createdAt}) DESC`)
    .limit(14);

  return {
    contacts: contactCount.count,
    templates: templateCount.count,
    campaigns: campaignCount.count,
    emails: emailCount.count,
    eventStats,
    recentEvents,
    eventsByDay: eventsByDay.reverse(),
  };
}

export async function listAnalyticsCampaigns(): Promise<AnalyticsCampaignOption[]> {
  const rows = await db
    .select({
      id: campaigns.id,
      name: campaigns.name,
      channel: campaigns.channel,
      status: campaigns.status,
      sentAt: campaigns.sentAt,
      createdAt: campaigns.createdAt,
      templateName: templates.name,
    })
    .from(campaigns)
    .innerJoin(templates, eq(campaigns.templateId, templates.id))
    .orderBy(desc(campaigns.sentAt), desc(campaigns.createdAt));

  const enriched = await Promise.all(
    rows.map(async (campaign) => {
      if (campaign.channel === "email") {
        const [emailStats] = await db
          .select({
            emailCount: count(emails.id),
            eventCount: count(emailEvents.id),
          })
          .from(emails)
          .leftJoin(emailEvents, eq(emailEvents.emailId, emails.id))
          .where(eq(emails.campaignId, campaign.id));

        return {
          ...campaign,
          emailCount: emailStats?.emailCount ?? 0,
          eventCount: emailStats?.eventCount ?? 0,
        };
      }

      const [msgStats] = await db
        .select({ count: count() })
        .from(messages)
        .where(eq(messages.campaignId, campaign.id));

      return {
        ...campaign,
        emailCount: 0,
        eventCount: msgStats?.count ?? 0,
      };
    }),
  );

  return enriched;
}

function emailCampaignCondition(campaignId?: string): SQL | undefined {
  return campaignId ? eq(emails.campaignId, campaignId) : undefined;
}

async function getEmailAnalytics(campaignId?: string): Promise<AnalyticsData> {
  const campaignFilter = emailCampaignCondition(campaignId);

  let campaignMeta: { name: string; channel: string } | null = null;
  if (campaignId) {
    const [campaign] = await db
      .select({ name: campaigns.name, channel: campaigns.channel })
      .from(campaigns)
      .where(eq(campaigns.id, campaignId));
    campaignMeta = campaign ?? null;
  }

  const eventStatsBase = db
    .select({
      type: emailEvents.type,
      count: count(),
    })
    .from(emailEvents)
    .innerJoin(emails, eq(emailEvents.emailId, emails.id));

  const eventStats = campaignFilter
    ? await eventStatsBase.where(campaignFilter).groupBy(emailEvents.type)
    : await eventStatsBase.groupBy(emailEvents.type);

  const allEventsBase = db
    .select({
      id: emailEvents.id,
      type: emailEvents.type,
      createdAt: emailEvents.createdAt,
      emailSubject: emails.subject,
      contactEmail: contacts.email,
      contactName: contacts.name,
      resendId: emails.resendId,
      campaignId: emails.campaignId,
      campaignName: campaigns.name,
    })
    .from(emailEvents)
    .innerJoin(emails, eq(emailEvents.emailId, emails.id))
    .innerJoin(contacts, eq(emails.contactId, contacts.id))
    .leftJoin(campaigns, eq(emails.campaignId, campaigns.id));

  const allEvents = campaignFilter
    ? await allEventsBase
        .where(campaignFilter)
        .orderBy(sql`${emailEvents.createdAt} DESC`)
        .limit(campaignId ? 500 : 100)
    : await allEventsBase
        .orderBy(sql`${emailEvents.createdAt} DESC`)
        .limit(campaignId ? 500 : 100);

  const eventsByDayBase = db
    .select({
      day: sql<string>`date(${emailEvents.createdAt})`.as("day"),
      type: emailEvents.type,
      count: count(),
    })
    .from(emailEvents)
    .innerJoin(emails, eq(emailEvents.emailId, emails.id));

  const eventsByDay = campaignFilter
    ? await eventsByDayBase
        .where(campaignFilter)
        .groupBy(sql`date(${emailEvents.createdAt})`, emailEvents.type)
        .orderBy(sql`date(${emailEvents.createdAt}) ASC`)
    : await eventsByDayBase
        .groupBy(sql`date(${emailEvents.createdAt})`, emailEvents.type)
        .orderBy(sql`date(${emailEvents.createdAt}) ASC`);

  return {
    campaignId: campaignId ?? null,
    campaignName: campaignMeta?.name ?? null,
    channel: campaignId
      ? ((campaignMeta?.channel as AnalyticsData["channel"]) ?? "email")
      : "all",
    eventStats,
    allEvents,
    eventsByDay,
    rates: computeRates(eventStats),
  };
}

async function getMessageCampaignAnalytics(campaignId: string): Promise<AnalyticsData> {
  const [campaign] = await db
    .select({
      name: campaigns.name,
      channel: campaigns.channel,
    })
    .from(campaigns)
    .where(eq(campaigns.id, campaignId));

  if (!campaign) {
    return {
      campaignId,
      campaignName: null,
      channel: "email",
      eventStats: [],
      allEvents: [],
      eventsByDay: [],
      rates: emptyRates(),
    };
  }

  const rows = await db
    .select({
      id: messages.id,
      status: messages.status,
      createdAt: messages.createdAt,
      sentAt: messages.sentAt,
      subject: messages.subject,
      contactEmail: contacts.email,
      contactName: contacts.name,
    })
    .from(messages)
    .innerJoin(contacts, eq(messages.contactId, contacts.id))
    .where(eq(messages.campaignId, campaignId))
    .orderBy(sql`coalesce(${messages.sentAt}, ${messages.createdAt}) DESC`)
    .limit(500);

  const statusCounts = rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});

  const sent = (statusCounts.sent ?? 0) + (statusCounts.demo ?? 0);
  const failed = statusCounts.failed ?? 0;
  const skipped = statusCounts.skipped ?? 0;
  const queued = statusCounts.queued ?? 0;

  const eventsByDayMap = rows.reduce<Record<string, number>>((acc, row) => {
    const day = (row.sentAt ?? row.createdAt).slice(0, 10);
    acc[day] = (acc[day] ?? 0) + 1;
    return acc;
  }, {});

  return {
    campaignId,
    campaignName: campaign.name,
    channel: campaign.channel as "whatsapp" | "telegram",
    eventStats: Object.entries(statusCounts).map(([type, count]) => ({ type, count })),
    allEvents: rows.map((row) => ({
      id: row.id,
      type: row.status,
      createdAt: row.sentAt ?? row.createdAt,
      emailSubject: row.subject,
      contactEmail: row.contactEmail,
      contactName: row.contactName,
      resendId: null,
      campaignId,
      campaignName: campaign.name,
    })),
    eventsByDay: Object.entries(eventsByDayMap).map(([day, count]) => ({
      day,
      type: "message",
      count,
    })),
    rates: {
      sent: sent + queued,
      delivered: sent,
      opened: 0,
      openedHuman: 0,
      openedBot: skipped,
      botProbes: statusCounts.demo ?? 0,
      clicked: 0,
      bounced: failed,
    },
  };
}

export async function getAnalytics(campaignId?: string): Promise<AnalyticsData> {
  if (!campaignId) {
    return getEmailAnalytics();
  }

  const [campaign] = await db
    .select({ channel: campaigns.channel })
    .from(campaigns)
    .where(eq(campaigns.id, campaignId));

  if (!campaign) {
    return getEmailAnalytics();
  }

  if (campaign.channel === "email") {
    return getEmailAnalytics(campaignId);
  }

  return getMessageCampaignAnalytics(campaignId);
}
