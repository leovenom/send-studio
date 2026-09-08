# File-by-file review checklist

## `src/lib/blocks.ts`
- [ ] All block types rendered in `blocksToHtml`
- [ ] `partitionBlocks` handles empty/missing types
- [ ] Image URLs validated or escaped
- [ ] Liquid errors don't crash render

## `src/lib/email-shell.ts`
- [ ] Media queries safe for Gmail/Outlook
- [ ] No external script tags
- [ ] Max width / table layout fallbacks

## `src/lib/liquid.ts`
- [ ] Context scoped — no arbitrary object access
- [ ] Subject render escapes HTML where needed

## `src/lib/messaging/send.ts`
- [ ] Token from env only
- [ ] Error paths update DB status
- [ ] Demo mode clearly labeled

## `src/lib/messaging/blocks-to-text.ts`
- [ ] HTML stripped from content blocks for WhatsApp
- [ ] Telegram `esc()` on user text; raw HTML in content block?
- [ ] URL injection in `<a href="">`

## `src/app/api/webhooks/resend/route.ts`
- [ ] Signature verified before processing
- [ ] Idempotent event handling
- [ ] Invalid payload rejected with 400

## `src/app/api/campaigns/route.ts`
- [ ] Archived template blocked
- [ ] Partial send failure handling
- [ ] Campaign status always updated

## `src/components/templates/channel-preview.tsx`
- [ ] Telegram preview XSS (client display only)
- [ ] WhatsApp bold parsing edge cases

## `scripts/migrate.ts`
- [ ] ALTER TABLE failures swallowed — columns exist?
- [ ] Seed data valid JSON blocks

## Client pages
- [ ] No secrets in client components
- [ ] Confirm dialogs on destructive actions
- [ ] Loading/error states on fetch failures
