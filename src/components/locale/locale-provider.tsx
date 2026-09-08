"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getUiT,
  type UiLocale,
  type UiTranslationKey,
} from "@/lib/ui-i18n/translations";
import { LOCALE_STORAGE_KEY } from "@/lib/ui-i18n/locale-storage";

export { LOCALE_STORAGE_KEY } from "@/lib/ui-i18n/locale-storage";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function writeLocaleCookie(locale: UiLocale) {
  document.cookie = `${LOCALE_STORAGE_KEY}=${locale};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
}

type TFunction = (
  key: UiTranslationKey,
  vars?: Record<string, string | number>,
) => string;

interface LocaleContextValue {
  locale: UiLocale;
  setLocale: (locale: UiLocale) => void;
  t: TFunction;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStoredLocale(): UiLocale | null {
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored === "en" || stored === "pt-BR") return stored;
  return null;
}

export function LocaleProvider({
  children,
  initialLocale = "pt-BR",
}: {
  children: React.ReactNode;
  initialLocale?: UiLocale;
}) {
  const [locale, setLocaleState] = useState<UiLocale>(initialLocale);

  useEffect(() => {
    const stored = readStoredLocale();
    if (stored && stored !== locale) {
      // One-time migration when localStorage differs from the SSR cookie snapshot.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional post-hydration locale sync
      setLocaleState(stored);
      writeLocaleCookie(stored);
      return;
    }
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    writeLocaleCookie(locale);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- sync persisted locale once on mount

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: UiLocale) => {
    setLocaleState(next);
    localStorage.setItem(LOCALE_STORAGE_KEY, next);
    writeLocaleCookie(next);
  }, []);

  const t = useMemo(() => getUiT(locale), [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}

export function useT() {
  return useLocale().t;
}
