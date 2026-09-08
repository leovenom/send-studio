/**
 * Validates translation key parity across pt-BR, en, es.
 * Exit 1 if any locale is missing keys.
 */
import { translations, type Locale } from "../src/lib/i18n";

const LOCALES: Locale[] = ["pt-BR", "en", "es"];

function main() {
  const allKeys = new Set<string>();
  for (const locale of LOCALES) {
    Object.keys(translations[locale]).forEach((k) => allKeys.add(k));
  }

  let ok = true;

  console.log("Send Studio — i18n validation\n");
  console.log("| Key | pt-BR | en | es |");
  console.log("|-----|-------|----|----|");

  for (const key of [...allKeys].sort()) {
    const cells = LOCALES.map((locale) => {
      const has = key in translations[locale];
      if (!has) ok = false;
      return has ? "✓" : "✗";
    });
    console.log(`| ${key} | ${cells.join(" | ")} |`);
  }

  // Check for empty values
  for (const locale of LOCALES) {
    for (const [key, value] of Object.entries(translations[locale])) {
      if (!value.trim()) {
        console.error(`\n✗ Empty value: ${locale}.${key}`);
        ok = false;
      }
    }
  }

  console.log("");
  if (ok) {
    console.log(`✅ All ${allKeys.size} keys present in ${LOCALES.length} locales.`);
    process.exit(0);
  } else {
    console.error("❌ Translation gaps found — fix src/lib/i18n.ts");
    process.exit(1);
  }
}

main();
