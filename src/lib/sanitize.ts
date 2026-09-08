/** Sanitização básica de HTML — remove scripts e event handlers */

const BLOCKED_TAGS = /<\/?(?:script|iframe|object|embed|form|input|meta|link|base|style|svg|math)[^>]*>/gi;
const EVENT_HANDLERS = /\s(on\w+)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const UNSAFE_URL = /(\s(href|src|action|formaction|xlink:href)\s*=\s*["'])(?:javascript|vbscript|data:text\/html)[^"']*/gi;

const TELEGRAM_ALLOWED = new Set([
  "b", "strong", "i", "em", "u", "ins", "s", "strike", "del", "a", "code", "pre",
]);

export function sanitizeEmailHtml(html: string): string {
  return html
    .replace(BLOCKED_TAGS, "")
    .replace(EVENT_HANDLERS, "")
    .replace(UNSAFE_URL, "$1#blocked:");
}

export function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function sanitizeTelegramHtml(html: string): string {
  let out = sanitizeEmailHtml(html);
  out = out.replace(/<\/?([a-zA-Z][a-zA-Z0-9-]*)([^>]*)>/g, (match, tag: string) => {
    return TELEGRAM_ALLOWED.has(tag.toLowerCase()) ? match : "";
  });
  return out;
}

export function isSafeHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function safeHref(url: string, fallback = "#"): string {
  return isSafeHttpUrl(url) ? url : fallback;
}
