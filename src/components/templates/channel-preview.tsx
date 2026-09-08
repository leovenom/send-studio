"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Info, Mail, MessageCircle, Send } from "lucide-react";
import { useT } from "@/components/locale/locale-provider";
import { accentToneStyles, type AccentTone } from "@/lib/accent-styles";
import { DEVICE_WIDTHS, type DevicePreview } from "@/lib/email-shell";
import { getTabProps, getTabPanelProps, handleTabArrowKeys, makeTabIds } from "@/components/ui/tab-list";
import { DeviceTabs, PREVIEW_DEVICE_TAB_PREFIX, ResponsiveEmailPreview } from "./responsive-preview";

type PreviewChannel = "email" | "whatsapp" | "telegram";

const CHANNEL_TAB_ORDER: PreviewChannel[] = ["email", "whatsapp", "telegram"];
const CHANNEL_TAB_PREFIX = "preview-channel";

const CHANNEL_TONES: Record<PreviewChannel, AccentTone> = {
  email: "blue",
  whatsapp: "emerald",
  telegram: "violet",
};

interface ChannelPreviewProps {
  html: string;
  whatsappText: string;
  telegramHtml: string;
  subject?: string;
  preheader?: string;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  localeSelector?: React.ReactNode;
  subjectLabel?: string;
  preheaderLabel?: string;
}

function ChannelFormatNote({ hint }: { hint: string }) {
  const t = useT();

  return (
    <div
      role="note"
      aria-label={`${t("preview.editorNoteLabel")}. ${t("preview.editorNoteBadge")}. ${hint}`}
      className="rounded-xl border border-dashed border-[#8ec5ff]/25 bg-gradient-to-br from-[#8ec5ff]/5 to-[#a78bfa]/5 px-3 py-2.5"
    >
      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
        <Info className="h-3.5 w-3.5 shrink-0 text-[#7c3aed] dark:text-[#c4b5fd]" aria-hidden />
        <p className="text-[10px] font-semibold uppercase tracking-wide text-foreground">
          {t("preview.editorNoteLabel")}
        </p>
        <span className="rounded-full border border-[#8ec5ff]/30 bg-card px-1.5 py-0.5 text-[9px] font-medium text-foreground">
          {t("preview.editorNoteBadge")}
        </span>
      </div>
      <p className="font-mono text-[10px] leading-relaxed text-muted">{hint}</p>
    </div>
  );
}

function SimulatedMessageLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-center text-[9px] font-semibold uppercase tracking-widest text-muted">
      {children}
    </p>
  );
}

function WhatsAppMock({
  text,
  subject,
}: {
  text: string;
  subject?: string;
}) {
  const body = subject ? text.replace(/^\*[^*]+\*\n\n/, "") : text;

  return (
    <div className="bg-[#e5ddd5] p-4 dark:bg-neutral-900/80">
      <div className="mx-auto max-w-[320px] rounded-lg bg-[#dcf8c6] px-3 py-2 shadow-sm dark:bg-emerald-900/40">
        {subject && (
          <p className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {formatWhatsAppBold(subject)}
          </p>
        )}
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-900 dark:text-neutral-100">
          {formatWhatsAppBold(body)}
        </div>
        <p className="mt-1 text-right text-[10px] text-neutral-500" aria-hidden>
          12:00 ✓✓
        </p>
      </div>
    </div>
  );
}

function formatWhatsAppBold(text: string) {
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, i) =>
    part.startsWith("*") && part.endsWith("*") ? (
      <strong key={i}>{part.slice(1, -1)}</strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function TelegramMock({ html }: { html: string }) {
  return (
    <div className="bg-[#0e1621] p-4">
      <div className="mx-auto max-w-[320px] rounded-xl rounded-tl-sm bg-[#182533] px-3 py-2 shadow-lg">
        <div
          className="max-w-none text-sm leading-relaxed text-[#f5f5f5] [&_a]:text-[#6ab2f2] [&_a]:underline [&_b]:font-semibold [&_i]:italic [&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <p className="mt-1 text-right text-[10px] text-neutral-400" aria-hidden>
          12:00
        </p>
      </div>
    </div>
  );
}

function ChannelTabs({
  channel,
  onChange,
  channels,
  ariaLabel,
}: {
  channel: PreviewChannel;
  onChange: (c: PreviewChannel) => void;
  channels: { id: PreviewChannel; label: string; icon: typeof Mail }[];
  ariaLabel: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="grid grid-cols-3 gap-1 rounded-xl border border-[#8ec5ff]/20 bg-[#8ec5ff]/5 p-1"
      onKeyDown={(e) =>
        handleTabArrowKeys(e, CHANNEL_TAB_ORDER, channel, onChange, CHANNEL_TAB_PREFIX)
      }
    >
      {channels.map(({ id, label, icon: Icon }) => {
        const active = channel === id;

        return (
          <button
            key={id}
            type="button"
            {...getTabProps(CHANNEL_TAB_PREFIX, id, active)}
            onClick={() => onChange(id)}
            className={cn(
              "flex min-w-0 items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-medium transition-all focus-ring",
              active ? "tab-pill-active shadow-sm" : "tab-pill-idle hover:bg-[#8ec5ff]/10",
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function ChannelMockFrame({
  channel,
  channelLabel,
  children,
}: {
  channel: PreviewChannel;
  channelLabel: string;
  children: React.ReactNode;
}) {
  const t = useT();
  const style = accentToneStyles[CHANNEL_TONES[channel]];

  return (
    <div className="overflow-hidden rounded-xl border border-[#8ec5ff]/15 bg-card shadow-sm">
      <div
        className={cn(
          "flex items-center gap-2 border-b border-[#8ec5ff]/15 px-4 py-2.5",
          "bg-gradient-to-r",
          style.stat,
        )}
      >
        <span className={cn("flex h-6 w-6 items-center justify-center rounded-md", style.icon)}>
          {channel === "whatsapp" && <MessageCircle className="h-3.5 w-3.5" aria-hidden />}
          {channel === "telegram" && <Send className="h-3.5 w-3.5" aria-hidden />}
        </span>
        <span className="truncate text-xs font-medium">{channelLabel}</span>
      </div>
      <div className="border-b border-[#8ec5ff]/10 px-4 pt-3">
        <SimulatedMessageLabel>{t("preview.simulatedMessage")}</SimulatedMessageLabel>
      </div>
      {children}
    </div>
  );
}

export function ChannelPreview({
  html,
  whatsappText,
  telegramHtml,
  subject,
  preheader,
  loading,
  emptyMessage,
  className,
  localeSelector,
  subjectLabel,
  preheaderLabel,
}: ChannelPreviewProps) {
  const t = useT();
  const [channel, setChannel] = useState<PreviewChannel>("email");
  const [device, setDevice] = useState<DevicePreview>("mobile");

  const channels = useMemo(
    () =>
      [
        { id: "email" as const, label: t("preview.channelEmail"), icon: Mail },
        { id: "whatsapp" as const, label: t("preview.channelWhatsapp"), icon: MessageCircle },
        { id: "telegram" as const, label: t("preview.channelTelegram"), icon: Send },
      ] satisfies { id: PreviewChannel; label: string; icon: typeof Mail }[],
    [t],
  );

  const deviceLabels = useMemo(
    () =>
      ({
        mobile: { label: t("preview.deviceMobile"), width: DEVICE_WIDTHS.mobile },
        tablet: { label: t("preview.deviceTablet"), width: DEVICE_WIDTHS.tablet },
        laptop: { label: t("preview.deviceDesktop"), width: DEVICE_WIDTHS.laptop },
      }) satisfies Record<DevicePreview, { label: string; width: number }>,
    [t],
  );

  const activeChannel = channels.find((c) => c.id === channel);

  const hasContent =
    channel === "email" ? !!html : channel === "whatsapp" ? !!whatsappText : !!telegramHtml;

  return (
    <div className={cn("min-w-0 space-y-4", className)}>
      {localeSelector && (
        <section className="space-y-1.5">
          <p className="label-caps !mb-0">{t("preview.previewLanguage")}</p>
          {localeSelector}
        </section>
      )}

      <section className="space-y-1.5">
        <p className="label-caps !mb-0">{t("preview.channelTitle")}</p>
        <ChannelTabs
          channel={channel}
          onChange={setChannel}
          channels={channels}
          ariaLabel={t("preview.channelTitle")}
        />
      </section>

      <div
        hidden={channel !== "email"}
        {...getTabPanelProps(
          CHANNEL_TAB_PREFIX,
          "email",
          makeTabIds(CHANNEL_TAB_PREFIX, "email").tab,
        )}
        className="space-y-4"
      >
        <section className="space-y-1.5">
          <p className="label-caps !mb-0">{t("preview.device")}</p>
          <DeviceTabs
            device={device}
            onChange={setDevice}
            labels={deviceLabels}
            ariaLabel={t("preview.device")}
            tabPrefix={PREVIEW_DEVICE_TAB_PREFIX}
          />
        </section>

        <div
          id={makeTabIds(PREVIEW_DEVICE_TAB_PREFIX, device).panel}
          role="tabpanel"
          aria-labelledby={makeTabIds(PREVIEW_DEVICE_TAB_PREFIX, device).tab}
        >
          <ResponsiveEmailPreview
            html={html}
            subject={subject}
            preheader={preheader}
            subjectLabel={subjectLabel}
            preheaderLabel={preheaderLabel}
            loading={loading}
            emptyMessage={emptyMessage}
            embedded
            device={device}
            onDeviceChange={setDevice}
            hideDeviceTabs
          />
        </div>
      </div>

      <div
        hidden={channel !== "whatsapp"}
        {...getTabPanelProps(
          CHANNEL_TAB_PREFIX,
          "whatsapp",
          makeTabIds(CHANNEL_TAB_PREFIX, "whatsapp").tab,
        )}
      >
        {loading ? (
          <div
            role="status"
            className="flex items-center justify-center rounded-xl border border-[#8ec5ff]/15 bg-card py-24 text-xs text-muted"
          >
            {t("preview.rendering")}
          </div>
        ) : !hasContent ? (
          <div className="rounded-xl border border-dashed border-[#8ec5ff]/25 bg-[#8ec5ff]/5 py-24 text-center text-xs text-muted">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-3">
            <ChannelMockFrame channel="whatsapp" channelLabel={activeChannel?.label ?? "WhatsApp"}>
              <WhatsAppMock text={whatsappText} subject={subject} />
            </ChannelMockFrame>
            <ChannelFormatNote hint={t("preview.whatsappHint")} />
          </div>
        )}
      </div>

      <div
        hidden={channel !== "telegram"}
        {...getTabPanelProps(
          CHANNEL_TAB_PREFIX,
          "telegram",
          makeTabIds(CHANNEL_TAB_PREFIX, "telegram").tab,
        )}
      >
        {loading ? (
          <div
            role="status"
            className="flex items-center justify-center rounded-xl border border-[#8ec5ff]/15 bg-card py-24 text-xs text-muted"
          >
            {t("preview.rendering")}
          </div>
        ) : !hasContent ? (
          <div className="rounded-xl border border-dashed border-[#8ec5ff]/25 bg-[#8ec5ff]/5 py-24 text-center text-xs text-muted">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-3">
            <ChannelMockFrame channel="telegram" channelLabel={activeChannel?.label ?? "Telegram"}>
              <TelegramMock html={telegramHtml} />
            </ChannelMockFrame>
            <ChannelFormatNote hint={t("preview.telegramHint")} />
          </div>
        )}
      </div>
    </div>
  );
}
