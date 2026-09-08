"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { BlockEditor } from "@/components/templates/block-editor";
import { LoadingRegion, Skeleton } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldGroup, Label, FieldError } from "@/components/ui/select";
import { useT } from "@/components/locale/locale-provider";
import { EmailBlock } from "@/lib/blocks";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-fetch";
import { ArrowLeft, Archive, Check, Copy, Save, Trash2 } from "lucide-react";

export default function TemplateEditorPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [preheader, setPreheader] = useState("");
  const [blocks, setBlocks] = useState<EmailBlock[]>([]);
  const [status, setStatus] = useState("active");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch(`/api/templates/${id}`)
      .then((r) => r.json())
      .then((template) => {
        setName(template.name);
        setSubject(template.subject);
        setPreheader(template.preheader ?? "");
        try {
          setBlocks(JSON.parse(template.blocks));
        } catch {
          setBlocks([]);
        }
        setStatus(template.status ?? "active");
        setLoading(false);
      });
  }, [id]);

  async function handleSave() {
    setSaving(true);
    await apiFetch(`/api/templates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, subject, preheader, blocks }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleArchive() {
    const next = status === "archived" ? "active" : "archived";
    await apiFetch(`/api/templates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setStatus(next);
  }

  async function handleDuplicate() {
    const res = await apiFetch(`/api/templates/${id}/duplicate`, { method: "POST" });
    const template = await res.json();
    router.push(`/templates/${template.id}`);
  }

  async function handleDelete() {
    if (!confirm(t("editor.confirmDelete", { name }))) return;
    const res = await apiFetch(`/api/templates/${id}`, { method: "DELETE" });
    if (res.status === 409) {
      const data = await res.json();
      setActionError(data.error ?? t("validation.fillRequired"));
      return;
    }
    router.push("/templates");
  }

  if (loading) {
    return (
      <AppShell>
        <LoadingRegion loading statusLabel={t("common.loading")}>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </LoadingRegion>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="accent-panel mb-6 p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <Link
              href="/templates"
              aria-label={t("a11y.backToTemplates")}
              className="btn-accent-secondary flex h-10 w-10 items-center justify-center rounded-xl focus-ring"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </Link>
            <div className="min-w-0 flex-1 space-y-3">
              <FieldGroup>
                <Label htmlFor="template-name" required>
                  {t("editor.templateName")}
                </Label>
                <Input
                  id="template-name"
                  required
                  aria-required="true"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-base font-semibold"
                  placeholder={t("editor.templateName")}
                />
              </FieldGroup>
              <FieldGroup>
                <Label htmlFor="template-subject">{t("editor.subject")}</Label>
                <Input
                  id="template-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="{{ t.welcome }}, {{ contact.name }}!"
                  className="font-mono text-sm"
                />
              </FieldGroup>
              <FieldGroup>
                <Label htmlFor="template-preheader">{t("editor.preheader")}</Label>
                <Input
                  id="template-preheader"
                  value={preheader}
                  onChange={(e) => setPreheader(e.target.value)}
                  placeholder="{{ t.body }}"
                  className="font-mono text-sm"
                />
                <p className="mt-1 text-xs text-muted">{t("editor.preheaderHint")}</p>
              </FieldGroup>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDuplicate}
              className="btn-accent-secondary px-3.5 py-2 text-sm"
            >
              <Copy className="h-4 w-4 text-[#a78bfa]" />
              {t("editor.duplicate")}
            </button>
            <Button variant="secondary" onClick={handleArchive}>
              <Archive className="h-4 w-4" />
              {status === "archived" ? t("common.restore") : t("common.archive")}
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
              {t("editor.delete")}
            </Button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={cn(
                "btn-accent px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50",
                saving && "opacity-70",
              )}
            >
              {saved ? (
                <Check className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? t("editor.saving") : saved ? t("editor.saved") : t("editor.save")}
            </button>
            </div>
            <FieldError id="template-action-error" message={actionError} />
          </div>
        </div>
      </div>

      <div className="min-w-0 overflow-hidden rounded-xl border border-[#8ec5ff]/15 shadow-sm">
        <div className="h-1 bg-gradient-to-r from-[#8ec5ff] via-[#a78bfa] to-[#5eead4]" />
        <BlockEditor blocks={blocks} onChange={setBlocks} subject={subject} preheader={preheader} />
      </div>
    </AppShell>
  );
}
