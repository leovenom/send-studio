"use client";

import { useEffect, useMemo, useState } from "react";
import { BLOCK_DEFINITIONS, EmailBlock } from "@/lib/blocks";
import { useBlockUiMap } from "@/lib/ui-i18n/block-editor";
import { LOCALES, type Locale } from "@/lib/i18n";
import { Select } from "@/components/ui/select";
import { useT } from "@/components/locale/locale-provider";
import { accentAt, accentToneStyles } from "@/lib/accent-styles";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-fetch";
import { ChannelPreview } from "./channel-preview";

interface BlockPreviewProps {
  blocks: EmailBlock[];
  subject?: string;
  preheader?: string;
  locale?: Locale;
}

export function BlockPreview({ blocks, subject, preheader, locale: controlledLocale }: BlockPreviewProps) {
  const t = useT();
  const [locale, setLocale] = useState<Locale>(controlledLocale ?? "pt-BR");
  const [previewHtml, setPreviewHtml] = useState("");
  const [whatsappText, setWhatsappText] = useState("");
  const [telegramHtml, setTelegramHtml] = useState("");
  const [renderedSubject, setRenderedSubject] = useState("");
  const [renderedPreheader, setRenderedPreheader] = useState("");
  const [loading, setLoading] = useState(false);

  const activeLocale = controlledLocale ?? locale;
  const payload = useMemo(
    () => JSON.stringify({ blocks, subject, preheader, locale: activeLocale }),
    [blocks, subject, preheader, activeLocale],
  );

  useEffect(() => {
    if (blocks.length === 0) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await apiFetch("/api/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
        });
        const data = await res.json();
        setPreviewHtml(data.html ?? "");
        setWhatsappText(data.whatsappText ?? "");
        setTelegramHtml(data.telegramHtml ?? "");
        setRenderedSubject(data.subject ?? subject ?? "");
        setRenderedPreheader(data.preheader ?? preheader ?? "");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [payload, blocks.length, subject, preheader]);

  const displayHtml = blocks.length === 0 ? "" : previewHtml;
  const displayWhatsapp = blocks.length === 0 ? "" : whatsappText;
  const displayTelegram = blocks.length === 0 ? "" : telegramHtml;
  const displaySubject = blocks.length === 0 ? "" : renderedSubject;
  const displayPreheader = blocks.length === 0 ? "" : renderedPreheader;

  return (
    <div className="sticky top-0 min-w-0">
      <ChannelPreview
        html={displayHtml}
        whatsappText={displayWhatsapp}
        telegramHtml={displayTelegram}
        subject={displaySubject}
        preheader={displayPreheader}
        subjectLabel={t("editor.previewSubject")}
        preheaderLabel={t("editor.previewPreheader")}
        loading={loading && blocks.length > 0}
        emptyMessage={t("editor.previewEmpty")}
        localeSelector={
          <Select
            id="preview-locale"
            aria-label={t("preview.previewLanguage")}
            value={activeLocale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="w-full py-2 text-xs"
          >
            {LOCALES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </Select>
        }
      />
    </div>
  );
}

export function BlockPalette({
  onAdd,
}: {
  onAdd: (type: EmailBlock["type"]) => void;
}) {
  const t = useT();
  const blockUi = useBlockUiMap();
  const blockTypes = Object.keys(BLOCK_DEFINITIONS) as EmailBlock["type"][];

  return (
    <div className="space-y-2">
      <p className="label-caps">{t("editor.blocksPalette")}</p>
      <div className="grid auto-rows-fr grid-cols-2 gap-2">
        {blockTypes.map((type, i) => {
          const tone = accentAt(i);
          const style = accentToneStyles[tone];
          const { label, description } = blockUi[type];

          return (
            <button
              key={type}
              type="button"
              aria-label={t("a11y.addBlock", { type: label })}
              onClick={() => onAdd(type)}
              className={cn(
                "group flex h-full min-h-[4.5rem] flex-col items-start justify-start rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-all focus-ring",
                "hover:-translate-y-0.5 hover:border-[#8ec5ff]/30 hover:shadow-sm active:scale-[0.98]",
              )}
            >
              <span
                className={cn(
                  "mb-1 inline-block rounded px-1 py-0.5 text-[9px] font-medium uppercase tracking-wide",
                  style.chip,
                )}
              >
                {type}
              </span>
              <span className="block text-xs font-medium leading-tight">{label}</span>
              <span
                className={cn(
                  "mt-0.5 block min-h-[1.25rem] text-[10px] leading-tight text-muted",
                  !description && "invisible",
                )}
              >
                {description ?? "—"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
