import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { emailEvents } from "@/lib/db/schema";
import { FAST_OPEN_BOT_THRESHOLD_MS, type OpenClassification } from "@/lib/tracking";

export async function classifyOpen(emailId: string): Promise<OpenClassification> {
  const [botProbe] = await db
    .select({ id: emailEvents.id })
    .from(emailEvents)
    .where(
      and(eq(emailEvents.emailId, emailId), eq(emailEvents.type, "email.bot_probe")),
    )
    .limit(1);

  if (botProbe) return "bot";

  const [delivered] = await db
    .select({ createdAt: emailEvents.createdAt })
    .from(emailEvents)
    .where(
      and(eq(emailEvents.emailId, emailId), eq(emailEvents.type, "email.delivered")),
    )
    .orderBy(desc(emailEvents.createdAt))
    .limit(1);

  if (delivered?.createdAt) {
    const elapsed = Date.now() - new Date(delivered.createdAt).getTime();
    if (elapsed >= 0 && elapsed < FAST_OPEN_BOT_THRESHOLD_MS) {
      return "bot";
    }
  }

  return "human";
}

export async function recordOpenClassification(
  emailId: string,
  classification: OpenClassification,
  reason?: string,
) {
  const type = classification === "bot" ? "email.opened_bot" : "email.opened_human";

  const [existing] = await db
    .select({ id: emailEvents.id })
    .from(emailEvents)
    .where(and(eq(emailEvents.emailId, emailId), eq(emailEvents.type, type)))
    .limit(1);

  if (existing) return;

  await db.insert(emailEvents).values({
    id: nanoid(),
    emailId,
    type,
    payload: JSON.stringify({ classification, reason }),
  });
}
