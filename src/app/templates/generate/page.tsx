"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Input, Textarea } from "@/components/ui/input";
import { EmptyState, PageHeader, SectionCard } from "@/components/ui/page-header";
import { FieldGroup, Label, FieldError } from "@/components/ui/select";
import { useLocale, useT } from "@/components/locale/locale-provider";
import { ResponsiveEmailPreview } from "@/components/templates/responsive-preview";
import { accentAt, accentToneStyles } from "@/lib/accent-styles";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-fetch";
import type { EmailBlock } from "@/lib/blocks";
import {
  ArrowLeft,
  Check,
  ImagePlus,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";

interface Variation {
  id: string;
  name: string;
  style: string;
  description: string;
  subject: string;
  blocks: EmailBlock[];
  previewHtml: string;
}

export default function GenerateTemplatePage() {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    headline: "",
    body: "",
    ctaText: "",
    ctaUrl: "https://resend.com",
    imageUrl: "",
    brandColor: "#0a0a0a",
    subject: "",
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [source, setSource] = useState<"ai" | "fallback" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  function handleImageFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      setForm((f) => ({ ...f, imageUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  }

  async function handleGenerate() {
    if (!form.headline.trim() || !form.body.trim()) {
      setFormError(t("validation.fillRequired"));
      return;
    }

    setFormError(null);

    setGenerating(true);
    setVariations([]);
    setSelectedId(null);
    setSource(null);

    try {
      const res = await apiFetch("/api/templates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ctaText: form.ctaText || t("generate.defaultCta"),
          locale,
        }),
      });
      const data = await res.json();
      setVariations(data.variations);
      setSource(data.source);
      if (data.variations.length > 0) {
        setSelectedId(data.variations[0].id);
      }
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    const selected = variations.find((v) => v.id === selectedId);
    if (!selected) return;

    setSaving(true);
    try {
      const res = await apiFetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selected.name,
          subject: selected.subject,
          blocks: selected.blocks,
        }),
      });
      const template = await res.json();
      router.push(`/templates/${template.id}`);
    } finally {
      setSaving(false);
    }
  }

  const selected = variations.find((v) => v.id === selectedId);

  return (
    <AppShell>
      <div className="mb-4">
        <Link
          href="/templates"
          className="btn-accent-secondary px-3 py-2 text-sm focus-ring"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("generate.back")}
        </Link>
      </div>

      <PageHeader
        accent
        label={t("generate.label")}
        title={t("generate.title")}
        description={t("generate.description")}
      />

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <SectionCard title={t("generate.title")} tone="violet">
          <div className="space-y-4">
            <FieldGroup>
              <Label htmlFor="generate-headline" required>
                {t("generate.headline")}
              </Label>
              <Input
                id="generate-headline"
                required
                aria-required="true"
                aria-invalid={!!formError}
                aria-describedby={formError ? "generate-form-error" : undefined}
                placeholder={t("generate.headlinePlaceholder")}
                value={form.headline}
                onChange={(e) => {
                  setForm({ ...form, headline: e.target.value });
                  if (formError) setFormError(null);
                }}
              />
            </FieldGroup>

            <FieldGroup>
              <Label htmlFor="generate-body" required>
                {t("generate.body")}
              </Label>
              <Textarea
                id="generate-body"
                required
                aria-required="true"
                aria-invalid={!!formError}
                aria-describedby={formError ? "generate-form-error" : undefined}
                rows={5}
                placeholder={t("generate.bodyPlaceholder")}
                value={form.body}
                onChange={(e) => {
                  setForm({ ...form, body: e.target.value });
                  if (formError) setFormError(null);
                }}
              />
            </FieldGroup>

            <FieldGroup>
              <Label>{t("generate.subject")}</Label>
              <Input
                placeholder={t("generate.subjectPlaceholder")}
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </FieldGroup>

            <div className="grid grid-cols-2 gap-3">
              <FieldGroup>
                <Label>{t("generate.ctaText")}</Label>
                <Input
                  value={form.ctaText}
                  placeholder={t("generate.defaultCta")}
                  onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                />
              </FieldGroup>
              <FieldGroup>
                <Label>{t("generate.brandColor")}</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={form.brandColor}
                    onChange={(e) => setForm({ ...form, brandColor: e.target.value })}
                    className="h-9 w-10 cursor-pointer rounded-lg border border-[#8ec5ff]/20"
                  />
                  <Input
                    value={form.brandColor}
                    onChange={(e) => setForm({ ...form, brandColor: e.target.value })}
                    className="font-mono text-xs"
                  />
                </div>
              </FieldGroup>
            </div>

            <FieldGroup>
              <Label>{t("generate.ctaUrl")}</Label>
              <Input
                placeholder="https://..."
                value={form.ctaUrl}
                onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })}
              />
            </FieldGroup>

            <FieldGroup>
              <Label>{t("generate.image")}</Label>
              <Input
                placeholder={t("generate.imagePlaceholder")}
                value={form.imageUrl.startsWith("data:") ? "" : form.imageUrl}
                onChange={(e) => {
                  setForm({ ...form, imageUrl: e.target.value });
                  setImagePreview(e.target.value || null);
                }}
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageFile(file);
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#8ec5ff]/25 bg-gradient-to-br from-[#8ec5ff]/5 to-[#a78bfa]/5 py-6 text-sm text-muted transition-colors hover:border-[#8ec5ff]/40 hover:bg-[#8ec5ff]/10"
              >
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreview}
                    alt={t("generate.imagePreviewAlt")}
                    className="max-h-24 rounded-lg object-contain"
                  />
                ) : (
                  <>
                    <ImagePlus className="h-5 w-5 text-[#7c3aed] dark:text-[#c4b5fd]" />
                    {t("generate.imageUpload")}
                  </>
                )}
              </button>
            </FieldGroup>

            <FieldError id="generate-form-error" message={formError} />

            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating || !form.headline.trim() || !form.body.trim()}
              className="btn-accent flex w-full px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("generate.generating")}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {t("generate.generateButton")}
                </>
              )}
            </button>

            {source && (
              <p className="text-center text-xs text-muted">
                {source === "ai" ? (
                  <span className="flex items-center justify-center gap-1">
                    <Wand2 className="h-3 w-3 text-[#a78bfa]" />
                    {t("generate.sourceAi")}
                  </span>
                ) : (
                  t("generate.sourceFallback")
                )}
              </p>
            )}
          </div>
        </SectionCard>

        <div className="space-y-4">
          {generating && (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#8ec5ff]/25 bg-gradient-to-br from-[#8ec5ff]/5 via-transparent to-[#a78bfa]/5 py-24">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8ec5ff]/20 to-[#a78bfa]/20">
                <Loader2 className="h-7 w-7 animate-spin text-[#7c3aed] dark:text-[#c4b5fd]" />
              </div>
              <p className="mt-4 text-sm font-medium">{t("generate.creatingVariations")}</p>
              <p className="mt-1 text-xs text-muted">{t("generate.styleHint")}</p>
            </div>
          )}

          {!generating && variations.length === 0 && (
            <EmptyState
              icon={Sparkles}
              title={t("generate.emptyTitle")}
              description={t("generate.emptyDesc")}
            />
          )}

          {variations.length > 0 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {variations.map((v, i) => {
                  const tone = accentAt(i);
                  const style = accentToneStyles[tone];
                  const isSelected = selectedId === v.id;

                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedId(v.id)}
                      className={cn(
                        "group overflow-hidden rounded-xl border bg-card text-left transition-all duration-200 hover:-translate-y-0.5",
                        isSelected
                          ? cn("border-[#8ec5ff]/40 shadow-md", style.glow)
                          : "border-border hover:border-[#8ec5ff]/30 hover:shadow-sm",
                      )}
                    >
                      <div className={cn("h-1 bg-gradient-to-r", style.stripe)} />
                      <div
                        className={cn(
                          "flex items-center justify-between border-b px-4 py-3",
                          isSelected && cn("bg-gradient-to-r", style.stat),
                        )}
                      >
                        <div>
                          <p className="text-sm font-semibold">{v.name}</p>
                          <p className="text-xs text-muted">{v.description}</p>
                        </div>
                        {isSelected && (
                          <span
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-full",
                              style.icon,
                            )}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </div>
                      <div className="overflow-hidden bg-gradient-to-b from-[#8ec5ff]/5 to-transparent p-2">
                        <iframe
                          srcDoc={v.previewHtml}
                          title={v.name}
                          className="h-48 w-full rounded-lg border border-[#8ec5ff]/10 bg-white dark:bg-neutral-950"
                          sandbox="allow-same-origin"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              {selected && (
                <>
                  <ResponsiveEmailPreview
                    html={selected.previewHtml}
                    subject={selected.subject}
                  />
                  <div className="accent-panel flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {t("generate.selected", { name: selected.name })}
                      </p>
                      <p className="text-xs text-muted">
                        {t("generate.subjectMeta", {
                          subject: selected.subject,
                          count: selected.blocks.length,
                        })}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="btn-accent shrink-0 px-4 py-2.5 text-sm disabled:opacity-60"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      {saving ? t("generate.saving") : t("generate.useTemplate")}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
