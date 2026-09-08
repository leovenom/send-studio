---
name: send-studio-bug-security
description: >-
  Finds bugs, logic errors, and security issues in Send Studio — XSS, injection,
  auth gaps, API validation, webhook verification, secret leaks, and multi-channel
  edge cases. Use when the user asks for bug hunt, security review, vulnerability
  scan, or "agente de bugs/segurança" for send-studio.
---

# Send Studio — Bug & Security Review Agent

## Mission

Systematically hunt bugs and security issues in Send Studio. Output a prioritized findings report with reproduction steps and fix suggestions.

## Workflow

```
Bug & security audit:
- [ ] 1. Run build + lint
- [ ] 2. Scan API routes for validation gaps
- [ ] 3. Check XSS / HTML injection surfaces
- [ ] 4. Verify webhook & secret handling
- [ ] 5. Test auth/authorization (expect none — flag if needed for prod)
- [ ] 6. Review Liquid/template injection
- [ ] 7. Check multi-channel edge cases
- [ ] 8. Inspect DB delete/archive cascades
- [ ] 9. Search for hardcoded secrets
- [ ] 10. Write report
```

## Commands to run first

```bash
cd ~/send-studio   # or project root
npm run build
npm run lint
rg -n "process\.env|API_KEY|SECRET|password|token" src/ --glob '!*.example'
rg -n "dangerouslySetInnerHTML|eval\(|innerHTML" src/
```

## Security checklist

### API routes (`src/app/api/`)

| Route | Checks |
|-------|--------|
| `templates/*` | Zod on blocks; DELETE without auth — OK for demo, flag for prod |
| `campaigns` | Template archived guard; contactIds validation; no rate limit |
| `preview` | User-supplied Liquid/HTML — SSRF via image URLs? |
| `webhooks/resend` | Signature verification with `RESEND_WEBHOOK_SECRET` |
| `contacts/*` | Email uniqueness; PII in responses |
| `templates/generate` | Image URL fetch — SSRF risk if user URL passed to OpenAI |

### XSS surfaces

- `channel-preview.tsx` — `dangerouslySetInnerHTML` for Telegram preview (client-only, sandboxed UI — low risk but document)
- `blocksToTelegramHtml` — user Liquid in `content` blocks passed to Telegram
- Email HTML — inline styles OK; script tags should be stripped or blocked

### Liquid injection

- Liquid runs server-side with `liquidjs` — check for filesystem/tags access
- `{% include %}`, raw tags — restrict if enabled

### Secrets

- `getResend()` lazy init — no key at build time ✓
- `.env` not committed ✓
- Client bundles must not import `resend.ts`, `send.ts` with tokens

### Data integrity

- Delete template with active campaigns — FK behavior?
- Delete campaign — orphaned `emails` / `messages`?
- Archive template still referenced by old campaigns

### Multi-channel bugs

- WhatsApp 4096 char limit — truncation?
- Telegram HTML parse errors — fallback?
- `partitionBlocks` — multiple headers/footers?
- Locale missing on contact — default locale applied?

## Bug hunt patterns

Search for common issues:

```bash
rg -n "catch \{\}|catch \{\ /\* exists \*\/ \}" src/ scripts/
rg -n "\.parse\(JSON" src/
rg -n "as any|@ts-ignore" src/
rg -n "fetch\(.*req\.json" src/app/api/
```

Manual review targets:
- `block-editor.tsx` drag zones — block type escape?
- `campaigns/page.tsx` — empty template list, archived filter
- `blocks-to-text.ts` — `content` block HTML stripping incomplete?

## Report template

```markdown
# Bug & Security Report — Send Studio

## Summary
[Critical / High / Medium / Low counts]

## Critical 🔴
### [Title]
- **Location**: `path:line`
- **Issue**: ...
- **Impact**: ...
- **Repro**: ...
- **Fix**: ...

## High 🟠
...

## Medium 🟡 / Low 🟢
...

## Security posture (demo vs production)
| Area | Current | Production recommendation |
|------|---------|---------------------------|
| Auth | None | Add ... |
| Rate limiting | None | Add ... |

## Verified clean
- ...
```

## Severity

- **Critical**: exploitable without auth, data breach, RCE, secret leak
- **High**: logic bug causing wrong sends, data loss, broken core flow
- **Medium**: edge case, poor error handling, missing validation
- **Low**: UX bug, minor inconsistency

## Fix policy

- Report first; only fix if user asks
- Minimal diffs; match existing patterns
- Never commit `.env` or real API keys

## Detailed checklist

See [checklist.md](checklist.md) for file-by-file review items.
