/** Site-wide config for SEO, canonical URLs, and Open Graph. */

const LOCAL_FALLBACK = "http://localhost:3000";

function isValidSiteUrl(value: string): boolean {
  if (!value || /[<>]/.test(value)) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function getSiteUrl(): string {
  const candidates = [
    process.env.SITE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ];

  for (const raw of candidates) {
    if (!raw) continue;
    const normalized = raw.replace(/\/$/, "");
    if (isValidSiteUrl(normalized)) return normalized;
  }

  return LOCAL_FALLBACK;
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
