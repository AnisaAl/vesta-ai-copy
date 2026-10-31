# Milestone 3.6 — Search / browse

## Goal

Storefront-style search on the existing classify → retrieve → mentor router. Not a second LLM.

- Named garment is a **hard** category filter.
- Unstated color/style are **not** filters.
- Dress / skirt / blouse / heels / gown imply **feminine** (user need not say “for women”).
- Ambivalent garments (blazer, jeans, tee) get a **follow-up** before mixed cards.
- Color advice is a short sentence, not swatch tiles.

## Shopper jobs

| Job | Example | Cards |
|-----|---------|-------|
| browse | “show me party dresses” | 4 dresses, party boosted |
| similar | “more like this tee” | same category |
| combine | “what pants with this” | complementary only |
| color | “what colors go with navy” | optional images; palette in prose |
| style | “minimal office” (no garment) | occasion looks |

## Follow-up

`needsFollowUp` on `FashionQueryPlan`. Example: “show me blazers” → ask men vs women and party vs casual/office; `injectOutfits` skipped. Later turns merge user history into the plan.

## Acceptance

- “show me party dresses” → four dresses, no `MEN-` blazers/shoes as primary.
- “show me blazers” → question, zero outfits.
- `npm run eval:retrieval` green.
- After prompt changes: `npm run eval:chat` (mock catalog, no Claude). See [EVAL_CHAT.md](EVAL_CHAT.md).
