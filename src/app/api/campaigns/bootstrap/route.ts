import { eq, sql } from "drizzle-orm";
import { jsonList } from "@/lib/api-list-response";
import { db } from "@/lib/db";
import { campaigns, contacts, templates } from "@/lib/db/schema";
import {
  formatCampaignSenderSummary,
  getDefaultSenders,
  parseCampaignSender,
} from "@/lib/messaging/campaign-sender";

/** One round-trip for /campaigns — avoids 4 cold starts on Vercel. */
export async function GET() {
  const [campaignRows, templateRows, contactRows] = await Promise.all([
    db
      .select({
        id: campaigns.id,
        name: campaigns.name,
        channel: campaigns.channel,
        status: campaigns.status,
        archivedAt: campaigns.archivedAt,
        sentAt: campaigns.sentAt,
        createdAt: campaigns.createdAt,
        sender: campaigns.sender,
        templateName: templates.name,
        templateSubject: templates.subject,
      })
      .from(campaigns)
      .innerJoin(templates, eq(campaigns.templateId, templates.id))
      .orderBy(campaigns.createdAt),
    db
      .select({
        id: templates.id,
        name: templates.name,
        subject: templates.subject,
        preheader: templates.preheader,
        status: templates.status,
        createdAt: templates.createdAt,
        updatedAt: templates.updatedAt,
        blockCount: sql<number>`coalesce(json_array_length(${templates.blocks}), 0)`.mapWith(Number),
      })
      .from(templates)
      .orderBy(templates.updatedAt),
    db.select().from(contacts).orderBy(contacts.createdAt),
  ]);

  return jsonList({
    campaigns: campaignRows.map((c) => ({
      ...c,
      senderSummary: formatCampaignSenderSummary(parseCampaignSender(c.sender)),
    })),
    templates: templateRows.filter((t) => t.status !== "archived"),
    contacts: contactRows,
    senderDefaults: getDefaultSenders(),
  });
}
