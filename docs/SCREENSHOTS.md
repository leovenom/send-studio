# Screenshot guide (portfolio)

Screenshots live in [`public/screenshots/`](../public/screenshots/) and are referenced from the README.

## Current assets

| File | Page | What to show |
|------|------|----------------|
| `block-editor.png` | `/templates/[id]` | Block palette, structure, live mobile preview |
| `analytics.png` | `/analytics` | KPI cards, funnel, human vs bot |
| `campaigns.png` | `/campaigns` | Multi-channel send + campaign history |

## Re-capture (recommended before deploy)

1. **Seed demo data**
   ```bash
   npm run db:migrate
   npm run db:seed-demo -- --force
   npm run simulate:webhook
   ```

2. **Start dev server**
   ```bash
   npm run dev
   ```

3. **Switch UI to English** (recommended for international recruiters)  
   Sidebar → **Settings** → Language → **EN**

4. **Capture at 1440×900** (Chrome DevTools device or full window)

   | URL | Save as |
   |-----|---------|
   | `http://localhost:3000/templates/<demo-id>` | `block-editor.png` |
   | `http://localhost:3000/analytics` | `analytics.png` |
   | `http://localhost:3000/campaigns` | `campaigns.png` |

5. **Replace files** in `public/screenshots/` and commit.

## Tips for job applications

- Use **EN locale** if applying to US/EU companies.
- Analytics looks best **after** `npm run simulate:webhook`.
- Crop sensitive data (real emails) if using production data.
- Keep sidebar visible — shows full product, not just a component.

## Optional extras

- `templates.png` — template library + “New template” card
- `dashboard.png` — stat cards + recent activity
- `generate-ai.png` — AI template variations picker
