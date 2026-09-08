"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { useT } from "@/components/locale/locale-provider";
import { ArrowLeft, Mail } from "lucide-react";

export default function NotFound() {
  const t = useT();

  return (
    <AppShell>
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8ec5ff] to-[#a78bfa] text-white shadow-[0_8px_32px_-8px_rgba(142,197,255,0.45)]">
          <Mail className="h-8 w-8" />
        </div>
        <p className="label-caps mt-6">404</p>
        <h1 className="gradient-text mt-2 text-3xl font-semibold tracking-tight">
          {t("seo.notFoundTitle")}
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
          {t("seo.notFoundDesc")}
        </p>
        <Link
          href="/"
          className="btn-accent mt-8 px-5 py-2.5 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("seo.notFoundBack")}
        </Link>
      </div>
    </AppShell>
  );
}
