import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { jsonList } from "@/lib/api-list-response";
import { getContactsList, invalidateListCache, LIST_CACHE_TAGS } from "@/lib/list-queries";
import { db } from "@/lib/db";
import { contacts } from "@/lib/db/schema";

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  company: z.string().optional(),
  locale: z.enum(["pt-BR", "en", "es"]).optional(),
  phone: z.string().optional(),
  telegramChatId: z.string().optional(),
});

export async function GET() {
  return jsonList(await getContactsList());
}

export async function POST(req: NextRequest) {
  const body = schema.parse(await req.json());
  const id = nanoid();

  await db.insert(contacts).values({
    id,
    email: body.email,
    name: body.name,
    company: body.company,
    locale: body.locale ?? "pt-BR",
    phone: body.phone,
    telegramChatId: body.telegramChatId,
  });

  const [created] = await db.select().from(contacts).where(eq(contacts.id, id));
  invalidateListCache(LIST_CACHE_TAGS.contacts, LIST_CACHE_TAGS.bootstrap);
  return NextResponse.json(created, { status: 201 });
}
