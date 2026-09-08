<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Send Studio — Agentes especializados

Este projeto inclui **8 agent skills** em `.cursor/skills/`. Invoca cada um pelo nome ou pedindo explicitamente:

| Agente | Skill | Quando usar |
|--------|-------|-------------|
| **Arquitetura** | `send-studio-architecture` | Camadas, fluxos, acoplamento, escalabilidade |
| **Bugs & Segurança** | `send-studio-bug-security` | Bugs, XSS, APIs, webhooks, secrets |
| **E2E & Demo** | `send-studio-e2e-demo` | Testar tudo, seed demo, validar previews |
| **i18n / Liquid** | `send-studio-i18n-liquid` | Traduções pt-BR/en/es, tags Liquid, locales |
| **Deploy** | `send-studio-deploy` | Vercel + Turso + Resend + env vars |
| **Performance** | `send-studio-performance` | Bundle, latência API, preview iframe |
| **Acessibilidade** | `send-studio-accessibility` | WCAG, teclado, contraste, screen readers |
| **Webhook / Analytics** | `send-studio-webhook-analytics` | Simular eventos Resend, validar métricas |

## Como invocar no Cursor

```
Use a skill send-studio-architecture e faça uma auditoria completa
```

```
Rode send-studio-bug-security neste projeto
```

```
Use send-studio-e2e-demo: seed demo, teste APIs e mostre resultados
```

```
Use send-studio-i18n-liquid para validar todas as traduções
```

```
Use send-studio-deploy para preparar produção no Vercel
```

```
Use send-studio-performance e meça latência do preview
```

```
Use send-studio-accessibility e audite o block editor
```

```
Use send-studio-webhook-analytics e simule eventos Resend
```

## Scripts úteis

```bash
npm run db:migrate          # Schema + seed base
npm run db:seed-demo        # Template + campanhas demo + analytics
npm run validate:i18n       # Paridade de chaves pt-BR / en / es
npm run simulate:webhook    # Simula sent/delivered/opened/clicked
```

## Demo rápida

```bash
npm run db:migrate
npm run db:seed-demo
npm run dev
# Em outro terminal:
npm run simulate:webhook
```

Abra `/templates`, `/campaigns`, `/analytics`.

## Mapa do projeto

```
src/app/              → páginas + API routes
src/components/       → block editor, previews, layout
src/lib/blocks.ts     → blocos + render email
src/lib/i18n.ts       → traduções + EXAMPLE_CONTENT_BLOCK
src/lib/liquid.ts       → engine Liquid
src/lib/messaging/      → WhatsApp / Telegram
src/lib/queries.ts      → analytics queries
scripts/              → migrate, seed, validate-i18n, simulate-webhook
.cursor/skills/       → definições dos 8 agentes
```

## Suite completa (ordem sugerida)

1. `send-studio-architecture` — entender o sistema
2. `send-studio-i18n-liquid` — validar conteúdo multilíngue
3. `send-studio-e2e-demo` — seed + smoke tests
4. `send-studio-webhook-analytics` — pipeline de métricas
5. `send-studio-bug-security` — caça a problemas
6. `send-studio-accessibility` — UI inclusiva
7. `send-studio-performance` — otimizações
8. `send-studio-deploy` — produção
