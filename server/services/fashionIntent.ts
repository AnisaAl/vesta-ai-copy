/**
 * Fashion chat intent: one primary intent + optional boosts.
 * Overlap rule (Analyst): when combine+color or similar+style conflict,
 * keep a single primary intent and apply colors/styleTags as retrieval boosts only.
 */

export type FashionIntent =
  | "combine"
  | "similar"
  | "browse"
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
  /** Ask before injecting cards (ambiguous audience/occasion). */
  needsFollowUp?: boolean;
  /** Short reason for debugging / logs */
  rationale?: string;
}

const SIMILAR_CUES =
  /\b(similar|alike|like this|same style|more like|look.?alike|matching shirt|another tee|duplicates?)\b/i;
const COMBINE_CUES =
  /\b(combin|pair with|go with|match with|what (?:pants|skirt|bottom|shoe|bag)|outfit with|wear with|complete (?:the )?look|styl(?:e|ing) this)\b/i;
/** Combine without the ambiguous “go with” / “match with” (those also appear in color asks). */
const STRONG_COMBINE_CUES =
  /\b(combin|pair with|what (?:pants|skirt|bottom|shoe|bag)|outfit with|wear with|complete (?:the )?look|styl(?:e|ing) this)\b/i;
const COLOR_CUES =
  /\b(color|colour|palette|navy|beige|pastel|monochrome|what colors?|colour.?match)\b/i;
const STYLE_CUES =
  /\b(minimal|office|casual|formal|streetwear|boho|elegant|business|party|weekend|athletic|sporty|chic|vintage)\b/i;

const CATEGORY_WORDS: Record<GarmentCategory, string[]> = {
  top: [
    "shirt",
    "shirts",
    "t-shirt",
    "tshirt",
    "tee",
    "tees",
    "tank",
    "tanks",
    "blouse",
    "blouses",
    "sweater",
    "sweaters",
    "cardigan",
    "cardigans",
    "hoodie",
    "hoodies",
    "top",
    "tops",
    "pullover",
    "camisole",
  ],
  bottom: [
    "pants",
    "trousers",
    "jeans",
    "shorts",
    "skirt",
    "skirts",
    "leggings",
    "chino",
    "chinos",
  ],
  dress: ["dress", "dresses", "gown", "gowns", "romper", "rompers", "jumpsuit", "jumpsuits"],
  shoes: ["shoe", "shoes", "sneaker", "sneakers", "boot", "boots", "sandal", "sandals", "heel", "heels", "loafer", "loafers", "footwear"],
  bag: ["bag", "bags", "handbag", "handbags", "purse", "purses", "backpack", "tote"],
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
  outerwear: ["jacket", "jackets", "coat", "coats", "blazer", "blazers", "parka", "vest", "vests", "windbreaker"],
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

const FEMININE_GARMENT_CUES =
  /\b(dress|dresses|gown|gowns|skirt|skirts|blouse|blouses|heels?|camisole)\b/i;

const AMBIVALENT_BROWSE: GarmentCategory[] = [
  "top",
  "bottom",
  "outerwear",
  "shoes",
  "bag",
  "accessory",
];

export function implyAudienceFromGarment(
  text: string,
  anchor: GarmentCategory,
  explicit: FashionAudience
): FashionAudience {
  if (explicit !== "any") return explicit;
  if (anchor === "dress" || FEMININE_GARMENT_CUES.test(text)) return "feminine";
  return "any";
}

function needsBrowseFollowUp(plan: FashionQueryPlan, text: string): boolean {
  if (plan.intent !== "browse") return false;
  if (plan.anchorGarment === "unknown") return true;
  const impliedFeminine =
    plan.audience === "feminine" ||
    plan.anchorGarment === "dress" ||
    FEMININE_GARMENT_CUES.test(text);
  if (impliedFeminine) return false;
  const ambivalent = AMBIVALENT_BROWSE.includes(plan.anchorGarment);
  const missingAudience = plan.audience === "any";
  const missingStyle = plan.styleTags.length === 0;
  return ambivalent && (missingAudience || missingStyle);
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
  const explicitAudience = detectAudience(text);
  let anchor = detectAnchorCategory(text);
  if (hasImage && anchor === "unknown") {
    anchor = "top";
  }
  const audience = implyAudienceFromGarment(text, anchor, explicitAudience);

  let intent: FashionIntent = "general";
  let rationale = "default general";

  if (SIMILAR_CUES.test(text) || /\bsimilar\b/i.test(text)) {
    intent = "similar";
    rationale = "similar cue in text";
  } else if (COMBINE_CUES.test(text) || (hasImage && !SIMILAR_CUES.test(text))) {
    if (COLOR_CUES.test(text) && !hasImage && !STRONG_COMBINE_CUES.test(text)) {
      intent = "color";
      rationale = "color cue without a strong combine ask";
    } else {
      intent = "combine";
      rationale = hasImage && !COMBINE_CUES.test(text)
        ? "image upload defaults to combine"
        : "combine cue in text";
    }
  } else if (anchor !== "unknown" && !hasImage) {
    // Named garment wins over party/navy style-or-color words
    intent = "browse";
    rationale = "named garment browse";
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
  } else if (intent === "similar" || intent === "browse") {
    targetCategories = [anchor === "unknown" ? "top" : anchor];
  } else if (intent === "style" || intent === "general" || intent === "color") {
    targetCategories = [];
  }

  const plan: FashionQueryPlan = {
    intent,
    audience,
    anchorGarment: anchor,
    targetCategories,
    colors,
    styleTags,
    rationale,
  };
  plan.needsFollowUp = needsBrowseFollowUp(plan, text);
  if (plan.needsFollowUp) {
    plan.rationale = `${plan.rationale}; needsFollowUp`;
  }
  return plan;
}

/**
 * Normalize a plan so retrieval policies are consistent:
 * combine → complementary targets (never the anchor alone)
 * similar → same category as anchor
 */
export function applyIntentPolicy(plan: FashionQueryPlan): FashionQueryPlan {
  const next = { ...plan };
  if (next.intent === "combine") {
    const targets =
      COMBINE_TARGETS[next.anchorGarment] || COMBINE_TARGETS.unknown;
    next.targetCategories = targets.filter((c) => c !== next.anchorGarment);
    if (next.targetCategories.length === 0) {
      next.targetCategories = [...targets];
    }
    next.rationale = `${next.rationale || ""}; policy=combine`.trim();
  } else if (next.intent === "similar") {
    const want =
      next.anchorGarment === "unknown"
        ? next.targetCategories[0] || "top"
        : next.anchorGarment;
    next.targetCategories = [want];
    next.anchorGarment = want;
    next.rationale = `${next.rationale || ""}; policy=similar`.trim();
  } else if (next.intent === "browse") {
    const want =
      next.anchorGarment === "unknown"
        ? next.targetCategories[0] || "dress"
        : next.anchorGarment;
    next.targetCategories = [want];
    next.anchorGarment = want;
    next.rationale = `${next.rationale || ""}; policy=browse`.trim();
  }
  return next;
}

/** Heuristic + policy: the plan used for catalog / DeepFashion injection. */
export function buildRetrievalPlan(
  userMessage: string,
  hasImage: boolean,
  priorUserTexts: string[] = []
): FashionQueryPlan {
  const combined = [...priorUserTexts, userMessage].filter(Boolean).join("\n");
  return applyIntentPolicy(detectIntentHeuristic(combined, hasImage));
}

/**
 * Mentor JSON may refine colors/styleTags for display only.
 * Intent, audience, anchor, and targets stay locked to the retrieval plan.
 */
export function mergeMentorHintsForDisplay(
  retrievalPlan: FashionQueryPlan,
  modelPartial: Partial<FashionQueryPlan> | null | undefined
): FashionQueryPlan {
  if (!modelPartial) return retrievalPlan;
  return {
    ...retrievalPlan,
    colors:
      modelPartial.colors && modelPartial.colors.length > 0
        ? modelPartial.colors.map((c) => c.toLowerCase())
        : retrievalPlan.colors,
    styleTags:
      modelPartial.styleTags && modelPartial.styleTags.length > 0
        ? modelPartial.styleTags.map((t) => t.toLowerCase())
        : retrievalPlan.styleTags,
    rationale: `${retrievalPlan.rationale || ""}; mentor_hints`.trim(),
  };
}

export function categoryKeywords(cat: GarmentCategory): string[] {
  return CATEGORY_WORDS[cat] || [];
}
