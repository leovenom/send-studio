"use client";

import { Badge } from "@/components/ui/badge";
import { useT } from "@/components/locale/locale-provider";
import type { UiTranslationKey } from "@/lib/ui-i18n/translations";

const STATUS_KEYS: Record<string, UiTranslationKey> = {
  active: "status.active",
  draft: "status.draft",
  sent: "status.sent",
  queued: "status.queued",
  delivered: "status.delivered",
  opened: "status.opened",
  clicked: "status.clicked",
  bounced: "status.bounced",
  complained: "status.complained",
  "email.sent": "status.emailSent",
  "email.delivered": "status.emailDelivered",
  "email.opened": "status.emailOpened",
  "email.clicked": "status.emailClicked",
  "email.bounced": "status.emailBounced",
  "email.complained": "status.emailComplained",
  "email.bot_probe": "status.botProbe",
  "email.opened_human": "status.openedHuman",
  "email.opened_bot": "status.openedBot",
  demo: "status.demo",
  partial: "status.partial",
  failed: "status.failed",
  archived: "status.archived",
  sending: "status.sending",
  skipped: "status.skipped",
};

const STATUS_VARIANTS = {
  active: "success",
  draft: "default",
  sent: "info",
  queued: "warning",
  delivered: "success",
  opened: "info",
  clicked: "info",
  bounced: "error",
  complained: "error",
  "email.sent": "info",
  "email.delivered": "success",
  "email.opened": "info",
  "email.clicked": "info",
  "email.bounced": "error",
  "email.complained": "error",
  "email.bot_probe": "warning",
  "email.opened_human": "success",
  "email.opened_bot": "warning",
  demo: "warning",
  partial: "warning",
  failed: "error",
  archived: "warning",
  sending: "warning",
  skipped: "default",
} as const;

export function StatusBadge({ status }: { status: string }) {
  const t = useT();
  const key = STATUS_KEYS[status];
  const label = key ? t(key) : status;
  const variant =
    STATUS_VARIANTS[status as keyof typeof STATUS_VARIANTS] ?? "default";

  return <Badge variant={variant}>{label}</Badge>;
}

export function ChannelBadge({ channel }: { channel: string }) {
  const labels: Record<string, string> = {
    email: "Email",
    whatsapp: "WhatsApp",
    telegram: "Telegram",
  };
  const variants: Record<string, "info" | "success" | "default"> = {
    email: "info",
    whatsapp: "success",
    telegram: "default",
  };

  return (
    <Badge variant={variants[channel] ?? "default"}>
      {labels[channel] ?? channel}
    </Badge>
  );
}
