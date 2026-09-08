import type { UiLocale } from "./translations";

export const LOCALE_STORAGE_KEY = "send-studio-ui-locale";

export function parseUiLocale(value: string | undefined | null): UiLocale {
  return value === "en" ? "en" : "pt-BR";
}
