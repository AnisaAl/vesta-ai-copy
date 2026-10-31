import type { FashionIntent, FashionAudience, GarmentCategory } from "../services/fashionIntent";

export type SimKind = "smallTalk" | "followUp" | "retrieve";

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
}

export interface ChatSimTurn {
  user: string;
  hasImage?: boolean;
  expect: ChatTurnExpect;
  hint?: string;
}

export interface ChatSimulation {
  name: string;
  turns: ChatSimTurn[];
}

export const CHAT_SIMULATIONS: ChatSimulation[] = [
  {
    name: "small-talk-hi",
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
    turns: [
      {
        user: "thanks",
        expect: { kind: "smallTalk", outfits: 0, helpQuestion: true },
        hint: "THANKS_RE in fashionSmallTalk.ts",
      },
    ],
  },
  {
    name: "browse-party-dresses",
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
    name: "similar-tee",
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
];
