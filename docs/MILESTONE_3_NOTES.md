# Milestone 3 — Product cards, cart, affiliate checkout handoff

## Goal

Make catalog rows shoppable in the UI: prices and merchants on chat product cards, a staging cart, and an outbound handoff to the merchant. Vesta never takes payment.

## What shipped

| Piece | Location |
|--------|----------|
| Anonymous session cookie | `server/middleware/session.ts` |
| `carts`, `cart_items`, `product_clicks` | `shared/schema.ts` |
| Cart storage methods | `server/storage.ts` |
| Cart API + affiliate redirect | `server/routes.ts` |
| Cart state hook | `client/src/hooks/useCart.ts` |
| Cart page | `client/src/pages/Cart.tsx` (`/cart`) |
| Header bag + badge | `client/src/components/layout/MainLayout.tsx` |
| Shoppable product cards | `client/src/components/fashion/OutfitGrid.tsx` |
| Disclosure | `client/src/components/fashion/AffiliateDisclosure.tsx` |

## Cart identity

The cart is keyed by an opaque 256-bit token in a `vesta_sid` cookie (`HttpOnly`, `SameSite=Lax`, `Secure` in production, 1-year max age). The token is meaningless without a matching `carts.session_id` row, so it needs no signing.

**Ownership is always derived from the cookie.** Every mutation scopes its `WHERE` clause to the session's cart id, so item ids from the URL cannot reach another session's rows — a mismatch returns 404, never someone else's data.

When auth lands: call `rotateSessionId(res)` on login (session fixation defence), then attach the existing cart row to the new `userId`. The `carts.user_id` column already exists and is nullable.

## API

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/cart` | Lines grouped by merchant, subtotal, item count |
| `POST` | `/api/cart/items` | `{ productId, quantity? }`; re-adding merges quantity |
| `PATCH` | `/api/cart/items/:itemId` | `{ quantity }`; `0` removes |
| `DELETE` | `/api/cart/items/:itemId` | Remove one line |
| `DELETE` | `/api/cart` | Clear |
| `GET` | `/api/go/:productId?source=` | Logs the click, then 302 to `affiliateUrl` |

`source` is `chat`, `cart`, or `catalog`. Click logging never blocks the redirect — a logging failure is caught and the handoff proceeds.

## Checkout model

Affiliate deep links are **per product**, so there is no merchant-level basket. The cart groups by merchant for orientation, but each line has its own **Buy** link. Copy states this plainly: "Each item opens its own product page on {merchant}; you pay there, not in Vesta."

Outbound links use `rel="sponsored noopener noreferrer"` and `target="_blank"`.

## Prices

Cart lines join `products` at read time, so prices and `isActive` always reflect the last ingest rather than a stale snapshot. Delisted items stay visible with a "No longer listed by the merchant" note. Items without a price render "Price at merchant" and the cart flags `hasUnpricedItems`.

## Acceptance — verified

1. New visitor gets a cookie and an empty cart; badge hidden at zero. ✓
2. Add from a chat product card; badge increments; re-adding merges quantity instead of duplicating. ✓
3. Subtotal is correct across merchants ($78.00 + 2 × $59.00 = $196.00). ✓
4. Quantity +/- and remove update without a page reload. ✓
5. A second session sees its own empty cart and gets 404 on the first session's item ids; the first cart is unchanged. ✓
6. `/api/go/2?source=chat` returns 302 to the merchant URL and writes a `product_clicks` row. ✓
7. Adding a nonexistent or inactive product returns 404. ✓
8. Disclosure appears on the cart page and under shoppable chat grids. ✓
9. No console errors during load, increment, or remove. ✓

## Out of scope

Real payment, merchant-of-record checkout, saved/wishlist separate from cart, cart expiry job, auth and cart claiming, coupon or price-drop tracking.

## Follow-ups

- Add a retention/cleanup job for abandoned anonymous carts (30–90 days) before any public deployment.
- `product_clicks` will need an index and a retention policy once volume grows.
- DeepFashion and sample outfits remain non-shoppable by design; only rows with a `productId` show Add to bag.
