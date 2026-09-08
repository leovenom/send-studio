---
name: send-studio-accessibility
description: >-
  Audits Send Studio UI accessibility — keyboard navigation, drag-and-drop a11y,
  color contrast, labels, focus states, and screen reader compatibility in the
  block editor and CRM pages. Use when the user asks for a11y review, WCAG,
  accessibility audit, or "agente de acessibilidade".
---

# Send Studio — Accessibility Agent

## Mission

Audit UI accessibility (WCAG 2.1 AA target) and produce actionable fixes for the block editor and CRM interface.

## Scope

| Area | Files |
|------|-------|
| Block editor | `src/components/templates/block-editor.tsx` |
| Preview | `channel-preview.tsx`, `responsive-preview.tsx` |
| Forms | `campaigns/page.tsx`, `contacts/page.tsx`, `templates/[id]/page.tsx` |
| Layout | `app-shell.tsx`, `sidebar.tsx` |
| UI primitives | `button.tsx`, `input.tsx`, `select.tsx`, `badge.tsx` |

## Workflow

```
Accessibility audit:
- [ ] 1. Keyboard-only navigation test
- [ ] 2. Focus visibility on all interactive elements
- [ ] 3. Label/input associations
- [ ] 4. Color contrast (text, badges, buttons)
- [ ] 5. Drag-and-drop keyboard alternative
- [ ] 6. Icon-only buttons (aria-label)
- [ ] 7. Preview iframe / channel tabs
- [ ] 8. Empty states and loading states
- [ ] 9. Write report with WCAG references
```

## Checklist by component

### Block editor (`block-editor.tsx`)

| Check | Current risk | WCAG |
|-------|--------------|------|
| Drag handle keyboard accessible | dnd-kit has KeyboardSensor ✓ | 2.1.1 |
| Remove block button | Icon only — needs `aria-label="Remover bloco"` | 4.1.2 |
| Zone labels | Visual only — add `aria-labelledby` | 1.3.1 |
| Block order announced | No live region for reorder | 4.1.3 |
| Pin badge "fixo" | Decorative OK | |

### Channel preview tabs

| Check | Fix |
|-------|-----|
| Tab buttons | Add `role="tablist"`, `aria-selected` |
| Active tab | `aria-selected="true"` |
| Preview iframe | `title` present ✓ — verify descriptive |

### Campaigns contact picker

| Check | Fix |
|-------|-----|
| Toggle buttons | State not announced — add `aria-pressed` |
| Channel picker | Add `role="radiogroup"` + `aria-checked` |
| Select all | Link styled button — OK if focusable |

### Forms

| Check | Fix |
|-------|-----|
| `<Label>` + `<Input>` | Verify `htmlFor`/`id` pairs in FieldGroup |
| Required fields | Add `aria-required` or visible indicator |
| Error messages | Link with `aria-describedby` when validation fails |

### Sidebar navigation

| Check | Fix |
|-------|-----|
| Current page indicator | `aria-current="page"` on active link |
| Skip to content | Missing — recommend skip link |

### Color contrast

Test with browser DevTools or:
- Muted text (`text-muted`) on `bg-accent` backgrounds
- Badge variants on light/dark mode
- Selected contact row: `bg-foreground text-background` — verify contrast
- WhatsApp/Telegram preview mockups — decorative, lower priority

Target: **4.5:1** normal text, **3:1** large text/UI components.

## Manual test procedure

1. Tab through `/templates/[id]` without mouse — can reach all blocks, save, palette?
2. Tab through `/campaigns` — select channel, contacts, submit?
3. Toggle dark mode (if available) — contrast still OK?
4. Zoom 200% — layout doesn't break?
5. Screen reader (VoiceOver/NVDA): block type announced?

## Report template

```markdown
# Accessibility Report — Send Studio

## Summary
- WCAG target: AA
- Critical issues: N
- Pages tested: ...

## Critical (blocks usage)
### [Issue]
- **Location**: ...
- **WCAG**: 2.x.x
- **Impact**: ...
- **Fix**: ...

## Serious / Moderate / Minor

## Passed checks
- KeyboardSensor in dnd-kit
- iframe title on email preview
- ...

## Recommended fixes (priority order)
1. Add aria-label to icon buttons
2. ...
```

## Fix policy

- Prefer semantic HTML over ARIA hacks
- Match existing Tailwind patterns
- Don't break drag-and-drop for mouse users
- Add `sr-only` text where visual labels missing

See [wcag-map.md](wcag-map.md) for criterion mapping.
