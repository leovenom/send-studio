"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, SectionCard, Skeleton, LoadingRegion } from "@/components/ui/page-header";
import { getTabProps, handleTabArrowKeys, makeTabIds } from "@/components/ui/tab-list";
import { FieldError } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/components/locale/locale-provider";
import { accentAt, accentToneStyles } from "@/lib/accent-styles";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-fetch";
import type { Template } from "@/lib/db/schema";

type TemplateListItem = Pick<
  Template,
  "id" | "name" | "subject" | "preheader" | "status" | "createdAt" | "updatedAt"
> & { blockCount?: number; blocks?: string };
import {
  Archive,
  ArchiveRestore,
  Blocks,
  Copy,
  LayoutTemplate,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";

type Tab = "active" | "archived";

const LIBRARY_TABS = ["active", "archived"] as const satisfies readonly Tab[];
const LIBRARY_TAB_PREFIX = "templates-library";

export default function TemplatesPage() {
  const t = useT();
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("active");
  const [actionError, setActionError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await apiFetch("/api/templates?includeArchived=true");
    const data = await res.json();
    setTemplates(data);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const res = await apiFetch("/api/templates?includeArchived=true");
      const data = await res.json();
      if (cancelled) return;
      setTemplates(data);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = templates.filter((tmpl) =>
    tab === "archived" ? tmpl.status === "archived" : tmpl.status !== "archived",
  );

  const activeCount = templates.filter((tmpl) => tmpl.status !== "archived").length;
  const archivedCount = templates.filter((tmpl) => tmpl.status === "archived").length;

  async function createTemplate() {
    const res = await apiFetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: t("templates.defaultName"),
        subject: "{{ t.welcome }}, {{ contact.name }}!",
        blocks: [],
      }),
    });
    const template = await res.json();
    router.push(`/templates/${template.id}`);
  }

  async function archiveTemplate(id: string) {
    await apiFetch(`/api/templates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "archived" }),
    });
    load();
  }

  async function restoreTemplate(id: string) {
    await apiFetch(`/api/templates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });
    load();
  }

  async function duplicateTemplate(id: string) {
    const res = await apiFetch(`/api/templates/${id}/duplicate`, { method: "POST" });
    const template = await res.json();
    router.push(`/templates/${template.id}`);
  }

  async function deleteTemplate(id: string, name: string) {
    if (!confirm(t("templates.confirmDelete", { name }))) return;
    const res = await apiFetch(`/api/templates/${id}`, { method: "DELETE" });
    if (res.status === 409) {
      const data = await res.json();
      setActionError(data.error ?? t("validation.fillRequired"));
      return;
    }
    load();
  }

  return (
    <AppShell>
      <PageHeader
        accent
        label={t("templates.label")}
        title={t("templates.title")}
        description={t("templates.description")}
      />

      {actionError && (
        <div className="mb-4 px-1">
          <FieldError id="templates-action-error" message={actionError} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[400px_1fr] lg:items-start">
        <SectionCard
          title={t("templates.newTemplate")}
          tone="violet"
        >
          <div className="space-y-4">
            <p className="text-xs leading-relaxed text-muted">
              {t("templates.newTemplateHelp")}
            </p>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/templates/generate"
                className="btn-accent-secondary px-3 py-2 text-xs"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#a78bfa]" aria-hidden />
                {t("templates.generateAi")}
              </Link>
              <button
                type="button"
                onClick={createTemplate}
                className="btn-accent px-3 py-2 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                {t("templates.createManual")}
              </button>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title={
            loading
              ? t("common.loading")
              : t("templates.count", { count: filtered.length })
          }
          tone="blue"
          contentClassName="p-0"
          action={
            <div
              role="tablist"
              aria-label={t("a11y.templateLibrary")}
              className="flex gap-2"
              onKeyDown={(e) =>
                handleTabArrowKeys(e, LIBRARY_TABS, tab, setTab, LIBRARY_TAB_PREFIX)
              }
            >
              {LIBRARY_TABS.map((tabId) => (
                <button
                  key={tabId}
                  type="button"
                  {...getTabProps(LIBRARY_TAB_PREFIX, tabId, tab === tabId)}
                  onClick={() => setTab(tabId)}
                  className={cn(
                    "tab-pill !px-2.5 !py-1 text-xs focus-ring",
                    tab === tabId ? "tab-pill-active" : "tab-pill-idle",
                  )}
                >
                  {tabId === "active"
                    ? `${t("common.active")} · ${activeCount}`
                    : `${t("common.archived")} · ${archivedCount}`}
                </button>
              ))}
            </div>
          }
        >
          <LoadingRegion loading={loading} statusLabel={t("common.loading")}>
            <div
              id={makeTabIds(LIBRARY_TAB_PREFIX, tab).panel}
              role="tabpanel"
              aria-labelledby={makeTabIds(LIBRARY_TAB_PREFIX, tab).tab}
            >
          {loading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={LayoutTemplate}
                title={
                  tab === "archived"
                    ? t("templates.emptyArchivedTitle")
                    : t("templates.emptyTitle")
                }
                description={
                  tab === "archived"
                    ? t("templates.emptyArchivedDesc")
                    : t("templates.emptyDesc")
                }
                action={
                  tab === "active" ? (
                    <div className="flex flex-wrap justify-center gap-2">
                      <Link
                        href="/templates/generate"
                        className="btn-accent-secondary px-4 py-2.5 text-sm"
                      >
                        <Sparkles className="h-4 w-4" aria-hidden />
                        {t("templates.generateAi")}
                      </Link>
                      <button
                        type="button"
                        onClick={createTemplate}
                        className="btn-accent px-4 py-2.5 text-sm"
                      >
                        <Plus className="h-4 w-4" />
                        {t("templates.createManual")}
                      </button>
                    </div>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((template, i) => {
                const blockCount =
                  template.blockCount ??
                  (() => {
                    try {
                      return JSON.parse(template.blocks ?? "[]").length;
                    } catch {
                      return 0;
                    }
                  })();
                const isArchived = template.status === "archived";
                const tone = accentAt(i);
                const style = accentToneStyles[tone];

                return (
                  <div
                    key={template.id}
                    className="group relative px-6 py-4 transition-colors hover:bg-[#8ec5ff]/5"
                  >
                    <div
                      className={cn(
                        "absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b opacity-0 transition-opacity group-hover:opacity-100",
                        style.stripe,
                      )}
                    />
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <Link
                          href={`/templates/${template.id}`}
                          aria-label={template.name}
                          className={cn(
                            "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
                            style.icon,
                          )}
                        >
                          <LayoutTemplate className="h-4 w-4" aria-hidden />
                        </Link>
                        <div className="min-w-0">
                          <Link href={`/templates/${template.id}`}>
                            <p className="truncate font-medium hover:underline">
                              {template.name}
                            </p>
                          </Link>
                          <p className="mt-0.5 truncate font-mono text-sm text-muted">
                            {template.subject}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10px]",
                                style.chip,
                              )}
                            >
                              <Blocks className="h-3 w-3" />
                              {t(
                                blockCount === 1
                                  ? "common.blocks_one"
                                  : "common.blocks_other",
                                { count: blockCount },
                              )}
                            </span>
                            {isArchived && (
                              <Badge variant="warning">{t("templates.archivedBadge")}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t("common.duplicate")}
                          onClick={() => duplicateTemplate(template.id)}
                        >
                          <Copy className="h-3.5 w-3.5" aria-hidden />
                        </Button>
                        {isArchived ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t("common.restore")}
                            onClick={() => restoreTemplate(template.id)}
                          >
                            <ArchiveRestore className="h-3.5 w-3.5" aria-hidden />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t("common.archive")}
                            onClick={() => archiveTemplate(template.id)}
                          >
                            <Archive className="h-3.5 w-3.5" aria-hidden />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t("common.delete")}
                          onClick={() => deleteTemplate(template.id, template.name)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" aria-hidden />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
            </div>
          </LoadingRegion>
        </SectionCard>
      </div>
    </AppShell>
  );
}
