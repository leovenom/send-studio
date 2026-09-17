# Franklyn → Send Studio (lead ingestion)

Franklyn (`franklyn-web`) sends new leads to Send Studio after diagnosis / contact flows.

## Endpoint

```
POST https://send-studio.vercel.app/api/contacts
Authorization: Bearer {STUDIO_ACCESS_TOKEN}
Content-Type: application/json
```

## Body

```json
{
  "email": "lead@exemplo.pt",
  "name": "Nome ou derivado do email",
  "company": "Franklyn · diagnostico · /",
  "locale": "pt-BR"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `email` | Yes | Unique key; re-post updates the same contact (200) |
| `name` | Yes | Display name |
| `company` | No | Franklyn uses this for source/path metadata |
| `locale` | No | `pt-BR` (default), `en`, or `es` |

## Responses

| Status | Meaning |
|--------|---------|
| `201` | New contact created |
| `200` | Email already exists; record updated |
| `401` | Missing or invalid Bearer token |
| `400` | Validation error (invalid email, empty name) |
| `429` | Rate limit (120 req/min per IP when authenticated) |

## Vercel

Set on **Production** (project `send-studio`):

- `STUDIO_ACCESS_TOKEN` — same value as in Franklyn env

After changing the token, redeploy Send Studio. Franklyn must use the same Bearer value.

## Smoke test

```bash
curl -sS -X POST "https://send-studio.vercel.app/api/contacts" \
  -H "Authorization: Bearer $STUDIO_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"lead@exemplo.pt","name":"Lead Test","company":"Franklyn · test · /","locale":"pt-BR"}'
```

Leads appear in **Send Studio → Contacts**.
