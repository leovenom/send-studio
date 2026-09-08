/** Responsive email shell — compatible with Gmail, Apple Mail, Outlook, Yahoo */

export const EMAIL_BREAKPOINTS = {
  mobile: 375,
  tablet: 768,
  laptop: 900,
} as const;

export type DevicePreview = keyof typeof EMAIL_BREAKPOINTS;

export const DEVICE_WIDTHS: Record<DevicePreview, number> = {
  mobile: EMAIL_BREAKPOINTS.mobile,
  tablet: EMAIL_BREAKPOINTS.tablet,
  laptop: EMAIL_BREAKPOINTS.laptop,
};

/** @deprecated Use DEVICE_WIDTHS + UI i18n for labels */
export const DEVICE_LABELS: Record<DevicePreview, { label: string; width: number }> = {
  mobile: { label: "Mobile", width: EMAIL_BREAKPOINTS.mobile },
  tablet: { label: "Tablet", width: EMAIL_BREAKPOINTS.tablet },
  laptop: { label: "Desktop", width: EMAIL_BREAKPOINTS.laptop },
};

const RESPONSIVE_STYLES = `
  body, table, td, a {
    -webkit-text-size-adjust: 100%;
    -ms-text-size-adjust: 100%;
  }
  table, td {
    mso-table-lspace: 0pt;
    mso-table-rspace: 0pt;
  }
  body, table, td, p, div, span, a {
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  td {
    word-break: break-word;
  }
  img {
    -ms-interpolation-mode: bicubic;
    border: 0;
    height: auto;
    line-height: 100%;
    outline: none;
    text-decoration: none;
  }
  a[x-apple-data-detectors] {
    color: inherit !important;
    text-decoration: none !important;
    font-size: inherit !important;
    font-family: inherit !important;
    font-weight: inherit !important;
    line-height: inherit !important;
  }
  .email-wrapper {
    width: 100%;
    background-color: #f5f5f5;
  }
  .email-container {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
  }
  .email-content {
    background-color: #ffffff;
    border-radius: 8px;
    padding: 32px;
  }
  .fluid-img {
    display: block;
    max-width: 100%;
    height: auto;
  }
  .btn-link {
    display: inline-block;
    padding: 14px 28px;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 500;
    font-size: 14px;
    line-height: 1;
    mso-padding-alt: 0;
  }
  .heading-h1 {
    margin: 0 0 16px;
    font-size: 28px;
    font-weight: 600;
    line-height: 1.25;
    color: #111111;
  }
  .heading-h2 {
    margin: 0 0 16px;
    font-size: 22px;
    font-weight: 600;
    line-height: 1.3;
    color: #111111;
  }
  .text-body {
    margin: 0 0 16px;
    font-size: 16px;
    line-height: 1.6;
    color: #444444;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  .content-block {
    max-width: 100%;
    overflow-wrap: break-word;
    word-wrap: break-word;
  }
  .content-block table {
    max-width: 100% !important;
    width: 100% !important;
    table-layout: fixed !important;
  }
  .content-block img {
    max-width: 100% !important;
    height: auto !important;
  }

  /* Tablet / iPad */
  @media only screen and (min-width: 481px) and (max-width: 768px) {
    .email-outer-padding {
      padding: 24px 12px !important;
    }
    .email-content {
      padding: 36px 32px !important;
    }
    .heading-h1 { font-size: 26px !important; }
    .heading-h2 { font-size: 21px !important; }
    .text-body {
      font-size: 16px !important;
      line-height: 1.65 !important;
      margin-bottom: 20px !important;
    }
  }

  /* Mobile */
  @media only screen and (max-width: 480px) {
    .email-outer-padding {
      padding: 16px 8px !important;
    }
    .email-content {
      padding: 24px 16px !important;
      border-radius: 4px !important;
    }
    .email-container {
      width: 100% !important;
      max-width: 100% !important;
    }
    .fluid-img {
      width: 100% !important;
      max-width: 100% !important;
      height: auto !important;
    }
    .btn-link {
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
      text-align: center !important;
      box-sizing: border-box !important;
      padding: 16px 20px !important;
    }
    .heading-h1 {
      font-size: 22px !important;
      line-height: 1.3 !important;
    }
    .heading-h2 {
      font-size: 18px !important;
      line-height: 1.35 !important;
    }
    .text-body {
      font-size: 15px !important;
      line-height: 1.55 !important;
    }
    .mobile-center {
      text-align: center !important;
    }
    .mobile-stack {
      display: block !important;
      width: 100% !important;
    }
    .spacer-mobile {
      height: 16px !important;
    }
  }
`;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Hidden inbox preview line — visible in Gmail/Apple Mail list, not in the opened email. */
export function buildPreheaderHtml(text: string): string {
  const escaped = escapeHtml(text.trim());
  if (!escaped) return "";
  const padding = "&#847;&zwnj;&nbsp;".repeat(40);
  return `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${escaped}${padding}</div>`;
}

export function wrapEmailHtml(
  bodyRows: string,
  options?: { honeypotRow?: string; preheader?: string },
): string {
  const preheaderBlock = options?.preheader
    ? buildPreheaderHtml(options.preheader)
    : "";
  const honeypotRow = options?.honeypotRow ?? "";

  return `<!DOCTYPE html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <meta name="x-apple-disable-message-reformatting"/>
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no"/>
  <title>Email</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">${RESPONSIVE_STYLES}</style>
</head>
<body style="margin:0;padding:0;word-spacing:normal;background-color:#f5f5f5;">
  ${preheaderBlock}
  <div class="email-wrapper" style="background-color:#f5f5f5;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="email-wrapper">
      <tr>
        <td align="center" class="email-outer-padding" style="padding:32px 16px;">
          <!--[if mso]>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" align="center">
          <tr><td>
          <![endif]-->
          <div class="email-container" style="max-width:600px;margin:0 auto;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;width:100%;">
              <tr>
                <td class="email-content" style="background-color:#ffffff;border-radius:8px;padding:32px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    ${bodyRows}
                    ${honeypotRow}
                  </table>
                </td>
              </tr>
            </table>
          </div>
          <!--[if mso]>
          </td></tr></table>
          <![endif]-->
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

export function emailRow(content: string): string {
  return `<tr><td style="padding:0;">${content}</td></tr>`;
}
