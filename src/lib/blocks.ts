import { nanoid } from "nanoid";
import { EXAMPLE_CONTENT_BLOCK } from "./i18n";
import { emailRow, wrapEmailHtml } from "./email-shell";
import { honeypotHtml } from "./tracking";
import { isSafeHttpUrl, safeHref, sanitizeEmailHtml } from "./sanitize";
import { buildLiquidContext, renderLiquid, type LiquidContext } from "./liquid";

export const BLOCK_TYPES = [
  "header",
  "heading",
  "text",
  "button",
  "link",
  "image",
  "divider",
  "spacer",
  "footer",
  "content",
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

export interface EmailBlock {
  id: string;
  type: BlockType;
  props: Record<string, string>;
}

export const BLOCK_DEFINITIONS: Record<
  BlockType,
  { label: string; description?: string; defaultProps: Record<string, string> }
> = {
  header: {
    label: "Header",
    description: "Logo + título no topo",
    defaultProps: {
      logoSrc: "https://resend.com/static/brand/resend-icon-black.svg",
      logoWidth: "48",
      logoAlt: "Logo",
      title: "Send Studio",
      subtitle: "",
      bgColor: "#ffffff",
      textColor: "#0a0a0a",
      align: "center",
    },
  },
  heading: {
    label: "Título",
    defaultProps: {
      text: "Olá, {{ contact.name }}!",
      level: "h1",
      align: "left",
    },
  },
  text: {
    label: "Texto",
    defaultProps: {
      text: "{{ t.body }}",
      align: "left",
    },
  },
  button: {
    label: "Botão / Link",
    description: "CTA como botão ou link",
    defaultProps: {
      text: "{{ t.cta }}",
      url: "https://resend.com",
      align: "center",
      color: "#000000",
      style: "button",
    },
  },
  link: {
    label: "Link",
    description: "Link de texto inline",
    defaultProps: {
      text: "Saiba mais",
      url: "https://resend.com",
      align: "left",
      color: "#2563eb",
      underline: "true",
    },
  },
  image: {
    label: "Imagem",
    defaultProps: {
      src: "https://resend.com/static/brand/resend-icon-black.svg",
      alt: "Imagem",
      align: "center",
      width: "560",
    },
  },
  divider: {
    label: "Divisor",
    defaultProps: { color: "#e5e5e5" },
  },
  spacer: {
    label: "Espaço",
    defaultProps: { height: "24" },
  },
  footer: {
    label: "Footer",
    description: "Rodapé com links e unsubscribe",
    defaultProps: {
      companyName: "Send Studio",
      text: "{{ t.footer }}",
      unsubscribeText: "{{ t.unsubscribe }}",
      unsubscribeUrl: "https://resend.com/unsubscribe",
      privacyUrl: "",
      privacyText: "Privacidade",
      bgColor: "#f5f5f5",
      textColor: "#737373",
      align: "center",
    },
  },
  content: {
    label: "Content (Liquid)",
    description: "Bloco HTML com lógica Liquid e i18n",
    defaultProps: {
      body: EXAMPLE_CONTENT_BLOCK,
      align: "left",
    },
  },
};

export function createBlock(type: BlockType): EmailBlock {
  return {
    id: nanoid(),
    type,
    props: { ...BLOCK_DEFINITIONS[type].defaultProps },
  };
}

/** Header sempre no topo, footer sempre na base — ordem relativa preservada em cada zona */
export function partitionBlocks(blocks: EmailBlock[]): EmailBlock[] {
  const headers = blocks.filter((b) => b.type === "header");
  const footers = blocks.filter((b) => b.type === "footer");
  const middle = blocks.filter((b) => b.type !== "header" && b.type !== "footer");
  return [...headers, ...middle, ...footers];
}

export function addBlockToTemplate(
  blocks: EmailBlock[],
  type: BlockType,
): EmailBlock[] {
  const block = createBlock(type);
  return partitionBlocks([...blocks, block]);
}

async function resolveProp(
  value: string,
  context: LiquidContext,
): Promise<string> {
  return renderLiquid(value, context);
}

export async function blocksToHtml(
  blocks: EmailBlock[],
  context?: Partial<LiquidContext["contact"]>,
  options?: { trackingToken?: string; preheader?: string },
): Promise<string> {
  const ordered = partitionBlocks(blocks);
  const ctx = buildLiquidContext(context ?? {});

  const rows = await Promise.all(
    ordered.map(async (block) => {
      const align = block.props.align ?? "left";
      const alignClass = align === "center" ? " mobile-center" : "";

      switch (block.type) {
        case "header": {
          const title = await resolveProp(block.props.title, ctx);
          const subtitle = block.props.subtitle
            ? await resolveProp(block.props.subtitle, ctx)
            : "";
          const logoSrc = block.props.logoSrc;
          const logo =
            logoSrc && (isSafeHttpUrl(logoSrc) || logoSrc.startsWith("data:image/"))
              ? `<img src="${escapeAttr(logoSrc)}" alt="${escapeAttr(block.props.logoAlt ?? "Logo")}" width="${block.props.logoWidth ?? "48"}" class="fluid-img" style="display:inline-block;max-width:100%;height:auto;margin-bottom:12px;" />`
              : "";
          const subtitleHtml = subtitle
            ? `<p style="margin:4px 0 0;font-size:13px;color:${block.props.textColor};opacity:0.7;">${escapeHtml(subtitle)}</p>`
            : "";
          return emailRow(`
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;background:${block.props.bgColor};border-radius:8px;">
              <tr>
                <td align="${align}" style="padding:24px 16px;text-align:${align};">
                  ${logo}
                  <h1 style="margin:0;font-size:20px;font-weight:600;color:${block.props.textColor};">${escapeHtml(title)}</h1>
                  ${subtitleHtml}
                </td>
              </tr>
            </table>`);
        }
        case "heading": {
          const tag = block.props.level === "h2" ? "h2" : "h1";
          const cssClass = tag === "h1" ? "heading-h1" : "heading-h2";
          const text = await resolveProp(block.props.text, ctx);
          return emailRow(
            `<${tag} class="${cssClass}${alignClass}" style="text-align:${align};">${escapeHtml(text)}</${tag}>`,
          );
        }
        case "text": {
          const text = await resolveProp(block.props.text, ctx);
          return emailRow(
            `<p class="text-body${alignClass}" style="text-align:${align};word-wrap:break-word;overflow-wrap:break-word;">${escapeHtml(text).replace(/\n/g, "<br/>")}</p>`,
          );
        }
        case "button": {
          const text = await resolveProp(block.props.text, ctx);
          const url = safeHref(await resolveProp(block.props.url, ctx));
          const isLink = block.props.style === "link";

          if (isLink) {
            return emailRow(`
              <p class="text-body${alignClass}" style="text-align:${align};margin:0 0 16px;">
                <a href="${escapeAttr(url)}" style="color:${block.props.color};font-weight:500;text-decoration:underline;">${escapeHtml(text)}</a>
              </p>`);
          }

          return emailRow(`
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
              <tr>
                <td align="${align}" class="${align === "center" ? "mobile-center" : ""}">
                  <!--[if mso]>
                  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeAttr(url)}" style="height:44px;v-text-anchor:middle;width:200px;" arcsize="14%" stroke="f" fillcolor="${block.props.color}">
                    <w:anchorlock/>
                    <center style="color:#ffffff;font-family:sans-serif;font-size:14px;font-weight:500;">${escapeHtml(text)}</center>
                  </v:roundrect>
                  <![endif]-->
                  <!--[if !mso]><!-->
                  <a href="${escapeAttr(url)}" class="btn-link" style="background-color:${block.props.color};color:#ffffff;">${escapeHtml(text)}</a>
                  <!--<![endif]-->
                </td>
              </tr>
            </table>`);
        }
        case "link": {
          const text = await resolveProp(block.props.text, ctx);
          const url = safeHref(await resolveProp(block.props.url, ctx));
          const decoration = block.props.underline === "true" ? "underline" : "none";
          return emailRow(`
            <p class="text-body${alignClass}" style="text-align:${align};margin:0 0 12px;">
              <a href="${escapeAttr(url)}" style="color:${block.props.color};text-decoration:${decoration};font-size:15px;">${escapeHtml(text)}</a>
            </p>`);
        }
        case "image": {
          const alt = await resolveProp(block.props.alt, ctx);
          const width = block.props.width || "560";
          const src = block.props.src;
          if (!isSafeHttpUrl(src) && !src.startsWith("data:image/")) {
            return emailRow(`<p class="text-body" style="color:#888;font-size:12px;">[Imagem: URL inválida]</p>`);
          }
          return emailRow(`
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
              <tr>
                <td align="${align}" class="${align === "center" ? "mobile-center" : ""}">
                  <img
                    src="${escapeAttr(block.props.src)}"
                    alt="${escapeAttr(alt)}"
                    width="${width}"
                    class="fluid-img"
                    style="display:block;max-width:100%;height:auto;width:${width}px;"
                  />
                </td>
              </tr>
            </table>`);
        }
        case "divider":
          return emailRow(
            `<hr style="border:none;border-top:1px solid ${block.props.color};margin:24px 0;" />`,
          );
        case "spacer":
          return emailRow(
            `<div class="spacer-mobile" style="height:${block.props.height}px;line-height:${block.props.height}px;font-size:1px;">&nbsp;</div>`,
          );
        case "footer": {
          const text = await resolveProp(block.props.text, ctx);
          const unsubText = await resolveProp(block.props.unsubscribeText, ctx);
          const unsubUrl = safeHref(await resolveProp(block.props.unsubscribeUrl, ctx));
          const company = await resolveProp(block.props.companyName, ctx);
          const privacyHref = block.props.privacyUrl
            ? safeHref(block.props.privacyUrl)
            : "";
          const privacyLink =
            privacyHref
              ? `<a href="${escapeAttr(privacyHref)}" style="color:${block.props.textColor};text-decoration:underline;margin:0 8px;">${escapeHtml(block.props.privacyText ?? "Privacidade")}</a>`
              : "";
          return emailRow(`
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0 0;background:${block.props.bgColor};border-radius:8px;">
              <tr>
                <td align="${align}" style="padding:24px 16px;text-align:${align};">
                  <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:${block.props.textColor};">${escapeHtml(company)}</p>
                  <p style="margin:0 0 12px;font-size:12px;line-height:1.5;color:${block.props.textColor};">${escapeHtml(text).replace(/\n/g, "<br/>")}</p>
                  <p style="margin:0;font-size:11px;color:${block.props.textColor};">
                    ${privacyLink}
                    <a href="${escapeAttr(unsubUrl)}" style="color:${block.props.textColor};text-decoration:underline;">${escapeHtml(unsubText)}</a>
                  </p>
                </td>
              </tr>
            </table>`);
        }
        case "content": {
          const html = sanitizeEmailHtml(await resolveProp(block.props.body, ctx));
          return emailRow(`<div class="content-block${alignClass}" style="text-align:${align};max-width:100%;word-wrap:break-word;overflow-wrap:break-word;">${html}</div>`);
        }
        default:
          return "";
      }
    }),
  );

  const honeypot = options?.trackingToken
    ? honeypotHtml(options.trackingToken)
    : undefined;

  return wrapEmailHtml(rows.join("\n"), {
    honeypotRow: honeypot,
    preheader: options?.preheader,
  });
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(text: string) {
  return text.replace(/"/g, "&quot;");
}
