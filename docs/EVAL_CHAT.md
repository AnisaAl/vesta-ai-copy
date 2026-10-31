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

## Adding a case after a prompt change

1. Add a block to `CHAT_SIMULATIONS` in `server/fixtures/chat-simulations.ts`.
2. Run `npm run eval:chat`.
3. If retrieval mix/gender is the risk, run `npm run eval:retrieval` and/or `EVAL_CHAT_CORPUS=1 npm run eval:chat`.
