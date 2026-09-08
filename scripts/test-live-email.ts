/**
 * One-off live Resend send test. Loads .env.local without restarting dev server.
 * Usage: npx tsx scripts/test-live-email.ts [recipient@email.com]
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { Resend } from "resend";

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    console.error("Missing .env.local — add RESEND_API_KEY first.");
    process.exit(1);
  }
}

async function main() {
  loadEnvLocal();

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ??
    "Send Studio <onboarding@resend.dev>";
  const to = process.argv[2]?.trim() ?? "leonardtlauenstein@gmail.com";

  if (!apiKey || apiKey.startsWith("re_xxx")) {
    console.error("RESEND_API_KEY not set in .env.local");
    process.exit(1);
  }

  console.log("Sending live test email...");
  console.log("From:", from);
  console.log("To:", to);

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: "Send Studio — live send test",
    html: `<p>If you received this, <strong>Resend</strong> is working.</p><p>Sent at ${new Date().toISOString()}</p>`,
    replyTo: "noreply@resend.dev",
  });

  if (error) {
    console.error("FAILED:", error.message);
    process.exit(1);
  }

  console.log("SUCCESS — resend id:", data?.id);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
