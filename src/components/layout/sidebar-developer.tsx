"use client";

import { useT } from "@/components/locale/locale-provider";
import { developerConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

export function SidebarDeveloperCard({ className }: { className?: string }) {
  const t = useT();

  return (
    <div className={cn("space-y-3", className)}>
      <div className="rounded-xl border border-border bg-accent p-3.5 shadow-sm">
        <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {t("nav.builtBy")}
        </p>

        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={developerConfig.avatarUrl}
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 shrink-0 rounded-full border-2 border-border bg-card object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight text-foreground">
              {developerConfig.name}
            </p>
            <p className="text-xs text-muted-foreground">{t(developerConfig.roleKey)}</p>
          </div>
        </div>

        <a
          href={developerConfig.githubUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-accent-secondary mt-3 w-full px-3 py-2 text-xs focus-ring"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5 shrink-0"
            fill="currentColor"
            aria-hidden
          >
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A8.996 8.996 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
          @{developerConfig.githubUsername}
          <span className="sr-only"> ({t("nav.viewGitHub")})</span>
        </a>
      </div>

      <p className="text-center text-[10px] text-muted-foreground">
        {t("nav.resendCredit")}{" "}
        <a
          href="https://resend.com"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-foreground/70 underline-offset-2 hover:text-foreground hover:underline"
        >
          Resend
        </a>
      </p>
    </div>
  );
}
