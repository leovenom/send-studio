import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { emailEvents, emails } from "@/lib/db/schema";
import { getResend } from "@/lib/resend";
import { classifyOpen, recordOpenClassification } from "@/lib/open-classification";

const isProduction =
  process.env.NODE_ENV === "production" || !!process.env.VERCEL;

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const secret = process.env.RESEND_WEBHOOK_SECRET;

    if (!secret) {
      if (isProduction) {
        return NextResponse.json(
          { error: "RESEND_WEBHOOK_SECRET required in production" },
          { status: 401 },
        );
      }
      const event = JSON.parse(payload);
      await handleEvent(event);
      return NextResponse.json({ ok: true });
    }

    const event = getResend().webhooks.verify({
      payload,
      headers: {
        id: req.headers.get("svix-id") ?? "",
        timestamp: req.headers.get("svix-timestamp") ?? "",
        signature: req.headers.get("svix-signature") ?? "",
      },
      webhookSecret: secret,
    });

    await handleEvent({ type: event.type, data: event.data as { email_id?: string } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }
}

async function handleEvent(event: {
  type: string;
  data?: { email_id?: string; [key: string]: unknown };
}) {
  const resendId = event.data?.email_id;
  if (!resendId) return;

  const [email] = await db
    .select()
    .from(emails)
    .where(eq(emails.resendId, resendId));

  if (!email) return;

  const [duplicate] = await db
    .select({ id: emailEvents.id })
    .from(emailEvents)
    .where(and(eq(emailEvents.emailId, email.id), eq(emailEvents.type, event.type)))
    .limit(1);

  if (duplicate) return;

  await db.insert(emailEvents).values({
    id: nanoid(),
    emailId: email.id,
    type: event.type,
    payload: JSON.stringify(event),
  });

  if (event.type === "email.opened") {
    const classification = await classifyOpen(email.id);
    const reason =
      classification === "bot"
        ? (await hasBotProbe(email.id))
          ? "honeypot"
          : "fast_open"
        : undefined;
    await recordOpenClassification(email.id, classification, reason);
  }

  const statusMap: Record<string, string> = {
    "email.sent": "sent",
    "email.delivered": "delivered",
    "email.opened": "opened",
    "email.clicked": "clicked",
    "email.bounced": "bounced",
    "email.complained": "complained",
  };

  const newStatus = statusMap[event.type];
  if (newStatus) {
    await db.update(emails).set({ status: newStatus }).where(eq(emails.id, email.id));
  }
}

async function hasBotProbe(emailId: string) {
  const [row] = await db
    .select({ id: emailEvents.id })
    .from(emailEvents)
    .where(and(eq(emailEvents.emailId, emailId), eq(emailEvents.type, "email.bot_probe")))
    .limit(1);
  return !!row;
}
