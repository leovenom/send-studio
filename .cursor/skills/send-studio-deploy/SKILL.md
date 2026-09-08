---
name: send-studio-deploy
description: >-
  Deploys Send Studio to production — Vercel, Turso database, Resend domain/API,
  env vars, webhooks, and post-deploy smoke tests. Use when the user asks to
  deploy, setup production, Vercel, Turso, or "agente de deploy".
---

# Send Studio — Deploy Agent

## Mission

Guide and execute production deployment: Vercel + Turso + Resend + optional WhatsApp/Telegram/OpenAI.

## Pre-deploy checklist

```
Deploy checklist:
- [ ] 1. Build passes locally (npm run build)
- [ ] 2. Git repo pushed to GitHub
- [ ] 3. Turso database created
- [ ] 4. Env vars documented and set in Vercel
- [ ] 5. Resend domain verified
- [ ] 6. Webhook URL configured in Resend
- [ ] 7. Deploy to Vercel
- [ ] 8. Run db:migrate against Turso
- [ ] 9. Post-deploy smoke test
```

## Step 1 — Turso (production DB)

```bash
# Install Turso CLI if needed: https://docs.turso.tech/cli
turso db create send-studio
turso db show send-studio --url
turso db tokens create send-studio
```

Vercel env vars:
```
DATABASE_URL=libsql://send-studio-<org>.turso.io
DATABASE_AUTH_TOKEN=<token>
```

Run migration after first deploy:
```bash
DATABASE_URL=libsql://... DATABASE_AUTH_TOKEN=... npm run db:migrate
```

## Step 2 — Resend

1. Create API key at https://resend.com/api-keys
2. Verify sending domain (or use `onboarding@resend.dev` for testing)
3. Set env vars:

```
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL="Send Studio <noreply@yourdomain.com>"
```

4. Create webhook pointing to:
```
https://<your-vercel-domain>/api/webhooks/resend
```

Events: `email.sent`, `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained`

```
RESEND_WEBHOOK_SECRET=whsec_...
```

## Step 3 — Optional integrations

```
OPENAI_API_KEY=sk-...          # AI template generation
OPENAI_MODEL=gpt-4o-mini
WHATSAPP_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
TELEGRAM_BOT_TOKEN=...
```

## Step 4 — Vercel deploy

```bash
# From project root
npx vercel --prod
# Or connect GitHub repo in Vercel dashboard
```

Framework preset: **Next.js**
Build command: `npm run build`
Output: default

Add all env vars in Vercel → Settings → Environment Variables (Production + Preview).

## Step 5 — Post-deploy smoke test

Replace `BASE` and `TOKEN` with your production URL and `STUDIO_ACCESS_TOKEN`.

```bash
BASE=https://your-app.vercel.app
TOKEN=<STUDIO_ACCESS_TOKEN>
AUTH="Authorization: Bearer $TOKEN"

# 1. Login page
curl -s -o /dev/null -w "%{http_code}" "$BASE/login"   # expect 200

# 2. API without auth → 401
curl -s -o /dev/null -w "%{http_code}" "$BASE/api/templates"   # expect 401

# 3. API with auth
curl -s -H "$AUTH" "$BASE/api/templates" | head -c 200

# 4. Preview
curl -s -X POST "$BASE/api/preview" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d '{"blocks":[],"subject":"Test","locale":"en"}'

# 5. Webhook endpoint (unsigned → 401 in prod if secret set)
curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/webhooks/resend" \
  -H "Content-Type: application/json" \
  -d '{"type":"email.sent","data":{"email_id":"test"}}'
```

Browser:
- `/login` → enter token → redirect to dashboard
- `/`, `/templates`, `/campaigns`, `/analytics` — load after login
- Send test campaign to your own email

Optional seed:
```bash
DATABASE_URL=libsql://... DATABASE_AUTH_TOKEN=... npm run db:seed-demo
```

## Common issues

| Issue | Fix |
|-------|-----|
| Build fails on Vercel | Check Node 20+, run `npm run build` locally |
| DB connection error | Turso URL + token in Vercel env |
| Emails not sending | Verify domain in Resend, check `RESEND_FROM_EMAIL` |
| Webhooks 400 | Set `RESEND_WEBHOOK_SECRET`, check svix headers |
| Analytics empty | Webhook not configured or no real sends yet |
| SQLite file in prod | Must use Turso — `file:local.db` won't persist on Vercel |

## Security for production

**Required before public production:**

| Control | Env / config | Status in codebase |
|---------|----------------|-------------------|
| API auth | `STUDIO_ACCESS_TOKEN` | Proxy protects `/api/*`; login at `/login` |
| Webhook signature | `RESEND_WEBHOOK_SECRET` | Required when `NODE_ENV=production` or `VERCEL` |
| Rate limiting | — | campaigns, generate, import, honeypot pixel |
| Security headers | `next.config.ts` | X-Frame-Options, nosniff, etc. |

Generate access token:
```bash
openssl rand -hex 32
```

Set as `STUDIO_ACCESS_TOKEN` in Vercel. After deploy, sign in at `https://<domain>/login`.

API scripts must send:
```bash
curl -H "Authorization: Bearer $STUDIO_ACCESS_TOKEN" https://<domain>/api/templates
```

## Report template

```markdown
# Deploy Report — Send Studio

## Target
- URL: ...
- Provider: Vercel + Turso

## Env vars configured
| Variable | Set? |
|----------|------|
| DATABASE_URL | |
| RESEND_API_KEY | |
| ... | |

## Steps completed
- [ ] Turso migrated
- [ ] Vercel deployed
- [ ] Resend webhook active
- [ ] Test email sent

## Blockers
- ...
```

See [vercel.md](vercel.md) for Vercel-specific notes.
