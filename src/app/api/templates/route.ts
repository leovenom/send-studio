import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { BLOCK_TYPES } from "@/lib/blocks";
import { db } from "@/lib/db";
import { templates } from "@/lib/db/schema";

const blockSchema = z.object({
  id: z.string(),
  type: z.enum(BLOCK_TYPES),
  props: z.record(z.string(), z.string()),
});

const schema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  preheader: z.string().optional(),
  blocks: z.array(blockSchema),
});

export async function GET(req: NextRequest) {
  const includeArchived = req.nextUrl.searchParams.get("includeArchived") === "true";
  const all = await db.select().from(templates).orderBy(templates.updatedAt);
  const filtered = includeArchived ? all : all.filter((t) => t.status !== "archived");
  return NextResponse.json(filtered);
}

export async function POST(req: NextRequest) {
  const body = schema.parse(await req.json());
  const id = nanoid();
  const now = new Date().toISOString();

  await db.insert(templates).values({
    id,
    name: body.name,
    subject: body.subject,
    preheader: body.preheader ?? "",
    blocks: JSON.stringify(body.blocks),
    status: "active",
    updatedAt: now,
  });

  const [created] = await db.select().from(templates).where(eq(templates.id, id));
  return NextResponse.json(created, { status: 201 });
}
