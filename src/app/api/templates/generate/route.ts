import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateAiVariations } from "@/lib/ai/generate-templates";
import { blocksToHtml } from "@/lib/blocks";
import { enforceRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  headline: z.string().min(1),
  body: z.string().min(1),
  ctaText: z.string().optional(),
  ctaUrl: z.string().url().optional().or(z.literal("")),
  imageUrl: z
    .union([z.string().url(), z.string().startsWith("data:image"), z.literal("")])
    .optional(),
  brandColor: z.string().optional(),
  subject: z.string().optional(),
  locale: z.enum(["pt-BR", "en"]).optional(),
});

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "templates-generate", 5, 60_000);
  if (limited) return limited;

  const body = schema.parse(await req.json());

  const { variations, source } = await generateAiVariations({
    headline: body.headline,
    body: body.body,
    ctaText: body.ctaText,
    ctaUrl: body.ctaUrl || undefined,
    imageUrl: body.imageUrl || undefined,
    brandColor: body.brandColor,
    subject: body.subject,
    locale: body.locale,
  });

  const withPreviews = await Promise.all(
    variations.map(async (v) => ({
      ...v,
      previewHtml: await blocksToHtml(v.blocks),
    })),
  );

  return NextResponse.json({ variations: withPreviews, source });
}
