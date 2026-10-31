# Milestone 2 — Affiliate catalog

## Goal

Online-only shoppable products in Postgres: schema, offline ingest, `GET /api/catalog`. Chat prefers affiliate rows; DeepFashion remains imagery fallback. **No cart / checkout** (Milestone 3).

## What shipped

| Piece | Location |
|--------|----------|
| `products` table | `shared/schema.ts` |
| Storage list/upsert | `server/storage.ts` |
| Intent-aware search | `server/services/catalog.ts` |
| Demo feed | `server/fixtures/affiliate-products.json` |
| Ingest | `npm run catalog:ingest` → `server/scripts/ingestCatalog.ts` |
| API | `GET /api/catalog` |
| Chat prefer-catalog | `fashionAi.ts` / `fashionData.ts` via `resolveOutfitSuggestions` |

## Setup

```bash
npm run docker:db
# ensure DATABASE_URL in .env points at Compose Postgres
npm run db:push
npm run catalog:ingest
npm run dev
```

**Port conflict:** a local Postgres (e.g. Homebrew `postgresql@15`) often owns `localhost:5432`, so Node hits the wrong server and reports `role "vesta" does not exist`. Publish Compose Postgres on another host port instead of stopping it:

```env
POSTGRES_HOST_PORT=5433
DATABASE_URL=postgresql://vesta:vesta@127.0.0.1:5433/vesta_ai
```

`docker-compose.yml` reads `POSTGRES_HOST_PORT` (default `5432`), so `npm run docker:db` then binds `5433 → 5432`.

Optional custom feed: `AFFILIATE_FEED_PATH=/path/to/feed.json npm run catalog:ingest`

## API

`GET /api/catalog?audience=feminine&category=bottom&color=navy&style=casual&search=jeans&limit=24&offset=0`

Also accepts `gender` as alias for `audience`.

Response includes `affiliateUrl`, `priceCents`, `merchant` — browse only until M3.

## Acceptance

1. Ingest upserts fixture rows; re-run is idempotent on `(merchant, externalId)`.
2. Catalog filters return expected subsets (feminine excludes masculine products).
3. Chat clothing queries inject `source: "affiliate"` outfits when DB has matches; else DeepFashion.
4. Empty catalog does not crash; DeepFashion still works.
5. No cart UI or fake “Buy” CTA.

## Out of scope

Live partner feed auth, in-app cart, merchant checkout UI, Wardrobe/Trends Unsplash cleanup.
