import { normalizeLocale, type Locale } from "@/lib/i18n";

export interface ContactImportRow {
  email: string;
  name: string;
  company?: string;
  locale: Locale;
  phone?: string;
  telegramChatId?: string;
}

export interface ParsedContactImport {
  rows: ContactImportRow[];
  errors: { line: number; message: string }[];
  skippedEmpty: number;
}

const COLUMN_ALIASES: Record<string, keyof ContactImportRow | "ignore"> = {
  email: "email",
  "e-mail": "email",
  mail: "email",
  name: "name",
  nome: "name",
  company: "company",
  empresa: "company",
  organization: "company",
  locale: "locale",
  idioma: "locale",
  language: "locale",
  lang: "locale",
  phone: "phone",
  telefone: "phone",
  whatsapp: "phone",
  mobile: "phone",
  telegramchatid: "telegramChatId",
  telegram_chat_id: "telegramChatId",
  telegram: "telegramChatId",
  chat_id: "telegramChatId",
  tgid: "telegramChatId",
};

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/^\ufeff/, "")
    .replace(/\s+/g, "_");
}

function detectDelimiter(line: string): "," | ";" {
  const semicolons = (line.match(/;/g) ?? []).length;
  const commas = (line.match(/,/g) ?? []).length;
  return semicolons > commas ? ";" : ",";
}

export function parseCsvLine(line: string, delimiter: "," | ";"): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

export function parseContactsCsv(text: string): ParsedContactImport {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!normalized) {
    return { rows: [], errors: [{ line: 1, message: "Arquivo vazio" }], skippedEmpty: 0 };
  }

  const lines = normalized.split("\n").filter((l, i) => i === 0 || l.trim());
  const delimiter = detectDelimiter(lines[0]);
  const headerFields = parseCsvLine(lines[0], delimiter);

  const columnMap: (keyof ContactImportRow | null)[] = headerFields.map((h) => {
    const key = normalizeHeader(h);
    const mapped = COLUMN_ALIASES[key];
    if (!mapped || mapped === "ignore") return null;
    return mapped;
  });

  const hasEmail = columnMap.includes("email");
  const hasName = columnMap.includes("name");

  if (!hasEmail || !hasName) {
    return {
      rows: [],
      errors: [
        {
          line: 1,
          message:
            "CSV precisa das colunas email e name (ou nome). Colunas: " +
            headerFields.join(", "),
        },
      ],
      skippedEmpty: 0,
    };
  }

  const rows: ContactImportRow[] = [];
  const errors: { line: number; message: string }[] = [];
  let skippedEmpty = 0;

  for (let i = 1; i < lines.length; i++) {
    const lineNum = i + 1;
    const fields = parseCsvLine(lines[i], delimiter);

    if (fields.every((f) => !f.trim())) {
      skippedEmpty++;
      continue;
    }

    const record: Partial<ContactImportRow> = { locale: "pt-BR" };

    columnMap.forEach((col, idx) => {
      if (!col) return;
      const val = fields[idx]?.trim();
      if (!val) return;
      if (col === "locale") {
        record.locale = normalizeLocale(val);
      } else {
        record[col] = val as never;
      }
    });

    if (!record.email?.trim()) {
      errors.push({ line: lineNum, message: "Email em falta" });
      continue;
    }

    const email = record.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ line: lineNum, message: `Email inválido: ${record.email}` });
      continue;
    }

    if (!record.name?.trim()) {
      errors.push({ line: lineNum, message: "Nome em falta" });
      continue;
    }

    rows.push({
      email,
      name: record.name.trim(),
      company: record.company?.trim() || undefined,
      locale: record.locale ?? "pt-BR",
      phone: record.phone?.trim() || undefined,
      telegramChatId: record.telegramChatId?.trim() || undefined,
    });
  }

  return { rows, errors, skippedEmpty };
}

export const CSV_TEMPLATE = `email,name,company,locale,phone,telegram_chat_id
maria@empresa.com,Maria Silva,Acme Inc,pt-BR,5511999990001,123456789
john@startup.com,John Smith,Startup Inc,en,14155550001,
carlos@latam.com,Carlos García,Tech LATAM,es,34612345678,
`;
