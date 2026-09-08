import type { EmailBlock } from "@/lib/blocks";
import { partitionBlocks } from "@/lib/blocks";
import { buildLiquidContext, renderLiquid, renderSubject } from "@/lib/liquid";
import { escapeHtmlAttr, safeHref, sanitizeTelegramHtml } from "@/lib/sanitize";

/** Converte blocos de email em texto plano para WhatsApp/Telegram */
export async function blocksToPlainText(
  blocks: EmailBlock[],
  contact?: { name?: string; email?: string; company?: string | null; locale?: string },
  subject?: string,
): Promise<string> {
  const ordered = partitionBlocks(blocks);
  const ctx = buildLiquidContext(contact ?? {});
  const lines: string[] = [];

  if (subject) {
    lines.push(`*${await renderSubject(subject, ctx)}*`, "");
  }

  for (const block of ordered) {
    switch (block.type) {
      case "heading":
        lines.push(`*${await renderLiquid(block.props.text, ctx)}*`, "");
        break;
      case "text":
        lines.push(await renderLiquid(block.props.text, ctx), "");
        break;
      case "button":
      case "link": {
        const text = await renderLiquid(block.props.text, ctx);
        const url = await renderLiquid(block.props.url, ctx);
        if (block.type === "link" || block.props.style === "link") {
          lines.push(`${text}: ${url}`, "");
        } else {
          lines.push(`👉 ${text}: ${url}`, "");
        }
        break;
      }
      case "header": {
        const title = await renderLiquid(block.props.title, ctx);
        lines.push(`━━ ${title} ━━`, "");
        break;
      }
      case "footer": {
        const text = await renderLiquid(block.props.text, ctx);
        const unsub = await renderLiquid(block.props.unsubscribeText, ctx);
        lines.push(text, `${unsub}: ${block.props.unsubscribeUrl}`, "");
        break;
      }
      case "image": {
        const url = block.props.src;
        if (url && !url.startsWith("data:")) lines.push(`🖼 ${url}`, "");
        break;
      }
      case "content": {
        const html = await renderLiquid(block.props.body, ctx);
        const text = html
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/p>/gi, "\n")
          .replace(/<[^>]+>/g, "")
          .trim();
        if (text) lines.push(text, "");
        break;
      }
      case "divider":
        lines.push("———", "");
        break;
      default:
        break;
    }
  }

  return lines.join("\n").trim();
}

export async function blocksToTelegramHtml(
  blocks: EmailBlock[],
  contact?: { name?: string; email?: string; company?: string | null; locale?: string },
  subject?: string,
): Promise<string> {
  const ordered = partitionBlocks(blocks);
  const ctx = buildLiquidContext(contact ?? {});
  const parts: string[] = [];

  if (subject) {
    parts.push(`<b>${esc(await renderSubject(subject, ctx))}</b>`, "");
  }

  for (const block of ordered) {
    switch (block.type) {
      case "heading":
        parts.push(`<b>${esc(await renderLiquid(block.props.text, ctx))}</b>`, "");
        break;
      case "text":
        parts.push(esc(await renderLiquid(block.props.text, ctx)), "");
        break;
      case "button":
      case "link": {
        const text = await renderLiquid(block.props.text, ctx);
        const url = await renderLiquid(block.props.url, ctx);
        const href = safeHref(url);
        parts.push(`<a href="${escapeHtmlAttr(href)}">${esc(text)}</a>`, "");
        break;
      }
      case "header": {
        const title = await renderLiquid(block.props.title, ctx);
        parts.push(`<b>${esc(title)}</b>`, "");
        break;
      }
      case "footer": {
        const text = await renderLiquid(block.props.text, ctx);
        const unsub = await renderLiquid(block.props.unsubscribeText, ctx);
        const unsubUrl = safeHref(block.props.unsubscribeUrl);
        parts.push(
          `<i>${esc(text)}</i>`,
          `<a href="${escapeHtmlAttr(unsubUrl)}">${esc(unsub)}</a>`,
          "",
        );
        break;
      }
      case "image": {
        const url = block.props.src;
        if (url && !url.startsWith("data:") && safeHref(url) !== "#") {
          parts.push(`<a href="${escapeHtmlAttr(url)}">🖼 Imagem</a>`, "");
        }
        break;
      }
      case "content": {
        const raw = await renderLiquid(block.props.body, ctx);
        parts.push(sanitizeTelegramHtml(raw), "");
        break;
      }
      default:
        break;
    }
  }

  return parts.join("\n").trim();
}

function esc(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
