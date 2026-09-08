---
name: send-studio-e2e-demo
description: >-
  End-to-end testing and demo setup for Send Studio — runs build/lint, seeds
  demo template and campaigns, tests API routes, validates email/WhatsApp/Telegram
  previews, and reports results. Use when the user asks to test everything, create
  example campaign, demo data, e2e verification, or "agente de testes".
---

# Send Studio — E2E Test & Demo Agent

## Mission

Verify Send Studio works end-to-end: build, seed demo data, exercise APIs, validate multi-channel previews, and produce a results report the user can inspect in the UI.

## Quick start

```bash
cd ~/send-studio   # project root
npm run db:migrate
npm run db:seed-demo
npm run build
npm run lint
npm run dev          # background, port 3000
```

Then run API tests (see below) and open UI pages.

## Workflow checklist

```
E2E verification:
- [ ] 1. Migrate + seed demo data
- [ ] 2. Build + lint pass
- [ ] 3. Dev server running
- [ ] 4. Test templates API (list, get, preview)
- [ ] 5. Test preview for all 3 channels
- [ ] 6. Test campaign send (demo mode OK)
- [ ] 7. Verify UI pages load
- [ ] 8. Check analytics has demo events
- [ ] 9. Write results report
```

## Step 1 — Seed demo campaign

```bash
npm run db:seed-demo
```

Creates:
- Template **"Demo — Campanha multicanal"** (header + Liquid content + button + footer)
- 3 campanhas enviadas (email, WhatsApp, Telegram)
- Emails com eventos (`sent`, `delivered`, `opened`, `clicked`) para `/analytics`
- Messages demo para WhatsApp/Telegram

Re-run after deleting the demo template to recreate.

## Step 2 — API smoke tests

Replace `BASE` if dev server uses another port.

```bash
BASE=http://localhost:3000

# List templates
curl -s "$BASE/api/templates" | head -c 500

# Get demo template id
TEMPLATE_ID=$(curl -s "$BASE/api/templates" | node -e "
  const d=JSON.parse(require('fs').readFileSync(0,'utf8'));
  const t=d.find(x=>x.name.includes('Demo'));
  console.log(t?.id||d[0]?.id||'');
")

# Preview all channels
curl -s -X POST "$BASE/api/preview" \
  -H "Content-Type: application/json" \
  -d "{\"blocks\":[],\"subject\":\"Test\",\"locale\":\"pt-BR\"}" 

# Full preview with demo template blocks
curl -s "$BASE/api/templates/$TEMPLATE_ID" | node -e "
  const t=JSON.parse(require('fs').readFileSync(0,'utf8'));
  const body=JSON.stringify({blocks:JSON.parse(t.blocks),subject:t.subject,locale:'pt-BR'});
  require('fs').writeFileSync('/tmp/preview-payload.json',body);
"
curl -s -X POST "$BASE/api/preview" -H "Content-Type: application/json" -d @/tmp/preview-payload.json \
  | node -e "
  const d=JSON.parse(require('fs').readFileSync(0,'utf8'));
  console.log('html:', (d.html||'').length, 'chars');
  console.log('whatsapp:', (d.whatsappText||'').slice(0,120));
  console.log('telegram:', (d.telegramHtml||'').slice(0,120));
  console.log('subject:', d.subject);
"

# List contacts
curl -s "$BASE/api/contacts" | head -c 300

# List campaigns (with demo history)
curl -s "$BASE/api/campaigns?includeArchived=true" | head -c 500

# Send demo campaign (no API keys = demo status)
CONTACT_ID=$(curl -s "$BASE/api/contacts" | node -e "
  const d=JSON.parse(require('fs').readFileSync(0,'utf8'));
  console.log(d[0]?.id||'');
")
curl -s -X POST "$BASE/api/campaigns" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"E2E Test Email\",\"templateId\":\"$TEMPLATE_ID\",\"channel\":\"email\",\"contactIds\":[\"$CONTACT_ID\"]}"
```

## Step 3 — UI verification

Open and confirm data visible:

| Page | Expected |
|------|----------|
| `/templates` | Demo template listed, preview tabs work |
| `/templates/[demo-id]` | Header/footer zones, channel preview |
| `/campaigns` | 3+ demo campaigns in history |
| `/contacts` | Maria, John, Carlos with phone/telegram |
| `/analytics` | Event counts > 0 after seed |
| `/` | Dashboard stats populated |

Use browser tools if available; otherwise report API results.

## Step 4 — Channel-specific checks

### Email
- Preview iframe renders HTML with media queries
- Subject uses Liquid (`{{ t.subject_welcome }}`)

### WhatsApp
- Preview shows plain text bubble
- No HTML tags in output
- `*bold*` formatting present

### Telegram
- Preview shows limited HTML (`<b>`, `<a>`)
- No CSS/JS

## Results report template

```markdown
# E2E Test Report — Send Studio

## Environment
- Node/npm versions
- DATABASE_URL (local.db / Turso)
- API keys: Resend ☐ / WhatsApp ☐ / Telegram ☐ / OpenAI ☐

## Build & lint
- [ ] `npm run build` — pass/fail
- [ ] `npm run lint` — pass/fail

## Demo seed
- [ ] Template created: [id]
- [ ] Campaigns: email / whatsapp / telegram
- [ ] Analytics events: [count]

## API tests
| Endpoint | Status | Notes |
|----------|--------|-------|
| GET /api/templates | | |
| POST /api/preview | | |
| GET /api/campaigns | | |
| POST /api/campaigns | | |

## UI verification
| Page | OK? | Screenshot/notes |
|------|-----|------------------|
| /templates | | |
| /campaigns | | |
| /analytics | | |

## Sample outputs
### Email subject (rendered)
...

### WhatsApp preview (excerpt)
...

### Telegram preview (excerpt)
...

## Failures & next steps
- ...
```

## Demo template structure (reference)

The seed script creates blocks in this order (partition ensures header/footer position):

1. **Header** — logo Resend + `{{ t.greeting }}`
2. **Content** — Liquid i18n block (`EXAMPLE_CONTENT_BLOCK`)
3. **Button** — `{{ t.cta }}`
4. **Divider**
5. **Text** — locale indicator
6. **Footer** — unsubscribe + privacy

## When things fail

| Symptom | Fix |
|---------|-----|
| Empty templates | `npm run db:migrate` |
| Demo already exists | Delete "Demo — Campanha multicanal" then re-seed |
| Build fails | Check TypeScript errors, run `npm run build` |
| Preview empty | Blocks array empty; use seeded template |
| Campaign 404 template | Template archived — restore first |
| Analytics empty | Run `npm run db:seed-demo` |

## Optional: live send test

Only if user provides `RESEND_API_KEY`:

```bash
# Send real email to test address
curl -X POST "$BASE/api/campaigns" \
  -H "Content-Type: application/json" \
  -d '{"name":"Live E2E","templateId":"'$TEMPLATE_ID'","channel":"email","contactIds":["'$CONTACT_ID'"]}'
```

Report `status: sent` vs `demo` in results.

## Do not

- Commit real API keys
- Delete user data without confirmation
- Skip build before reporting success
