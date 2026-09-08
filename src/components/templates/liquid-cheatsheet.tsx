"use client";

import { Code2 } from "lucide-react";
import { useT } from "@/components/locale/locale-provider";
import type { UiTranslationKey } from "@/lib/ui-i18n/translations";

const SNIPPET_KEYS = [
  { labelKey: "editor.liquidSnippet.contactName" as UiTranslationKey, code: "{{ contact.name }}" },
  { labelKey: "editor.liquidSnippet.translation" as UiTranslationKey, code: "{{ t.welcome }}" },
  {
    labelKey: "editor.liquidSnippet.localeConditional" as UiTranslationKey,
    codeKey: "editor.liquidSnippet.localeConditionalCode" as UiTranslationKey,
  },
  {
    labelKey: "editor.liquidSnippet.localeCase" as UiTranslationKey,
    codeKey: "editor.liquidSnippet.localeCaseCode" as UiTranslationKey,
  },
] as const;

export function LiquidCheatsheet() {
  const t = useT();

  return (
    <div className="rounded-xl border border-border bg-accent/40 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Code2 className="h-3.5 w-3.5 text-muted" />
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
          {t("editor.liquidCheatsheet")}
        </p>
      </div>
      <div className="space-y-1">
        {SNIPPET_KEYS.map((snippet) => {
          const code =
            "code" in snippet ? snippet.code : t(snippet.codeKey).split("\n")[0];
          return (
            <div key={snippet.labelKey} className="rounded-md bg-card px-2.5 py-2">
              <p className="text-[11px] font-medium">{t(snippet.labelKey)}</p>
              <code className="mt-0.5 block truncate font-mono text-[10px] text-muted">
                {code}
              </code>
            </div>
          );
        })}
      </div>
    </div>
  );
}
