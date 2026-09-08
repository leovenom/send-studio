import {
  deriveNoReplyEmail,
  formatFromEmail,
  getFromEmail,
  parseFromEmail,
} from "@/lib/resend";
import type { MessageChannel } from "./channels";

export type EmailCampaignSender = {
  channel: "email";
  fromName: string;
  fromEmail: string;
  from: string;
  replyTo?: string;
  noReply: boolean;
};

export type WhatsAppCampaignSender = {
  channel: "whatsapp";
  displayName: string;
  phoneNumber: string;
};

export type TelegramCampaignSender = {
  channel: "telegram";
  botName: string;
  botUsername: string;
};

export type CampaignSender =
  | EmailCampaignSender
  | WhatsAppCampaignSender
  | TelegramCampaignSender;

export type CampaignSenderInput = {
  fromName?: string;
  fromEmail?: string;
  displayName?: string;
  phoneNumber?: string;
  botName?: string;
  botUsername?: string;
  noReply?: boolean;
};

export function getDefaultSenders() {
  const emailDefaults = parseFromEmail(getFromEmail());
  return {
    email: {
      fromName: emailDefaults.name,
      fromEmail: emailDefaults.email,
      noReply: true,
    },
    whatsapp: {
      displayName: process.env.WHATSAPP_DISPLAY_NAME ?? "Send Studio",
      phoneNumber: process.env.WHATSAPP_FROM_NUMBER ?? "+1 555 010 0000",
    },
    telegram: {
      botName: process.env.TELEGRAM_BOT_NAME ?? "Send Studio Bot",
      botUsername: process.env.TELEGRAM_BOT_USERNAME ?? "@sendstudio_bot",
    },
  };
}

export function resolveCampaignSender(
  channel: MessageChannel,
  input?: CampaignSenderInput,
): CampaignSender {
  const defaults = getDefaultSenders();

  if (channel === "email") {
    const noReply = input?.noReply ?? defaults.email.noReply;
    const fromName = input?.fromName?.trim() || defaults.email.fromName;
    const fromEmail = input?.fromEmail?.trim() || defaults.email.fromEmail;
    const from = formatFromEmail(fromName, fromEmail);
    const replyTo = noReply ? deriveNoReplyEmail(fromEmail) : undefined;
    return { channel: "email", fromName, fromEmail, from, replyTo, noReply };
  }

  if (channel === "whatsapp") {
    return {
      channel: "whatsapp",
      displayName: input?.displayName?.trim() || defaults.whatsapp.displayName,
      phoneNumber: input?.phoneNumber?.trim() || defaults.whatsapp.phoneNumber,
    };
  }

  const botUsername = normalizeBotUsername(
    input?.botUsername?.trim() || defaults.telegram.botUsername,
  );
  return {
    channel: "telegram",
    botName: input?.botName?.trim() || defaults.telegram.botName,
    botUsername,
  };
}

export function parseCampaignSender(raw: string | null | undefined): CampaignSender | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CampaignSender;
    if (!parsed?.channel) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function formatCampaignSenderSummary(sender: CampaignSender | null): string | null {
  if (!sender) return null;

  if (sender.channel === "email") {
    const reply = sender.replyTo ? ` · Reply-To: ${sender.replyTo}` : "";
    return `${sender.from}${reply}`;
  }

  if (sender.channel === "whatsapp") {
    return `${sender.displayName} · ${sender.phoneNumber}`;
  }

  return `${sender.botName} · ${sender.botUsername}`;
}

function normalizeBotUsername(username: string): string {
  const trimmed = username.trim();
  if (!trimmed) return "@sendstudio_bot";
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}
