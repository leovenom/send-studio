"use client";

import { useMemo } from "react";
import type { BlockType } from "@/lib/blocks";
import { useT } from "@/components/locale/locale-provider";
import type { UiTranslationKey } from "@/lib/ui-i18n/translations";

const BLOCK_DESC_TYPES = new Set<BlockType>([
  "header",
  "button",
  "link",
  "footer",
  "content",
]);

export function useBlockUi(type: BlockType) {
  const t = useT();
  const label = t(`blocks.${type}.label` as UiTranslationKey);
  const description = BLOCK_DESC_TYPES.has(type)
    ? t(`blocks.${type}.desc` as UiTranslationKey)
    : undefined;
  return { label, description };
}

export function useBlockUiMap() {
  const t = useT();
  return useMemo(() => {
    const types: BlockType[] = [
      "header",
      "heading",
      "text",
      "button",
      "link",
      "image",
      "divider",
      "spacer",
      "footer",
      "content",
    ];
    return Object.fromEntries(
      types.map((type) => {
        const label = t(`blocks.${type}.label` as UiTranslationKey);
        const description = BLOCK_DESC_TYPES.has(type)
          ? t(`blocks.${type}.desc` as UiTranslationKey)
          : undefined;
        return [type, { label, description }];
      }),
    ) as Record<BlockType, { label: string; description?: string }>;
  }, [t]);
}

type FieldDef = {
  key: string;
  labelKey: UiTranslationKey;
  mono?: boolean;
  type?: "select";
};

export const BLOCK_FIELD_DEFS: Partial<Record<BlockType, FieldDef[]>> = {
  content: [
    { key: "body", labelKey: "blocks.field.htmlLiquid", mono: true },
    { key: "align", labelKey: "blocks.field.alignment" },
  ],
  header: [
    { key: "logoSrc", labelKey: "blocks.field.logoUrl" },
    { key: "logoWidth", labelKey: "blocks.field.logoWidth" },
    { key: "logoAlt", labelKey: "blocks.field.logoAlt" },
    { key: "title", labelKey: "blocks.field.title", mono: true },
    { key: "subtitle", labelKey: "blocks.field.subtitle", mono: true },
    { key: "bgColor", labelKey: "blocks.field.bgColor" },
    { key: "textColor", labelKey: "blocks.field.textColor" },
    { key: "align", labelKey: "blocks.field.alignment" },
  ],
  heading: [
    { key: "text", labelKey: "blocks.field.textLiquid", mono: true },
    { key: "level", labelKey: "blocks.field.level" },
    { key: "align", labelKey: "blocks.field.alignment" },
  ],
  text: [
    { key: "text", labelKey: "blocks.field.textLiquid", mono: true },
    { key: "align", labelKey: "blocks.field.alignment" },
  ],
  button: [
    { key: "text", labelKey: "blocks.field.text", mono: true },
    { key: "url", labelKey: "blocks.field.linkUrl" },
    { key: "style", labelKey: "blocks.field.style", type: "select" },
    { key: "color", labelKey: "blocks.field.color" },
    { key: "align", labelKey: "blocks.field.alignment" },
  ],
  link: [
    { key: "text", labelKey: "blocks.field.linkText", mono: true },
    { key: "url", labelKey: "blocks.field.url" },
    { key: "color", labelKey: "blocks.field.color" },
    { key: "underline", labelKey: "blocks.field.underline" },
    { key: "align", labelKey: "blocks.field.alignment" },
  ],
  image: [
    { key: "src", labelKey: "blocks.field.url" },
    { key: "alt", labelKey: "blocks.field.alt" },
    { key: "width", labelKey: "blocks.field.width" },
    { key: "align", labelKey: "blocks.field.alignment" },
  ],
  divider: [{ key: "color", labelKey: "blocks.field.color" }],
  spacer: [{ key: "height", labelKey: "blocks.field.height" }],
  footer: [
    { key: "companyName", labelKey: "blocks.field.company", mono: true },
    { key: "text", labelKey: "blocks.field.textLiquid", mono: true },
    { key: "unsubscribeText", labelKey: "blocks.field.unsubText", mono: true },
    { key: "unsubscribeUrl", labelKey: "blocks.field.unsubUrl" },
    { key: "privacyUrl", labelKey: "blocks.field.privacyUrl" },
    { key: "privacyText", labelKey: "blocks.field.privacyText" },
    { key: "bgColor", labelKey: "blocks.field.bgColor" },
    { key: "textColor", labelKey: "blocks.field.textColor" },
    { key: "align", labelKey: "blocks.field.alignment" },
  ],
};
