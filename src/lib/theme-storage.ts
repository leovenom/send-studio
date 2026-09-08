export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "send-studio-theme";

export function parseTheme(value: string | undefined | null): Theme {
  if (value === "light" || value === "dark" || value === "system") return value;
  return "system";
}

/** SSR-safe resolved theme (system preference is unknown on the server). */
export function resolveThemeForSsr(theme: Theme): ResolvedTheme {
  return theme === "dark" ? "dark" : "light";
}
