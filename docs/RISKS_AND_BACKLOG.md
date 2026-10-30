# Risks & backlog (future milestones)

Deferred work and known risks. Pull items into a milestone when they become blocking; do not expand the current slice to absorb them.

## Product / UX

| Risk / gap | Why it matters | Likely milestone |
|------------|----------------|------------------|
| Trends page is hardcoded; images broken | Misleading “live” trends | M7 — catalog aggregates |
| Chat cannot answer price, size, stock, comparison, or policy questions | Users expect them; today Claude prose may guess | M6 catalogs gaps in [SHOPPING_QUESTIONS.md](SHOPPING_QUESTIONS.md); build later slices (price filter first) |
| Size / stock / shipping / returns data absent from affiliate feed | Agent must not invent merchant facts | Needs feed fields or merchant links; never fabricate |
| Profile is static (no edit) | Fake personalization | Auth + editable profile |
| No browsable catalog page | Products only via chat | Catalog UI slice |
| Wardrobe items must never be sold | Own-closet photos ≠ affiliate inventory | M5 keeps: no `productId` / no Add to bag on wardrobe cards |
| Demo affiliate URLs (`example.com`) | Click-through goes nowhere in demos | Real partner feed when available |

## Commerce / compliance

| Risk / gap | Why it matters | Likely milestone |
|------------|----------------|------------------|
| Abandoned anonymous carts never cleaned | DB / cookie growth | Ops job (30–90 days) before public deploy |
| `product_clicks` lacks index + retention | Volume will hurt writes/reads | Ops once traffic grows |
| Cart claiming on login | Session cart must attach to `userId` without fixation | Auth (rotate `vesta_sid`, then set `carts.user_id`) |
| Merchant-of-record / in-app payment | Out of scope; affiliate handoff only | Never for current commerce model |
| Affiliate ToS / disclosure | Must stay on every outbound path | Keep reviewing when new surfaces ship |

## Try-on / media

| Risk / gap | Why it matters | Likely milestone |
|------------|----------------|------------------|
| Demo overlay quality | Expected placeholder; do not treat as production VTO | Hosted IDM-VTON already optional; **Kolors** later — see [KOLORS.md](KOLORS.md) |
| Hosted Replicate model is research / non-commercial by default | Legal for commercial use | Override `VTO_REPLICATE_MODEL` or switch provider |
| Local GPU weights + PyTorch install | Heavy, gitignored, easy to break Docker images | Optional Kolors path only |
| User photos sent to third parties (hosted) | Privacy / disclosure | Keep dialog disclosure; no image logging |

## Retrieval / AI

| Risk / gap | Why it matters | Likely milestone |
|------------|----------------|------------------|
| No embeddings / vector search | Caption + tag heuristics only | Later quality pass |
| Claude mentor prose not covered by `eval:chat` | Router/retrieval only | Expand evals if mentor regressions bite |
| Gender / audience edge cases | DeepFashion filenames + captions | Re-run `eval:retrieval` / corpus chat eval after intent changes |
| S3/R2 storage stub | Local `./uploads` only | Cloud lift when deploying multi-instance |

## Infra

| Risk / gap | Why it matters | Likely milestone |
|------------|----------------|------------------|
| Auth missing | Shared `LOCAL_USER_ID=1` for chat history | Real auth |
| Multi-instance local uploads | Files on one disk only | `STORAGE_MODE=s3` implementation |
| DeepFashion not in git | Empty corpus → weak imagery fallback | Document mount / seed for each env |

## Explicit non-goals (do not sneak in)

- Kolors as a required install for Demo try-on
- Embeddings for M5 wardrobe
- Selling wardrobe uploads
- Merchant-of-record checkout
- Auth-editable profile before auth exists
