import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { blocksToHtml } from "@/lib/blocks";
import { db } from "@/lib/db";
import { campaigns, contacts, emails, messages, templates } from "@/lib/db/schema";
import { blocksToPlainText, blocksToTelegramHtml } from "@/lib/messaging/blocks-to-text";
import {
  resolveCampaignSender,
  type EmailCampaignSender,
} from "@/lib/messaging/campaign-sender";
import { sendTelegramMessage, sendWhatsAppMessage } from "@/lib/messaging/send";
import { buildLiquidContext, renderSubject } from "@/lib/liquid";
import { getResend } from "@/lib/resend";
import { createTrackingToken } from "@/lib/tracking";
import type { EmailBlock } from "@/lib/blocks";
import { enforceRateLimit } from "@/lib/rate-limit";
import { jsonList } from "@/lib/api-list-response";
import { getCampaignsList, invalidateListCache, LIST_CACHE_TAGS } from "@/lib/list-queries";

const channelSchema = z.enum(["email", "whatsapp", "telegram"]);

export async function GET(req: NextRequest) {
  const includeArchived = req.nextUrl.searchParams.get("includeArchived") === "true";
  const all = await getCampaignsList();
  const filtered = includeArchived ? all : all.filter((c) => !c.archivedAt);
  return jsonList(filtered);
}

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "campaigns-send", 10, 60_000);
  if (limited) return limited;

  const body = z
    .object({
      name: z.string().min(1),
      templateId: z.string(),
      channel: channelSchema.default("email"),
      contactIds: z.array(z.string()).min(1),
      emailSender: z
        .object({
          fromName: z.string().min(1).max(100),
          fromEmail: z.string().email(),
          noReply: z.boolean().default(true),
        })
        .optional(),
      sender: z
        .object({
          fromName: z.string().min(1).max(100).optional(),
          fromEmail: z.string().email().optional(),
          displayName: z.string().min(1).max(100).optional(),
          phoneNumber: z.string().min(3).max(40).optional(),
          botName: z.string().min(1).max(100).optional(),
          botUsername: z.string().min(2).max(100).optional(),
          noReply: z.boolean().default(true),
        })
        .optional(),
    })
    .parse(await req.json());

  const senderInput = body.sender ?? body.emailSender;
  const campaignSender = resolveCampaignSender(body.channel, senderInput);

  const [template] = await db
    .select()
    .from(templates)
    .where(eq(templates.id, body.templateId));

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  if (template.status === "archived") {
    return NextResponse.json({ error: "Template arquivado — restaure antes de usar" }, { status: 400 });
  }

  const campaignId = nanoid();
  await db.insert(campaigns).values({
    id: campaignId,
    name: body.name,
    templateId: body.templateId,
    channel: body.channel,
    status: "sending",
    sender: JSON.stringify(campaignSender),
  });

  const blocks: EmailBlock[] = (() => {
    try {
      return JSON.parse(template.blocks);
    } catch {
      return [];
    }
  })();
  if (blocks.length === 0) {
    return NextResponse.json({ error: "Template sem blocos válidos" }, { status: 400 });
  }
  const results = [];

  for (const contactId of body.contactIds) {
    const [contact] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, contactId));

    if (!contact) continue;

    const contactCtx = {
      name: contact.name,
      email: contact.email,
      company: contact.company,
      locale: contact.locale ?? "en",
    };

    if (body.channel === "email") {
      const result = await sendEmail({
        campaignId,
        contactId,
        contact,
        blocks,
        template,
        contactCtx,
        emailSender: campaignSender as EmailCampaignSender,
      });
      results.push(result);
    } else if (body.channel === "whatsapp") {
      const result = await sendWhatsApp({
        campaignId,
        contactId,
        contact,
        blocks,
        template,
        contactCtx,
      });
      results.push(result);
    } else if (body.channel === "telegram") {
      const result = await sendTelegram({
        campaignId,
        contactId,
        contact,
        blocks,
        template,
        contactCtx,
      });
      results.push(result);
    }
  }

  const successStatuses = new Set(["sent", "demo"]);
  const failCount = results.filter((r) => r.status === "failed").length;
  const successCount = results.filter((r) => successStatuses.has(r.status as string)).length;

  let campaignStatus = "sent";
  if (failCount === results.length) campaignStatus = "failed";
  else if (failCount > 0 || successCount < results.length) campaignStatus = "partial";

  await db
    .update(campaigns)
    .set({ status: campaignStatus, sentAt: new Date().toISOString() })
    .where(eq(campaigns.id, campaignId));

  invalidateListCache(LIST_CACHE_TAGS.campaigns, LIST_CACHE_TAGS.bootstrap);

  return NextResponse.json({ campaignId, channel: body.channel, results }, { status: 201 });
}

async function sendEmail({
  campaignId,
  contactId,
  contact,
  blocks,
  template,
  contactCtx,
  emailSender,
}: {
  campaignId: string;
  contactId: string;
  contact: typeof contacts.$inferSelect;
  blocks: EmailBlock[];
  template: typeof templates.$inferSelect;
  contactCtx: { name: string; email: string; company: string | null; locale: string };
  emailSender: EmailCampaignSender;
}) {
  const liquidContext = buildLiquidContext(contactCtx);
  const trackingToken = createTrackingToken();
  const preheader = template.preheader
    ? await renderSubject(template.preheader, liquidContext)
    : undefined;
  const html = await blocksToHtml(blocks, liquidContext.contact, {
    trackingToken,
    preheader,
  });
  const subject = await renderSubject(template.subject, liquidContext);

  const emailId = nanoid();
  await db.insert(emails).values({
    id: emailId,
    campaignId,
    contactId,
    subject,
    trackingToken,
    status: "queued",
  });

  if (!process.env.RESEND_API_KEY) {
    await db.update(emails).set({ status: "demo", sentAt: new Date().toISOString() }).where(eq(emails.id, emailId));
    return { id: emailId, channel: "email", status: "demo", contact: contact.email };
  }

  const { data, error } = await getResend().emails.send({
    from: emailSender.from,
    ...(emailSender.replyTo ? { replyTo: emailSender.replyTo } : {}),
    to: contact.email,
    subject,
    html,
    tags: [
      { name: "campaign_id", value: campaignId },
      { name: "locale", value: contact.locale ?? "en" },
    ],
  });

  if (error) {
    await db.update(emails).set({ status: "failed" }).where(eq(emails.id, emailId));
    return { id: emailId, channel: "email", status: "failed", error: error.message };
  }

  await db.update(emails).set({ resendId: data?.id, status: "sent", sentAt: new Date().toISOString() }).where(eq(emails.id, emailId));
  return { id: emailId, channel: "email", status: "sent", resendId: data?.id };
}

async function sendWhatsApp({
  campaignId,
  contactId,
  contact,
  blocks,
  template,
  contactCtx,
}: {
  campaignId: string;
  contactId: string;
  contact: typeof contacts.$inferSelect;
  blocks: EmailBlock[];
  template: typeof templates.$inferSelect;
  contactCtx: { name: string; email: string; company: string | null; locale: string };
}) {
  if (!contact.phone) {
    return { channel: "whatsapp", status: "skipped", contact: contact.name, error: "Sem telefone" };
  }

  const text = await blocksToPlainText(blocks, contactCtx, template.subject);
  const msgId = nanoid();

  await db.insert(messages).values({
    id: msgId,
    campaignId,
    contactId,
    channel: "whatsapp",
    subject: template.subject,
    body: text,
    status: "queued",
  });

  const result = await sendWhatsAppMessage(contact.phone, text);

  const status = result.demo ? "demo" : result.success ? "sent" : "failed";
  await db
    .update(messages)
    .set({
      status,
      externalId: result.messageId,
      metadata: JSON.stringify({ waLink: result.waLink }),
      sentAt: new Date().toISOString(),
    })
    .where(eq(messages.id, msgId));

  return {
    id: msgId,
    channel: "whatsapp",
    status,
    contact: contact.phone,
    waLink: result.waLink,
    error: result.error,
  };
}

async function sendTelegram({
  campaignId,
  contactId,
  contact,
  blocks,
  template,
  contactCtx,
}: {
  campaignId: string;
  contactId: string;
  contact: typeof contacts.$inferSelect;
  blocks: EmailBlock[];
  template: typeof templates.$inferSelect;
  contactCtx: { name: string; email: string; company: string | null; locale: string };
}) {
  if (!contact.telegramChatId) {
    return { channel: "telegram", status: "skipped", contact: contact.name, error: "Sem Chat ID" };
  }

  const text = await blocksToTelegramHtml(blocks, contactCtx, template.subject);
  const msgId = nanoid();

  await db.insert(messages).values({
    id: msgId,
    campaignId,
    contactId,
    channel: "telegram",
    subject: template.subject,
    body: text,
    status: "queued",
  });

  const result = await sendTelegramMessage(contact.telegramChatId, text, "HTML");

  const status = result.demo ? "demo" : result.success ? "sent" : "failed";
  await db
    .update(messages)
    .set({
      status,
      externalId: result.messageId?.toString(),
      sentAt: new Date().toISOString(),
    })
    .where(eq(messages.id, msgId));

  return {
    id: msgId,
    channel: "telegram",
    status,
    contact: contact.telegramChatId,
    error: result.error,
  };
}
