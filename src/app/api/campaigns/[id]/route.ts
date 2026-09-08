import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { campaigns } from "@/lib/db/schema";
import { invalidateListCache, LIST_CACHE_TAGS } from "@/lib/list-queries";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = z
    .object({
      archived: z.boolean().optional(),
    })
    .parse(await req.json());

  const [existing] = await db.select().from(campaigns).where(eq(campaigns.id, id));
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const archivedAt =
    body.archived === true
      ? new Date().toISOString()
      : body.archived === false
        ? null
        : undefined;

  await db
    .update(campaigns)
    .set({ archivedAt })
    .where(eq(campaigns.id, id));

  const [updated] = await db.select().from(campaigns).where(eq(campaigns.id, id));
  invalidateListCache(LIST_CACHE_TAGS.campaigns, LIST_CACHE_TAGS.bootstrap);
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [existing] = await db.select().from(campaigns).where(eq(campaigns.id, id));
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(campaigns).where(eq(campaigns.id, id));
  invalidateListCache(LIST_CACHE_TAGS.campaigns, LIST_CACHE_TAGS.bootstrap);
  return NextResponse.json({ ok: true });
}
