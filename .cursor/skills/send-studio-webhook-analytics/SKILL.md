---
name: send-studio-webhook-analytics
description: >-
  Tests Send Studio Resend webhooks and analytics pipeline — simulates email
  events, verifies email_events table, validates open/click/delivery rates on
  /analytics. Use when the user asks for webhook testing, analytics validation,
  event simulation, or "agente webhook/analytics".
---

# Send Studio — Webhook & Analytics Agent

## Mission

Validate the Resend webhook → DB → analytics pipeline. Simulate events, verify funnel metrics, and report discrepancies.

## Key files

| File | Role |
|------|------|
| `src/app/api/webhooks/resend/route.ts` | Webhook handler + signature verify |
| `src/lib/queries.ts` | `getAnalytics()`, `getDashboardStats()` |
| `src/app/analytics/page.tsx` | Funnel UI |
| `scripts/simulate-webhook.ts` | Local event simulator |

## Workflow

```
Webhook & analytics audit:
- [ ] 1. Ensure demo or real emails exist in DB
- [ ] 2. Run npm run simulate:webhook (or curl)
- [ ] 3. Verify email_events rows inserted
- [ ] 4. Verify emails.status updated
- [ ] 5. Check /analytics rates match DB counts
- [ ] 6. Test signed vs unsigned webhook modes
- [ ] 7. Write report
```

## Step 1 — Seed data if empty

```bash
npm run db:seed-demo
```

Or send a real campaign with `RESEND_API_KEY` so `emails.resend_id` is set.

## Step 2 — Simulate webhook events

```bash
npm run simulate:webhook
# Or with specific email:
npm run simulate:webhook -- --email-id <emails.resend_id>
```

Script sends events in order: `email.sent` → `delivered` → `opened` → `clicked`

Manual curl (unsigned mode — no RESEND_WEBHOOK_SECRET):

```bash
BASE=http://localhost:3000
RESEND_ID=$(sqlite3 local.db "SELECT resend_id FROM emails LIMIT 1;" 2>/dev/null || echo "demo_abc123")

curl -s -X POST "$BASE/api/webhooks/resend" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"email.opened\",\"data\":{\"email_id\":\"$RESEND_ID\"}}"
```

## Step 3 — Verify DB

```bash
sqlite3 local.db "SELECT type, COUNT(*) FROM email_events GROUP BY type;"
sqlite3 local.db "SELECT status, COUNT(*) FROM emails GROUP BY status;"
```

Expected event types:
- `email.sent`
- `email.delivered`
- `email.opened`
- `email.clicked`
- `email.bounced`
- `email.complained`

## Step 4 — Analytics rate validation

From `getAnalytics()` in `queries.ts`:

| Metric | Formula | Source |
|--------|---------|--------|
| Delivery rate | delivered / sent | eventStats |
| Open rate | opened / delivered | eventStats |
| Click rate | clicked / opened | eventStats |
| Bounces | count | eventStats |

Cross-check `/analytics` UI numbers against manual SQL counts.

## Step 5 — Webhook security modes

| Mode | Behavior |
|------|----------|
| `RESEND_WEBHOOK_SECRET` unset | Accepts raw JSON — **dev only** |
| Secret set | Requires svix signature headers |

Test invalid signature returns 400 when secret configured.

## Step 6 — Edge cases

| Case | Expected |
|------|----------|
| Unknown `email_id` | 200 OK, no DB insert (silent skip) |
| Duplicate event | Duplicate rows OK (counts inflate — flag if idempotency needed) |
| Event before email record | No match, skip |
| Demo emails with `demo_*` resend_id | Simulator works |

## Report template

```markdown
# Webhook & Analytics Report — Send Studio

## Pipeline status
- Webhook endpoint: /api/webhooks/resend
- Signature verification: enabled/disabled
- Events in DB: [counts by type]

## Simulated events
| Event | HTTP | DB row | Status update |
|-------|------|--------|---------------|
| email.sent | 200 | ✓ | sent |
| ... | | | |

## Analytics UI vs DB
| Metric | UI | Calculated | Match? |
|--------|-----|------------|--------|
| Delivery rate | | | |
| Open rate | | | |

## Issues
- ...

## Production recommendations
- Enable RESEND_WEBHOOK_SECRET
- Add idempotency key on events
- Configure all event types in Resend dashboard
```

## Resend dashboard setup

1. Webhooks → Add endpoint
2. URL: `https://<domain>/api/webhooks/resend`
3. Events: all email.* types
4. Copy signing secret → `RESEND_WEBHOOK_SECRET`

## Do not

- Disable signature verification in production
- Expose webhook URL without rate limiting (future)
