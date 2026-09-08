import { NextRequest, NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { BLOCK_TYPES } from "@/lib/blocks";
import { jsonList } from "@/lib/api-list-response";
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
  const includeBlocks = req.nextUrl.searchParams.get("includeBlocks") === "true";

  if (includeBlocks) {
    const all = await db.select().from(templates).orderBy(desc(templates.updatedAt));
    const filtered = includeArchived ? all : all.filter((t) => t.status !== "archived");
    return jsonList(filtered);
  }

  const rows = await db
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
    .orderBy(desc(templates.updatedAt));

  const filtered = includeArchived ? rows : rows.filter((t) => t.status !== "archived");
  return jsonList(filtered);
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
