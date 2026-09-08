"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badges";
import {
  Avatar,
  EmptyState,
  PageHeader,
  SectionCard,
  Skeleton,
  LoadingRegion,
} from "@/components/ui/page-header";
import { FieldGroup, Label, Select, FieldError } from "@/components/ui/select";
import { useT } from "@/components/locale/locale-provider";
import { LOCALES, type Locale } from "@/lib/i18n";
import { ContactImport } from "@/components/contacts/contact-import";
import { accentAt, accentToneStyles } from "@/lib/accent-styles";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-fetch";
import type { Contact } from "@/lib/db/schema";
import {
  Mail,
  MessageCircle,
  Pencil,
  Save,
  Send,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";

const emptyForm = {
  email: "",
  name: "",
  company: "",
  locale: "pt-BR" as Locale,
  phone: "",
  telegramChatId: "",
};

export default function ContactsPage() {
  const t = useT();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  async function loadContacts() {
    const res = await apiFetch("/api/contacts");
    setContacts(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const res = await apiFetch("/api/contacts");
      const data = await res.json();
      if (cancelled) return;
      setContacts(data);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function startEdit(contact: Contact) {
    setEditingId(contact.id);
    setForm({
      email: contact.email,
      name: contact.name,
      company: contact.company ?? "",
      locale: (contact.locale as Locale) ?? "pt-BR",
      phone: contact.phone ?? "",
      telegramChatId: contact.telegramChatId ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const payload = {
      email: form.email,
      name: form.name,
      company: form.company || null,
      locale: form.locale,
      phone: form.phone || null,
      telegramChatId: form.telegramChatId || null,
    };

    if (editingId) {
      const res = await apiFetch(`/api/contacts/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 409) {
        setFormError(t("contacts.emailInUse"));
        return;
      }
      cancelEdit();
    } else {
      await apiFetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setForm(emptyForm);
    }

    loadContacts();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(t("contacts.confirmDelete", { name }))) return;
    if (editingId === id) cancelEdit();
    await apiFetch(`/api/contacts/${id}`, { method: "DELETE" });
    loadContacts();
  }

  return (
    <AppShell>
      <PageHeader
        accent
        label={t("contacts.label")}
        title={t("contacts.title")}
        description={t("contacts.description")}
      />

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <div className="space-y-6">
          <ContactImport onImported={loadContacts} />

          <SectionCard
            title={editingId ? t("contacts.editContact") : t("contacts.newContact")}
            tone={editingId ? "cyan" : "violet"}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
            <FieldGroup>
              <Label htmlFor="contact-email" required>
                {t("contacts.email")}
              </Label>
              <Input
                id="contact-email"
                type="email"
                required
                aria-required="true"
                aria-invalid={!!formError}
                aria-describedby={formError ? "contact-email-error" : undefined}
                placeholder={t("contacts.emailPlaceholder")}
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  if (formError) setFormError(null);
                }}
              />
              <FieldError id="contact-email-error" message={formError} />
            </FieldGroup>
            <FieldGroup>
              <Label htmlFor="contact-name" required>
                {t("contacts.name")}
              </Label>
              <Input
                id="contact-name"
                required
                aria-required="true"
                placeholder={t("contacts.namePlaceholder")}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </FieldGroup>
            <FieldGroup>
              <Label htmlFor="contact-company">{t("contacts.company")}</Label>
              <Input
                id="contact-company"
                placeholder={t("contacts.companyPlaceholder")}
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </FieldGroup>
            <FieldGroup>
              <Label htmlFor="contact-phone">{t("contacts.whatsapp")}</Label>
              <Input
                id="contact-phone"
                placeholder={t("contacts.phonePlaceholder")}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </FieldGroup>
            <FieldGroup>
              <Label htmlFor="contact-telegram">{t("contacts.telegramChatId")}</Label>
              <Input
                id="contact-telegram"
                placeholder={t("contacts.telegramPlaceholder")}
                value={form.telegramChatId}
                onChange={(e) =>
                  setForm({ ...form, telegramChatId: e.target.value })
                }
              />
              <p className="text-[10px] text-muted">{t("contacts.telegramHint")}</p>
            </FieldGroup>
            <FieldGroup>
              <Label htmlFor="contact-locale">{t("contacts.language")}</Label>
              <Select
                id="contact-locale"
                value={form.locale}
                onChange={(e) =>
                  setForm({ ...form, locale: e.target.value as Locale })
                }
              >
                  {LOCALES.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </Select>
              </FieldGroup>
              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  className="btn-accent flex w-full px-4 py-3 text-sm"
                >
                  {editingId ? (
                    <Save className="h-4 w-4" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  {editingId ? t("contacts.saveChanges") : t("contacts.addContact")}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="btn-accent-secondary flex w-full px-4 py-2.5 text-sm"
                  >
                    <X className="h-4 w-4" />
                    {t("contacts.cancelEdit")}
                  </button>
                )}
              </div>
            </form>
          </SectionCard>
        </div>

        <SectionCard
          title={
            loading
              ? t("common.loading")
              : t("contacts.count", { count: contacts.length })
          }
          tone="blue"
          contentClassName="p-0"
        >
          <LoadingRegion loading={loading} statusLabel={t("common.loading")}>
          {loading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Users}
                title={t("contacts.emptyTitle")}
                description={t("contacts.emptyDesc")}
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {contacts.map((contact, i) => {
                const tone = accentAt(i);
                const style = accentToneStyles[tone];
                const isEditing = editingId === contact.id;

                return (
                  <div
                    key={contact.id}
                    className={cn(
                      "group relative flex items-center gap-4 px-6 py-4 transition-colors",
                      isEditing
                        ? "bg-[#5eead4]/10"
                        : "hover:bg-[#8ec5ff]/5",
                    )}
                  >
                    <div
                      className={cn(
                        "absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b transition-opacity",
                        style.stripe,
                        isEditing ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                      )}
                    />
                    <Avatar name={contact.name} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{contact.name}</p>
                      <p className="flex items-center gap-1.5 truncate text-sm text-muted">
                        <Mail className="h-3 w-3 shrink-0 opacity-60" />
                        {contact.email}
                      </p>
                      {contact.company && (
                        <p className="text-xs text-muted-foreground">{contact.company}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {contact.phone && (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                              accentToneStyles.emerald.chip,
                            )}
                          >
                            <MessageCircle className="h-3 w-3" />
                            {contact.phone}
                          </span>
                        )}
                        {contact.telegramChatId && (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                              accentToneStyles.violet.chip,
                            )}
                          >
                            <Send className="h-3 w-3" />
                            {contact.telegramChatId}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                      <Badge variant="info">{contact.locale ?? "en"}</Badge>
                      <StatusBadge status={contact.status} />
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("contacts.edit")}
                        onClick={() => startEdit(contact)}
                      >
                        <Pencil className="h-4 w-4 text-[#7c3aed] dark:text-[#c4b5fd]" aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("a11y.deleteContact", { name: contact.name })}
                        onClick={() => handleDelete(contact.id, contact.name)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" aria-hidden />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </LoadingRegion>
        </SectionCard>
      </div>
    </AppShell>
  );
}
