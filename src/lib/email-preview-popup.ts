import type { DevicePreview } from "@/lib/email-shell";

export const EMAIL_PREVIEW_POPUP_KEY = "send-studio-email-preview-popup";

export type EmailPreviewPopupPayload = {
  html: string;
  subject?: string;
  preheader?: string;
  device?: DevicePreview;
  darkClient?: boolean;
  subjectLabel?: string;
  preheaderLabel?: string;
};

/** localStorage (not sessionStorage) so the new tab can read the payload. */
export function openEmailPreviewPopup(payload: EmailPreviewPopupPayload): boolean {
  try {
    localStorage.setItem(EMAIL_PREVIEW_POPUP_KEY, JSON.stringify(payload));
  } catch {
    return false;
  }

  const popup = window.open(
    "/preview/email",
    "_blank",
    "noopener,noreferrer,width=1280,height=900",
  );

  return popup != null;
}

export function readEmailPreviewPopup(): EmailPreviewPopupPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(EMAIL_PREVIEW_POPUP_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as EmailPreviewPopupPayload;
  } catch {
    return null;
  }
}

export function clearEmailPreviewPopup() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(EMAIL_PREVIEW_POPUP_KEY);
}
