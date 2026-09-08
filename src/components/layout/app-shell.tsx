"use client";

import { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";
import { BrandMark, BrandTitle } from "@/components/layout/brand-mark";
import { Breadcrumbs } from "./breadcrumbs";
import { Sidebar } from "./sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "@/components/locale/locale-provider";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function AppShell({
  children,
  contentClassName,
}: {
  children: React.ReactNode;
  contentClassName?: string;
}) {
  const t = useT();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  function closeMobileMenu() {
    setMobileOpen(false);
  }

  useEffect(() => {
    if (!mobileOpen) return;

    const drawer = drawerRef.current;
    if (!drawer) return;

    const focusables = Array.from(
      drawer.querySelectorAll<HTMLElement>(FOCUSABLE),
    );

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    first?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileOpen(false);
        return;
      }

      if (event.key !== "Tab" || focusables.length === 0) return;

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        }
      } else if (document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    const menuButton = menuButtonRef.current;
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      menuButton?.focus();
    };
  }, [mobileOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <a href="#main-content" className="skip-link">
        {t("a11y.skipToContent")}
      </a>

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/55"
            onClick={closeMobileMenu}
            aria-hidden
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={t("nav.menu")}
            className="absolute inset-y-0 left-0 w-[17rem] bg-card shadow-2xl"
          >
            <Sidebar mobile id="mobile-navigation" onClose={closeMobileMenu} />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex h-14 items-center gap-3 border-b border-border bg-card px-4 lg:hidden">
          <Button
            ref={menuButtonRef}
            variant="ghost"
            size="icon"
            aria-label={t("a11y.openMenu")}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" aria-hidden />
          </Button>
          <BrandMark size="sm" />
          <BrandTitle />
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="grid-bg flex-1 overflow-x-hidden overflow-y-auto [scrollbar-gutter:stable]"
        >
          <div
            className={cn(
              "mx-auto w-full min-w-0 max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8",
              contentClassName,
            )}
          >
            <Breadcrumbs />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
