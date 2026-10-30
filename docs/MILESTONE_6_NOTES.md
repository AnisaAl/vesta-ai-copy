# Milestone 6 — Shopping question coverage

Branch: `feat/m6-shopping-questions` (based on `feat/m5-wardrobe`; rebase onto `main` once PR #8 merges).

## Goal

Know exactly which shopper questions the chat agent handles, and lock that in with evals. No new chat features in this milestone.

## Deliverables

1. [SHOPPING_QUESTIONS.md](SHOPPING_QUESTIONS.md) — catalog with status (S / P / N) per question.
2. `server/fixtures/chat-simulations.ts` — add `questionId` and `status: "supported" | "pending"`; add sims for S rows not yet covered (wardrobe grounding, "where can I buy this", "can I buy my wardrobe items").
3. `eval:chat` runner reports `passed / failed / pending`; pending sims never fail the run.

## Result

- `npm run eval:chat`: 140 checks pass, 43 pending (mock and corpus modes).
- Supported sims cover A1-A3, B1-B3, B5, G5, L1-L4. Not simulatable at router level: B8, G1-G3, H4, J1 (reasons in `NOT_SIMULATABLE`).
- Finding: substring category matching ("hat" in "what") misroutes many "what ..." questions. Logged in [RISKS_AND_BACKLOG.md](RISKS_AND_BACKLOG.md); not fixed here.

## Out of scope

Trends (M7) · Kolors · embeddings · auth-editable profile · merchant-of-record · implementing any N-tagged question type (price filter, size, comparison, policies).

## Acceptance

1. Every S row in the catalog has a passing sim; every P/N row has a pending sim or is explicitly listed as not simulatable (needs Claude or DB).
2. `npm run eval:chat` is green (existing 55 assertions unchanged).
3. Docs list Trends under M7.
