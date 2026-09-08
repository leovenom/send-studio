---
name: send-studio-architecture
description: >-
  Audits Send Studio architecture — Next.js app layers, data flow, multi-channel
  messaging, block editor, Liquid/i18n, and Resend integration. Use when the user
  asks for architecture review, system design audit, structural analysis, or
  "agente de arquitetura" for send-studio.
---

# Send Studio — Architecture Review Agent

## Mission

Produce a structured architecture audit of **Send Studio** (`send-studio`): boundaries, data flow, coupling, scalability risks, and concrete improvements — without rewriting working code unless asked.

## Project map (read first)

| Layer | Path | Role |
|-------|------|------|
| App routes | `src/app/` | Pages + API routes |
| UI | `src/components/` | Block editor, preview, layout |
| Domain | `src/lib/blocks.ts` | Block model, `partitionBlocks`, `blocksToHtml` |
| Email shell | `src/lib/email-shell.ts` | Responsive HTML wrapper |
| Liquid/i18n | `src/lib/liquid.ts`, `src/lib/i18n.ts` | Template rendering + locales |
| Messaging | `src/lib/messaging/` | WhatsApp, Telegram, plain-text adapters |
| DB | `src/lib/db/schema.ts` | SQLite/Turso via Drizzle |
| Integrations | `src/lib/resend.ts`, `src/lib/ai/` | Resend API, OpenAI templates |

## Review workflow

Copy and track:

```
Architecture audit:
- [ ] 1. Map request flows (UI → API → lib → DB → external)
- [ ] 2. Check client/server boundaries ("use client", API-only secrets)
- [ ] 3. Evaluate block pipeline (editor → partition → channel adapters)
- [ ] 4. Review data model (templates, campaigns, messages, emails)
- [ ] 5. Assess multi-channel consistency (email vs WhatsApp vs Telegram)
- [ ] 6. Identify coupling, duplication, missing abstractions
- [ ] 7. Scalability & ops (SQLite local vs Turso prod, webhooks)
- [ ] 8. Write report with severity-tagged findings
```

### Step 1 — Trace critical flows

Document these end-to-end:

1. **Template save**: `templates/[id]/page.tsx` → `PATCH /api/templates/[id]` → `blocks` JSON in DB
2. **Preview**: `block-preview.tsx` → `POST /api/preview` → `blocksToHtml` + `blocksToPlainText` + `blocksToTelegramHtml`
3. **Campaign send**: `campaigns/page.tsx` → `POST /api/campaigns` → channel branch → Resend / WhatsApp / Telegram
4. **Webhooks**: `POST /api/webhooks/resend` → `email_events` + status updates
5. **AI generate**: `POST /api/templates/generate` → OpenAI or fallback layouts

Draw a simple mermaid diagram when helpful.

### Step 2 — Boundary checks

- Secrets only in server routes (`RESEND_API_KEY`, `OPENAI_API_KEY`, tokens)
- `channels.ts` vs `blocks-to-text.ts` split (client-safe vs server)
- Zod validation on every API input
- Template `status` (active/archived) enforced on campaign create

### Step 3 — Block architecture

Verify:
- `partitionBlocks()` — header top, footer bottom, middle ordered
- Single source of truth for block types (`BLOCK_TYPES`, `BLOCK_DEFINITIONS`)
- Channel adapters don't drift from email block semantics

### Step 4 — Data model

Tables: `contacts`, `templates`, `campaigns`, `emails`, `messages`, `email_events`.

Check: FK integrity, archive semantics, orphaned records on delete, JSON `blocks` vs normalized schema tradeoff.

### Step 5 — Multi-channel

| Channel | Format | Adapter |
|---------|--------|---------|
| Email | HTML + inline CSS | `blocksToHtml` + `email-shell.ts` |
| WhatsApp | Plain text + `*bold*` | `blocksToPlainText` |
| Telegram | Subset HTML | `blocksToTelegramHtml` |

Flag gaps: images, Liquid in `content` blocks, preview parity.

## Report template

```markdown
# Architecture Review — Send Studio

## Executive summary
[2–3 sentences]

## System diagram
[mermaid or ascii]

## Strengths
- ...

## Findings

### Critical
- ...

### High
- ...

### Medium / Low
- ...

## Recommendations (prioritized)
1. ...
2. ...

## Optional next steps
- ...
```

## Severity guide

- **Critical**: Security boundary break, data loss risk, broken core flow
- **High**: Architectural debt blocking features or scale
- **Medium**: Maintainability, duplication, unclear ownership
- **Low**: Naming, minor consistency

## Do not

- Propose microservices or rewrites without justification
- Ignore existing conventions (Next.js App Router, Drizzle, Tailwind 4)
- Skip reading `src/lib/blocks.ts` and `src/lib/db/schema.ts`

## Additional context

See [reference.md](reference.md) for intended architecture decisions.
