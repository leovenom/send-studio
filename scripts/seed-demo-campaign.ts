import { createClient } from "@libsql/client";
import { nanoid } from "nanoid";
import { EXAMPLE_CONTENT_BLOCK } from "../src/lib/i18n";

const client = createClient({
  url: process.env.DATABASE_URL ?? "file:local.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const DEMO_PREFIX = "Demo —";
const force = process.argv.includes("--force");

const DEMO_CONTACTS = [
  {
    email: "maria@example.com",
    name: "Maria Silva",
    company: "Acme Inc",
    locale: "pt-BR",
    phone: "5511999990001",
    telegramChatId: "100001",
  },
  {
    email: "john@example.com",
    name: "John Smith",
    company: "Startup Inc",
    locale: "en",
    phone: "14155550001",
    telegramChatId: "100002",
  },
  {
    email: "carlos@example.com",
    name: "Carlos García",
    company: "Tech LATAM",
    locale: "es",
    phone: "34612345678",
    telegramChatId: null,
  },
  {
    email: "sarah@example.com",
    name: "Sarah Chen",
    company: "Northwind",
    locale: "en",
    phone: "447700900123",
    telegramChatId: "100004",
  },
  {
    email: "ana@example.co",
    name: "Ana Costa",
    company: "Resend Partners",
    locale: "pt-BR",
    phone: "5511988887777",
    telegramChatId: "100005",
  },
  {
    email: "lucas@example.es",
    name: "Lucas Fernández",
    company: "Global SaaS",
    locale: "es",
    phone: "34911223344",
    telegramChatId: "100006",
  },
] as const;

type DemoContact = (typeof DEMO_CONTACTS)[number] & { id: string };

function daysAgo(days: number, hours = 12): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hours, 0, 0, 0);
  return d.toISOString();
}

function mainBlocks(localeNote: string) {
  return [
    {
      id: nanoid(),
      type: "header",
      props: {
        logoSrc: "https://resend.com/static/brand/resend-icon-black.svg",
        logoWidth: "56",
        logoAlt: "Send Studio",
        title: "Send Studio",
        subtitle: "{{ t.greeting }}",
        bgColor: "#fafafa",
        textColor: "#0a0a0a",
        align: "center",
      },
    },
    {
      id: nanoid(),
      type: "content",
      props: { body: EXAMPLE_CONTENT_BLOCK, align: "left" },
    },
    {
      id: nanoid(),
      type: "button",
      props: {
        text: "{{ t.cta }}",
        url: "https://resend.com",
        align: "center",
        color: "#000000",
        style: "button",
      },
    },
    {
      id: nanoid(),
      type: "divider",
      props: { color: "#e5e5e5" },
    },
    {
      id: nanoid(),
      type: "text",
      props: {
        text: `📊 Portfolio demo — Liquid + i18n. Locale: {{ contact.locale }}. ${localeNote}`,
        align: "center",
      },
    },
    {
      id: nanoid(),
      type: "footer",
      props: {
        companyName: "Send Studio",
        text: "{{ t.footer }}",
        unsubscribeText: "{{ t.unsubscribe }}",
        unsubscribeUrl: "https://resend.com/unsubscribe",
        privacyUrl: "https://resend.com/privacy",
        privacyText: "Privacy",
        bgColor: "#f5f5f5",
        textColor: "#737373",
        align: "center",
      },
    },
  ];
}

async function deleteExistingDemo() {
  const templates = await client.execute({
    sql: "SELECT id FROM templates WHERE name LIKE ?",
    args: [`${DEMO_PREFIX}%`],
  });

  if (templates.rows.length === 0) return false;

  const ids = templates.rows.map((r) => r.id as string);
  const placeholders = ids.map(() => "?").join(",");

  await client.execute({
    sql: `DELETE FROM email_events WHERE email_id IN (
      SELECT id FROM emails WHERE campaign_id IN (
        SELECT id FROM campaigns WHERE template_id IN (${placeholders})
      )
    )`,
    args: ids,
  });
  await client.execute({
    sql: `DELETE FROM emails WHERE campaign_id IN (SELECT id FROM campaigns WHERE template_id IN (${placeholders}))`,
    args: ids,
  });
  await client.execute({
    sql: `DELETE FROM messages WHERE campaign_id IN (SELECT id FROM campaigns WHERE template_id IN (${placeholders}))`,
    args: ids,
  });
  await client.execute({
    sql: `DELETE FROM campaigns WHERE template_id IN (${placeholders})`,
    args: ids,
  });
  await client.execute({
    sql: `DELETE FROM templates WHERE id IN (${placeholders})`,
    args: ids,
  });

  console.log(`Demo anterior removido (${ids.length} template(s)).`);
  return true;
}

async function ensureDemoContacts(): Promise<DemoContact[]> {
  const result: DemoContact[] = [];

  for (const c of DEMO_CONTACTS) {
    const existing = await client.execute({
      sql: "SELECT id FROM contacts WHERE email = ? LIMIT 1",
      args: [c.email],
    });

    if (existing.rows.length > 0) {
      result.push({ ...c, id: existing.rows[0].id as string });
      continue;
    }

    const id = nanoid();
    await client.execute({
      sql: `INSERT INTO contacts (id, email, name, company, locale, phone, telegram_chat_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [id, c.email, c.name, c.company, c.locale, c.phone, c.telegramChatId],
    });
    result.push({ ...c, id });
  }

  return result;
}

async function insertTemplate(
  name: string,
  subject: string,
  blocks: object[],
  status: "active" | "archived" = "active",
  preheader = "",
) {
  const id = nanoid();
  const now = new Date().toISOString();
  await client.execute({
    sql: `INSERT INTO templates (id, name, subject, preheader, blocks, status, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, name, subject, preheader, JSON.stringify(blocks), status, now],
  });
  return id;
}

async function insertCampaign(
  name: string,
  templateId: string,
  channel: string,
  status: string,
  sentAt: string,
  sender: object,
  archivedAt?: string,
) {
  const id = nanoid();
  await client.execute({
    sql: `INSERT INTO campaigns (id, name, template_id, channel, status, sent_at, sender, archived_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      name,
      templateId,
      channel,
      status,
      sentAt,
      JSON.stringify(sender),
      archivedAt ?? null,
      sentAt,
    ],
  });
  return id;
}

async function seedEmailCampaign({
  campaignId,
  contacts,
  subject,
  sentAt,
  eventDayOffset,
  failureRate = 0,
}: {
  campaignId: string;
  contacts: DemoContact[];
  subject: string;
  sentAt: string;
  eventDayOffset: number;
  failureRate?: number;
}) {
  let index = 0;
  for (const contact of contacts) {
    const emailId = nanoid();
    const trackingToken = nanoid(24);
    const failed = failureRate > 0 && index % Math.round(1 / failureRate) === 0;
    const status = failed ? "failed" : "delivered";
    const eventAt = daysAgo(eventDayOffset, 10 + index);

    await client.execute({
      sql: `INSERT INTO emails (id, resend_id, tracking_token, campaign_id, contact_id, subject, status, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        emailId,
        `demo_${nanoid(8)}`,
        trackingToken,
        campaignId,
        contact.id,
        subject.replace("{{ name }}", contact.name),
        status,
        eventAt,
      ],
    });

    if (failed) {
      await client.execute({
        sql: `INSERT INTO email_events (id, email_id, type, created_at) VALUES (?, ?, ?, ?)`,
        args: [nanoid(), emailId, "email.bounced", eventAt],
      });
      index++;
      continue;
    }

    const isBot = contact.locale === "en" && contact.name === "John Smith";
    const events: string[] = ["email.sent", "email.delivered", "email.opened"];
    if (isBot) {
      events.push("email.bot_probe", "email.opened_bot");
    } else {
      events.push("email.opened_human");
    }
    if (index % 2 === 0) events.push("email.clicked");
    if (index % 5 === 0) events.push("email.complained");

    for (const type of events) {
      await client.execute({
        sql: `INSERT INTO email_events (id, email_id, type, created_at) VALUES (?, ?, ?, ?)`,
        args: [nanoid(), emailId, type, eventAt],
      });
    }
    index++;
  }
}

async function seedMessagingCampaign({
  campaignId,
  channel,
  contacts,
  subject,
  sentAt,
}: {
  campaignId: string;
  channel: "whatsapp" | "telegram";
  contacts: DemoContact[];
  subject: string;
  sentAt: string;
}) {
  for (const contact of contacts) {
    const hasChannel =
      channel === "whatsapp" ? !!contact.phone : !!contact.telegramChatId;
    if (!hasChannel) continue;

    const msgId = nanoid();
    const body =
      channel === "whatsapp"
        ? `*${subject.replace("{{ name }}", contact.name)}*\n\nDemo WhatsApp — Send Studio portfolio`
        : `<b>${subject.replace("{{ name }}", contact.name)}</b>\n\nDemo Telegram — Send Studio portfolio`;

    const metadata =
      channel === "whatsapp" && contact.phone
        ? JSON.stringify({
            waLink: `https://wa.me/${contact.phone.replace(/\D/g, "")}?text=demo`,
          })
        : null;

    await client.execute({
      sql: `INSERT INTO messages (id, campaign_id, contact_id, channel, subject, body, status, metadata, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        msgId,
        campaignId,
        contact.id,
        channel,
        subject,
        body,
        "demo",
        metadata,
        sentAt,
      ],
    });
  }
}

async function seedDemo() {
  const existing = await client.execute({
    sql: "SELECT id FROM templates WHERE name LIKE ? LIMIT 1",
    args: [`${DEMO_PREFIX}%`],
  });

  if (existing.rows.length > 0) {
    if (force) {
      await deleteExistingDemo();
    } else {
      console.log(
        "Demo já existe — pulando seed. Use npm run db:seed-demo -- --force para recriar.",
      );
      return;
    }
  }

  const contacts = await ensureDemoContacts();
  console.log(`Contatos demo: ${contacts.length}`);

  const welcomeTemplateId = await insertTemplate(
    `${DEMO_PREFIX} Multichannel welcome`,
    "{{ t.subject_welcome }}",
    mainBlocks("Multichannel CRM demo"),
    "active",
    "Your personalized update inside",
  );

  const launchTemplateId = await insertTemplate(
    `${DEMO_PREFIX} Product launch`,
    "🚀 New: {{ contact.company }} is live",
    mainBlocks("Product launch campaign"),
    "active",
  );

  await insertTemplate(
    `${DEMO_PREFIX} Legacy newsletter`,
    "Weekly digest",
    mainBlocks("Archived template example"),
    "archived",
  );

  const emailSender = {
    channel: "email",
    fromName: "Send Studio",
    fromEmail: "noreply@sendstudio.dev",
    from: "Send Studio <noreply@sendstudio.dev>",
    replyTo: "noreply@sendstudio.dev",
    noReply: true,
  };

  const waSender = {
    channel: "whatsapp",
    displayName: "Send Studio",
    phoneNumber: "+1 555 010 0000",
  };

  const tgSender = {
    channel: "telegram",
    botName: "Send Studio Bot",
    botUsername: "@sendstudio_bot",
  };

  const welcomeEmailId = await insertCampaign(
    `${DEMO_PREFIX} Welcome email`,
    welcomeTemplateId,
    "email",
    "sent",
    daysAgo(12),
    emailSender,
  );
  await seedEmailCampaign({
    campaignId: welcomeEmailId,
    contacts,
    subject: "Welcome, {{ name }}!",
    sentAt: daysAgo(12),
    eventDayOffset: 12,
  });

  const welcomeWaId = await insertCampaign(
    `${DEMO_PREFIX} Welcome WhatsApp`,
    welcomeTemplateId,
    "whatsapp",
    "sent",
    daysAgo(10),
    waSender,
  );
  await seedMessagingCampaign({
    campaignId: welcomeWaId,
    channel: "whatsapp",
    contacts,
    subject: "Welcome, {{ name }}!",
    sentAt: daysAgo(10),
  });

  const welcomeTgId = await insertCampaign(
    `${DEMO_PREFIX} Welcome Telegram`,
    welcomeTemplateId,
    "telegram",
    "sent",
    daysAgo(9),
    tgSender,
  );
  await seedMessagingCampaign({
    campaignId: welcomeTgId,
    channel: "telegram",
    contacts,
    subject: "Welcome, {{ name }}!",
    sentAt: daysAgo(9),
  });

  const launchCampaignId = await insertCampaign(
    `${DEMO_PREFIX} Product launch`,
    launchTemplateId,
    "email",
    "sent",
    daysAgo(3),
    emailSender,
  );
  await seedEmailCampaign({
    campaignId: launchCampaignId,
    contacts: contacts.slice(0, 4),
    subject: "Launch day — {{ name }}",
    sentAt: daysAgo(3),
    eventDayOffset: 3,
  });

  const partialCampaignId = await insertCampaign(
    `${DEMO_PREFIX} Re-engagement (partial)`,
    welcomeTemplateId,
    "email",
    "partial",
    daysAgo(6),
    emailSender,
  );
  await seedEmailCampaign({
    campaignId: partialCampaignId,
    contacts: contacts.slice(0, 5),
    subject: "We miss you, {{ name }}",
    sentAt: daysAgo(6),
    eventDayOffset: 6,
    failureRate: 0.25,
  });

  await insertCampaign(
    `${DEMO_PREFIX} Black Friday 2025`,
    welcomeTemplateId,
    "email",
    "sent",
    daysAgo(45),
    emailSender,
    daysAgo(30),
  );

  const stats = await client.execute(
    `SELECT
      (SELECT COUNT(*) FROM templates WHERE name LIKE '${DEMO_PREFIX}%') AS templates,
      (SELECT COUNT(*) FROM campaigns WHERE name LIKE '${DEMO_PREFIX}%') AS campaigns,
      (SELECT COUNT(*) FROM emails WHERE campaign_id IN (SELECT id FROM campaigns WHERE name LIKE '${DEMO_PREFIX}%')) AS emails,
      (SELECT COUNT(*) FROM email_events WHERE email_id IN (SELECT id FROM emails WHERE campaign_id IN (SELECT id FROM campaigns WHERE name LIKE '${DEMO_PREFIX}%'))) AS events,
      (SELECT COUNT(*) FROM messages WHERE campaign_id IN (SELECT id FROM campaigns WHERE name LIKE '${DEMO_PREFIX}%')) AS messages`,
  );

  const row = stats.rows[0] as Record<string, number>;

  console.log(`
✅ Demo seed completo (portfolio)!

Templates demo:     ${row.templates}
Campanhas demo:       ${row.campaigns} (email, whatsapp, telegram, partial, archived)
Emails + eventos:     ${row.emails} emails, ${row.events} eventos
Mensagens WA/TG:      ${row.messages}
Contatos demo:        ${contacts.length} (pt-BR / en / es)

Próximos passos:
  npm run dev
  → /           dashboard com gráfico de 14 dias
  → /contacts   6 contatos multicanal
  → /templates  3 templates (1 arquivado)
  → /campaigns  histórico com remetentes
  → /analytics  funil human vs bot
`);
}

seedDemo().catch(console.error);
