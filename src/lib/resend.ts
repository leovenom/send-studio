import { Resend } from "resend";

let client: Resend | null = null;

export function getResend() {
  if (!client) {
    client = new Resend(process.env.RESEND_API_KEY ?? "re_placeholder");
  }
  return client;
}

export function getFromEmail() {
  return process.env.RESEND_FROM_EMAIL ?? "Send Studio <onboarding@resend.dev>";
}

export function parseFromEmail(raw: string): { name: string; email: string } {
  const trimmed = raw.trim();
  const match = trimmed.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) {
    return {
      name: match[1].trim().replace(/^["']|["']$/g, ""),
      email: match[2].trim(),
    };
  }
  if (trimmed.includes("@")) {
    return { name: "Send Studio", email: trimmed };
  }
  return { name: "Send Studio", email: "onboarding@resend.dev" };
}

export function formatFromEmail(name: string, email: string): string {
  const safeName = name.replace(/[<>]/g, "").trim() || "Send Studio";
  return `${safeName} <${email.trim()}>`;
}

export function deriveNoReplyEmail(fromEmail: string): string {
  const domain = fromEmail.split("@")[1]?.trim();
  if (!domain) return "noreply@resend.dev";
  return `noreply@${domain}`;
}

