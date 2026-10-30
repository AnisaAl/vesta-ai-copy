# Milestone 5 — Persisted wardrobe + chat grounding

## Goal

Replace in-memory Unsplash / blob-URL wardrobe with Postgres rows + `objectStorage` uploads. Session-scoped like the cart (`vesta_sid`). Chat can reference closet pieces; **only affiliate/DeepFashion catalog cards are shoppable**.

## What shipped

| Piece | Location |
|--------|----------|
| `wardrobe_items` table | `shared/schema.ts` + `migrations/0001_wardrobe_items.sql` |
| Storage CRUD | `server/storage.ts` |
| Boot ensure (if push skipped) | `ensureWardrobeItemsTable` in `server/db.ts` |
| Upload decode + wardrobe API | `server/routes.ts` |
| Closet scoring / inventory text | `server/services/wardrobe.ts` |
| Chat grounding (prompt + non-shoppable cards) | `server/services/fashionAi.ts` |
| Client hook | `client/src/hooks/useWardrobe.ts` |
| Wardrobe page | `client/src/pages/Wardrobe.tsx` |

## Identity

Same anonymous session cookie as cart. Optional `userId` set to the seeded local MVP user on create (mirrors chat history). Ownership checks always include `sessionId`.

## API

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/api/wardrobe` | Items for this session |
| `POST` | `/api/wardrobe` | `{ imageData, title?, tag?, category?, colors? }` → stores via `objectStorage` |
| `PATCH` | `/api/wardrobe/:id` | Metadata only |
| `DELETE` | `/api/wardrobe/:id` | Session-scoped |

Images are served from `/uploads/...` when `STORAGE_MODE=local`.

## Docker Compose (`--profile full`)

- Boot calls `ensureWardrobeItemsTable()` so a fresh Compose Postgres volume still gets `wardrobe_items`.
- Compose sets `COOKIE_SECURE=false` because the stack is served over **http://localhost**. A `Secure` cookie would be ignored by the browser and wardrobe/cart sessions would not stick.
- Rebuild after pulling: `docker compose --profile full up -d --build api`
- Upload control uses a native `<label htmlFor>` (same as try-on), not `input.click()` on a `display:none` file input.
- After picking a file, a short dialog asks for a **name** before `POST /api/wardrobe` — the item only appears in the grid once saved.
- Existing cards have a pencil control that `PATCH`es the title. Dialogs use `z-[100]` so they sit above the app header (`z-50`).
- Docker users must rebuild the API image to get client changes: `docker compose --profile full up -d --build api`, then hard-refresh the browser.

## Chat

- Loads wardrobe for the session on every `POST /api/chat`.
- Injects inventory into the mentor system prompt.
- For combine / similar / browse (and wardrobe cues), may prepend non-shoppable `source: "wardrobe"` outfits; catalog injection still uses existing intent filters.
- No `productId` on wardrobe cards → no Add to bag.

## Out of scope

M7 trends (M6 is shopping-question coverage) · Kolors · embeddings · auth-editable profile · merchant-of-record · selling wardrobe items.

## Acceptance

1. Upload on `/wardrobe` → survives refresh.
2. Ask chat about “my wardrobe” / a titled piece → reply can reference it (and may show a wardrobe card).
3. `npm run eval:chat` stays green (no Claude / no DB).
4. Try-on Demo path unchanged.
