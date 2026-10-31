/**
 * Affiliate catalog search — reuses FashionQueryPlan scoring ideas from DeepFashion.
 * Prefer these rows in chat; fall back to DeepFashion when empty.
 * M3.5: no silent general / audience-only fill for focused intents.
 */

import type { Product } from "@shared/schema";
import type { FashionOutfit } from "../../client/src/lib/types";
import {
  FashionQueryPlan,
  FashionAudience,
  GarmentCategory,
} from "./fashionIntent";
import type { MatchQuality } from "./deepFashion";
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
    productId: product.id,
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
  } else if (plan.intent === "browse") {
    const want = plan.targetCategories[0] || plan.anchorGarment;
    if (want === "unknown" || category !== want) return -1;
    score += 8;
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

export interface AffiliateSearchResult {
  outfits: FashionOutfit[];
  match: MatchQuality;
  categories: GarmentCategory[];
}

/**
 * Intent-aware affiliate search.
 * Combine/similar may drop color/style boosts once; never collapse to general.
 * Color with no hits → empty (palette JSON still shown by mentor).
 */
export async function searchAffiliateCatalogDetailed(
  plan: FashionQueryPlan,
  limit = 4
): Promise<AffiliateSearchResult> {
  try {
    const pool = await storage.listProducts({
      audience: plan.audience === "any" ? undefined : plan.audience,
      limit: 200,
      offset: 0,
    });

    if (pool.length === 0) {
      return { outfits: [], match: "empty", categories: [] };
    }

    const rank = (p: FashionQueryPlan) =>
      pool
        .map((product) => ({ product, score: scoreProduct(product, p) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((x) => x.product);

    let picks = rank(plan);
    let match: MatchQuality = picks.length > 0 ? "strict" : "empty";

    if (
      picks.length === 0 &&
      (plan.intent === "combine" || plan.intent === "similar") &&
      (plan.colors.length > 0 || plan.styleTags.length > 0)
    ) {
      picks = rank({ ...plan, colors: [], styleTags: [] });
      if (picks.length > 0) match = "broadened";
    }

    if (plan.intent === "browse" && picks.length < limit) {
      const extra = rank({ ...plan, colors: [], styleTags: [] });
      const seen = new Set(picks.map((p) => p.id));
      for (const product of extra) {
        if (picks.length >= limit) break;
        if (!seen.has(product.id)) {
          picks.push(product);
          seen.add(product.id);
          if (plan.styleTags.length > 0 || plan.colors.length > 0) {
            match = "broadened";
          }
        }
      }
    }

    if (picks.length === 0) {
      return { outfits: [], match: "empty", categories: [] };
    }

    return {
      outfits: picks.map(productToOutfit),
      match,
      categories: picks.map((p) => (p.category || "unknown") as GarmentCategory),
    };
  } catch (err) {
    console.error("Affiliate catalog search failed:", err);
    return { outfits: [], match: "empty", categories: [] };
  }
}

export type OutfitSource = "affiliate" | "deepfashion" | "none";

/** Catalog first, DeepFashion second — shared by chat + local fallback. */
export async function resolveOutfitSuggestions(
  plan: FashionQueryPlan,
  limit: number,
  deepFashionSearch: (
    plan: FashionQueryPlan,
    limit: number
  ) => { outfits: FashionOutfit[]; match: MatchQuality; categories: GarmentCategory[] }
): Promise<{
  outfits: FashionOutfit[];
  source: OutfitSource;
  match: MatchQuality;
  categories: GarmentCategory[];
}> {
  const affiliate = await searchAffiliateCatalogDetailed(plan, limit);
  const deep = deepFashionSearch(plan, limit);

  if (plan.intent === "browse") {
    const outfits: FashionOutfit[] = [...affiliate.outfits];
    const seen = new Set(outfits.map((o) => o.id));
    for (const item of deep.outfits) {
      if (outfits.length >= limit) break;
      if (!seen.has(item.id)) {
        outfits.push(item);
        seen.add(item.id);
      }
    }
    if (outfits.length > 0) {
      const source: OutfitSource =
        affiliate.outfits.length > 0 && outfits.length > affiliate.outfits.length
          ? "affiliate"
          : affiliate.outfits.length > 0
            ? "affiliate"
            : "deepfashion";
      return {
        outfits: outfits.slice(0, limit),
        source,
        match:
          affiliate.match === "broadened" || deep.match === "broadened"
            ? "broadened"
            : outfits.length
              ? "strict"
              : "empty",
        categories: outfits
          .slice(0, limit)
          .map(() => (plan.targetCategories[0] || "unknown") as GarmentCategory),
      };
    }
  } else if (affiliate.outfits.length > 0) {
    return {
      outfits: affiliate.outfits,
      source: "affiliate",
      match: affiliate.match,
      categories: affiliate.categories,
    };
  }

  if (deep.outfits.length > 0) {
    return {
      outfits: deep.outfits,
      source: "deepfashion",
      match: deep.match,
      categories: deep.categories,
    };
  }
  return { outfits: [], source: "none", match: "empty", categories: [] };
}

export type { FashionAudience };
