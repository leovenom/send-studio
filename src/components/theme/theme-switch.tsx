"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/components/locale/locale-provider";
import { type Theme, useTheme } from "./theme-provider";

const OPTIONS: { value: Theme; icon: typeof Sun; labelKey: "theme.light" | "theme.dark" | "theme.system" }[] = [
  { value: "light", icon: Sun, labelKey: "theme.light" },
  { value: "dark", icon: Moon, labelKey: "theme.dark" },
  { value: "system", icon: Monitor, labelKey: "theme.system" },
];

export function ThemeSwitch({
  className,
  compact,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { theme, setTheme } = useTheme();
  const t = useT();

  return (
    <div className={cn(compact ? "space-y-0" : "space-y-2", className)}>
      {!compact && (
        <div className="flex items-center gap-1.5 px-1">
          <Moon className="h-3.5 w-3.5 text-[#7c3aed] dark:text-[#c4b5fd]" />
          <p className="label-caps !mb-0 !text-[10px]">{t("theme.appearance")}</p>
        </div>
      )}
      <div
        role="radiogroup"
        aria-label={t("theme.appearance")}
        className={cn(
          "grid grid-cols-3 gap-1 rounded-xl border border-[#8ec5ff]/20 bg-[#8ec5ff]/5 p-1",
          compact && "rounded-lg p-0.5",
        )}
      >
        {OPTIONS.map(({ value, icon: Icon, labelKey }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={theme === value}
            aria-label={t(labelKey)}
            onClick={() => setTheme(value)}
            className={cn(
              "inline-flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-all focus-ring",
              theme === value
                ? "tab-pill-active shadow-sm"
                : "tab-pill-idle hover:bg-[#8ec5ff]/10",
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {!compact && <span className="truncate">{t(labelKey)}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
