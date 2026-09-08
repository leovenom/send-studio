"use client";

import { cn } from "@/lib/utils";
import { UI_LOCALES, type UiLocale } from "@/lib/ui-i18n/translations";
import { useLocale, useT } from "./locale-provider";
import { Languages } from "lucide-react";

export function LocaleSwitch({
  className,
  compact,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { locale, setLocale } = useLocale();
  const t = useT();

  return (
    <div className={cn(compact ? "space-y-0" : "space-y-2", className)}>
      {!compact && (
        <div className="flex items-center gap-1.5 px-1">
          <Languages className="h-3.5 w-3.5 text-[#7c3aed] dark:text-[#c4b5fd]" aria-hidden />
          <p className="label-caps !mb-0 !text-[10px]">{t("locale.language")}</p>
        </div>
      )}
      <div
        role="radiogroup"
        aria-label={t("locale.language")}
        className={cn(
          "grid grid-cols-2 gap-1 rounded-xl border border-[#8ec5ff]/20 bg-[#8ec5ff]/5 p-1",
          compact && "rounded-lg p-0.5",
        )}
      >
        {UI_LOCALES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={locale === value}
            aria-label={label}
            onClick={() => setLocale(value as UiLocale)}
            className={cn(
              "rounded-lg px-2 py-1.5 text-xs font-medium transition-all focus-ring",
              locale === value
                ? "tab-pill-active shadow-sm"
                : "tab-pill-idle hover:bg-[#8ec5ff]/10",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
