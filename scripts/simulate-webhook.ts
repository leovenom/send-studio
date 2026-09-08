/**
 * Simulates Resend webhook events against local dev server.
 * Usage: npm run simulate:webhook [-- --base http://localhost:3000]
 */
import { createClient } from "@libsql/client";
import { getDatabaseConfig } from "../src/lib/db/config";

const BASE = process.env.BASE ?? "http://localhost:3000";
const args = process.argv.slice(2);
const emailIdArg = args.includes("--email-id")
  ? args[args.indexOf("--email-id") + 1]
  : undefined;

const EVENTS = [
  "email.sent",
  "email.delivered",
  "email.opened",
  "email.clicked",
] as const;

async function main() {
  let resendId = emailIdArg;

  if (!resendId) {
    const { url, authToken } = getDatabaseConfig();
    const client = createClient({ url, authToken });
    const result = await client.execute(
      "SELECT resend_id FROM emails WHERE resend_id IS NOT NULL LIMIT 1",
    );
    resendId = (result.rows[0]?.resend_id as string) ?? "demo_fallback_id";
  }

  console.log(`Simulating webhooks → ${BASE}/api/webhooks/resend`);
  console.log(`Email ID: ${resendId}\n`);

  const results: { type: string; status: number; ok: boolean }[] = [];

  for (const type of EVENTS) {
    const payload = JSON.stringify({ type, data: { email_id: resendId } });
    const res = await fetch(`${BASE}/api/webhooks/resend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
    const ok = res.ok;
    results.push({ type, status: res.status, ok });
    console.log(`${ok ? "✓" : "✗"} ${type} → HTTP ${res.status}`);
    if (!ok) {
      const text = await res.text();
      console.log(`  ${text.slice(0, 200)}`);
    }
  }

  const allOk = results.every((r) => r.ok);
  console.log("");

  if (allOk) {
    console.log("✅ All events accepted. Check /analytics for updated metrics.");
    console.log("   sqlite3 local.db \"SELECT type, COUNT(*) FROM email_events GROUP BY type;\"");
  } else {
    console.error("❌ Some events failed. Is dev server running? (npm run dev)");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
