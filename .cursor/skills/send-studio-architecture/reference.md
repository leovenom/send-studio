# Send Studio — Architecture Reference

## Design intent

Send Studio is a **portfolio-grade CRM + email builder** targeting Resend's Product Engineer role. It demonstrates:

- Visual block editor with drag-and-drop
- Liquid templating + i18n (pt-BR, en, es)
- Multi-channel delivery (Email, WhatsApp, Telegram) from one template
- Resend integration with webhooks and analytics
- AI template generation with offline fallback

## Layering rules

```
Pages (client)     → fetch API routes, no direct DB
API routes         → Zod validate → lib → db / external APIs
lib/               → pure domain + adapters, testable
components/        → UI only, receive props/callbacks
```

## Block pipeline

```
EmailBlock[] (stored JSON)
    ↓ partitionBlocks()
[headers, middle, footers]
    ↓ per channel
blocksToHtml      → wrapEmailHtml → Resend
blocksToPlainText → WhatsApp API / wa.me demo
blocksToTelegramHtml → Telegram Bot API (parse_mode HTML)
```

## Known tradeoffs (intentional)

- **Blocks as JSON** in SQLite — fast to ship, harder to query individual blocks
- **No auth** — demo/portfolio scope; flag if adding production
- **Demo mode** — sends without API keys return `status: demo`
- **Single-tenant** — no org/workspace model

## Extension points

- Add block type → `BLOCK_TYPES`, `BLOCK_DEFINITIONS`, render in `blocks.ts` + all three adapters
- New channel → adapter in `messaging/`, branch in `campaigns/route.ts`, preview tab in `channel-preview.tsx`
- New locale → `src/lib/i18n.ts` translations object

## Env dependencies

| Variable | Required for |
|----------|--------------|
| `RESEND_API_KEY` | Real email send |
| `RESEND_WEBHOOK_SECRET` | Webhook verification |
| `OPENAI_API_KEY` | AI generation (optional) |
| `WHATSAPP_*` | WhatsApp Cloud API |
| `TELEGRAM_BOT_TOKEN` | Telegram send |
| `DATABASE_URL` | SQLite local / Turso prod |
