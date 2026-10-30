/**
 * Conversation simulations (no Claude, no Postgres).
 *
 * Default: mock catalog (server/fixtures/chat-sim-catalog.ts).
 * Optional: EVAL_CHAT_CORPUS=1 uses local DeepFashion images (still no API tokens).
 *
 * Usage:
 *   npm run eval:chat
 *   EVAL_CHAT_CORPUS=1 npm run eval:chat
 */

import {
  buildRetrievalPlan,
  GarmentCategory,
  FashionAudience,
  FashionQueryPlan,
} from "../services/fashionIntent";
import { searchDeepFashionDetailed } from "../services/deepFashion";
import { trySmallTalkReply, HELP_TAIL } from "../services/fashionSmallTalk";
import {
  formatWardrobeInventory,
  selectWardrobeForChat,
} from "../services/wardrobe";
import {
  CHAT_SIMULATIONS,
  ChatTurnExpect,
  NOT_SIMULATABLE,
} from "../fixtures/chat-simulations";
import { MOCK_CHAT_CATALOG, MockSimItem } from "../fixtures/chat-sim-catalog";
import type { WardrobeItem } from "@shared/schema";
import fs from "node:fs";
import path from "node:path";

type CaseResult = { name: string; ok: boolean; detail: string; hint?: string };

type SimKind = "smallTalk" | "followUp" | "retrieve";

interface SimOutfit {
  name: string;
  description: string;
  imageUrl: string;
  category: GarmentCategory;
}

interface SimulatedTurn {
  kind: SimKind;
  message: string;
  plan: FashionQueryPlan | null;
  outfits: SimOutfit[];
  injected: boolean;
  /** Closet cards chat would prepend (non-shoppable). */
  wardrobeCards: { productId?: unknown; affiliateUrl?: unknown }[];
  wardrobeInventory: string;
}

const USE_CORPUS = process.env.EVAL_CHAT_CORPUS === "1";

const FOLLOW_UP_MESSAGE =
  "I can pull those. Are you shopping for men or women, and is this more casual, office, or party?";

function isMenUrl(url: string): boolean {
  const file = decodeURIComponent(url.split("/").pop() || "");
  return /^MEN-/i.test(file) || file.includes("-MEN-");
}

function isWomenUrl(url: string): boolean {
  const file = decodeURIComponent(url.split("/").pop() || "");
  return /^WOMEN-/i.test(file) || file.includes("-WOMEN-");
}

/** Keep in sync with shouldAttachCatalog in fashionAi.ts */
function wouldInjectCards(plan: FashionQueryPlan, userMessage: string): boolean {
  if (plan.needsFollowUp) return false;
  if (["combine", "similar", "browse", "color", "style", "general"].includes(plan.intent)) {
    if (plan.intent === "general") {
      return /\b(outfit|clothes|clothing|wear|recommend|shirt|dress|pants|skirt|style)\b/i.test(
        userMessage
      );
    }
    return true;
  }
  return false;
}

function audienceOk(itemAudience: FashionAudience, planAudience: FashionAudience): boolean {
  if (planAudience === "any") return true;
  if (itemAudience === "any") return true;
  return itemAudience === planAudience;
}

function mockSearch(plan: FashionQueryPlan, limit: number): SimOutfit[] {
  const scored = MOCK_CHAT_CATALOG.map((item) => ({
    item,
    score: scoreMock(item, plan),
  }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ item }) => ({
    name: item.name,
    description: item.description,
    imageUrl: item.imageUrl,
    category: item.category,
  }));
}

function scoreMock(item: MockSimItem, plan: FashionQueryPlan): number {
  if (!audienceOk(item.audience, plan.audience || "any")) return -1;
  let score = 0;

  if (plan.intent === "combine") {
    if (!plan.targetCategories.includes(item.category)) return -1;
    score += 8;
  } else if (plan.intent === "similar" || plan.intent === "browse") {
    const want = plan.targetCategories[0] || plan.anchorGarment;
    if (want === "unknown" || item.category !== want) return -1;
    score += 8;
  } else if (plan.intent === "color") {
    const hit = plan.colors.some(
      (c) => item.colors.includes(c) || item.description.toLowerCase().includes(c)
    );
    if (!hit) return -1;
    score += 5;
  } else if (plan.intent === "style") {
    const hit = plan.styleTags.some(
      (t) => item.styleTags.includes(t) || item.description.toLowerCase().includes(t)
    );
    if (!hit) return -1;
    score += 4;
  } else {
    score += 1;
  }

  for (const c of plan.colors) {
    if (item.colors.includes(c)) score += 3;
  }
  for (const t of plan.styleTags) {
    if (item.styleTags.includes(t)) score += 2;
  }
  return score;
}

function retrieve(plan: FashionQueryPlan, limit: number): SimOutfit[] {
  if (!USE_CORPUS) return mockSearch(plan, limit);
  const search = searchDeepFashionDetailed(plan, limit);
  return search.outfits.map((o, i) => ({
    name: o.name,
    description: o.description,
    imageUrl: o.imageUrl,
    category: search.categories[i] || "unknown",
  }));
}

function simulateTurn(
  userMessage: string,
  priorUserTexts: string[],
  hasImage: boolean,
  wardrobe: WardrobeItem[] = []
): SimulatedTurn {
  const wardrobeInventory = formatWardrobeInventory(wardrobe);
  if (!hasImage) {
    const smallTalk = trySmallTalkReply(userMessage);
    if (smallTalk) {
      return {
        kind: "smallTalk",
        message: smallTalk,
        plan: null,
        outfits: [],
        injected: false,
        wardrobeCards: [],
        wardrobeInventory,
      };
    }
  }

  const plan = buildRetrievalPlan(userMessage, hasImage, priorUserTexts);
  // Same call fashionAi makes; closet cards attach even when catalog cards are skipped.
  const wardrobeCards = selectWardrobeForChat(wardrobe, plan, userMessage, 2);
  if (plan.needsFollowUp || !wouldInjectCards(plan, userMessage)) {
    return {
      kind: "followUp",
      message: FOLLOW_UP_MESSAGE,
      plan,
      outfits: [],
      injected: false,
      wardrobeCards,
      wardrobeInventory,
    };
  }

  const outfits = retrieve(plan, 4);
  return {
    kind: "retrieve",
    message: `Here are ${plan.anchorGarment} options.`,
    plan,
    outfits,
    injected: outfits.length > 0,
    wardrobeCards,
    wardrobeInventory,
  };
}

function assert(name: string, ok: boolean, detail: string, hint?: string): CaseResult {
  return { name, ok, detail, hint };
}

function checkExpect(
  label: string,
  sim: SimulatedTurn,
  expect: ChatTurnExpect,
  hint?: string
): CaseResult[] {
  const out: CaseResult[] = [];
  out.push(
    assert(
      `${label}:kind`,
      sim.kind === expect.kind,
      `kind=${sim.kind} (expected ${expect.kind})`,
      hint
    )
  );

  if (expect.intent) {
    out.push(
      assert(
        `${label}:intent`,
        sim.plan?.intent === expect.intent,
        `intent=${sim.plan?.intent ?? "none"} (expected ${expect.intent})`,
        hint
      )
    );
  }
  if (expect.audience) {
    out.push(
      assert(
        `${label}:audience`,
        sim.plan?.audience === expect.audience,
        `audience=${sim.plan?.audience ?? "none"} (expected ${expect.audience})`,
        hint
      )
    );
  }

  const n = sim.outfits.length;
  if (expect.outfits !== undefined) {
    out.push(
      assert(`${label}:outfits`, n === expect.outfits, `n=${n} (expected ${expect.outfits})`, hint)
    );
  }
  if (expect.outfitsMin !== undefined) {
    out.push(
      assert(
        `${label}:outfitsMin`,
        n >= expect.outfitsMin,
        `n=${n} (expected >= ${expect.outfitsMin})`,
        hint
      )
    );
  }
  if (expect.outfitsMax !== undefined) {
    out.push(
      assert(
        `${label}:outfitsMax`,
        n <= expect.outfitsMax,
        `n=${n} (expected <= ${expect.outfitsMax})`,
        hint
      )
    );
  }

  if (expect.category) {
    const bad = sim.outfits.filter((o) => o.category !== expect.category);
    out.push(
      assert(
        `${label}:category`,
        n > 0 && bad.length === 0,
        `cats=${sim.outfits.map((o) => o.category).join(",") || "(none)"} (expected all ${expect.category})`,
        hint
      )
    );
  }
  if (expect.categoriesOnly) {
    const allowed = new Set(expect.categoriesOnly);
    const bad = sim.outfits.filter((o) => !allowed.has(o.category));
    out.push(
      assert(
        `${label}:categoriesOnly`,
        n > 0 && bad.length === 0,
        `cats=${sim.outfits.map((o) => o.category).join(",") || "(none)"} allowed=${expect.categoriesOnly.join(",")}`,
        hint
      )
    );
  }

  if (expect.noMen) {
    const leak = sim.outfits.some((o) => isMenUrl(o.imageUrl));
    out.push(
      assert(
        `${label}:noMen`,
        !leak,
        leak ? sim.outfits.map((o) => o.imageUrl.split("/").pop()).join(",") : `n=${n}`,
        hint
      )
    );
  }
  if (expect.noWomen) {
    const leak = sim.outfits.some((o) => isWomenUrl(o.imageUrl));
    out.push(
      assert(
        `${label}:noWomen`,
        !leak,
        leak ? sim.outfits.map((o) => o.imageUrl.split("/").pop()).join(",") : `n=${n}`,
        hint
      )
    );
  }

  if (expect.helpQuestion) {
    const ok =
      sim.message.includes(HELP_TAIL.trim()) ||
      /what can i help you with today/i.test(sim.message) ||
      /looking for style/i.test(sim.message) ||
      /want help with/i.test(sim.message) ||
      /want outfit ideas/i.test(sim.message) ||
      /how can i help/i.test(sim.message);
    out.push(
      assert(
        `${label}:helpQuestion`,
        ok,
        `message=${sim.message.slice(0, 80)}`,
        hint
      )
    );
  }

  if (expect.wardrobeMin !== undefined) {
    out.push(
      assert(
        `${label}:wardrobeMin`,
        sim.wardrobeCards.length >= expect.wardrobeMin,
        `closet cards=${sim.wardrobeCards.length} (expected >= ${expect.wardrobeMin})`,
        hint
      )
    );
  }
  if (expect.wardrobeNotShoppable) {
    const shoppable = sim.wardrobeCards.some((c) => c.productId || c.affiliateUrl);
    out.push(
      assert(
        `${label}:wardrobeNotShoppable`,
        !shoppable && /NOT for sale/.test(sim.wardrobeInventory),
        shoppable
          ? "closet card has productId/affiliateUrl"
          : `inventory=${sim.wardrobeInventory.slice(0, 60)}`,
        hint
      )
    );
  }

  out.push(
    assert(
      `${label}:not-confused`,
      !/not sure i (understand|understood)/i.test(sim.message),
      `message=${sim.message.slice(0, 80)}`,
      hint
    )
  );

  return out;
}

const CATALOG_PATH = path.resolve(process.cwd(), "docs/SHOPPING_QUESTIONS.md");

/** Parse `| A1 | question | S | notes |` rows from the shopper question catalog. */
function readCatalogStatuses(): Map<string, "S" | "P" | "N"> {
  const map = new Map<string, "S" | "P" | "N">();
  const text = fs.readFileSync(CATALOG_PATH, "utf8");
  for (const line of text.split("\n")) {
    const m = line.match(/^\|\s*([A-L]\d+)\s*\|.*\|\s*([SPN])\s*\|/);
    if (m) map.set(m[1], m[2] as "S" | "P" | "N");
  }
  return map;
}

/**
 * Keep docs/SHOPPING_QUESTIONS.md and the sims in sync:
 *  - S rows need a supported sim (or a NOT_SIMULATABLE reason)
 *  - P/N rows need a pending sim (or a NOT_SIMULATABLE reason)
 *  - sims may only reference IDs that exist, with a matching status
 */
function checkCatalogCoverage(): CaseResult[] {
  const out: CaseResult[] = [];
  const catalog = readCatalogStatuses();
  const supportedIds = new Set<string>();
  const pendingIds = new Set<string>();

  for (const sim of CHAT_SIMULATIONS) {
    for (const id of sim.questionIds) {
      (sim.status === "supported" ? supportedIds : pendingIds).add(id);
      const row = catalog.get(id);
      if (!row) {
        out.push(assert(`coverage:${sim.name}`, false, `questionId ${id} not in catalog`));
      } else if (sim.status === "supported" && row !== "S") {
        out.push(assert(`coverage:${sim.name}`, false, `${id} is ${row} in catalog but sim is supported`));
      } else if (sim.status === "pending" && row === "S") {
        out.push(assert(`coverage:${sim.name}`, false, `${id} is S in catalog but sim is pending`));
      }
    }
  }

  for (const [id, row] of Array.from(catalog.entries())) {
    const covered = row === "S" ? supportedIds.has(id) : pendingIds.has(id);
    const exempt = id in NOT_SIMULATABLE;
    out.push(
      assert(
        `coverage:${id}`,
        covered || exempt,
        covered
          ? `${row} covered by ${row === "S" ? "supported" : "pending"} sim`
          : exempt
            ? `not simulatable: ${NOT_SIMULATABLE[id]}`
            : `${row} row has no ${row === "S" ? "supported" : "pending"} sim and no NOT_SIMULATABLE entry`
      )
    );
  }
  return out;
}

function run(): number {
  const results: CaseResult[] = [];
  const pendingLines: string[] = [];
  console.log(
    USE_CORPUS
      ? "eval:chat — DeepFashion corpus (still no Claude)\n"
      : "eval:chat — mock catalog (no Claude, no Postgres, no DeepFashion)\n"
  );

  for (const sim of CHAT_SIMULATIONS) {
    const prior: string[] = [];
    sim.turns.forEach((turn, i) => {
      const out = simulateTurn(turn.user, prior, Boolean(turn.hasImage), turn.wardrobe);
      const label = `${sim.name}/t${i + 1}`;
      if (sim.status === "pending") {
        const plan = out.plan;
        const router = plan
          ? `${out.kind} intent=${plan.intent} anchor=${plan.anchorGarment}`
          : out.kind;
        pendingLines.push(
          `PEND  ${sim.questionIds.join(",")} "${turn.user}" — router today: ${router} | gap: ${sim.gap}`
        );
      } else if (!turn.expect) {
        results.push(assert(`${label}:expect`, false, "supported sim turn is missing expect"));
      } else {
        results.push(...checkExpect(label, out, turn.expect, turn.hint));
      }
      prior.push(turn.user);
    });
  }

  results.push(...checkCatalogCoverage());

  let failed = 0;
  for (const r of results) {
    const mark = r.ok ? "PASS" : "FAIL";
    if (!r.ok) failed += 1;
    const hint = !r.ok && r.hint ? ` | improve: ${r.hint}` : "";
    console.log(`${mark}  ${r.name} — ${r.detail}${hint}`);
  }
  if (pendingLines.length) {
    console.log("");
    for (const line of pendingLines) console.log(line);
  }
  console.log(
    `\n${results.length - failed}/${results.length} passed` +
      (failed ? ` (${failed} failed)` : "") +
      `, ${pendingLines.length} pending`
  );
  return failed;
}

process.exit(run());
