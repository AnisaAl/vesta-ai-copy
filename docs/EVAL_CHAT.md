# Conversation simulations (`eval:chat`)

On-demand golden conversations for prompt / intent changes. **Not** wired to `dev`, git hooks, or CI — run it when you touch chat behavior.

These runs **do not call Claude** (no Anthropic tokens). They also **do not open Postgres**. Default retrieval uses a tiny mock catalog.

## When to run

After you change any of:

- `server/services/fashionIntent.ts` (jobs, follow-ups, audience)
- `server/services/fashionSmallTalk.ts` (greetings / chit-chat)
- `server/services/fashionAi.ts` (locked plan, inject / skip cards)
- Chat system prompt copy in `fashionAi.ts`

Also re-run `npm run eval:retrieval` if you changed DeepFashion scoring (`deepFashion.ts` / `catalog.ts`).
After try-on overlay changes: `npm run eval:tryon` (no Replicate).

## Commands

From the repo root:

```bash
# Default — mock catalog, zero API tokens, no database
npm run eval:chat
```

```bash
# Same conversations, but retrieve from local DeepFashion images (still no Claude)
EVAL_CHAT_CORPUS=1 npm run eval:chat
```

```bash
# Image mix / gender-leak suite (local corpus, still no Claude)
npm run eval:retrieval
```

Exit code is `0` when every assert passes; non-zero lists `FAIL` lines with an **improve:** hint (file / rule to inspect).

## What is mocked vs real

| Piece | `npm run eval:chat` | `EVAL_CHAT_CORPUS=1 npm run eval:chat` | `npm run eval:retrieval` |
|--------|---------------------|----------------------------------------|---------------------------|
| Claude / Anthropic | **off** | **off** | **off** |
| Postgres / affiliate catalog | **off** | **off** | **off** |
| Outfits | `server/fixtures/chat-sim-catalog.ts` | DeepFashion on disk | DeepFashion on disk |
| Small talk + classify | real heuristics | real heuristics | classify + search only |

Mentor **prose from Claude is not tested**. This suite checks the router: small talk vs search, follow-up before cards, category/audience, and “would inject” vs empty.

## Scenarios

Edit `server/fixtures/chat-simulations.ts` to add a conversation. Each turn is a fake user line plus expects (`kind`, `intent`, outfit counts, `noMen`, help question, …). Multi-turn cases (e.g. blazers → “for women, casual”) pass prior user texts into `buildRetrievalPlan`, same as production chat history.

## Shopper question coverage (M6)

Every simulation carries `questionIds` pointing at rows in [SHOPPING_QUESTIONS.md](SHOPPING_QUESTIONS.md) and a `status`:

- `supported` — asserted; failures fail the run.
- `pending` — a question the agent does not handle yet. Never asserted: the runner prints a `PEND` line with what the router does today and the gap.

The runner also parses the catalog and fails if the two drift: an `S` row needs a supported sim, a `P`/`N` row needs a pending sim, and anything else must be listed in `NOT_SIMULATABLE` with a reason. Wardrobe turns can pass a closet (`wardrobe`) and assert `wardrobeMin` / `wardrobeNotShoppable`.

To promote a question: build the feature, flip the catalog row to `S`, change the sim to `supported` and add an `expect`.

## Adding a case after a prompt change

1. Add a block to `CHAT_SIMULATIONS` in `server/fixtures/chat-simulations.ts`.
2. Run `npm run eval:chat`.
3. If retrieval mix/gender is the risk, run `npm run eval:retrieval` and/or `EVAL_CHAT_CORPUS=1 npm run eval:chat`.
