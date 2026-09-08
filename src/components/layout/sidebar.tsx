"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  House,
  LayoutTemplate,
  Send,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/components/locale/locale-provider";
import { SidebarSettings } from "@/components/layout/sidebar-settings";
import { SidebarDeveloperCard } from "@/components/layout/sidebar-developer";
import { BrandMark, BrandTitle } from "@/components/layout/brand-mark";
import { accentToneStyles, type AccentTone } from "@/lib/accent-styles";

interface SidebarProps {
  mobile?: boolean;
  onClose?: () => void;
  id?: string;
}

const NAV_ACCENTS: Record<string, AccentTone> = {
  "/": "blue",
  "/contacts": "violet",
  "/templates": "cyan",
  "/campaigns": "emerald",
  "/analytics": "amber",
};

const ACTIVE_NAV_BG: Record<AccentTone, string> = {
  blue: "bg-[#dbeafe] dark:bg-[#1e3a5f]",
  violet: "bg-[#ede9fe] dark:bg-[#3b2d6b]",
  cyan: "bg-[#ccfbf1] dark:bg-[#134e4a]",
  emerald: "bg-[#d1fae5] dark:bg-[#14532d]",
  amber: "bg-[#fef3c7] dark:bg-[#78350f]",
};

export function Sidebar({ mobile, onClose, id }: SidebarProps) {
  const pathname = usePathname();
  const t = useT();

  const nav = [
    { href: "/", label: t("nav.dashboard"), icon: House },
    { href: "/contacts", label: t("nav.contacts"), icon: Users },
    { href: "/templates", label: t("nav.templates"), icon: LayoutTemplate },
    { href: "/campaigns", label: t("nav.campaigns"), icon: Send },
    { href: "/analytics", label: t("nav.analytics"), icon: BarChart3 },
  ];

  return (
    <aside
      id={id}
      className={cn(
        "relative flex h-full w-[17rem] flex-col overflow-hidden border-r border-border bg-card",
        mobile && "w-full border-r-0",
      )}
    >
      <div className="relative flex h-[4.25rem] shrink-0 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-2.5">
          <BrandMark />
          <div className="min-w-0">
            <BrandTitle />
            <p className="truncate text-[10px] font-medium text-muted-foreground">
              {t("nav.tagline")}
            </p>
          </div>
        </div>
        {mobile && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={t("a11y.closeMenu")}
            className="rounded-lg border border-border bg-accent p-1.5 text-foreground hover:bg-accent/80 focus-ring"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        )}
      </div>

      <nav
        aria-label={t("nav.menu")}
        className="relative flex-1 overflow-y-auto bg-card px-3 py-4"
      >
        <ul className="space-y-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            const tone = NAV_ACCENTS[href];
            const style = accentToneStyles[tone];

            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onClose}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-ring",
                    active
                      ? cn(
                          "font-semibold text-foreground shadow-sm",
                          ACTIVE_NAV_BG[tone],
                        )
                      : "text-foreground/80 hover:bg-accent hover:text-foreground",
                  )}
                >
                  {active && (
                    <span
                      className={cn(
                        "absolute inset-y-2 left-0 w-1 rounded-r-full bg-gradient-to-b",
                        style.stripe,
                      )}
                      aria-hidden
                    />
                  )}
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      active
                        ? style.icon
                        : "bg-accent text-foreground/70 group-hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="truncate">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="my-4 border-t border-border" />

        <SidebarSettings />
      </nav>

      <div className="relative shrink-0 border-t border-border bg-card p-4">
        <SidebarDeveloperCard />
      </div>
    </aside>
  );
}
