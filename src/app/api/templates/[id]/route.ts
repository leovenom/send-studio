import { NextRequest, NextResponse } from "next/server";
import { count, eq } from "drizzle-orm";
import { z } from "zod";
import { BLOCK_TYPES } from "@/lib/blocks";
import { db } from "@/lib/db";
import { campaigns, templates } from "@/lib/db/schema";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [template] = await db.select().from(templates).where(eq(templates.id, id));
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(template);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = z
    .object({
      name: z.string().min(1).optional(),
      subject: z.string().min(1).optional(),
      preheader: z.string().optional(),
      status: z.enum(["active", "archived"]).optional(),
      blocks: z
        .array(
          z.object({
            id: z.string(),
            type: z.enum(BLOCK_TYPES),
            props: z.record(z.string(), z.string()),
          }),
        )
        .optional(),
    })
    .parse(await req.json());

  await db
    .update(templates)
    .set({
      ...body,
      blocks: body.blocks ? JSON.stringify(body.blocks) : undefined,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(templates.id, id));

  const [updated] = await db.select().from(templates).where(eq(templates.id, id));
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const [usage] = await db
    .select({ count: count() })
    .from(campaigns)
    .where(eq(campaigns.templateId, id));

  if (usage.count > 0) {
    return NextResponse.json(
      {
        error: `Template usado em ${usage.count} campanha(s). Arquivar em vez de deletar.`,
      },
      { status: 409 },
    );
  }

  await db.delete(templates).where(eq(templates.id, id));
  return NextResponse.json({ ok: true });
}
