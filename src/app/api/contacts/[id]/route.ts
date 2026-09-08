import { NextRequest, NextResponse } from "next/server";
import { eq, and, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { contacts } from "@/lib/db/schema";
import { invalidateListCache, LIST_CACHE_TAGS } from "@/lib/list-queries";

const patchSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  company: z.string().nullable().optional(),
  locale: z.enum(["pt-BR", "en", "es"]).optional(),
  phone: z.string().nullable().optional(),
  telegramChatId: z.string().nullable().optional(),
  status: z.enum(["active", "archived"]).optional(),
});

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [existing] = await db.select().from(contacts).where(eq(contacts.id, id));
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await db.delete(contacts).where(eq(contacts.id, id));
  invalidateListCache(LIST_CACHE_TAGS.contacts, LIST_CACHE_TAGS.bootstrap);
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = patchSchema.parse(await req.json());

  const [existing] = await db.select().from(contacts).where(eq(contacts.id, id));
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (body.email && body.email !== existing.email) {
    const [duplicate] = await db
      .select({ id: contacts.id })
      .from(contacts)
      .where(and(eq(contacts.email, body.email), ne(contacts.id, id)));
    if (duplicate) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
  }

  const updates = {
    ...body,
    company: body.company === "" ? null : body.company,
    phone: body.phone === "" ? null : body.phone,
    telegramChatId: body.telegramChatId === "" ? null : body.telegramChatId,
  };

  await db.update(contacts).set(updates).where(eq(contacts.id, id));
  const [updated] = await db.select().from(contacts).where(eq(contacts.id, id));
  invalidateListCache(LIST_CACHE_TAGS.contacts, LIST_CACHE_TAGS.bootstrap);
  return NextResponse.json(updated);
}
