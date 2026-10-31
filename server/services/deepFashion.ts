import { readFileSync, readdirSync } from "fs";
import path from "path";
import { FashionOutfit } from "../../client/src/lib/types";
import {
  FashionQueryPlan,
  GarmentCategory,
  GenderPresentation,
  categoryKeywords,
  inferGenderPresentation,
  itemMatchesAudience,
  buildRetrievalPlan,
} from "./fashionIntent";

interface DeepFashionItem {
  id: string;
  fileName: string;
  caption: string;
  imageUrl: string;
  primaryCategory: GarmentCategory;
  categories: GarmentCategory[];
  colors: string[];
  styleTags: string[];
  genderPresentation: GenderPresentation;
}

let deepFashionCache: DeepFashionItem[] | null = null;

const DEEPFASHION_ROOT =
  process.env.DEEPFASHION_ROOT ||
  path.join(process.cwd(), "server", "data", "DeepFashion-MultiModal");
const IMAGES_DIR = path.join(DEEPFASHION_ROOT, "images");
const CAPTIONS_PATH = path.join(DEEPFASHION_ROOT, "captions.json");

const COLOR_WORDS = [
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
];

const STYLE_WORDS = [
  "casual",
  "formal",
  "elegant",
  "sporty",
  "athletic",
  "business",
  "party",
  "minimal",
  "vintage",
  "chic",
  "office",
];

function wordHit(haystack: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^a-z])${escaped}(?:[^a-z]|$)`, "i").test(haystack);
}

const DF_FOLDER_CATEGORY: Record<string, GarmentCategory> = {
  dresses: "dress",
  rompers_jumpsuits: "dress",
  tees_tanks: "top",
  graphic_tees: "top",
  blouses_shirts: "top",
  shirts_polos: "top",
  sweaters: "top",
  cardigans: "top",
  sweatshirts_hoodies: "top",
  jackets_coats: "outerwear",
  jackets_vests: "outerwear",
  suiting: "outerwear",
  pants: "bottom",
  shorts: "bottom",
  skirts: "bottom",
  denim: "bottom",
  leggings: "bottom",
};

function categoryFromFileName(fileName: string): GarmentCategory | null {
  const match = fileName.match(/^(?:MEN|WOMEN)-([^-]+)-/i);
  if (!match) return null;
  return DF_FOLDER_CATEGORY[match[1].toLowerCase()] || null;
}

function inferCategories(haystack: string): GarmentCategory[] {
  const cats: GarmentCategory[] = [];
  const order: GarmentCategory[] = [
    "dress",
    "outerwear",
    "bottom",
    "top",
    "shoes",
    "bag",
    "accessory",
  ];
  for (const cat of order) {
    if (categoryKeywords(cat).some((w) => wordHit(haystack, w))) {
      cats.push(cat);
    }
  }
  return cats;
}

function inferPrimaryCategory(haystack: string, cats: GarmentCategory[]): GarmentCategory {
  if (cats.length === 0) return "unknown";

  const hasTop = cats.includes("top") || cats.includes("outerwear");
  const hasBottom = cats.includes("bottom");
  const hasDress = cats.includes("dress");

  // Full-body shots often mention shirt + trousers. Prefer the garment that
  // matches exclusive keywords first; if both top+bottom, prefer bottom only
  // when trousers/skirt/jeans are present AND no stronger dress.
  if (hasDress) return "dress";
  if (cats.includes("outerwear") && (wordHit(haystack, "jacket") || wordHit(haystack, "coat") || wordHit(haystack, "blazer"))) {
    return "outerwear";
  }
  if (hasTop && hasBottom) {
    // Dual mention: primary follows the first strongly signaled piece; default top for tees
    if (
      wordHit(haystack, "tank") ||
      wordHit(haystack, "t-shirt") ||
      wordHit(haystack, "sweater") ||
      wordHit(haystack, "hoodie")
    ) {
      return "top";
    }
    if (
      wordHit(haystack, "skirt") ||
      wordHit(haystack, "shorts")
    ) {
      return "bottom";
    }
    // shirt + trousers → treat as bottom-featuring look for combine filters
    if (wordHit(haystack, "trousers") || wordHit(haystack, "pants") || wordHit(haystack, "jeans")) {
      return "bottom";
    }
    return "top";
  }
  if (hasBottom) return "bottom";
  if (hasTop) return cats.includes("outerwear") && !cats.includes("top") ? "outerwear" : "top";
  if (cats.includes("shoes")) return "shoes";
  if (cats.includes("bag")) return "bag";
  if (cats.includes("accessory")) return "accessory";
  return cats[0];
}

function loadDeepFashionData(): DeepFashionItem[] {
  if (deepFashionCache) return deepFashionCache;

  try {
    const captionsRaw = readFileSync(CAPTIONS_PATH, "utf-8");
    const captions: Record<string, string> = JSON.parse(captionsRaw);
    const imageFiles = new Set<string>(readdirSync(IMAGES_DIR));
    const items: DeepFashionItem[] = [];

    for (const [fileName, caption] of Object.entries(captions)) {
      if (!imageFiles.has(fileName)) continue;

      const lower = fileName.toLowerCase();
      if (
        !lower.includes("_full") &&
        !lower.includes("_front") &&
        !lower.includes("_1_front")
      ) {
        continue;
      }

      const haystack = `${caption} ${fileName}`.toLowerCase();
      const fileCat = categoryFromFileName(fileName);
      const categories = inferCategories(haystack);
      if (fileCat && !categories.includes(fileCat)) {
        categories.unshift(fileCat);
      }
      const primaryCategory =
        fileCat || inferPrimaryCategory(haystack, categories);
      const colors = COLOR_WORDS.filter((c) => haystack.includes(c));
      const styleTags = STYLE_WORDS.filter((s) => haystack.includes(s));
      const genderPresentation = inferGenderPresentation(fileName, caption);

      items.push({
        id: `deepfashion-${fileName.replace(/[^a-zA-Z0-9_-]/g, "_")}`,
        fileName,
        caption,
        imageUrl: `/data/deepfashion/images/${encodeURIComponent(fileName)}`,
        primaryCategory,
        categories,
        colors,
        styleTags,
        genderPresentation,
      });
    }

    deepFashionCache = items;
    console.log(
      `✓ Loaded ${items.length} DeepFashion-MultiModal items from ${IMAGES_DIR}`
    );
    return items;
  } catch (error) {
    console.error("Error loading DeepFashion-MultiModal data:", error);
    deepFashionCache = [];
    return [];
  }
}

function itemToOutfit(item: DeepFashionItem): FashionOutfit {
  const labels: Partial<Record<GarmentCategory, string>> = {
    dress: "Dress look",
    outerwear: "Outerwear look",
    bottom: "Bottoms look",
    top: "Top look",
    shoes: "Footwear look",
    bag: "Bag look",
    accessory: "Accessory look",
  };
  return {
    id: item.id,
    name: labels[item.primaryCategory] || "Outfit",
    description: item.caption,
    imageUrl: item.imageUrl,
    source: "deepfashion",
  };
}

function getRandomDeepFashionItems(
  limit: number,
  audience: FashionQueryPlan["audience"] = "any"
): DeepFashionItem[] {
  const allItems = loadDeepFashionData().filter((item) =>
    itemMatchesAudience(item.genderPresentation, audience)
  );
  if (allItems.length === 0) return [];
  const shuffled = [...allItems].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
}

function scoreItem(item: DeepFashionItem, plan: FashionQueryPlan): number {
  if (!itemMatchesAudience(item.genderPresentation, plan.audience || "any")) {
    return -1;
  }
  let score = 0;
  const haystack = `${item.caption} ${item.fileName}`.toLowerCase();

  if (plan.intent === "combine") {
    const targets = plan.targetCategories;
    if (!targets.includes(item.primaryCategory)) return -1;
    score += 8;
    if (item.primaryCategory === "bottom") score += 2;
  } else if (plan.intent === "similar") {
    const want = plan.targetCategories[0] || plan.anchorGarment;
    if (want === "unknown") {
      score += 1;
    } else if (item.primaryCategory === want) {
      score += 8;
    } else {
      return -1;
    }
  } else if (plan.intent === "browse") {
    const want = plan.targetCategories[0] || plan.anchorGarment;
    if (want === "unknown" || item.primaryCategory !== want) return -1;
    score += 8;
  } else if (plan.intent === "color") {
    for (const c of plan.colors) {
      if (item.colors.includes(c) || wordHit(haystack, c)) score += 5;
    }
    if (score === 0) return -1;
  } else if (plan.intent === "style") {
    for (const s of plan.styleTags) {
      if (item.styleTags.includes(s) || wordHit(haystack, s)) score += 4;
    }
    if (plan.styleTags.some((t) => ["office", "formal", "business", "minimal"].includes(t))) {
      if (wordHit(haystack, "blazer") || wordHit(haystack, "trousers") || wordHit(haystack, "shirt")) {
        score += 2;
      }
    }
    if (score === 0) return -1;
  } else {
    // general: weak base; color/style boosts below
    score += 1;
  }

  if (plan.intent !== "color") {
    for (const c of plan.colors) {
      if (item.colors.includes(c) || wordHit(haystack, c)) score += 3;
    }
  }
  if (plan.intent !== "style") {
    for (const s of plan.styleTags) {
      if (item.styleTags.includes(s) || wordHit(haystack, s)) score += 2;
    }
  }

  return score;
}

export type MatchQuality = "strict" | "broadened" | "empty";

export interface DeepFashionSearchResult {
  outfits: FashionOutfit[];
  match: MatchQuality;
  categories: GarmentCategory[];
}

/**
 * Intent-aware DeepFashion retrieval.
 * Focused intents never fall back to random fills (M3.5).
 * One broaden pass only: drop color/style boosts while keeping category rules.
 */
export function searchDeepFashionDetailed(
  plan: FashionQueryPlan,
  limit: number = 4
): DeepFashionSearchResult {
  const allItems = loadDeepFashionData();
  if (allItems.length === 0) {
    return { outfits: [], match: "empty", categories: [] };
  }

  const rank = (p: FashionQueryPlan) => {
    const scored = allItems
      .map((item) => ({ item, score: scoreItem(item, p) }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((s) => s.item);
  };

  let selected = rank(plan);
  let match: MatchQuality = selected.length > 0 ? "strict" : "empty";

  if (
    selected.length === 0 &&
    (plan.colors.length > 0 || plan.styleTags.length > 0) &&
    (plan.intent === "combine" ||
      plan.intent === "similar" ||
      plan.intent === "style" ||
      plan.intent === "color")
  ) {
    // Keep category / color primary rules; only drop secondary boosts for combine/similar.
    // For color: no broaden (empty is better than random).
    // For style: one pass without requiring exact style tag — use formal/office caption cues via empty styleTags + general? No — that becomes random.
    // Style broaden: keep intent style but allow score via formal synonyms by using styleTags cleared and intent general with audience only — too loose.
    // Style: broaden by dropping styleTags but requiring at least one of blazer/trousers/shirt in haystack via a soft plan
    if (plan.intent === "color") {
      // no broaden — empty beats random color-mismatched looks
    } else if (plan.intent === "style") {
      const officeish = allItems
        .filter((item) =>
          itemMatchesAudience(item.genderPresentation, plan.audience || "any")
        )
        .filter((item) => {
          const h = `${item.caption} ${item.fileName}`.toLowerCase();
          return (
            wordHit(h, "blazer") ||
            wordHit(h, "trousers") ||
            wordHit(h, "suit") ||
            item.styleTags.some((t) =>
              ["office", "formal", "business", "minimal", "elegant"].includes(t)
            )
          );
        })
        .slice(0, limit);
      selected = officeish;
      if (selected.length > 0) match = "broadened";
    } else {
      selected = rank({ ...plan, colors: [], styleTags: [] });
      if (selected.length > 0) match = "broadened";
    }
  }

  if (selected.length === 0 && plan.intent === "combine") {
    selected = rank({
      ...plan,
      targetCategories: plan.targetCategories.length
        ? plan.targetCategories
        : ["bottom", "shoes", "bag"],
      colors: [],
      styleTags: [],
    });
    if (selected.length > 0) match = "broadened";
  }

  if (plan.intent === "browse" && selected.length < limit) {
    const extra = rank({ ...plan, colors: [], styleTags: [] });
    const seen = new Set(selected.map((item) => item.id));
    for (const item of extra) {
      if (selected.length >= limit) break;
      if (!seen.has(item.id)) {
        selected.push(item);
        seen.add(item.id);
        if (plan.styleTags.length > 0 || plan.colors.length > 0) {
          match = "broadened";
        }
      }
    }
  }

  // general only: audience-scoped sample when nothing ranked
  if (selected.length === 0 && plan.intent === "general") {
    selected = getRandomDeepFashionItems(limit, plan.audience || "any");
    if (selected.length > 0) match = "broadened";
  }

  if (selected.length === 0) {
    return { outfits: [], match: "empty", categories: [] };
  }

  return {
    outfits: selected.map(itemToOutfit),
    match,
    categories: selected.map((i) => i.primaryCategory),
  };
}

export function searchDeepFashion(
  plan: FashionQueryPlan,
  limit: number = 4
): FashionOutfit[] {
  return searchDeepFashionDetailed(plan, limit).outfits;
}

/** @deprecated Chat uses searchDeepFashionDetailed; kept for GET /api/recommendations. */
export function getDeepFashionOutfits(
  query: string,
  limit: number = 4
): FashionOutfit[] {
  return searchDeepFashion(buildRetrievalPlan(query, false), limit);
}

export function getDeepFashionRecommendations(
  limit: number = 12
): FashionOutfit[] {
  return getRandomDeepFashionItems(limit, "any").map(itemToOutfit);
}
