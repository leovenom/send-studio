# Vercel deployment notes

## next.config

Default Next.js 16 config — no special output mode needed.

## Serverless limits

- API routes run as serverless functions
- SQLite `file:local.db` **does not persist** — use Turso
- Cold starts may add latency to first API call

## Environment variables

Set in Vercel dashboard for **Production** (and **Preview** if you test previews there):

| Variable | Required | Notes |
|----------|----------|-------|
| `STUDIO_ACCESS_TOKEN` | **Yes (prod)** | `openssl rand -hex 32` — protects all `/api/*` |
| `DATABASE_URL` | Yes (prod) | `libsql://...` — not `file:local.db` |
| `DATABASE_AUTH_TOKEN` | Yes (prod) | Turso token |
| `RESEND_API_KEY` | For email | |
| `RESEND_FROM_EMAIL` | For email | Verified domain |
| `RESEND_WEBHOOK_SECRET` | **Yes (prod)** | From Resend webhook; Svix verification |
| `SITE_URL` | Recommended | `https://your-domain.com` — honeypot + OG (Config, server-only) |
| `OPENAI_API_KEY` | Optional | AI template generation |
| `OPENAI_MODEL` | Optional | Default `gpt-4o-mini` |
| `WHATSAPP_TOKEN` | Optional | |
| `WHATSAPP_PHONE_NUMBER_ID` | Optional | |
| `TELEGRAM_BOT_TOKEN` | Optional | |

**Do not** expose `STUDIO_ACCESS_TOKEN` as `NEXT_PUBLIC_*`.

### Auth flow in production

1. Deploy with `STUDIO_ACCESS_TOKEN` set
2. Open `https://<domain>/login`
3. Paste token → httpOnly cookie for 7 days
4. UI uses `apiFetch` with credentials; 401 redirects to `/login`

Public routes (no token): `/api/webhooks/resend`, `/api/track/h/*`, `/api/auth/login`, `/api/auth/logout`

## GitHub integration

1. Push repo to GitHub
2. Import in Vercel
3. Auto-deploy on push to `main`

## Custom domain

Vercel → Project → Settings → Domains

Update Resend webhook URL after domain change.

## Build settings

```
Install: npm install
Build: npm run build
```

No `vercel.json` required for standard Next.js App Router.
