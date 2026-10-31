import Anthropic from '@anthropic-ai/sdk';
import { Message } from "@shared/schema";
import { generateLocalFashionResponse } from "./fashionData";
import { searchDeepFashion } from "./deepFashion";
import { resolveOutfitSuggestions } from "./catalog";
import {
  FashionQueryPlan,
  detectIntentHeuristic,
  mergeIntentFromModel,
} from "./fashionIntent";

const anthropic = new Anthropic({ 
  apiKey: process.env.ANTHROPIC_API_KEY || "" 
});

let useLocalDataFallback = false;

function prepareConversationHistory(history: Message[]) {
  return history.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
}

const SYSTEM_PROMPT = `You are Vesta, a fashion mentor. Help users combine clothes, find similar pieces, choose colors, and refine style.

## Intent (required)
Classify every clothing request into ONE primary intent:
- combine: user has/uploads a garment and needs complementary pieces (e.g. tee → pants/skirts/shoes)
- similar: user wants lookalikes of the same garment type
- color: user asks for palettes / what colors work
- style: user asks for a vibe/occasion (office, casual, minimal…)
- general: broad outfit advice without the above

If intents overlap (e.g. combine + color), keep ONE primary intent and put extra color/style hints in the JSON fields below — do not invent a second intent.

## Audience (required)
Set "audience" so catalog images match who is being dressed:
- feminine: woman, women, female, feminine, lady, girl, she/her
- masculine: man, men, male, masculine, gentleman, guy, he/him
- any: unspecified or explicitly unisex

Never describe or imply men's catalog looks (gentleman, man, guy, his…) when audience is feminine, and the reverse for masculine.

## Response format
Write a short human explanation, then ONE json code block:

\`\`\`json
{
  "intent": "combine",
  "audience": "feminine",
  "anchorGarment": "top",
  "targetCategories": ["bottom", "shoes", "bag"],
  "colors": [{"name": "Navy", "hexCode": "#000080"}],
  "styleTags": ["casual"],
  "outfits": [],
  "accessories": [
    {"id": "acc1", "name": "Leather belt", "description": "Defines the waist", "icon": "ri-contrast-drop-line"}
  ],
  "conclusion": "Short wrap-up."
}
\`\`\`

Rules for fields:
- intent, audience, anchorGarment, targetCategories, styleTags: required for clothing queries (use [] if none).
- audience one of: feminine, masculine, any
- anchorGarment one of: top, bottom, dress, shoes, bag, accessory, outerwear, unknown
- targetCategories: for combine = complementary categories; for similar = [same as anchor]; else []
- colors: use {name, hexCode} objects when discussing color; else []
- outfits: ALWAYS leave "outfits" as []. The server injects shoppable affiliate products when available, else DeepFashion imagery. Never invent Unsplash or other external image URLs.
- accessories: Remix Icon class names (ri-*) when helpful; else []

## Image uploads
1. Identify the main garment (anchor), colors, style, and likely audience if visible or stated.
2. Default intent is combine unless the user asks for similar items.
3. For combine: recommend bottoms/skirts/shoes/bags — not more of the same garment.
4. For similar: stay on the same garment category.

## Tone
Concise, practical mentoring. Steer non-fashion chat gently back to style.`;

function extractJsonBlock(message: string): { json: any; raw: string } | null {
  const jsonMatch = message.match(/```json([\s\S]*?)```/);
  if (!jsonMatch) return null;
  try {
    return { json: JSON.parse(jsonMatch[1].trim()), raw: jsonMatch[0] };
  } catch {
    return null;
  }
}

function planFromAssistantJson(
  assistantMessage: string,
  heuristic: FashionQueryPlan
): FashionQueryPlan {
  const parsed = extractJsonBlock(assistantMessage);
  if (!parsed) return heuristic;

  const j = parsed.json;
  return mergeIntentFromModel(heuristic, {
    intent: j.intent,
    audience: j.audience,
    anchorGarment: j.anchorGarment,
    targetCategories: Array.isArray(j.targetCategories)
      ? j.targetCategories
      : undefined,
    colors: Array.isArray(j.colors)
      ? j.colors.map((c: any) =>
          typeof c === "string" ? c : String(c?.name || "").toLowerCase()
        ).filter(Boolean)
      : undefined,
    styleTags: Array.isArray(j.styleTags) ? j.styleTags : undefined,
    rationale: "from model json",
  });
}

async function injectOutfits(
  assistantMessage: string,
  plan: FashionQueryPlan,
  limit = 4
): Promise<string> {
  const { outfits, source } = await resolveOutfitSuggestions(
    plan,
    limit,
    searchDeepFashion
  );
  if (outfits.length === 0) {
    return (
      assistantMessage +
      "\n\nI could not find catalog or DeepFashion images for that filter yet; try rephrasing (e.g. “similar tops” or “pants to combine”)."
    );
  }

  const parsed = extractJsonBlock(assistantMessage);
  if (parsed) {
    const next = {
      ...parsed.json,
      intent: plan.intent,
      audience: plan.audience,
      anchorGarment: plan.anchorGarment,
      targetCategories: plan.targetCategories,
      styleTags: plan.styleTags,
      catalogSource: source,
      outfits,
    };
    if (!Array.isArray(next.colors)) next.colors = [];
    return assistantMessage.replace(
      /```json[\s\S]*?```/,
      `\`\`\`json\n${JSON.stringify(next, null, 2)}\n\`\`\``
    );
  }

  return (
    assistantMessage +
    `\n\n\`\`\`json\n${JSON.stringify(
      {
        intent: plan.intent,
        audience: plan.audience,
        anchorGarment: plan.anchorGarment,
        targetCategories: plan.targetCategories,
        colors: [],
        styleTags: plan.styleTags,
        catalogSource: source,
        outfits,
        accessories: [],
        conclusion: "",
      },
      null,
      2
    )}\n\`\`\``
  );
}

function shouldAttachCatalog(plan: FashionQueryPlan, userMessage: string): boolean {
  if (["combine", "similar", "color", "style", "general"].includes(plan.intent)) {
    if (plan.intent === "general") {
      return /\b(outfit|clothes|clothing|wear|recommend|shirt|dress|pants|skirt|style)\b/i.test(
        userMessage
      );
    }
    return true;
  }
  return false;
}

/**
 * Generate fashion response using Anthropic Claude, optionally with image analysis
 */
export async function generateFashionResponse(
  userMessage: string, 
  history: Message[] = [], 
  imageData?: string
) {
  const hasImage = Boolean(imageData);
  const heuristic = detectIntentHeuristic(userMessage, hasImage);

  if (useLocalDataFallback) {
    const localResponse = await generateLocalFashionResponse(userMessage, hasImage);
    let formattedResponse = localResponse.message;
    if (localResponse.colors || localResponse.outfits || localResponse.accessories) {
      formattedResponse += '\n\n```json\n' + JSON.stringify({
        intent: localResponse.intent || heuristic.intent,
        audience: heuristic.audience,
        anchorGarment: heuristic.anchorGarment,
        targetCategories: heuristic.targetCategories,
        colors: localResponse.colors || [],
        styleTags: heuristic.styleTags,
        outfits: localResponse.outfits || [],
        accessories: localResponse.accessories || []
      }, null, 2) + '\n```';
    }
    return { message: formattedResponse, responseType: 'text' };
  }
  
  try {
    const conversationHistory = prepareConversationHistory(history);
    let messages: any[] = [...conversationHistory];

    if (imageData) {
      let base64Data: string;
      let mediaType: string = "image/jpeg";
      
      if (imageData.includes('base64,')) {
        const parts = imageData.split(',');
        const header = parts[0];
        base64Data = parts[1];
        const mediaTypeMatch = header.match(/data:([^;]+)/);
        if (mediaTypeMatch) mediaType = mediaTypeMatch[1];
      } else {
        base64Data = imageData;
      }

      const uploadHint =
        heuristic.intent === "similar"
          ? "User wants SIMILAR items to this garment."
          : "User wants pieces to COMBINE with this garment (complementary categories).";

      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text:
              (userMessage ||
                "Please analyze this fashion item and provide styling advice.") +
              `\n\n(${uploadHint})`,
          },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: base64Data,
            },
          },
        ],
      });
    } else {
      messages.push({ role: "user", content: userMessage });
    }

    const models = [
      "claude-3-5-sonnet-20241022",
      "claude-3-sonnet-20240229",
      "claude-3-haiku-20240307",
    ];
    
    let response;
    let lastError;
    
    for (const model of models) {
      try {
        response = await anthropic.messages.create({
          model: model,
          system: SYSTEM_PROMPT,
          messages: messages,
          temperature: 0.5,
          max_tokens: 1200,
        });
        break;
      } catch (error: any) {
        lastError = error;
        if (error?.status === 404 && models.indexOf(model) < models.length - 1) {
          console.log(`Model ${model} not available, trying next model...`);
          continue;
        }
        throw error;
      }
    }
    
    if (!response) {
      throw lastError || new Error("Failed to get response from any model");
    }

    let assistantMessage =
      response.content[0].type === "text"
        ? response.content[0].text
        : "I'm sorry, I couldn't generate a response.";

    const plan = planFromAssistantJson(assistantMessage, heuristic);

    if (shouldAttachCatalog(plan, userMessage) || hasImage) {
      try {
        assistantMessage = await injectOutfits(assistantMessage, plan, 4);
      } catch (error) {
        console.error("Error adding DeepFashion items to response:", error);
      }
    }

    return {
      message: assistantMessage,
      responseType: "text",
    };
  } catch (error: any) {
    console.error("Error generating fashion response:", error);
    
    if (error?.status === 429 || error?.error?.type === "insufficient_quota") {
      console.log("Anthropic API quota exceeded, switching to local data mode");
      useLocalDataFallback = true;
    } else {
      console.log(
        "Anthropic API error, using local DeepFashion fallback for this request"
      );
    }

    const localResponse = await generateLocalFashionResponse(userMessage, hasImage);
    let formattedResponse = localResponse.message;

    if (localResponse.colors || localResponse.outfits || localResponse.accessories) {
      formattedResponse +=
        "\n\n```json\n" +
        JSON.stringify(
          {
            intent: localResponse.intent || heuristic.intent,
            audience: heuristic.audience,
            anchorGarment: heuristic.anchorGarment,
            targetCategories: heuristic.targetCategories,
            colors: localResponse.colors || [],
            styleTags: heuristic.styleTags,
            outfits: localResponse.outfits || [],
            accessories: localResponse.accessories || [],
          },
          null,
          2
        ) +
        "\n```";
    }

    return {
      message: formattedResponse,
      responseType: "text",
    };
  }
}
