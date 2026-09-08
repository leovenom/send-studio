"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { FieldGroup, Label, FieldError } from "@/components/ui/select";
import { useT } from "@/components/locale/locale-provider";
import { apiFetch } from "@/lib/api-fetch";
import { Lock } from "lucide-react";

export default function LoginPage() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error === "Invalid token" ? t("auth.invalidToken") : data.error);
        return;
      }

      router.replace(next);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#8ec5ff]/20 bg-card p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8ec5ff]/15 text-[#2563eb] dark:text-[#8ec5ff]">
            <Lock className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-lg font-semibold">{t("auth.loginTitle")}</h1>
            <p className="text-sm text-muted">{t("auth.loginDescription")}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldGroup>
            <Label htmlFor="studio-token" required>
              {t("auth.tokenLabel")}
            </Label>
            <Input
              id="studio-token"
              type="password"
              autoComplete="current-password"
              required
              aria-required="true"
              aria-invalid={!!error}
              aria-describedby={error ? "studio-token-error" : undefined}
              placeholder={t("auth.tokenPlaceholder")}
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                if (error) setError(null);
              }}
            />
            <FieldError id="studio-token-error" message={error} />
          </FieldGroup>

          <button
            type="submit"
            disabled={loading || !token.trim()}
            className="btn-accent flex w-full px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? t("common.loading") : t("auth.loginButton")}
          </button>
        </form>
      </div>
    </div>
  );
}
