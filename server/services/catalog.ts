/**
 * Affiliate catalog search — reuses FashionQueryPlan scoring ideas from DeepFashion.
 * Prefer these rows in chat; fall back to DeepFashion when empty.
 */

import type { Product } from "@shared/schema";
import type { FashionOutfit } from "../../client/src/lib/types";
import {
  FashionQueryPlan,
  FashionAudience,
  GarmentCategory,
} from "./fashionIntent";
import { storage } from "../storage";

function productMatchesAudience(
  productAudience: string,
  planAudience: FashionAudience
): boolean {
  if (planAudience === "any") return true;
  if (productAudience === "any" || productAudience === "unknown") return true;
  return productAudience === planAudience;
}

export function productToOutfit(product: Product): FashionOutfit {
  return {
    id: `product-${product.id}`,
    name: product.title,
    description: product.description || product.title,
    imageUrl: product.imageUrl,
    affiliateUrl: product.affiliateUrl,
    priceCents: product.priceCents ?? undefined,
    currency: product.currency,
    merchant: product.merchant,
    source: "affiliate",
  };
}

function scoreProduct(product: Product, plan: FashionQueryPlan): number {
  if (!productMatchesAudience(product.audience, plan.audience || "any")) {
    return -1;
  }

  let score = 0;
  const category = (product.category || "unknown") as GarmentCategory;
  const colors = (product.colors || []).map((c) => c.toLowerCase());
  const styles = (product.styleTags || []).map((s) => s.toLowerCase());
  const haystack = `${product.title} ${product.description}`.toLowerCase();

  if (plan.intent === "combine") {
    if (!plan.targetCategories.includes(category)) return -1;
    score += 8;
    if (category === "bottom") score += 2;
  } else if (plan.intent === "similar") {
    const want = plan.targetCategories[0] || plan.anchorGarment;
    if (want === "unknown") {
      score += 1;
    } else if (category === want) {
      score += 8;
    } else {
      return -1;
    }
  } else if (plan.intent === "color") {
    for (const c of plan.colors) {
      if (colors.includes(c) || haystack.includes(c)) score += 5;
    }
    if (score === 0) return -1;
  } else if (plan.intent === "style") {
    for (const s of plan.styleTags) {
      if (styles.includes(s) || haystack.includes(s)) score += 4;
    }
    if (score === 0) return -1;
  } else {
    score += 1;
  }

  if (plan.intent !== "color") {
    for (const c of plan.colors) {
      if (colors.includes(c) || haystack.includes(c)) score += 3;
    }
  }
  if (plan.intent !== "style") {
    for (const s of plan.styleTags) {
      if (styles.includes(s) || haystack.includes(s)) score += 2;
    }
  }

  return score;
}

/**
 * Intent-aware affiliate search. Returns [] if DB empty or no match
 * (caller should fall back to DeepFashion).
 */
export async function searchAffiliateCatalog(
  plan: FashionQueryPlan,
  limit = 4
): Promise<FashionOutfit[]> {
  try {
    // Pull a wider pool then score in-memory (fixture catalogs are small)
    const pool = await storage.listProducts({
      audience: plan.audience === "any" ? undefined : plan.audience,
      limit: 200,
      offset: 0,
    });

    if (pool.length === 0) return [];

    const scored = pool
      .map((p) => ({ p, score: scoreProduct(p, plan) }))
      .filter((x) => x.score >= 0)
      .sort((a, b) => b.score - a.score);

    let picks = scored.slice(0, limit).map((x) => x.p);

    // Broaden once: drop color/style strictness by taking top general matches
    if (picks.length === 0 && plan.intent !== "general") {
      const broadPlan: FashionQueryPlan = {
        ...plan,
        intent: "general",
        colors: [],
        styleTags: [],
        targetCategories: [],
      };
      picks = pool
        .map((p) => ({ p, score: scoreProduct(p, broadPlan) }))
        .filter((x) => x.score >= 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((x) => x.p);
    }

    // Audience-only fallback for feminine/masculine when filters miss
    if (picks.length === 0 && plan.audience !== "any") {
      picks = pool
        .filter(
          (p) =>
            p.audience === plan.audience ||
            p.audience === "any"
        )
        .slice(0, limit);
    }

    return picks.map(productToOutfit);
  } catch (err) {
    console.error("Affiliate catalog search failed:", err);
    return [];
  }
}

/** Catalog first, DeepFashion second — shared by chat + local fallback. */
export async function resolveOutfitSuggestions(
  plan: FashionQueryPlan,
  limit: number,
  deepFashionSearch: (plan: FashionQueryPlan, limit: number) => FashionOutfit[]
): Promise<{ outfits: FashionOutfit[]; source: "affiliate" | "deepfashion" | "none" }> {
  const affiliate = await searchAffiliateCatalog(plan, limit);
  if (affiliate.length > 0) {
    return { outfits: affiliate, source: "affiliate" };
  }
  const deep = deepFashionSearch(plan, limit);
  if (deep.length > 0) {
    return { outfits: deep, source: "deepfashion" };
  }
  return { outfits: [], source: "none" };
}

export type { FashionAudience };
