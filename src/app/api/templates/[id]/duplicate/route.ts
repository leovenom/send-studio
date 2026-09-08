import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { templates } from "@/lib/db/schema";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [source] = await db.select().from(templates).where(eq(templates.id, id));
  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const newId = nanoid();
  const now = new Date().toISOString();

  await db.insert(templates).values({
    id: newId,
    name: `${source.name} (cópia)`,
    subject: source.subject,
    preheader: source.preheader ?? "",
    blocks: source.blocks,
    status: "active",
    updatedAt: now,
  });

  const [created] = await db.select().from(templates).where(eq(templates.id, newId));
  return NextResponse.json(created, { status: 201 });
}
