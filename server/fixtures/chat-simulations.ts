import type { WardrobeItem } from "@shared/schema";
import type { FashionIntent, FashionAudience, GarmentCategory } from "../services/fashionIntent";

export type SimKind = "smallTalk" | "followUp" | "retrieve";

/**
 * supported — asserted; a failure fails eval:chat.
 * pending   — question from docs/SHOPPING_QUESTIONS.md the agent does not handle yet.
 *             Never asserted; the runner prints what the router does today.
 */
export type SimStatus = "supported" | "pending";

export interface ChatTurnExpect {
  kind: SimKind;
  intent?: FashionIntent;
  audience?: FashionAudience;
  /** Primary retrieved category (browse/similar) or a required category in the mix. */
  category?: GarmentCategory;
  /** Combine: every card must be in this set. */
  categoriesOnly?: GarmentCategory[];
  outfits?: number;
  outfitsMin?: number;
  outfitsMax?: number;
  noMen?: boolean;
  noWomen?: boolean;
  helpQuestion?: boolean;
  /** Minimum wardrobe (closet) cards chat would prepend for this turn. */
  wardrobeMin?: number;
  /** Wardrobe cards carry no productId / affiliateUrl, and the prompt marks closet items NOT for sale. */
  wardrobeNotShoppable?: boolean;
}

export interface ChatSimTurn {
  user: string;
  hasImage?: boolean;
  /** Closet items the session owns for this turn (supported sims only). */
  wardrobe?: WardrobeItem[];
  /** Required for supported sims; ignored for pending sims. */
  expect?: ChatTurnExpect;
  hint?: string;
}

export interface ChatSimulation {
  name: string;
  /** IDs from docs/SHOPPING_QUESTIONS.md (e.g. "A1"). */
  questionIds: string[];
  status: SimStatus;
  /** Pending only: what is missing before this can become supported. */
  gap?: string;
  turns: ChatSimTurn[];
}

/** Minimal closet row for router-level sims (no DB). */
function closetItem(
  id: number,
  title: string,
  category: GarmentCategory,
  colors: string[] = []
): WardrobeItem {
  const now = new Date(0);
  return {
    id,
    sessionId: "sim-session",
    userId: null,
    title,
    imageKey: `sim/${id}.jpg`,
    imageUrl: `/uploads/sim/${id}.jpg`,
    category,
    tag: "casual",
    colors,
    createdAt: now,
    updatedAt: now,
  };
}

const SIM_CLOSET: WardrobeItem[] = [
  closetItem(1, "Blue Jeans", "bottom", ["blue"]),
  closetItem(2, "Black Tee", "top", ["black"]),
];

export const CHAT_SIMULATIONS: ChatSimulation[] = [
  {
    name: "small-talk-hi",
    questionIds: ["L1"],
    status: "supported",
    turns: [
      {
        user: "hi",
        expect: { kind: "smallTalk", outfits: 0, helpQuestion: true },
        hint: "trySmallTalkReply in fashionSmallTalk.ts — greetings must run before any 'too short' reject",
      },
    ],
  },
  {
    name: "small-talk-how-are-you",
    questionIds: ["L1"],
    status: "supported",
    turns: [
      {
        user: "how are you",
        expect: { kind: "smallTalk", outfits: 0, helpQuestion: true },
        hint: "HOW_ARE_RE in fashionSmallTalk.ts",
      },
    ],
  },
  {
    name: "small-talk-thanks",
    questionIds: ["L1"],
    status: "supported",
    turns: [
      {
        user: "thanks",
        expect: { kind: "smallTalk", outfits: 0, helpQuestion: true },
        hint: "THANKS_RE in fashionSmallTalk.ts",
      },
    ],
  },
  {
    name: "small-talk-bye",
    questionIds: ["L1"],
    status: "supported",
    turns: [
      {
        user: "bye",
        expect: { kind: "smallTalk", outfits: 0 },
        hint: "BYE_RE in fashionSmallTalk.ts",
      },
    ],
  },
  {
    name: "small-talk-what-can-you-do",
    questionIds: ["L2"],
    status: "supported",
    turns: [
      {
        user: "what can you do",
        expect: { kind: "smallTalk", outfits: 0, helpQuestion: true },
        hint: "WHO_RE in fashionSmallTalk.ts",
      },
    ],
  },
  {
    name: "small-talk-weather",
    questionIds: ["L3"],
    status: "supported",
    turns: [
      {
        user: "what's the weather like",
        expect: { kind: "smallTalk", outfits: 0, helpQuestion: true },
        hint: "CHITCHAT_RE in fashionSmallTalk.ts — off-topic redirects back to style",
      },
    ],
  },
  {
    name: "browse-party-dresses",
    questionIds: ["A1"],
    status: "supported",
    turns: [
      {
        user: "show me party dresses",
        expect: {
          kind: "retrieve",
          intent: "browse",
          audience: "feminine",
          category: "dress",
          outfits: 4,
          noMen: true,
        },
        hint: "browse job + implied feminine in fashionIntent.ts; hard category in deepFashion/catalog scoring",
      },
    ],
  },
  {
    name: "browse-dresses",
    questionIds: ["A1"],
    status: "supported",
    turns: [
      {
        user: "show me dresses",
        expect: {
          kind: "retrieve",
          intent: "browse",
          audience: "feminine",
          category: "dress",
          outfitsMin: 1,
          noMen: true,
        },
        hint: "empty color/style must not block dress browse",
      },
    ],
  },
  {
    name: "blazers-follow-up-then-search",
    questionIds: ["A2", "L4"],
    status: "supported",
    turns: [
      {
        user: "show me blazers",
        expect: { kind: "followUp", intent: "browse", outfits: 0 },
        hint: "needsFollowUp + skip inject in fashionIntent.ts / fashionAi shouldAttachCatalog",
      },
      {
        user: "for women, casual",
        expect: {
          kind: "retrieve",
          intent: "browse",
          audience: "feminine",
          category: "outerwear",
          outfitsMin: 1,
          noMen: true,
        },
        hint: "buildRetrievalPlan merges prior user turns; after gender+style, cards should inject",
      },
    ],
  },
  {
    name: "combine-tee-bottoms",
    questionIds: ["B1"],
    status: "supported",
    turns: [
      {
        user: "what pants go with this t-shirt",
        hasImage: true,
        expect: {
          kind: "retrieve",
          intent: "combine",
          categoriesOnly: ["bottom", "shoes", "bag"],
          outfitsMin: 1,
        },
        hint: "combine targets in fashionIntent COMBINE_TARGETS — never more tops",
      },
    ],
  },
  {
    name: "combine-complete-this-look",
    questionIds: ["B2"],
    status: "supported",
    turns: [
      {
        user: "complete this look",
        hasImage: true,
        expect: {
          kind: "retrieve",
          intent: "combine",
          categoriesOnly: ["bottom", "shoes", "bag"],
          outfitsMin: 1,
        },
        hint: "image upload defaults to combine; unknown anchor falls back to top",
      },
    ],
  },
  {
    name: "similar-tee",
    questionIds: ["A3"],
    status: "supported",
    turns: [
      {
        user: "show me similar shirts to this tee",
        hasImage: true,
        expect: {
          kind: "retrieve",
          intent: "similar",
          category: "top",
          outfitsMin: 1,
        },
        hint: "similar policy must stay on the anchor category",
      },
    ],
  },
  {
    name: "color-go-with-navy",
    questionIds: ["B3"],
    status: "supported",
    turns: [
      {
        user: "what colors go with navy",
        expect: { kind: "retrieve", intent: "color" },
        hint: "COLOR_CUES must win over 'go with' combine in fashionIntent.ts",
      },
    ],
  },
  {
    name: "audience-women",
    questionIds: [],
    status: "supported",
    turns: [
      {
        user: "casual outfits for women",
        expect: {
          kind: "retrieve",
          audience: "feminine",
          outfitsMin: 1,
          noMen: true,
        },
        hint: "detectAudience + itemMatchesAudience; mock/corpus URLs must not be MEN-",
      },
    ],
  },
  {
    name: "wardrobe-goes-with-my-jeans",
    questionIds: ["B5"],
    status: "supported",
    turns: [
      {
        user: "what goes with the jeans in my wardrobe",
        wardrobe: SIM_CLOSET,
        expect: {
          // Browse on an ambivalent garment with no audience asks a follow-up for catalog cards,
          // but closet hits still attach (fashionAi: wardrobeHits.length > 0).
          kind: "followUp",
          wardrobeMin: 1,
          wardrobeNotShoppable: true,
        },
        hint: "mentionsWardrobe + selectWardrobeForChat in wardrobe.ts; closet cards never carry productId",
      },
    ],
  },
  {
    name: "wardrobe-cannot-buy-own-items",
    questionIds: ["G5"],
    status: "supported",
    turns: [
      {
        user: "can I buy my wardrobe items",
        wardrobe: SIM_CLOSET,
        expect: {
          // No catalog cards for a general policy question; closet cards stay non-shoppable.
          kind: "followUp",
          wardrobeMin: 1,
          wardrobeNotShoppable: true,
        },
        hint: "formatWardrobeInventory must say NOT for sale; wardrobeItemToOutfit has no productId/affiliateUrl",
      },
    ],
  },
];

/**
 * Questions from docs/SHOPPING_QUESTIONS.md with no support yet (status P or N).
 * Each becomes a pending sim: the runner prints router behavior today and the gap.
 */
interface PendingQuestion {
  id: string;
  user: string;
  hasImage?: boolean;
  gap: string;
}

const PENDING_QUESTIONS: PendingQuestion[] = [
  { id: "A4", user: "what's new in sneakers", gap: "No recency field in catalog rows" },
  { id: "A5", user: "show me more options", gap: "No pagination or seen-item tracking" },
  { id: "A6", user: "show me something different from these", gap: "No exclusion of prior results" },
  { id: "A7", user: "do you have this in another color", hasImage: true, gap: "No variant grouping" },
  { id: "A8", user: "only items from a specific brand", gap: "No brand/merchant filter" },
  { id: "B4", user: "style this blazer three ways", hasImage: true, gap: "Single retrieval pass; no multi-look planning" },
  { id: "B6", user: "build me an outfit from my wardrobe", gap: "Lists closet pieces; no outfit assembly" },
  { id: "B7", user: "which of my pieces match this new item", hasImage: true, gap: "No wardrobe-vs-catalog matching" },
  { id: "C1", user: "what should I wear to a wedding", gap: "No occasion tags in retrieval" },
  { id: "C2", user: "what does smart casual mean", gap: "Prose only; no dress-code knowledge base" },
  { id: "C3", user: "outfit for rain", gap: "No season or weather logic" },
  { id: "C4", user: "packing list for a 5 day trip", gap: "No multi-item trip planning" },
  { id: "C5", user: "work appropriate but not boring", gap: "Only an office style tag" },
  { id: "D1", user: "show me dresses under $50", gap: "Price filter on catalog rows" },
  { id: "D2", user: "cheaper alternative to this", hasImage: true, gap: "Price-aware similar" },
  { id: "D3", user: "what is the best value jacket", gap: "Price ranking intent" },
  { id: "D4", user: "is this on sale", gap: "No sale price in the feed schema" },
  { id: "D5", user: "compare these two by price", gap: "No comparison intent" },
  { id: "E1", user: "what size should I get", gap: "No size data" },
  { id: "E2", user: "does this run small", gap: "No fit/review data" },
  { id: "E3", user: "what suits a pear shape", gap: "General advice only; no body-shape retrieval" },
  { id: "E4", user: "petite options please", gap: "No size-range tags" },
  { id: "E5", user: "oversized or tailored fit", gap: "Style prose only" },
  { id: "F1", user: "what is it made of", gap: "No material field" },
  { id: "F2", user: "is it machine washable", gap: "No care or sustainability data" },
  { id: "F3", user: "compare these two items", gap: "No comparison intent" },
  { id: "F4", user: "which one is better for everyday wear", gap: "Needs comparison intent" },
  { id: "F5", user: "is this worth the price", gap: "Needs price data and opinion guardrails" },
  { id: "G4", user: "remove the blazer from my bag", gap: "Cart edits are UI-only" },
  { id: "G6", user: "is this in stock in my size", gap: "No inventory (affiliate-only)" },
  { id: "H1", user: "how long does shipping take", gap: "Merchant-specific; no data" },
  { id: "H2", user: "what is your return policy", gap: "Merchant-specific; no data" },
  { id: "H3", user: "where is my order", gap: "No merchant-of-record" },
  { id: "H5", user: "do you earn commission on this", gap: "Disclosure exists in cart, not in chat" },
  { id: "I1", user: "what do I own that is black", gap: "Router misreads 'what' as the accessory 'hat' (substring match) and asks a follow-up; see RISKS_AND_BACKLOG.md" },
  { id: "I2", user: "what am I missing in my wardrobe", gap: "Prose only; no gap analysis" },
  { id: "I3", user: "what should I buy to get more outfits from what I own", gap: "No gap-to-catalog retrieval" },
  { id: "I4", user: "rename my black tee to office tee", gap: "Wardrobe edits are UI-only" },
  { id: "I5", user: "remember my size and style", gap: "No profile (needs auth)" },
  { id: "J2", user: "try it in another color", gap: "No variants" },
  { id: "K1", user: "gift for a friend who likes streetwear", gap: "No gifting flow" },
  { id: "K2", user: "gift ideas under $100 for her", gap: "Price filter" },
  { id: "L5", user: "que me pongo para una boda", gap: "English-only heuristics" },
];

for (const q of PENDING_QUESTIONS) {
  CHAT_SIMULATIONS.push({
    name: `pending-${q.id.toLowerCase()}`,
    questionIds: [q.id],
    status: "pending",
    gap: q.gap,
    turns: [{ user: q.user, hasImage: q.hasImage }],
  });
}

/**
 * Catalog rows with no simulation at all, and why. Everything else in
 * docs/SHOPPING_QUESTIONS.md must be covered by a supported or pending sim.
 */
export const NOT_SIMULATABLE: Record<string, string> = {
  B8: "Needs two images in one turn; chat takes one",
  G1: "Affiliate link is rendered by OutfitGrid, not the router",
  G2: "Add to bag is the cart UI/API",
  G3: "Cart page shows the bag; chat does not",
  H4: "Disclosure copy lives in the cart UI",
  J1: "Try-on is the VTO flow, not the router",
};
