import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { emailEvents, emails } from "@/lib/db/schema";
import { enforceRateLimit } from "@/lib/rate-limit";

/** 1×1 transparent GIF */
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

const pixelResponse = () =>
  new NextResponse(PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
    },
  });

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const limited = enforceRateLimit(req, "track-pixel", 120, 60_000);
  if (limited) return limited;

  const { token } = await params;

  const [email] = await db
    .select()
    .from(emails)
    .where(eq(emails.trackingToken, token));

  if (email) {
    const existing = await db
      .select({ id: emailEvents.id })
      .from(emailEvents)
      .where(
        and(eq(emailEvents.emailId, email.id), eq(emailEvents.type, "email.bot_probe")),
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(emailEvents).values({
        id: nanoid(),
        emailId: email.id,
        type: "email.bot_probe",
        payload: JSON.stringify({
          source: "honeypot",
          userAgent: req.headers.get("user-agent"),
          img: req.nextUrl.searchParams.get("img") === "1",
        }),
      });
    }
  }

  return pixelResponse();
}
