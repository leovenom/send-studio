# Translation keys inventory

All keys must exist in `pt-BR`, `en`, and `es`:

| Key | Used in |
|-----|---------|
| `welcome` | Subject snippets, cheatsheet |
| `greeting` | Header subtitle default |
| `body` | Text block default, content block |
| `cta` | Button default |
| `footer` | Footer text, content block |
| `unsubscribe` | Footer unsubscribe link text |
| `subject_welcome` | Demo template subject |

## Locale values

- `pt-BR` — Portuguese (Brazil)
- `en` — English (fallback)
- `es` — Spanish

## Fallback chain

1. `contact.locale` from DB
2. `locale` param in preview API
3. `normalizeLocale()` → invalid becomes `en`
4. `getTranslations()` → unknown locale uses `en` object

## Liquid context shape

```json
{
  "contact": { "name", "email", "company", "locale" },
  "locale": "pt-BR",
  "t": { "welcome": "Olá", ... }
}
```

Custom filter `t` registered in `liquid.ts` — prefer `{{ t.welcome }}` over `{{ t.welcome | t: locale }}` in simple cases since `t` object is pre-loaded in context.
