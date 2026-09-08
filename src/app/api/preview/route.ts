import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { BLOCK_TYPES, blocksToHtml } from "@/lib/blocks";
import { buildLiquidContext, renderSubject } from "@/lib/liquid";
import { blocksToPlainText, blocksToTelegramHtml } from "@/lib/messaging/blocks-to-text";

const schema = z.object({
  blocks: z.array(
    z.object({
      id: z.string(),
      type: z.enum(BLOCK_TYPES),
      props: z.record(z.string(), z.string()),
    }),
  ),
  subject: z.string().optional(),
  preheader: z.string().optional(),
  locale: z.string().optional(),
  contact: z
    .object({
      name: z.string().optional(),
      email: z.string().optional(),
      company: z.string().nullable().optional(),
      locale: z.string().optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  const body = schema.parse(await req.json());
  const context = buildLiquidContext({
    ...body.contact,
    locale: body.contact?.locale ?? body.locale,
  });

  const html = await blocksToHtml(body.blocks, context.contact, {
    preheader: body.preheader
      ? await renderSubject(body.preheader, context)
      : undefined,
  });
  const subject = body.subject
    ? await renderSubject(body.subject, context)
    : undefined;
  const preheader = body.preheader
    ? await renderSubject(body.preheader, context)
    : undefined;

  const contactCtx = {
    name: context.contact.name,
    email: context.contact.email,
    company: context.contact.company,
    locale: context.locale,
  };

  const whatsappText = await blocksToPlainText(body.blocks, contactCtx, body.subject);
  const telegramHtml = await blocksToTelegramHtml(body.blocks, contactCtx, body.subject);

  return NextResponse.json({
    html,
    subject,
    preheader,
    locale: context.locale,
    whatsappText,
    telegramHtml,
  });
}
