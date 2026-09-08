---
name: send-studio-performance
description: >-
  Profiles Send Studio performance — Next.js build output, bundle size, API
  latency, preview iframe cost, and database query efficiency. Use when the
  user asks for performance audit, speed optimization, bundle analysis, or
  "agente de performance".
---

# Send Studio — Performance Agent

## Mission

Measure and report performance bottlenecks; suggest minimal, high-impact optimizations.

## Workflow

```
Performance audit:
- [ ] 1. Run production build, note compile time
- [ ] 2. Analyze bundle / route sizes
- [ ] 3. Measure API latency (preview, templates, campaigns)
- [ ] 4. Profile client pages (editor, preview iframe)
- [ ] 5. Review DB queries (N+1, missing indexes)
- [ ] 6. Check heavy dependencies (@dnd-kit, recharts, liquidjs)
- [ ] 7. Write report with metrics + recommendations
```

## Step 1 — Build analysis

```bash
npm run build
# Note: compile time, static vs dynamic routes
```

Inspect `.next/` output sizes:
```bash
du -sh .next/static/chunks/* 2>/dev/null | sort -hr | head -15
```

Heavy routes to watch:
- `/templates/[id]` — BlockEditor + dnd-kit + preview
- `/templates/generate` — AI + preview grid
- `/analytics` — Recharts

## Step 2 — API latency

With dev server running:

```bash
BASE=http://localhost:3000

# Preview (Liquid render — hottest path)
time curl -s -X POST "$BASE/api/preview" \
  -H "Content-Type: application/json" \
  -d @/tmp/preview-payload.json -o /dev/null

# Templates list
time curl -s "$BASE/api/templates" -o /dev/null

# Campaigns list (join)
time curl -s "$BASE/api/campaigns" -o /dev/null
```

Targets (local dev, indicative):
| Endpoint | Target |
|----------|--------|
| GET /api/templates | < 100ms |
| POST /api/preview | < 500ms (Liquid + HTML) |
| POST /api/campaigns | depends on contact count |

## Step 3 — Client performance

### Block editor (`block-editor.tsx`)
- dnd-kit sensors on every block — OK for <50 blocks
- Preview debounce 300ms in `block-preview.tsx` — good
- Re-render on every keystroke? Check if `onChange` triggers full preview

### Preview iframe (`responsive-preview.tsx`)
- Fixed height 500px iframe with `srcDoc` — re-parses HTML each update
- Consider: memoize html, reduce preview frequency for large templates

### Charts (`analytics/charts.tsx`)
- Recharts loaded on analytics page only — verify no barrel import on home

## Step 4 — Server / DB

Review `src/lib/queries.ts`:
- Analytics joins 3 tables — OK for demo scale
- No pagination on events list (limit 100) — flag for scale

SQLite/Turso:
- JSON `blocks` column — full parse on every template fetch
- Consider caching rendered HTML per template+locale if needed

## Step 5 — Dependency audit

| Package | Size impact | Note |
|---------|-------------|------|
| `@dnd-kit/*` | Medium | Editor only |
| `recharts` | Large | Lazy load if possible |
| `liquidjs` | Medium | Server-side preview |
| `openai` | Server only | OK |
| `@libsql/client` | Server only | OK |

```bash
npx depcheck 2>/dev/null || echo "install depcheck optional"
```

## Optimization recommendations (prioritized)

### Quick wins
1. Debounce preview already at 300ms — increase to 500ms for large templates if needed
2. Dynamic import Recharts on analytics page
3. `React.memo` on SortableBlockItem if profiling shows re-render cost

### Medium
1. Cache `blocksToHtml` result server-side (template id + locale hash)
2. Paginate campaigns/templates lists
3. Stream campaign sends instead of sequential loop

### Long-term
1. Edge-compatible DB reads for dashboard stats
2. Background job queue for bulk sends
3. Separate preview service if Liquid render becomes bottleneck

## Report template

```markdown
# Performance Report — Send Studio

## Build
- Compile time: ...
- Largest chunks: ...

## API latency (p50 / p95)
| Endpoint | ms |
|----------|-----|
| POST /api/preview | |
| GET /api/templates | |

## Findings
### High impact
- ...

## Recommendations
1. ...
```

## Do not

- Add Redis/caching infrastructure without user approval
- Micro-optimize before measuring
- Break preview accuracy for marginal gains
