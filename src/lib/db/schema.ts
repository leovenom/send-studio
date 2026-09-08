import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const contacts = sqliteTable("contacts", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  company: text("company"),
  locale: text("locale").notNull().default("pt-BR"),
  phone: text("phone"),
  telegramChatId: text("telegram_chat_id"),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const templates = sqliteTable("templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  preheader: text("preheader").notNull().default(""),
  blocks: text("blocks").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const campaigns = sqliteTable("campaigns", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  templateId: text("template_id")
    .notNull()
    .references(() => templates.id),
  channel: text("channel").notNull().default("email"),
  status: text("status").notNull().default("draft"),
  archivedAt: text("archived_at"),
  sentAt: text("sent_at"),
  sender: text("sender"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const emails = sqliteTable("emails", {
  id: text("id").primaryKey(),
  resendId: text("resend_id"),
  trackingToken: text("tracking_token"),
  campaignId: text("campaign_id").references(() => campaigns.id),
  contactId: text("contact_id")
    .notNull()
    .references(() => contacts.id),
  subject: text("subject").notNull(),
  status: text("status").notNull().default("queued"),
  sentAt: text("sent_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const emailEvents = sqliteTable("email_events", {
  id: text("id").primaryKey(),
  emailId: text("email_id")
    .notNull()
    .references(() => emails.id),
  type: text("type").notNull(),
  payload: text("payload"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  campaignId: text("campaign_id").references(() => campaigns.id),
  contactId: text("contact_id")
    .notNull()
    .references(() => contacts.id),
  channel: text("channel").notNull(),
  subject: text("subject"),
  body: text("body").notNull(),
  status: text("status").notNull().default("queued"),
  externalId: text("external_id"),
  metadata: text("metadata"),
  sentAt: text("sent_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type Contact = typeof contacts.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type Email = typeof emails.$inferSelect;
export type EmailEvent = typeof emailEvents.$inferSelect;
