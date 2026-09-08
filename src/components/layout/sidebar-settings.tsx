"use client";

import { useState } from "react";
import { ChevronDown, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/components/locale/locale-provider";
import { LocaleSwitch } from "@/components/locale/locale-switch";
import { ThemeSwitch } from "@/components/theme/theme-switch";

export function SidebarSettings() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const panelId = "sidebar-settings-panel";

  return (
    <div className="mt-2">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
          "focus-ring",
          open
            ? "bg-accent font-semibold text-foreground"
            : "text-foreground/80 hover:bg-accent hover:text-foreground",
        )}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-foreground/70 group-hover:text-foreground">
          <Settings className="h-4 w-4" aria-hidden />
        </span>
        <span className="flex-1 text-left">{t("nav.settings")}</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-muted transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <div
          id={panelId}
          role="region"
          aria-label={t("nav.settings")}
          className="mt-1.5 space-y-4 rounded-xl border border-border bg-accent p-3"
        >
          <ThemeSwitch />
          <LocaleSwitch />
        </div>
      )}
    </div>
  );
}
