import { createClient } from "@libsql/client";
import { nanoid } from "nanoid";
import { EXAMPLE_CONTENT_BLOCK } from "../src/lib/i18n";

const client = createClient({
  url: process.env.DATABASE_URL ?? "file:local.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

async function migrate() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      company TEXT,
      locale TEXT NOT NULL DEFAULT 'pt-BR',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  try {
    await client.execute(`ALTER TABLE contacts ADD COLUMN locale TEXT NOT NULL DEFAULT 'pt-BR'`);
  } catch { /* exists */ }

  try {
    await client.execute(`ALTER TABLE contacts ADD COLUMN phone TEXT`);
  } catch { /* exists */ }
  try {
    await client.execute(`ALTER TABLE contacts ADD COLUMN telegram_chat_id TEXT`);
  } catch { /* exists */ }
  try {
    await client.execute(`ALTER TABLE campaigns ADD COLUMN channel TEXT NOT NULL DEFAULT 'email'`);
  } catch { /* exists */ }
  try {
    await client.execute(`ALTER TABLE templates ADD COLUMN status TEXT NOT NULL DEFAULT 'active'`);
  } catch { /* exists */ }
  try {
    await client.execute(`ALTER TABLE campaigns ADD COLUMN archived_at TEXT`);
  } catch { /* exists */ }
  try {
    await client.execute(`ALTER TABLE emails ADD COLUMN tracking_token TEXT`);
  } catch { /* exists */ }
  try {
    await client.execute(`ALTER TABLE templates ADD COLUMN preheader TEXT NOT NULL DEFAULT ''`);
  } catch { /* exists */ }
  try {
    await client.execute(`ALTER TABLE campaigns ADD COLUMN sender TEXT`);
  } catch { /* exists */ }

  await client.execute(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      campaign_id TEXT REFERENCES campaigns(id),
      contact_id TEXT NOT NULL REFERENCES contacts(id),
      channel TEXT NOT NULL,
      subject TEXT,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      external_id TEXT,
      metadata TEXT,
      sent_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      subject TEXT NOT NULL,
      blocks TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      template_id TEXT NOT NULL REFERENCES templates(id),
      channel TEXT NOT NULL DEFAULT 'email',
      status TEXT NOT NULL DEFAULT 'draft',
      archived_at TEXT,
      sent_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS emails (
      id TEXT PRIMARY KEY,
      resend_id TEXT,
      tracking_token TEXT,
      campaign_id TEXT REFERENCES campaigns(id),
      contact_id TEXT NOT NULL REFERENCES contacts(id),
      subject TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      sent_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS email_events (
      id TEXT PRIMARY KEY,
      email_id TEXT NOT NULL REFERENCES emails(id),
      type TEXT NOT NULL,
      payload TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const existing = await client.execute("SELECT id FROM contacts LIMIT 1");
  if (existing.rows.length === 0) {
    const templateId = nanoid();
    await client.execute({
      sql: `INSERT INTO templates (id, name, subject, blocks) VALUES (?, ?, ?, ?)`,
      args: [
        templateId,
        "Boas-vindas i18n",
        "{{ t.welcome }}, {{ contact.name }}!",
        JSON.stringify([
          {
            id: nanoid(),
            type: "content",
            props: {
              body: EXAMPLE_CONTENT_BLOCK,
              align: "left",
            },
          },
          {
            id: nanoid(),
            type: "button",
            props: {
              text: "{{ t.cta }}",
              url: "https://resend.com",
              align: "center",
              color: "#000000",
            },
          },
        ]),
      ],
    });

    await client.execute({
      sql: `INSERT INTO contacts (id, email, name, company, locale, phone, telegram_chat_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        nanoid(),
        "maria@example.com",
        "Maria Silva",
        "Send Studio",
        "pt-BR",
        "5511999990001",
        "123456789",
      ],
    });

    await client.execute({
      sql: `INSERT INTO contacts (id, email, name, company, locale, phone, telegram_chat_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        nanoid(),
        "john@example.com",
        "John Smith",
        "Startup Inc",
        "en",
        "14155550001",
        "987654321",
      ],
    });

    await client.execute({
      sql: `INSERT INTO contacts (id, email, name, company, locale, phone, telegram_chat_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        nanoid(),
        "carlos@example.com",
        "Carlos García",
        "Tech LATAM",
        "es",
        "34612345678",
        null,
      ],
    });
  }

  console.log("Database migrated and seeded!");
  await rebrandLegacyNames();
}

/** Atualiza registros antigos que ainda usam o nome "Resend Studio". */
async function rebrandLegacyNames() {
  const from = "Resend Studio";
  const to = "Send Studio";

  const tables: { table: string; columns: string[] }[] = [
    { table: "templates", columns: ["name", "subject", "blocks"] },
    { table: "campaigns", columns: ["name"] },
    { table: "contacts", columns: ["company"] },
    { table: "messages", columns: ["subject", "body"] },
  ];

  let updated = 0;
  for (const { table, columns } of tables) {
    for (const column of columns) {
      const result = await client.execute({
        sql: `UPDATE ${table} SET ${column} = REPLACE(${column}, ?, ?) WHERE ${column} LIKE ?`,
        args: [from, to, `%${from}%`],
      });
      updated += result.rowsAffected;
    }
  }

  if (updated > 0) {
    console.log(`Rebrand: ${updated} campo(s) atualizado(s) (${from} → ${to}).`);
  }
}

migrate().catch(console.error);
