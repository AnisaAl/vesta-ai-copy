/**
 * Fashion chat intent: one primary intent + optional boosts.
 * Overlap rule (Analyst): when combine+color or similar+style conflict,
 * keep a single primary intent and apply colors/styleTags as retrieval boosts only.
 */

export type FashionIntent =
  | "combine"
  | "similar"
  | "color"
  | "style"
  | "general";

/** Who the recommendations are for (presentation / catalog slice). */
export type FashionAudience = "feminine" | "masculine" | "any";

/** Catalog item presentation inferred from filename + caption. */
export type GenderPresentation = "feminine" | "masculine" | "unknown";

export type GarmentCategory =
  | "top"
  | "bottom"
  | "dress"
  | "shoes"
  | "bag"
  | "accessory"
  | "outerwear"
  | "unknown";

export interface FashionQueryPlan {
  intent: FashionIntent;
  audience: FashionAudience;
  anchorGarment: GarmentCategory;
  targetCategories: GarmentCategory[];
  colors: string[];
  styleTags: string[];
  /** Short reason for debugging / logs */
  rationale?: string;
}

const SIMILAR_CUES =
  /\b(similar| alike|like this|same style|more like|look.?alike|matching shirt|another tee|duplicates?)\b/i;
const COMBINE_CUES =
  /\b(combin|pair with|go with|match with|what (?:pants|skirt|bottom|shoe|bag)|outfit with|wear with|complete (?:the )?look|styl(?:e|ing) this)\b/i;
const COLOR_CUES =
  /\b(color|colour|palette|navy|beige|pastel|monochrome|what colors?|colour.?match)\b/i;
const STYLE_CUES =
  /\b(minimal|office|casual|formal|streetwear|boho|elegant|business|party|weekend|athletic|sporty|chic|vintage)\b/i;

const CATEGORY_WORDS: Record<GarmentCategory, string[]> = {
  top: [
    "shirt",
    "t-shirt",
    "tshirt",
    "tee",
    "tank",
    "blouse",
    "sweater",
    "cardigan",
    "hoodie",
    "top",
    "pullover",
    "camisole",
  ],
  bottom: [
    "pants",
    "trousers",
    "jeans",
    "shorts",
    "skirt",
    "leggings",
    "chino",
  ],
  dress: ["dress", "gown", "romper", "jumpsuit"],
  shoes: ["shoe", "sneaker", "boot", "sandal", "heel", "loafer", "footwear"],
  bag: ["bag", "handbag", "purse", "backpack", "tote"],
  accessory: [
    "hat",
    "scarf",
    "belt",
    "watch",
    "necklace",
    "earring",
    "ring",
    "sunglasses",
    "accessory",
  ],
  outerwear: ["jacket", "coat", "blazer", "parka", "vest", "windbreaker"],
  unknown: [],
};

/** Complementary targets when combining with an anchor garment */
export const COMBINE_TARGETS: Record<GarmentCategory, GarmentCategory[]> = {
  top: ["bottom", "shoes", "bag"],
  outerwear: ["bottom", "top", "shoes"],
  bottom: ["top", "shoes", "bag"],
  dress: ["shoes", "bag", "outerwear"],
  shoes: ["top", "bottom", "dress"],
  bag: ["top", "bottom", "dress"],
  accessory: ["top", "bottom", "dress"],
  unknown: ["bottom", "shoes", "bag"],
};

export function detectAnchorCategory(text: string): GarmentCategory {
  const lower = text.toLowerCase();
  let best: GarmentCategory = "unknown";
  let bestScore = 0;
  for (const [cat, words] of Object.entries(CATEGORY_WORDS) as [
    GarmentCategory,
    string[],
  ][]) {
    if (cat === "unknown") continue;
    let score = 0;
    for (const w of words) {
      if (lower.includes(w)) score += w.length > 4 ? 2 : 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = cat;
    }
  }
  return best;
}

export function extractColorTerms(text: string): string[] {
  const palette = [
    "black",
    "white",
    "red",
    "blue",
    "navy",
    "green",
    "yellow",
    "pink",
    "purple",
    "brown",
    "beige",
    "gray",
    "grey",
    "orange",
    "cream",
    "khaki",
    "denim",
    "burgundy",
    "olive",
    "coral",
    "camel",
    "gold",
    "silver",
  ];
  const lower = text.toLowerCase();
  return palette.filter((c) => lower.includes(c));
}

export function extractStyleTags(text: string): string[] {
  const tags = [
    "minimal",
    "office",
    "casual",
    "formal",
    "streetwear",
    "boho",
    "elegant",
    "business",
    "party",
    "weekend",
    "athletic",
    "sporty",
    "chic",
    "vintage",
  ];
  const lower = text.toLowerCase();
  return tags.filter((t) => lower.includes(t));
}

const FEMININE_AUDIENCE =
  /\b(women|woman|female|feminine|lady|ladies|girl|girls|she|her|hers|womens)\b/i;
const MASCULINE_AUDIENCE =
  /\b(men|man|male|masculine|gentleman|guy|guys|boys?|he|him|his|mens)\b/i;

/** Detect who the user is shopping / styling for from their message. */
export function detectAudience(text: string): FashionAudience {
  const hasFem = FEMININE_AUDIENCE.test(text);
  const hasMas = MASCULINE_AUDIENCE.test(text);
  if (hasFem && !hasMas) return "feminine";
  if (hasMas && !hasFem) return "masculine";
  // "he or she" / both → any
  return "any";
}

/**
 * Infer presentation from DeepFashion filename (MEN-/WOMEN-) and caption cues.
 * Filename wins when present.
 */
export function inferGenderPresentation(
  fileName: string,
  caption: string
): GenderPresentation {
  const fn = fileName.toUpperCase();
  if (fn.startsWith("WOMEN-") || fn.includes("-WOMEN-")) return "feminine";
  if (fn.startsWith("MEN-") || fn.includes("-MEN-")) return "masculine";

  const hay = caption.toLowerCase();
  const femHits = [
    "woman",
    "women",
    "lady",
    "female",
    "her ",
    " she ",
    "girl",
  ].filter((w) => hay.includes(w)).length;
  const masHits = [
    "gentleman",
    " man ",
    "man is",
    "guy",
    "male",
    " his ",
    " he ",
  ].filter((w) => hay.includes(w)).length;

  // Strong caption pronouns / nouns
  if (/\b(gentleman|guy|guys)\b/.test(hay) || /\bthis man\b/.test(hay) || /\bhis\b/.test(hay)) {
    if (!/\b(lady|woman|female|her|she)\b/.test(hay)) return "masculine";
  }
  if (/\b(lady|woman|female|girl)\b/.test(hay) || /\bher\b/.test(hay) || /\bshe\b/.test(hay)) {
    if (!/\b(gentleman|guy|man|his|he)\b/.test(hay)) return "feminine";
  }

  if (femHits > masHits) return "feminine";
  if (masHits > femHits) return "masculine";
  return "unknown";
}

export function itemMatchesAudience(
  presentation: GenderPresentation,
  audience: FashionAudience
): boolean {
  if (audience === "any") return true;
  if (presentation === "unknown") return true; // keep unisex / unclear
  if (audience === "feminine") return presentation !== "masculine";
  if (audience === "masculine") return presentation !== "feminine";
  return true;
}

/**
 * Deterministic intent when Claude JSON is missing.
 * Image upload defaults to combine unless user asks for similar.
 */
export function detectIntentHeuristic(
  userMessage: string,
  hasImage: boolean
): FashionQueryPlan {
  const text = userMessage || "";
  const colors = extractColorTerms(text);
  const styleTags = extractStyleTags(text);
  const audience = detectAudience(text);
  let anchor = detectAnchorCategory(text);
  if (hasImage && anchor === "unknown") {
    // Uploads without wording usually are a top/anchor piece
    anchor = "top";
  }

  let intent: FashionIntent = "general";
  let rationale = "default general";

  if (SIMILAR_CUES.test(text) || /\bsimilar\b/i.test(text)) {
    intent = "similar";
    rationale = "similar cue in text";
  } else if (COMBINE_CUES.test(text) || (hasImage && !SIMILAR_CUES.test(text))) {
    intent = "combine";
    rationale = hasImage && !COMBINE_CUES.test(text)
      ? "image upload defaults to combine"
      : "combine cue in text";
  } else if (COLOR_CUES.test(text) && !hasImage) {
    intent = "color";
    rationale = "color cue without image";
  } else if (STYLE_CUES.test(text)) {
    intent = "style";
    rationale = "style cue in text";
  } else if (
    /\b(outfit|clothes|clothing|wear|recommend|shirt|dress|pants|skirt)\b/i.test(
      text
    )
  ) {
    intent = "general";
    rationale = "clothing query without stronger intent";
  }

  if (audience !== "any") {
    rationale += `; audience=${audience}`;
  }

  let targetCategories: GarmentCategory[] = [];
  if (intent === "combine") {
    targetCategories = COMBINE_TARGETS[anchor] || COMBINE_TARGETS.unknown;
  } else if (intent === "similar") {
    targetCategories = [anchor === "unknown" ? "top" : anchor];
  } else if (intent === "style" || intent === "general") {
    targetCategories = [];
  } else if (intent === "color") {
    targetCategories = [];
  }

  return {
    intent,
    audience,
    anchorGarment: anchor,
    targetCategories,
    colors,
    styleTags,
    rationale,
  };
}

/** Merge Claude-provided intent JSON with heuristics (Claude wins on intent if valid). */
export function mergeIntentFromModel(
  heuristic: FashionQueryPlan,
  modelPartial: Partial<FashionQueryPlan> | null | undefined
): FashionQueryPlan {
  if (!modelPartial) return heuristic;
  const validIntents: FashionIntent[] = [
    "combine",
    "similar",
    "color",
    "style",
    "general",
  ];
  const validAudiences: FashionAudience[] = ["feminine", "masculine", "any"];
  const intent =
    modelPartial.intent && validIntents.includes(modelPartial.intent)
      ? modelPartial.intent
      : heuristic.intent;

  const audience =
    modelPartial.audience && validAudiences.includes(modelPartial.audience)
      ? modelPartial.audience
      : heuristic.audience;

  const anchor =
    modelPartial.anchorGarment && modelPartial.anchorGarment !== "unknown"
      ? modelPartial.anchorGarment
      : heuristic.anchorGarment;

  let targetCategories =
    Array.isArray(modelPartial.targetCategories) &&
    modelPartial.targetCategories.length > 0
      ? modelPartial.targetCategories
      : heuristic.targetCategories;

  if (intent === "combine" && targetCategories.length === 0) {
    targetCategories = COMBINE_TARGETS[anchor] || COMBINE_TARGETS.unknown;
  }
  if (intent === "similar" && targetCategories.length === 0) {
    targetCategories = [anchor === "unknown" ? "top" : anchor];
  }

  return {
    intent,
    audience,
    anchorGarment: anchor,
    targetCategories,
    colors:
      modelPartial.colors && modelPartial.colors.length > 0
        ? modelPartial.colors.map((c) => c.toLowerCase())
        : heuristic.colors,
    styleTags:
      modelPartial.styleTags && modelPartial.styleTags.length > 0
        ? modelPartial.styleTags.map((t) => t.toLowerCase())
        : heuristic.styleTags,
    rationale: modelPartial.rationale || heuristic.rationale,
  };
}

export function categoryKeywords(cat: GarmentCategory): string[] {
  return CATEGORY_WORDS[cat] || [];
}
