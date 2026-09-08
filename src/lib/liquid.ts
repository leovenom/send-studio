import { Liquid } from "liquidjs";
import { getTranslations, normalizeLocale } from "./i18n";

export interface LiquidContact {
  name: string;
  email: string;
  company?: string | null;
  locale: string;
}

export interface LiquidContext {
  contact: LiquidContact;
  locale?: string;
  t?: Record<string, string>;
  [key: string]: unknown;
}

const engine = new Liquid({
  strictFilters: false,
  strictVariables: false,
});

engine.registerFilter("t", (key: string, locale?: string) => {
  const translations = getTranslations(locale ?? "en");
  return translations[key] ?? key;
});

export function buildLiquidContext(contact: Partial<LiquidContact>): LiquidContext {
  const locale = normalizeLocale(contact.locale);
  return {
    contact: {
      name: contact.name ?? "Maria Silva",
      email: contact.email ?? "maria@example.com",
      company: contact.company ?? "Acme Inc",
      locale,
    },
    locale,
    t: getTranslations(locale),
  };
}

export async function renderLiquid(
  template: string,
  context: LiquidContext,
): Promise<string> {
  if (!template.includes("{{") && !template.includes("{%")) {
    return template;
  }

  try {
    return await engine.parseAndRender(template, context);
  } catch (error) {
    console.error("Liquid render error:", error);
    return template;
  }
}

/** Re-render until nested Liquid in translation strings (e.g. t.subject_welcome) is expanded. */
export async function renderLiquidDeep(
  template: string,
  context: LiquidContext,
  maxPasses = 4,
): Promise<string> {
  let out = template;
  for (let i = 0; i < maxPasses; i++) {
    if (!out.includes("{{") && !out.includes("{%")) break;
    const next = await renderLiquid(out, context);
    if (next === out) break;
    out = next;
  }
  return out;
}

export async function renderSubject(
  subject: string,
  context: LiquidContext,
): Promise<string> {
  return renderLiquidDeep(subject, context);
}
