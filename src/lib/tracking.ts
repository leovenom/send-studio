import { nanoid } from "nanoid";
import { getSiteUrl } from "@/lib/site";

/** Token único por email enviado — usado no honeypot anti-bot */
export function createTrackingToken(): string {
  return nanoid(24);
}

export function getAppBaseUrl(): string {
  return getSiteUrl();
}

/**
 * Honeypot invisível para humanos — bots/scanners seguem links e carregam imagens ocultas.
 * Injetado apenas no envio real, não no preview do editor.
 */
export function honeypotHtml(trackingToken: string): string {
  const url = `${getAppBaseUrl()}/api/track/h/${trackingToken}`;
  return `
    <tr aria-hidden="true">
      <td style="font-size:0;line-height:0;max-height:0;overflow:hidden;mso-hide:all;">
        <div style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;max-height:0;overflow:hidden;">
          <a href="${url}" tabindex="-1" style="display:none;color:transparent;text-decoration:none;">.</a>
          <img src="${url}?img=1" width="1" height="1" alt="" border="0" style="display:block;height:1px!important;width:1px!important;border:0;padding:0;margin:0;" />
        </div>
      </td>
    </tr>`;
}

/** Abertura em menos de 15s após entrega → provável scanner automático */
export const FAST_OPEN_BOT_THRESHOLD_MS = 15_000;

export type OpenClassification = "human" | "bot";
