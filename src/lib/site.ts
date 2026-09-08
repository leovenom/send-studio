/** Site-wide config for SEO, canonical URLs, and Open Graph. */

export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

export const siteConfig = {
  name: "Send Studio",
  title: "Send Studio",
  description:
    "Email CRM with block template editor, multi-channel campaigns (Resend, WhatsApp, Telegram), and delivery analytics.",
  descriptionPt:
    "CRM de email com editor de templates em blocos, campanhas multicanal e analytics de entregas via Resend.",
  locale: "pt_BR",
  language: "pt-BR",
  twitterHandle: undefined as string | undefined,
  creator: "Leonardt",
  /** Private CRM — not intended for public search indexing */
  allowIndexing: false,
} as const;

export const developerConfig = {
  name: "Leonardt",
  roleKey: "nav.developerRole" as const,
  githubUrl: "https://github.com/leovenom",
  githubUsername: "leovenom",
  avatarUrl: "https://github.com/leovenom.png",
} as const;

export const publicRoutes = [
  { path: "/", priority: 1, changeFrequency: "daily" as const },
  { path: "/contacts", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/templates", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/templates/generate", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/campaigns", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/analytics", priority: 0.7, changeFrequency: "daily" as const },
];
