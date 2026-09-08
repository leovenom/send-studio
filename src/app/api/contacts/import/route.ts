import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { parseContactsCsv } from "@/lib/contacts/import-csv";
import { db } from "@/lib/db";
import { contacts } from "@/lib/db/schema";
import { enforceRateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  csv: z.string().min(1),
  mode: z.enum(["skip", "update"]).default("skip"),
});

const MAX_CSV_BYTES = 1_000_000;
const MAX_CSV_ROWS = 5000;

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "contacts-import", 5, 60_000);
  if (limited) return limited;

  const body = bodySchema.parse(await req.json());

  if (body.csv.length > MAX_CSV_BYTES) {
    return NextResponse.json(
      { error: `CSV excede ${MAX_CSV_BYTES / 1000}KB. Divida em arquivos menores.` },
      { status: 413 },
    );
  }

  const parsed = parseContactsCsv(body.csv);

  if (parsed.rows.length > MAX_CSV_ROWS) {
    return NextResponse.json(
      { error: `Máximo ${MAX_CSV_ROWS} contatos por importação.` },
      { status: 413 },
    );
  }

  if (parsed.rows.length === 0 && parsed.errors.length > 0) {
    return NextResponse.json(
      { imported: 0, updated: 0, skipped: 0, errors: parsed.errors },
      { status: 400 },
    );
  }

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  const errors = [...parsed.errors];

  for (const row of parsed.rows) {
    const [existing] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.email, row.email));

    if (existing) {
      if (body.mode === "update") {
        await db
          .update(contacts)
          .set({
            name: row.name,
            company: row.company ?? null,
            locale: row.locale,
            phone: row.phone ?? null,
            telegramChatId: row.telegramChatId ?? null,
          })
          .where(eq(contacts.id, existing.id));
        updated++;
      } else {
        skipped++;
      }
      continue;
    }

    try {
      await db.insert(contacts).values({
        id: nanoid(),
        email: row.email,
        name: row.name,
        company: row.company,
        locale: row.locale,
        phone: row.phone,
        telegramChatId: row.telegramChatId,
      });
      imported++;
    } catch {
      errors.push({ line: 0, message: `Falha ao importar ${row.email}` });
      skipped++;
    }
  }

  return NextResponse.json({
    imported,
    updated,
    skipped,
    skippedEmpty: parsed.skippedEmpty,
    errors,
    total: parsed.rows.length,
  });
}
