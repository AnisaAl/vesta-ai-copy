# Shopping question catalog (Milestone 6)

Questions a fashion shopper can ask the Vesta chat agent. Used to measure coverage, not to promise features: each row is tagged with what the agent does **today**.

Status key:

- **S** supported today (router/retrieval/cart/wardrobe handles it)
- **P** partial (Claude prose may answer, but no retrieval/filter backs it)
- **N** not supported (no data or logic behind it)

`eval:chat` fixtures reference the ID in `server/fixtures/chat-simulations.ts` (`questionId`). S rows must pass; P/N rows are `pending` until built.

Baseline code: `server/services/fashionIntent.ts` (intents `similar` / `combine` / `browse` / `color` / `style` / `general`), `fashionSmallTalk.ts`, `wardrobe.ts`, `fashionAi.ts`.

## A. Discovery and browsing

| ID | Question | Status | Notes / target |
|----|----------|--------|----------------|
| A1 | Show me party dresses | S | `browse` intent |
| A2 | Do you have blazers for women? | S | `browse` + follow-up when gender/style missing |
| A3 | Show me something like this (photo) | S | `similar` intent |
| A4 | What's new in sneakers? | P | No recency field in catalog |
| A5 | Show me more options | P | No pagination / "seen" tracking |
| A6 | Show me something different from these | N | Needs exclusion of prior results |
| A7 | Do you have this in another color? | N | Needs variant grouping |
| A8 | Only items from a specific store or brand | N | Merchant/brand filter not in plan |

## B. Styling and outfit building

| ID | Question | Status | Notes / target |
|----|----------|--------|----------------|
| B1 | What pants go with this t-shirt? | S | `combine` intent |
| B2 | Complete this look (photo) | S | `combine` targets. Naming "shoes and a bag" in the text flips the anchor to shoes, so those words do not steer targets |
| B3 | What colors go with navy? | S | `color` intent |
| B4 | Style this blazer three ways | P | One retrieval pass only |
| B5 | What goes with the jeans in my wardrobe? | S | Wardrobe grounding (M5) |
| B6 | Build me an outfit from my wardrobe | P | Lists items, no full-outfit assembly |
| B7 | Which of my pieces match this new item? | P | Needs wardrobe-vs-catalog matching |
| B8 | Can I wear this with that? (photo vs photo) | N | Single image per turn |

## C. Occasion and context

| ID | Question | Status | Notes / target |
|----|----------|--------|----------------|
| C1 | What do I wear to a wedding / interview / first date? | P | `style` prose, no occasion tags in retrieval |
| C2 | What does "smart casual" / "cocktail" mean? | P | Prose only |
| C3 | Outfit for rain, summer heat, a ski trip | P | No season/weather logic |
| C4 | Packing list for a 5-day trip | N | Multi-item planning |
| C5 | Work-appropriate but not boring | P | `office` style tag only |

## D. Budget, price, and deals

| ID | Question | Status | Notes / target |
|----|----------|--------|----------------|
| D1 | Under $50 only | N | Price filter on catalog rows |
| D2 | Cheaper alternative to this | N | Needs price-aware `similar` |
| D3 | Best value / best splurge piece | N | Needs price ranking |
| D4 | Is this on sale? | N | No sale price in feed schema |
| D5 | Compare these two by price | N | See F-section comparison |

## E. Fit, size, and body

| ID | Question | Status | Notes / target |
|----|----------|--------|----------------|
| E1 | What size should I get? | N | No size data |
| E2 | Does this run small? | N | No review/fit data |
| E3 | What suits a pear / apple shape? | P | General advice only |
| E4 | Petite, tall, or plus-size options | N | No size-range tags |
| E5 | Oversized vs tailored fit | P | Style prose |

## F. Product details and comparison

| ID | Question | Status | Notes / target |
|----|----------|--------|----------------|
| F1 | What is it made of? | N | No material field |
| F2 | Is it machine washable / sustainable? | N | No care/sustainability data |
| F3 | Compare these two items | N | No comparison intent |
| F4 | Which is better for everyday wear? | N | Needs comparison intent |
| F5 | Is this worth the price? | N | Opinion on price data we do not have |

## G. Availability and purchase

| ID | Question | Status | Notes / target |
|----|----------|--------|----------------|
| G1 | Where can I buy this? | S | Affiliate link on card |
| G2 | Add this to my bag | S | Cart UI (Add to bag) |
| G3 | What's in my bag and the total? | P | Cart page only, not chat |
| G4 | Remove or swap an item in my bag | N | Not via chat |
| G5 | Can I buy my wardrobe items? | S | Wardrobe is never sold |
| G6 | Is this in stock in my size? | N | No inventory (affiliate-only) |

## H. Policies and post-purchase

| ID | Question | Status | Notes / target |
|----|----------|--------|----------------|
| H1 | Shipping time or cost? | N | Merchant-specific; no data |
| H2 | Returns and exchanges? | N | Merchant-specific; no data |
| H3 | Order status / tracking? | N | No merchant-of-record |
| H4 | Why does the cart send me to the merchant? | P | Affiliate disclosure copy only |
| H5 | Is this an ad? Do you earn commission? | P | Disclosure in cart; not in chat |

## I. Personalization and wardrobe

| ID | Question | Status | Notes / target |
|----|----------|--------|----------------|
| I1 | What do I own that is black? | P | Inventory is in the prompt, but the router reads "what" as the accessory "hat" and asks a follow-up (see Known router bug) |
| I2 | What am I missing in my wardrobe? | P | Prose only |
| I3 | What should I buy to get more outfits from what I own? | P | Needs gap-to-catalog retrieval |
| I4 | Rename or remove a wardrobe item via chat | N | UI only |
| I5 | Remember my size and style | N | No profile (auth) |

## J. Try-on

| ID | Question | Status | Notes / target |
|----|----------|--------|----------------|
| J1 | How would this look on me? | S | "Try it on" card button |
| J2 | Try it in another color | N | No variants |

## K. Gifting

| ID | Question | Status | Notes / target |
|----|----------|--------|----------------|
| K1 | Gift for a friend who likes streetwear | P | `browse`/`style`, no gifting flow |
| K2 | Ideas under $100 for her | N | Price filter |

## L. Meta, trust, and edge cases

| ID | Question | Status | Notes / target |
|----|----------|--------|----------------|
| L1 | Hi / thanks / bye | S | `fashionSmallTalk.ts` |
| L2 | What can you do? | S | `WHO_RE` |
| L3 | Off-topic (weather, jokes) | S | Redirect small talk |
| L4 | Ambiguous ask ("show me blazers") | S | `needsFollowUp` |
| L5 | Questions in other languages | N | English heuristics only |

## Gap summary (backlog input)

| Cluster | IDs | Missing capability |
|---------|-----|--------------------|
| Price / budget | D1-D5, K2 | Price filter + ranking intent |
| Size / fit | E1-E4, G6 | Size and stock data (not in affiliate feed) |
| Comparison / details | F1-F5 | Comparison intent, material/care fields |
| Policies / orders | H1-H3 | Merchant policy data; order tracking needs merchant-of-record (out of scope) |
| Variants / pagination | A5-A7, J2 | Variant grouping, result exclusion |
| Smarter wardrobe | B6, B7, I2, I3 | Wardrobe-vs-catalog matching |
| Occasion / season | C1-C5 | Occasion and season tags in retrieval |

## Known router bug (found while building the M6 sims)

`detectAnchorCategory` in `server/services/fashionIntent.ts` matches category words with `String.includes`. The accessory word "hat" matches inside "what", so any question starting with "what" and naming no garment (for example "what size should I get", "what is your return policy", "what do I own that is black") is classified as `browse` on `accessory` and answered with the "Are you shopping for men or women?" follow-up. Short words like "tee", "top", "bag" have the same substring risk ("meet", "stop", "baggy"). Fix is word-boundary matching; deliberately not done in M6 (no behavior changes), tracked in [RISKS_AND_BACKLOG.md](RISKS_AND_BACKLOG.md).

Hard constraints stay in force: affiliate-only commerce, wardrobe items never sold, no merchant-of-record, no embeddings in this milestone.
