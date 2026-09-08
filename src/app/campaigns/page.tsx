"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChannelBadge, StatusBadge } from "@/components/ui/status-badges";
import { Avatar, EmptyState, PageHeader, SectionCard, Skeleton, LoadingRegion } from "@/components/ui/page-header";
import { getTabProps, handleTabArrowKeys, makeTabIds } from "@/components/ui/tab-list";
import { FieldGroup, Label, Select } from "@/components/ui/select";
import { useLocale, useT } from "@/components/locale/locale-provider";
import { CHANNELS, type MessageChannel } from "@/lib/messaging/channels";
import { accentAt, accentToneStyles, type AccentTone } from "@/lib/accent-styles";
import type { UiTranslationKey } from "@/lib/ui-i18n/translations";
import type { Contact, Template } from "@/lib/db/schema";

type TemplateListItem = Pick<
  Template,
  "id" | "name" | "subject" | "preheader" | "status" | "createdAt" | "updatedAt"
> & { blockCount?: number; blocks?: string };
import { deriveNoReplyEmail, formatFromEmail } from "@/lib/resend";
import { cn, formatDate } from "@/lib/utils";
import { apiFetch } from "@/lib/api-fetch";
import { Check, Mail, MessageCircle, Rocket, Send, Archive, ArchiveRestore, Trash2 } from "lucide-react";

interface CampaignRow {
  id: string;
  name: string;
  channel: string;
  status: string;
  archivedAt: string | null;
  sentAt: string | null;
  createdAt: string;
  templateName: string;
  templateSubject: string;
  senderSummary: string | null;
}

type SenderFormState = {
  email: { fromName: string; fromEmail: string; noReply: boolean };
  whatsapp: { displayName: string; phoneNumber: string };
  telegram: { botName: string; botUsername: string };
};

const DEFAULT_SENDERS: SenderFormState = {
  email: { fromName: "Send Studio", fromEmail: "onboarding@resend.dev", noReply: true },
  whatsapp: { displayName: "Send Studio", phoneNumber: "+1 555 010 0000" },
  telegram: { botName: "Send Studio Bot", botUsername: "@sendstudio_bot" },
};

const CHANNEL_ICONS = {
  email: Mail,
  whatsapp: MessageCircle,
  telegram: Send,
};

const CHANNEL_TONES: Record<MessageChannel, AccentTone> = {
  email: "blue",
  whatsapp: "emerald",
  telegram: "violet",
};

const HISTORY_TABS = ["active", "archived"] as const;
const HISTORY_TAB_PREFIX = "campaigns-history";

export default function CampaignsPage() {
  const t = useT();
  const { locale } = useLocale();
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "",
    templateId: "",
    channel: "email" as MessageChannel,
  });
  const [senders, setSenders] = useState<SenderFormState>(DEFAULT_SENDERS);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastResults, setLastResults] = useState<{ waLink?: string; status: string }[]>([]);
  const [historyTab, setHistoryTab] = useState<"active" | "archived">("active");

  async function load() {
    const data = await apiFetch("/api/campaigns/bootstrap").then((r) => r.json());
    setCampaigns(data.campaigns ?? []);
    setTemplates(data.templates ?? []);
    setContacts(data.contacts ?? []);
    const tpl = data.templates ?? [];
    if (tpl.length > 0 && !form.templateId) {
      setForm((f) => ({ ...f, templateId: tpl[0].id }));
    }
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const data = await apiFetch("/api/campaigns/bootstrap").then((r) => r.json());
      if (cancelled) return;
      setCampaigns(data.campaigns ?? []);
      setTemplates(data.templates ?? []);
      setContacts(data.contacts ?? []);
      const tpl = data.templates ?? [];
      if (tpl.length > 0) {
        setForm((f) => (f.templateId ? f : { ...f, templateId: tpl[0].id }));
      }
      const senderDefaults = data.senderDefaults;
      if (senderDefaults?.email) {
        setSenders((s) => ({
          ...s,
          email: { ...s.email, ...senderDefaults.email },
          whatsapp: senderDefaults.whatsapp
            ? { ...s.whatsapp, ...senderDefaults.whatsapp }
            : s.whatsapp,
          telegram: senderDefaults.telegram
            ? { ...s.telegram, ...senderDefaults.telegram }
            : s.telegram,
        }));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const channelInfo = CHANNELS.find((c) => c.id === form.channel)!;
  const channelDescKey = `channels.${form.channel}.desc` as UiTranslationKey;
  const channelDescription = t(channelDescKey);

  const eligibleContacts = useMemo(() => {
    return contacts.filter((c) => {
      if (form.channel === "email") return !!c.email;
      if (form.channel === "whatsapp") return !!c.phone;
      if (form.channel === "telegram") return !!c.telegramChatId;
      return false;
    });
  }, [contacts, form.channel]);

  function toggleContact(id: string) {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  function selectAllEligible() {
    setSelectedContacts(eligibleContacts.map((c) => c.id));
  }

  const emailFromPreview = useMemo(() => {
    const { fromName, fromEmail } = senders.email;
    if (!fromEmail.includes("@")) return "";
    return formatFromEmail(fromName || "Send Studio", fromEmail);
  }, [senders.email]);

  const emailReplyToPreview = useMemo(() => {
    const { fromEmail, noReply } = senders.email;
    if (!noReply || !fromEmail.includes("@")) return "";
    return deriveNoReplyEmail(fromEmail);
  }, [senders.email]);

  function buildSenderPayload() {
    const channel = form.channel;
    if (channel === "email") {
      const { fromName, fromEmail, noReply } = senders.email;
      return { fromName, fromEmail, noReply };
    }
    if (channel === "whatsapp") {
      const { displayName, phoneNumber } = senders.whatsapp;
      return { displayName, phoneNumber };
    }
    const { botName, botUsername } = senders.telegram;
    return { botName, botUsername };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (selectedContacts.length === 0) return;

    setSending(true);
    setLastResults([]);
    const payload = {
      name: form.name,
      templateId: form.templateId,
      channel: form.channel,
      contactIds: selectedContacts,
      sender: buildSenderPayload(),
    };

    const res = await apiFetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLastResults(data.results ?? []);
    setSending(false);
    setForm({ name: "", templateId: form.templateId, channel: form.channel });
    setSelectedContacts([]);
    load();
  }

  const ChannelIcon = CHANNEL_ICONS[form.channel];

  const activeCampaigns = campaigns.filter((c) => !c.archivedAt);
  const archivedCampaigns = campaigns.filter((c) => c.archivedAt);
  const visibleCampaigns = historyTab === "archived" ? archivedCampaigns : activeCampaigns;

  async function archiveCampaign(id: string) {
    await apiFetch(`/api/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: true }),
    });
    load();
  }

  async function restoreCampaign(id: string) {
    await apiFetch(`/api/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: false }),
    });
    load();
  }

  async function deleteCampaign(id: string, name: string) {
    if (!confirm(t("campaigns.confirmDelete", { name }))) return;
    await apiFetch(`/api/campaigns/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <AppShell>
      <PageHeader
        accent
        label={t("campaigns.label")}
        title={t("campaigns.title")}
        description={t("campaigns.description")}
      />

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <SectionCard title={t("campaigns.newCampaign")} tone="emerald">
          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldGroup>
              <Label>{t("campaigns.channel")}</Label>
              <div
                role="radiogroup"
                aria-label={t("campaigns.channel")}
                className="grid grid-cols-3 gap-2"
              >
                {CHANNELS.map((ch) => {
                  const Icon = CHANNEL_ICONS[ch.id];
                  const tone = CHANNEL_TONES[ch.id];
                  const style = accentToneStyles[tone];
                  const selected = form.channel === ch.id;

                  return (
                    <button
                      key={ch.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => {
                        setForm({ ...form, channel: ch.id });
                        setSelectedContacts([]);
                      }}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all focus-ring",
                        selected
                          ? cn(
                              "bg-gradient-to-br shadow-sm",
                              style.stat,
                              style.glow,
                            )
                          : "border-border hover:border-[#8ec5ff]/25 hover:bg-[#8ec5ff]/5",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg",
                          selected ? style.icon : "bg-accent/80 text-muted",
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="text-xs font-medium">{ch.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted">{channelDescription}</p>
            </FieldGroup>

            <FieldGroup>
              <Label htmlFor="campaign-name" required>
                {t("campaigns.name")}
              </Label>
              <Input
                id="campaign-name"
                placeholder={t("campaigns.namePlaceholder", { channel: channelInfo.label })}
                required
                aria-required="true"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </FieldGroup>

            {form.channel === "email" && (
              <>
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  {t("campaigns.senderSection")}
                </p>
                <FieldGroup>
                  <Label htmlFor="campaign-from-name">{t("campaigns.fromName")}</Label>
                  <Input
                    id="campaign-from-name"
                    placeholder={t("campaigns.fromNamePlaceholder")}
                    value={senders.email.fromName}
                    onChange={(e) =>
                      setSenders((s) => ({
                        ...s,
                        email: { ...s.email, fromName: e.target.value },
                      }))
                    }
                  />
                </FieldGroup>

                <FieldGroup>
                  <Label htmlFor="campaign-from-email">{t("campaigns.fromEmail")}</Label>
                  <Input
                    id="campaign-from-email"
                    type="email"
                    placeholder={t("campaigns.fromEmailPlaceholder")}
                    required
                    aria-required="true"
                    value={senders.email.fromEmail}
                    onChange={(e) =>
                      setSenders((s) => ({
                        ...s,
                        email: { ...s.email, fromEmail: e.target.value },
                      }))
                    }
                  />
                  {emailFromPreview && (
                    <p className="text-[11px] text-muted">
                      {t("campaigns.fromPreview", { from: emailFromPreview })}
                      {emailReplyToPreview && (
                        <>
                          {" · "}
                          {t("campaigns.replyToPreview", { replyTo: emailReplyToPreview })}
                        </>
                      )}
                    </p>
                  )}
                </FieldGroup>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-accent/30 px-3 py-3 transition-colors hover:border-[#8ec5ff]/25">
                  <input
                    type="checkbox"
                    checked={senders.email.noReply}
                    onChange={(e) =>
                      setSenders((s) => ({
                        ...s,
                        email: { ...s.email, noReply: e.target.checked },
                      }))
                    }
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-[#7c3aed] focus-ring"
                  />
                  <span>
                    <span className="block text-sm font-medium text-foreground">
                      {t("campaigns.noReply")}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted">
                      {t("campaigns.noReplyDesc")}
                    </span>
                  </span>
                </label>
              </>
            )}

            {form.channel === "whatsapp" && (
              <>
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  {t("campaigns.senderSection")}
                </p>
                <FieldGroup>
                  <Label htmlFor="campaign-wa-name">{t("campaigns.waDisplayName")}</Label>
                  <Input
                    id="campaign-wa-name"
                    placeholder={t("campaigns.waDisplayNamePlaceholder")}
                    value={senders.whatsapp.displayName}
                    onChange={(e) =>
                      setSenders((s) => ({
                        ...s,
                        whatsapp: { ...s.whatsapp, displayName: e.target.value },
                      }))
                    }
                  />
                </FieldGroup>

                <FieldGroup>
                  <Label htmlFor="campaign-wa-phone">{t("campaigns.waPhoneNumber")}</Label>
                  <Input
                    id="campaign-wa-phone"
                    type="tel"
                    placeholder={t("campaigns.waPhonePlaceholder")}
                    required
                    aria-required="true"
                    value={senders.whatsapp.phoneNumber}
                    onChange={(e) =>
                      setSenders((s) => ({
                        ...s,
                        whatsapp: { ...s.whatsapp, phoneNumber: e.target.value },
                      }))
                    }
                  />
                  <p className="text-[11px] text-muted">
                    {t("campaigns.waPreview", {
                      name: senders.whatsapp.displayName,
                      phone: senders.whatsapp.phoneNumber,
                    })}
                  </p>
                </FieldGroup>
              </>
            )}

            {form.channel === "telegram" && (
              <>
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  {t("campaigns.senderSection")}
                </p>
                <FieldGroup>
                  <Label htmlFor="campaign-tg-name">{t("campaigns.tgBotName")}</Label>
                  <Input
                    id="campaign-tg-name"
                    placeholder={t("campaigns.tgBotNamePlaceholder")}
                    value={senders.telegram.botName}
                    onChange={(e) =>
                      setSenders((s) => ({
                        ...s,
                        telegram: { ...s.telegram, botName: e.target.value },
                      }))
                    }
                  />
                </FieldGroup>

                <FieldGroup>
                  <Label htmlFor="campaign-tg-username">{t("campaigns.tgBotUsername")}</Label>
                  <Input
                    id="campaign-tg-username"
                    placeholder={t("campaigns.tgBotUsernamePlaceholder")}
                    required
                    aria-required="true"
                    value={senders.telegram.botUsername}
                    onChange={(e) =>
                      setSenders((s) => ({
                        ...s,
                        telegram: { ...s.telegram, botUsername: e.target.value },
                      }))
                    }
                  />
                  <p className="text-[11px] text-muted">
                    {t("campaigns.tgPreview", {
                      name: senders.telegram.botName,
                      username: senders.telegram.botUsername,
                    })}
                  </p>
                </FieldGroup>
              </>
            )}

            <FieldGroup>
              <Label htmlFor="campaign-template">{t("campaigns.template")}</Label>
              <Select
                id="campaign-template"
                value={form.templateId}
                onChange={(e) => setForm({ ...form, templateId: e.target.value })}
              >
                {templates
                  .filter((tmpl) => tmpl.status !== "archived")
                  .map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.name}
                    </option>
                  ))}
              </Select>
            </FieldGroup>

            <FieldGroup>
              <div className="flex items-center justify-between">
                <Label>
                  {t("campaigns.recipients", { count: eligibleContacts.length })}
                </Label>
                <button
                  type="button"
                  onClick={selectAllEligible}
                  className="text-[11px] font-medium text-[#7c3aed] underline underline-offset-2 dark:text-[#c4b5fd]"
                >
                  {t("campaigns.selectAll")}
                </button>
              </div>
              <div
                className="max-h-52 space-y-1 overflow-y-auto rounded-xl border border-[#8ec5ff]/15 bg-gradient-to-b from-[#8ec5ff]/5 to-transparent p-2"
                aria-describedby={
                  eligibleContacts.length > 0 && selectedContacts.length === 0
                    ? "campaign-recipients-hint"
                    : undefined
                }
              >
                {eligibleContacts.length === 0 ? (
                  <p className="p-3 text-center text-xs text-muted">
                    {form.channel === "whatsapp"
                      ? t("campaigns.noContactPhone")
                      : form.channel === "telegram"
                        ? t("campaigns.noContactTelegram")
                        : t("campaigns.noContactEmail")}
                  </p>
                ) : (
                  eligibleContacts.map((contact) => {
                    const selected = selectedContacts.includes(contact.id);
                    const detail =
                      form.channel === "whatsapp"
                        ? contact.phone
                        : form.channel === "telegram"
                          ? contact.telegramChatId
                          : contact.email;
                    return (
                      <button
                        key={contact.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleContact(contact.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all focus-ring",
                          selected
                            ? "border border-[#8ec5ff]/30 bg-gradient-to-r from-[#8ec5ff]/15 to-[#a78bfa]/10"
                            : "border border-transparent hover:bg-[#8ec5ff]/8",
                        )}
                      >
                        <Avatar name={contact.name} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{contact.name}</p>
                          <p className="truncate text-xs text-muted">{detail}</p>
                        </div>
                        {selected && (
                          <Check className="h-4 w-4 shrink-0 text-[#2563eb] dark:text-[#8ec5ff]" aria-hidden />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
              {eligibleContacts.length > 0 && selectedContacts.length === 0 && (
                <p id="campaign-recipients-hint" className="text-[11px] text-muted">
                  {t("campaigns.selectRecipientsHint")}
                </p>
              )}
            </FieldGroup>

            <button
              type="submit"
              disabled={sending || selectedContacts.length === 0}
              aria-describedby={
                selectedContacts.length === 0 ? "campaign-recipients-hint" : undefined
              }
              className="btn-accent flex w-full px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChannelIcon className="h-4 w-4" />
              {sending
                ? t("campaigns.sending")
                : t("campaigns.sendVia", { channel: channelInfo.label })}
            </button>
          </form>

          {lastResults.some((r) => r.waLink) && (
            <div className="accent-callout mt-4 p-3">
              <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                {t("campaigns.waDemoTitle")}
              </p>
              {lastResults
                .filter((r) => r.waLink)
                .map((r, i) => (
                  <a
                    key={i}
                    href={r.waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block truncate text-xs text-emerald-600 underline dark:text-emerald-400"
                  >
                    {r.waLink}
                  </a>
                ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title={t("campaigns.history")}
          tone="violet"
          contentClassName="p-0"
          action={
            <div
              role="tablist"
              aria-label={t("a11y.campaignHistory")}
              className="flex gap-2"
              onKeyDown={(e) =>
                handleTabArrowKeys(e, HISTORY_TABS, historyTab, setHistoryTab, HISTORY_TAB_PREFIX)
              }
            >
              {HISTORY_TABS.map((tabId) => (
                <button
                  key={tabId}
                  type="button"
                  {...getTabProps(HISTORY_TAB_PREFIX, tabId, historyTab === tabId)}
                  onClick={() => setHistoryTab(tabId)}
                  className={cn(
                    "tab-pill !px-2.5 !py-1 text-xs focus-ring",
                    historyTab === tabId ? "tab-pill-active" : "tab-pill-idle",
                  )}
                >
                  {tabId === "active"
                    ? t("campaigns.activeTab", { count: activeCampaigns.length })
                    : t("campaigns.archivedTab", { count: archivedCampaigns.length })}
                </button>
              ))}
            </div>
          }
        >
          <LoadingRegion loading={loading} statusLabel={t("common.loading")}>
            <div
              id={makeTabIds(HISTORY_TAB_PREFIX, historyTab).panel}
              role="tabpanel"
              aria-labelledby={makeTabIds(HISTORY_TAB_PREFIX, historyTab).tab}
            >
          {loading ? (
            <div className="space-y-3 p-6">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : visibleCampaigns.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Rocket}
                title={
                  historyTab === "archived"
                    ? t("campaigns.emptyArchivedTitle")
                    : t("campaigns.emptyTitle")
                }
                description={
                  historyTab === "archived"
                    ? t("campaigns.emptyArchivedDesc")
                    : t("campaigns.emptyDesc")
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {visibleCampaigns.map((campaign, i) => {
                const tone = accentAt(i);
                const style = accentToneStyles[tone];
                const ChannelIconRow =
                  CHANNEL_ICONS[campaign.channel as MessageChannel] ?? Mail;

                return (
                  <div
                    key={campaign.id}
                    className="group relative px-6 py-4 transition-colors hover:bg-[#8ec5ff]/5"
                  >
                    <div
                      className={cn(
                        "absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b opacity-0 transition-opacity group-hover:opacity-100",
                        style.stripe,
                      )}
                    />
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                            style.icon,
                          )}
                        >
                          <ChannelIconRow className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          <p className="mt-0.5 text-sm text-muted">
                            {campaign.templateName}
                          </p>
                          {campaign.senderSummary && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {t("campaigns.senderHistory", {
                                sender: campaign.senderSummary,
                              })}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground">
                            {campaign.sentAt
                              ? `${t("common.sent")} · ${formatDate(campaign.sentAt, locale)}`
                              : `${t("common.created")} · ${formatDate(campaign.createdAt, locale)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex flex-col items-end gap-1">
                          <ChannelBadge channel={campaign.channel ?? "email"} />
                          <StatusBadge status={campaign.status} />
                        </div>
                        <div className="flex gap-1">
                          {campaign.archivedAt ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={t("common.restore")}
                              onClick={() => restoreCampaign(campaign.id)}
                            >
                              <ArchiveRestore className="h-3.5 w-3.5" aria-hidden />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={t("common.archive")}
                              onClick={() => archiveCampaign(campaign.id)}
                            >
                              <Archive className="h-3.5 w-3.5" aria-hidden />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t("common.delete")}
                            onClick={() => deleteCampaign(campaign.id, campaign.name)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" aria-hidden />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
            </div>
          </LoadingRegion>
        </SectionCard>
      </div>
    </AppShell>
  );
}
