"use client";

import { useRef, useState } from "react";
import { SectionCard } from "@/components/ui/page-header";
import { Label, Select } from "@/components/ui/select";
import { useT } from "@/components/locale/locale-provider";
import { parseContactsCsv } from "@/lib/contacts/import-csv";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-fetch";
import { CheckCircle2, Download, FileSpreadsheet, Upload } from "lucide-react";

interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
  skippedEmpty?: number;
  errors: { line: number; message: string }[];
  total?: number;
}

export function ContactImport({ onImported }: { onImported: () => void }) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<ReturnType<typeof parseContactsCsv> | null>(null);
  const [mode, setMode] = useState<"skip" | "update">("skip");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleFile(file: File) {
    setResult(null);
    setFileName(file.name);
    const text = await file.text();
    setPreview(parseContactsCsv(text));
  }

  async function handleImport() {
    if (!preview || preview.rows.length === 0) return;

    setImporting(true);
    const csv = await inputRef.current?.files?.[0]?.text();
    if (!csv) {
      setImporting(false);
      return;
    }

    const res = await apiFetch("/api/contacts/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv, mode }),
    });

    const data = await res.json();
    setResult(data);
    setImporting(false);

    if (res.ok && (data.imported > 0 || data.updated > 0)) {
      onImported();
      setPreview(null);
      setFileName(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <SectionCard title={t("import.title")} label="CSV" tone="cyan">
      <div className="space-y-4">
        <p className="text-xs leading-relaxed text-muted">{t("import.csvHelp")}</p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => window.open("/api/contacts/import/template", "_blank")}
            className="btn-accent-secondary px-3 py-2 text-xs"
          >
            <Download className="h-3.5 w-3.5 text-[#8ec5ff]" />
            {t("import.downloadTemplate")}
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="btn-accent px-3 py-2 text-xs"
          >
            <Upload className="h-3.5 w-3.5" />
            {t("import.chooseFile")}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>

        {fileName && (
          <p className="flex items-center gap-2 text-xs text-muted">
            <FileSpreadsheet className="h-3.5 w-3.5 text-[#0d9488] dark:text-[#5eead4]" />
            {t("import.file")}:{" "}
            <span className="font-medium text-foreground">{fileName}</span>
          </p>
        )}

        {preview && (
          <div className="space-y-3 rounded-xl border border-[#5eead4]/20 bg-gradient-to-br from-[#5eead4]/5 to-[#8ec5ff]/5 p-3">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-700 dark:text-emerald-400">
                {t("import.valid", { count: preview.rows.length })}
              </span>
              {preview.errors.length > 0 && (
                <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-medium text-amber-700 dark:text-amber-400">
                  {t("import.errors", { count: preview.errors.length })}
                </span>
              )}
            </div>

            {preview.rows.length > 0 && (
              <div className="max-h-32 overflow-y-auto rounded-lg border border-[#8ec5ff]/15 bg-card text-xs">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-[#8ec5ff]/10 text-left">
                      <th className="px-2 py-1.5 font-medium">{t("contacts.email")}</th>
                      <th className="px-2 py-1.5 font-medium">{t("contacts.name")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.slice(0, 5).map((row) => (
                      <tr key={row.email} className="border-b border-border/50">
                        <td className="truncate px-2 py-1.5">{row.email}</td>
                        <td className="truncate px-2 py-1.5">{row.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.rows.length > 5 && (
                  <p className="px-2 py-1.5 text-muted">
                    {t("import.moreContacts", { count: preview.rows.length - 5 })}
                  </p>
                )}
              </div>
            )}

            {preview.errors.length > 0 && (
              <ul className="max-h-24 space-y-1 overflow-y-auto text-[11px] text-amber-700 dark:text-amber-400">
                {preview.errors.slice(0, 5).map((err, i) => (
                  <li key={i}>
                    {t("import.lineError", { line: err.line, message: err.message })}
                  </li>
                ))}
              </ul>
            )}

            <div>
              <Label>{t("import.duplicates")}</Label>
              <Select
                value={mode}
                onChange={(e) => setMode(e.target.value as "skip" | "update")}
                className="mt-1"
              >
                <option value="skip">{t("import.duplicateSkip")}</option>
                <option value="update">{t("import.duplicateUpdate")}</option>
              </Select>
            </div>

            <button
              type="button"
              disabled={importing || preview.rows.length === 0}
              onClick={handleImport}
              className="btn-accent flex w-full px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {importing
                ? t("import.importing")
                : t("import.import", { count: preview.rows.length })}
            </button>
          </div>
        )}

        {result && (
          <div
            className={cn(
              "accent-callout p-3 text-sm",
              result.imported > 0 || result.updated > 0
                ? "border-emerald-500/30"
                : "border-amber-500/30",
            )}
          >
            <div className="flex items-start gap-2">
              <CheckCircle2
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0",
                  result.imported > 0 || result.updated > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400",
                )}
              />
              <div>
                <p className="font-medium">{t("import.done")}</p>
                <p className="mt-1 text-xs text-muted">
                  {t("import.doneDetail", {
                    imported: result.imported,
                    updated: result.updated,
                    skipped: result.skipped,
                  })}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
