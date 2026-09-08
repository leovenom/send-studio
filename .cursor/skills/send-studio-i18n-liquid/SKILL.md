---
name: send-studio-i18n-liquid
description: >-
  Validates Send Studio i18n (pt-BR, en, es) and Liquid templates — translation
  key parity, locale fallbacks, channel-specific rendering, and content block
  correctness. Use when the user asks for i18n review, Liquid validation, locale
  testing, or "agente i18n/Liquid".
---

# Send Studio — i18n & Liquid Agent

## Mission

Ensure translations and Liquid templates work correctly across all locales and channels (email, WhatsApp, Telegram).

## Key files

| File | Role |
|------|------|
| `src/lib/i18n.ts` | Locales, `translations`, `EXAMPLE_CONTENT_BLOCK` |
| `src/lib/liquid.ts` | Liquid engine, `buildLiquidContext`, `renderLiquid` |
| `src/lib/messaging/blocks-to-text.ts` | Plain text / Telegram adapters |
| `src/app/api/preview/route.ts` | Preview with locale param |

## Workflow

```
i18n/Liquid audit:
- [ ] 1. Verify translation key parity (pt-BR, en, es)
- [ ] 2. Test each locale via POST /api/preview
- [ ] 3. Check Liquid in subject, blocks, content block
- [ ] 4. Validate fallback when locale missing/invalid
- [ ] 5. Compare email vs WhatsApp vs Telegram output per locale
- [ ] 6. Run npm run validate:i18n (if available)
- [ ] 7. Write report
```

## Step 1 — Translation parity

All keys in `translations["pt-BR"]` must exist in `en` and `es`:

```bash
npm run validate:i18n
```

Or manually compare keys in `src/lib/i18n.ts`. Flag:
- Missing keys in any locale
- Hardcoded strings in blocks that should use `{{ t.* }}`
- Subject lines not using translations

## Step 2 — Locale matrix test

For each locale (`pt-BR`, `en`, `es`, invalid `fr`):

```bash
BASE=http://localhost:3000
# Get demo template blocks first, then:
curl -s -X POST "$BASE/api/preview" \
  -H "Content-Type: application/json" \
  -d '{"blocks":[...],"subject":"{{ t.subject_welcome }}","locale":"pt-BR","contact":{"name":"Maria","locale":"pt-BR"}}'
```

Verify:
- `subject` renders with correct language
- `html` contains locale-appropriate text from `EXAMPLE_CONTENT_BLOCK`
- `whatsappText` uses `*bold*` for subject, plain body text
- `telegramHtml` has `<b>` tags, no raw CSS

## Step 3 — Liquid edge cases

Test these patterns in preview:

| Pattern | Expected |
|---------|----------|
| `{{ contact.name }}` | Substituted |
| `{{ t.missing_key }}` | Key shown or empty (document behavior) |
| `{% if contact.company != blank %}` | Conditional renders |
| `{% case contact.locale %}` | Correct branch |
| Invalid Liquid syntax | Falls back to raw template (see `liquid.ts` catch) |
| Empty block props | No crash |

## Step 4 — Channel i18n gaps

| Channel | i18n support | Gap to flag |
|---------|--------------|-------------|
| Email | Full Liquid + HTML | Best reference |
| WhatsApp | Text only, `*bold*` | Emojis OK, no HTML from content block |
| Telegram | Subset HTML | `content` block HTML may pass through raw |

Check `blocks-to-text.ts` — `content` block strips HTML for WhatsApp but not always for Telegram.

## Step 5 — Contact locale flow

Trace: `contacts.locale` → campaign send → `buildLiquidContext(contact)` → render.

- Default locale when null: `normalizeLocale` → `"en"`
- Preview selector in `block-preview.tsx` passes `locale` to API
- Campaign send uses contact's stored locale

## Report template

```markdown
# i18n & Liquid Report — Send Studio

## Translation coverage
| Key | pt-BR | en | es |
|-----|-------|----|----|
| welcome | ✓ | ✓ | ✓ |
| ... | | | |

## Locale preview results
| Locale | Subject | Email excerpt | WhatsApp | Telegram |
|--------|---------|---------------|----------|----------|
| pt-BR | | | | |
| en | | | | |
| es | | | | |

## Issues found
### Critical / High / Medium / Low

## Recommendations
1. Add missing keys: ...
2. Replace hardcoded strings in block defaults: ...
```

## Fix policy

- Add missing translation keys to all 3 locales together
- Prefer `{{ t.key }}` over duplicated locale branches when text is identical structure
- Keep `EXAMPLE_CONTENT_BLOCK` as reference for complex `{% case %}` patterns

See [locales.md](locales.md) for key inventory.
