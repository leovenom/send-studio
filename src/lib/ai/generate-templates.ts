import { nanoid } from "nanoid";
import OpenAI from "openai";
import { BLOCK_TYPES, type BlockType, type EmailBlock } from "@/lib/blocks";
import { getUiT, type UiLocale } from "@/lib/ui-i18n/translations";

export interface GenerateTemplateInput {
  headline: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
  imageUrl?: string;
  brandColor?: string;
  subject?: string;
  locale?: UiLocale;
}

export interface GeneratedVariation {
  id: string;
  name: string;
  style: string;
  description: string;
  subject: string;
  blocks: EmailBlock[];
}

function block(type: BlockType, props: Record<string, string>): EmailBlock {
  return { id: nanoid(), type, props };
}

/** Rule-based fallback — 4 distinct visual layouts */
export function generateFallbackVariations(
  input: GenerateTemplateInput,
): GeneratedVariation[] {
  const locale = input.locale ?? "pt-BR";
  const t = getUiT(locale);

  const {
    headline,
    body,
    ctaText = t("generate.defaultCta"),
    ctaUrl = "https://resend.com",
    imageUrl,
    brandColor = "#0a0a0a",
    subject,
  } = input;

  const emailSubject = subject ?? headline;
  const footerNote = t("generate.variation.footerNote");

  const variations: GeneratedVariation[] = [
    {
      id: nanoid(),
      name: t("generate.variation.hero.name"),
      style: "hero",
      description: t("generate.variation.hero.description"),
      subject: emailSubject,
      blocks: [
        ...(imageUrl
          ? [block("image", { src: imageUrl, alt: headline, align: "center", width: "560" })]
          : []),
        block("spacer", { height: "16" }),
        block("heading", { text: headline, level: "h1", align: "center" }),
        block("text", { text: body, align: "center" }),
        block("spacer", { height: "8" }),
        block("button", { text: ctaText, url: ctaUrl, align: "center", color: brandColor }),
      ],
    },
    {
      id: nanoid(),
      name: t("generate.variation.minimal.name"),
      style: "minimal",
      description: t("generate.variation.minimal.description"),
      subject: emailSubject,
      blocks: [
        block("heading", { text: headline, level: "h1", align: "left" }),
        block("divider", { color: brandColor }),
        block("text", { text: body, align: "left" }),
        block("spacer", { height: "24" }),
        block("button", { text: ctaText, url: ctaUrl, align: "left", color: brandColor }),
        ...(imageUrl
          ? [
              block("spacer", { height: "32" }),
              block("image", { src: imageUrl, alt: headline, align: "left", width: "200" }),
            ]
          : []),
      ],
    },
    {
      id: nanoid(),
      name: t("generate.variation.editorial.name"),
      style: "editorial",
      description: t("generate.variation.editorial.description"),
      subject: emailSubject,
      blocks: [
        block("heading", { text: headline, level: "h2", align: "left" }),
        block("text", {
          text: body.split("\n")[0] ?? body,
          align: "left",
        }),
        ...(imageUrl
          ? [block("image", { src: imageUrl, alt: headline, align: "center", width: "480" })]
          : [block("spacer", { height: "16" })]),
        block("text", {
          text: body.split("\n").slice(1).join("\n") || body,
          align: "left",
        }),
        block("button", { text: ctaText, url: ctaUrl, align: "center", color: brandColor }),
      ],
    },
    {
      id: nanoid(),
      name: t("generate.variation.bold.name"),
      style: "bold",
      description: t("generate.variation.bold.description"),
      subject: emailSubject,
      blocks: [
        block("spacer", { height: "16" }),
        block("heading", { text: headline, level: "h1", align: "center" }),
        block("text", { text: body, align: "center" }),
        block("spacer", { height: "24" }),
        block("button", { text: ctaText, url: ctaUrl, align: "center", color: brandColor }),
        block("spacer", { height: "24" }),
        ...(imageUrl
          ? [block("image", { src: imageUrl, alt: headline, align: "center", width: "400" })]
          : []),
        block("divider", { color: "#e5e5e5" }),
        block("text", {
          text: footerNote,
          align: "center",
        }),
      ],
    },
  ];

  return variations;
}

function aiSystemPrompt(locale: UiLocale): string {
  const language = locale === "en" ? "English" : "Portuguese (Brazil)";

  return `You are an expert email designer for Send Studio. Generate exactly 4 distinct email template variations as JSON.

Each variation must use only these block types: ${BLOCK_TYPES.join(", ")}.
Each block: { "type": string, "props": Record<string,string> }

Block props reference:
- header: logoSrc, logoWidth, logoAlt, title, subtitle, bgColor, textColor, align
- heading: text, level (h1|h2), align (left|center|right)
- text: text, align
- button: text, url, color (hex), align, style (button|link)
- link: text, url, color (hex), align, underline (true|false)
- image: src, alt, width (px number as string), align
- divider: color (hex)
- spacer: height (px number as string)
- footer: companyName, text, unsubscribeText, unsubscribeUrl, privacyUrl, privacyText, bgColor, textColor, align
- content: body (HTML+Liquid), align

Rules:
- Use the user's headline, body, CTA, image URL and brand color
- Create 4 visually DISTINCT layouts (hero, minimal, editorial, bold)
- ALL templates must be responsive: images width 560 max, use align center for mobile-friendly layouts
- Images must use width "560" for fluid scaling on mobile
- Buttons should use align center for best mobile experience
- Professional email design, mobile-first
- Return valid JSON only, no markdown
- Write name, description and subject in ${language}

Response format:
{
  "variations": [
    {
      "name": "Layout Name",
      "style": "hero|minimal|editorial|bold",
      "description": "One sentence in ${language}",
      "subject": "Email subject line",
      "blocks": [{ "type": "heading", "props": { ... } }]
    }
  ]
}`;
}

export async function generateAiVariations(
  input: GenerateTemplateInput,
): Promise<{ variations: GeneratedVariation[]; source: "ai" | "fallback" }> {
  const locale = input.locale ?? "pt-BR";
  const t = getUiT(locale);

  if (!process.env.OPENAI_API_KEY) {
    return {
      variations: generateFallbackVariations(input),
      source: "fallback",
    };
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const userMessage = JSON.stringify({
      headline: input.headline,
      body: input.body,
      ctaText: input.ctaText ?? t("generate.defaultCta"),
      ctaUrl: input.ctaUrl ?? "https://resend.com",
      imageUrl: input.imageUrl ?? null,
      brandColor: input.brandColor ?? "#0a0a0a",
      subject: input.subject ?? input.headline,
      locale,
    });

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: aiSystemPrompt(locale) },
        {
          role: "user",
          content: `Create 4 email template variations for this content:\n${userMessage}`,
        },
      ],
      temperature: 0.8,
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty AI response");

    const parsed = JSON.parse(raw) as {
      variations: {
        name: string;
        style: string;
        description: string;
        subject: string;
        blocks: { type: BlockType; props: Record<string, string> }[];
      }[];
    };

    const variations: GeneratedVariation[] = parsed.variations
      .slice(0, 4)
      .map((v) => ({
        id: nanoid(),
        name: v.name,
        style: v.style,
        description: v.description,
        subject: v.subject,
        blocks: v.blocks
          .filter((b) => BLOCK_TYPES.includes(b.type))
          .map((b) => block(b.type, b.props)),
      }));

    if (variations.length === 0) throw new Error("No valid variations");

    return { variations, source: "ai" };
  } catch (error) {
    console.error("AI generation failed, using fallback:", error);
    return {
      variations: generateFallbackVariations(input),
      source: "fallback",
    };
  }
}
