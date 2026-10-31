# Milestone 1 — Prompt engineering & intent-aware retrieval

## Orchestrator acceptance

Four scenarios must return DeepFashion catalog images aligned with intent:

1. Upload/text **combine** (tee + pants) → mostly bottoms/shoes/bags, not more tees
2. **similar** tees → mostly tops
3. **color** (navy palette) → colors JSON + looks (color words sparse in captions; style/general boost OK)
4. **style** (minimal office) → style-tagged / formal-leaning looks

## Analyst brief (overlaps)

- DeepFashion captions are often **multi-garment** (full-body). Primary category inference prefers explicit pants/skirt/dress/top phrases.
- Color tokens in captions are rare (often “pure color” / denim). Color intent still emits palette JSON; image filter uses color boosts when present, then broadens.
- **Overlap rule:** one primary intent; `colors` / `styleTags` are boosts only (e.g. combine+navy keeps `combine`).

## Developer deliverables

- [`server/services/fashionIntent.ts`](../server/services/fashionIntent.ts) — intents, heuristics, merge with model JSON
- [`server/services/deepFashion.ts`](../server/services/deepFashion.ts) — attributes + `searchDeepFashion(plan)`
- [`server/services/fashionAi.ts`](../server/services/fashionAi.ts) — SYSTEM_PROMPT (no Unsplash outfits; empty outfits for server inject)
- [`server/services/fashionData.ts`](../server/services/fashionData.ts) — local fallback uses same plan/search

## Debugger checklist

- [ ] Chat: “what pants with this t-shirt” (with/without image) → Bottoms look cards
- [ ] Chat: “similar shirts to this” → Top look cards
- [ ] Chat: “navy color palette” → color chips + outfits
- [ ] Chat: “minimal office outfits” → outfits; not random Unsplash hosts
- [ ] Chat: “outfits for women” / “feminine casual” → no gentleman/man/guy / `MEN-` filenames
- [ ] Chat: “outfits for men” → no lady/woman / `WOMEN-` filenames
- [ ] Network: image URLs under `/data/deepfashion/images/` return 200
- [ ] Rebuild Docker API if using Compose: `docker compose --profile full up -d --build api`

## Gender / audience (Debugger follow-up)

**Root cause:** Milestone 1 retrieval scored captions/categories only — no audience field. DeepFashion filenames (`MEN-` / `WOMEN-`) and caption nouns (gentleman, guy, lady, woman) were ignored.

**Fix:** `audience` on `FashionQueryPlan` + `genderPresentation` on catalog items; feminine audience excludes masculine presentation and vice versa.