# Milestone 0 — stabilize and clean

## Fixed
- ChatBubble renders colors, outfits, and accessories together (no early return on colors only).
- Chat history save/list uses the local MVP user (`LOCAL_USER_ID` + `ensureLocalUser`).
- OutfitGrid: removed fake "Shop: noshop" and non-functional Select; kept Try it on.
- Profile: removed no-op Edit Profile and fake activity list; labeled as preview.
- Virtual try-on UI: explicit demo-mode labeling.
- README / `.env.example`: Anthropic Claude, not OpenAI-as-primary.

## Removed / renamed
- Deleted orphan `client/src/pages/Recommendations.tsx` (was unrouted).
- Deleted `server/services/fashionMnistLoader.ts` (recommendations use DeepFashion).
- Removed unused deps: `openai`, `passport`, `passport-local`, `csv-parse`, passport types.
- Renamed `server/services/openai.ts` → `fashionAi.ts` (Claude implementation).
- Dropped `fashionMnistData` from `shared/schema.ts` (legacy SQL migration may still create the table locally; safe to ignore/drop manually).

## Temporary (until Milestone 1)
- Unsplash `SAMPLE_OUTFITS` in `fashionData.ts` remain as DeepFashion fallback only — tagged TEMPORARY, not shoppable inventory.
