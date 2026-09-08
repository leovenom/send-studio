"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ResponsiveEmailPreview } from "@/components/templates/responsive-preview";
import { useT } from "@/components/locale/locale-provider";
import { readEmailPreviewPopup, type EmailPreviewPopupPayload } from "@/lib/email-preview-popup";
import { ArrowLeft, LayoutTemplate } from "lucide-react";

function subscribePreviewPayload() {
  return () => {};
}

function getPreviewPayloadSnapshot(): EmailPreviewPopupPayload | null {
  return readEmailPreviewPopup();
}

function getPreviewPayloadServerSnapshot(): EmailPreviewPopupPayload | null {
  return null;
}

export default function PreviewEmailPage() {
  const t = useT();
  const payload = useSyncExternalStore(
    subscribePreviewPayload,
    getPreviewPayloadSnapshot,
    getPreviewPayloadServerSnapshot,
  );

  if (!payload?.html) {
    return (
      <div className="grid-bg flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8ec5ff]/20 to-[#a78bfa]/20">
          <LayoutTemplate className="h-7 w-7 text-[#7c3aed] dark:text-[#c4b5fd]" />
        </div>
        <h1 className="mt-4 text-lg font-semibold">{t("preview.popupTitle")}</h1>
        <p className="mt-2 max-w-md text-sm text-muted">{t("preview.popupEmpty")}</p>
        <Link
          href="/templates"
          className="btn-accent mt-6 px-4 py-2.5 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("preview.popupBack")}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid-bg min-h-screen">
      <header className="border-b border-border bg-card/80 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="label-caps !mb-0">{t("preview.popupTitle")}</p>
            <p className="truncate text-sm font-medium">{payload.subject || t("preview.responsiveTitle")}</p>
          </div>
          <button
            type="button"
            onClick={() => window.close()}
            className="btn-accent-secondary shrink-0 px-3 py-2 text-xs"
          >
            {t("preview.popupClose")}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <ResponsiveEmailPreview
          html={payload.html}
          subject={payload.subject}
          preheader={payload.preheader}
          subjectLabel={payload.subjectLabel}
          preheaderLabel={payload.preheaderLabel}
          initialDevice={payload.device}
          initialDarkClient={payload.darkClient}
          fullscreen
        />
      </main>
    </div>
  );
}
