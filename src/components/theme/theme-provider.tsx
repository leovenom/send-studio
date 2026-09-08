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
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type Theme,
  resolveThemeForSsr,
} from "@/lib/theme-storage";

export type { ResolvedTheme, Theme } from "@/lib/theme-storage";
export { THEME_STORAGE_KEY } from "@/lib/theme-storage";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function writeThemeCookie(theme: Theme) {
  document.cookie = `${THEME_STORAGE_KEY}=${theme};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readStoredTheme(): Theme | null {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return null;
}

export function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme;
}

export function applyResolvedTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.classList.toggle("light", resolved === "light");
  root.style.colorScheme = resolved;
}

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  initialTheme = "system",
}: {
  children: React.ReactNode;
  initialTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveThemeForSsr(initialTheme),
  );

  useEffect(() => {
    const stored = readStoredTheme();
    const activeTheme = stored && stored !== theme ? stored : theme;

    if (stored && stored !== theme) {
      // One-time migration when localStorage differs from the SSR cookie snapshot.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional post-hydration theme sync
      setThemeState(stored);
    }

    localStorage.setItem(THEME_STORAGE_KEY, activeTheme);
    writeThemeCookie(activeTheme);

    const resolved = resolveTheme(activeTheme);
    setResolvedTheme(resolved);
    applyResolvedTheme(resolved);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- sync persisted theme once on mount

  useEffect(() => {
    if (theme !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const resolved = resolveTheme("system");
      setResolvedTheme(resolved);
      applyResolvedTheme(resolved);
    };

    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
    writeThemeCookie(next);
    const resolved = resolveTheme(next);
    setResolvedTheme(resolved);
    applyResolvedTheme(resolved);
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
