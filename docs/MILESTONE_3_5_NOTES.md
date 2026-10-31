# Milestone 3.5 — Prompt + retrieval evaluation

## Goal

Stop mixed/random chat outfit grids by locking **classify → retrieve → mentor**, with golden simulations. Not a multi-agent rewrite.

## What shipped

| Piece | Location |
|--------|----------|
| `buildRetrievalPlan` / `applyIntentPolicy` / `mergeMentorHintsForDisplay` | `server/services/fashionIntent.ts` |
| No silent random for combine/similar/color/style | `searchDeepFashionDetailed` in `deepFashion.ts` |
| Tighter affiliate search (no general collapse) | `catalog.ts` |
| Locked plan in Claude system prompt | `fashionAi.ts` |
| Golden suite | `npm run eval:retrieval` → `server/scripts/evalRetrieval.ts` |

## Classify-then-mentor

1. Server builds `retrievalPlan` from heuristics + policies (combine targets, similar category, audience).
2. Claude receives that plan as **locked** and writes mentoring prose + palette JSON.
3. Outfit injection always uses `retrievalPlan`, never the model’s intent fields.
4. Mentor may only refine display `colors` / `styleTags`.

## Retrieval policy

| Intent | Behavior |
|--------|----------|
| combine | Complementary categories only; one broaden dropping color/style boosts |
| similar | Same category only; same broaden rule |
| color | Strict color hits or **empty** (no random fill) |
| style | Style tags, then office/formal synonym broaden — never full random |
| general | Audience-scoped sample allowed when ranked set empty |

JSON now includes `matchQuality` (`strict` \| `broadened` \| `empty`) and `retrievedCategories`.

Debugger follow-up: `mergeIntentFromModel` removed (mentor can no longer override retrieval intent). Local fallback no longer Unsplash-fills focused misses. “what colors go with navy” is `color`, not `combine`.

## Eval

```bash
npm run eval:retrieval
```

Asserts combine/similar category mix, color no silent-random, style classification, and MEN-/WOMEN- audience isolation.

## Acceptance

- [x] Golden suite mostly green (run locally with DeepFashion data present)
- [x] Focused intents no longer call `getRandomDeepFashionItems`
- [x] Chat inject path uses locked retrieval plan

## Out of scope

Multi-agent specialists, embeddings, wardrobe/trends UI, live partner feeds.
