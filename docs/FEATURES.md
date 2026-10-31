# Vesta AI — Implemented features

What exists today, phrased as user capabilities. A UX test guide will follow separately.

**Status legend**

| Status | Meaning |
|--------|---------|
| Live | Works end to end and is reachable in the UI |
| Demo | Works, but results are placeholder quality and labeled as such |
| Backend only | Implemented and callable via API, no UI yet |
| Placeholder | Screen exists with static content; no real data behind it |

---

## Chat & styling intelligence

| # | User can… | Status | Where |
|---|-----------|--------|-------|
| 1 | Ask open fashion questions and get styling advice | Live | `server/services/fashionAi.ts` |
| 2 | Ask what to **combine** with a garment and get complementary categories (tee → bottoms, shoes, bags) instead of more tops | Live | `fashionIntent.ts` (`combine`) |
| 3 | Ask for **similar** pieces and stay within the same garment category | Live | `fashionIntent.ts` (`similar`) |
| 4 | Ask for **color** advice and get a palette plus color-leaning looks | Live | `fashionIntent.ts` (`color`) |
| 5 | Ask for a **style/occasion** direction (office, casual, minimal) and get matching looks | Live | `fashionIntent.ts` (`style`) |
| 6 | Upload a clothing photo and get advice about that item (defaults to *combine* unless "similar" is asked) | Live | `useChat.ts` → `POST /api/chat` |
| 7 | Say who the outfit is for and **not** see the opposite gender's clothes — "outfits for women" excludes `MEN-` looks and masculine-coded captions (gentleman, guy, his) | Live | `detectAudience` / `itemMatchesAudience` |
| 8 | Get outfit images, color swatches, and accessories rendered together in a single reply | Live | `ChatBubble.tsx` |
| 9 | Keep chatting when the Anthropic API is down or out of quota (rule-based local fallback) | Live | `fashionData.ts` |
| 10 | Reopen past conversations from the history sidebar and start a new chat | Live | `HistorySidebar.tsx` |

Intent, audience, anchor garment, and target categories are returned in the reply's JSON block, so retrieval decisions are inspectable.

---

## Product catalog (affiliate, online-only)

No owned inventory. Checkout stays on the merchant; the in-app cart is Milestone 3.

| # | User / operator can… | Status | Where |
|---|-----------|--------|-------|
| 11 | Store affiliate products in Postgres (title, image, merchant, price, buy link, category, audience, colors, style tags) | Live | `shared/schema.ts` |
| 12 | Load a product feed offline with `npm run catalog:ingest`, re-runnable without duplicates | Live | `server/scripts/ingestCatalog.ts` |
| 13 | Point ingest at a custom feed via `AFFILIATE_FEED_PATH` | Live | same |
| 14 | Browse/filter the catalog by audience, category, color, style, free-text search, with paging | Backend only | `GET /api/catalog` |
| 15 | Receive shoppable affiliate products in chat instead of research imagery, when the catalog has matches | Live (data) | `resolveOutfitSuggestions` |
| 16 | Fall back to DeepFashion imagery automatically when the catalog is empty or filters miss | Live | `server/services/catalog.ts` |

**Known gap:** affiliate fields reach the client (`affiliateUrl`, `priceCents`, `merchant`, `source` on `FashionOutfit`) but **nothing renders them yet**. Outfit cards still show only image, name, description, and "Try it on" — no price, merchant, or buy link. `GET /api/catalog` also has no UI consumer. Both are Milestone 3 work.

---

## Imagery & retrieval

| # | User can… | Status | Where |
|---|-----------|--------|-------|
| 17 | See real garment photos from the local DeepFashion-MultiModal corpus rather than stock filler | Live | `server/services/deepFashion.ts` |
| 18 | Get looks filtered by garment role, color words, and style tags parsed from captions | Live | `searchDeepFashion` |
| 19 | Query DeepFashion outfits directly over HTTP | Backend only | `GET /api/recommendations` |

---

## Try-on

| # | User can… | Status | Where |
|---|-----------|--------|-------|
| 20 | Click "Try it on" on any outfit card, upload a photo, and see a composite result | Demo | `VirtualTryOn.tsx` |

Labeled as demo in the dialog title and an amber banner; requires `PYTHON_SERVICE_URL` (Compose profile `vto`) or it returns a setup message.

---

## Wardrobe, profile, trends

| # | User can… | Status | Where |
|---|-----------|--------|-------|
| 21 | Upload wardrobe items and see them as cards | Demo | `Wardrobe.tsx` — React state only, lost on refresh |
| 22 | View a profile preview (avatar, style preferences, favorite colors) | Placeholder | `Profile.tsx` — static, no editing |
| 23 | Browse trending styles and color trends | Placeholder | `Trends.tsx` — hardcoded, images currently broken |

Persistence for these lands in Milestones 5 and 6.

---

## Platform & operations

| # | Operator can… | Status | Where |
|---|-----------|--------|-------|
| 24 | Run Postgres, the API, and the try-on sidecar via Docker Compose profiles | Live | `docker-compose.yml` |
| 25 | Move Compose Postgres off a busy host port with `POSTGRES_HOST_PORT` | Live | same |
| 26 | Apply schema with `npm run db:push` (Drizzle) | Live | `shared/schema.ts` |
| 27 | Check liveness and config flags | Live | `GET /api/health` |
| 28 | Keep uploads local now and swap to S3 later behind one interface | Live | `objectStorage.ts` |
| 29 | Use chat without auth via a seeded local MVP user | Live | `ensureLocalUser` |

---

## Demo feed contents

`server/fixtures/affiliate-products.json` — 12 rows loaded by `npm run catalog:ingest`.

**These are not real products.** Images are Unsplash; every `affiliateUrl` is a placeholder `https://example.com/affiliate/...` that leads nowhere.

| externalId | Audience | Category | Title | Price | Colors | Style tags |
|---|---|---|---|---|---|---|
| `demo-w-tee-001` | feminine | top | Soft Cotton Crew Tee | $29.00 | white, cream | casual, minimal |
| `demo-w-jeans-001` | feminine | bottom | High-Rise Straight Jeans | $78.00 | blue, navy, denim | casual |
| `demo-w-skirt-001` | feminine | bottom | Pleated Midi Skirt | $64.00 | beige, cream | office, elegant, minimal |
| `demo-w-blazer-001` | feminine | outerwear | Structured Navy Blazer | $128.00 | navy, blue | office, formal, business, minimal |
| `demo-w-dress-001` | feminine | dress | Black Wrap Dress | $98.00 | black | elegant, party, formal |
| `demo-w-tote-001` | feminine | bag | Canvas Everyday Tote | $45.00 | beige, brown | casual, office |
| `demo-m-oxford-001` | masculine | top | Oxford Button-Down Shirt | $59.00 | blue, navy | office, formal, business |
| `demo-m-chinos-001` | masculine | bottom | Slim Khaki Chinos | $72.00 | khaki, beige | casual, office |
| `demo-m-sneakers-001` | masculine | shoes | Grey Runner Sneakers | $95.00 | grey, gray | casual, sporty |
| `demo-m-jacket-001` | masculine | outerwear | Olive Field Jacket | $145.00 | olive, green | casual, weekend |
| `demo-w-sneakers-001` | any | shoes | White Leather Sneakers | $89.00 | white | casual, sporty |
| `demo-u-belt-001` | any | accessory | Leather Belt | $35.00 | brown | casual, office |

### Why these twelve

The set is sized to exercise every retrieval path without padding:

- **Audience filtering** — the masculine rows mirror the feminine ones (top, bottom, shoes, outerwear), so a feminine query must return only the six feminine plus two `any` rows, and the reverse for masculine.
- **Combine** — a feminine top anchor targets bottom, shoes, and bag; exactly four rows qualify (jeans, skirt, white sneakers, tote), matching the four-outfit limit chat requests.
- **Similar** — both audiences have a top, bottom, shoes, and outerwear to match against.
- **Color** — navy appears on three rows (jeans, blazer, oxford).
- **Style** — office, casual, formal, elegant, sporty, and weekend are spread across rows.
- **Unisex handling** — the two `any` rows verify that unisex items surface for every audience.

---

## Not built yet

In-app cart and merchant checkout handoff (M3) · production try-on quality (M4) · persisted wardrobe (M5) · live trends from catalog aggregates (M6) · authentication and per-user profiles · affiliate fields rendered on outfit cards.
