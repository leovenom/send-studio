import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { LocaleProvider } from "@/components/locale/locale-provider";
import { ThemeInitScript } from "@/components/theme/theme-init-script";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { JsonLd } from "@/components/seo/json-ld";
import { getRootStructuredData } from "@/lib/seo/structured-data";
import { createDefaultOgMetadata } from "@/lib/seo/metadata";
import { getSiteUrl, siteConfig } from "@/lib/site";
import { THEME_STORAGE_KEY, parseTheme } from "@/lib/theme-storage";
import { LOCALE_STORAGE_KEY, parseUiLocale } from "@/lib/ui-i18n/locale-storage";
import type { UiLocale } from "@/lib/ui-i18n/translations";
import "./globals.css";

function readLocaleCookie(value: string | undefined): UiLocale {
  return parseUiLocale(value);
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  creator: siteConfig.creator,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  ...createDefaultOgMetadata(),
  icons: {
    icon: [{ url: "/icon", type: "image/png" }],
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const initialLocale = readLocaleCookie(
    cookieStore.get(LOCALE_STORAGE_KEY)?.value,
  );
  const initialTheme = parseTheme(cookieStore.get(THEME_STORAGE_KEY)?.value);

  return (
    <html
      lang={initialLocale === "en" ? "en" : "pt-BR"}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ThemeInitScript />
        <JsonLd data={getRootStructuredData()} />
        <ThemeProvider initialTheme={initialTheme}>
          <LocaleProvider initialLocale={initialLocale}>
            {children}
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
