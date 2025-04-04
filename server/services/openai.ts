import OpenAI from "openai";
import { Message } from "@shared/schema";
import { generateLocalFashionResponse } from "./fashionData";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "" 
});

// Flag to track if we've encountered an API rate limit or quota issue
let useLocalDataFallback = false;

// Helper function to prepare the chat history for OpenAI
function prepareConversationHistory(history: Message[]) {
  return history.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
}

// Fashion expert system prompt
const SYSTEM_PROMPT = `You are a fashion expert assistant specialized in trends, styling advice, and outfit recommendations. 
Your knowledge includes current fashion trends, style principles, color theory, and outfit coordination.

When responding to user queries about fashion trends, styling advice, or outfit ideas, provide detailed and visually-oriented responses.

For questions about fashion trends, colors, outfits, or accessories, please format part of your response as JSON inside a code block like this:
\`\`\`json
{
  "colors": [
    {"name": "Rich Brown", "hexCode": "#5C4033"},
    {"name": "Camel", "hexCode": "#8A6642"}
  ],
  "outfits": [
    {"id": "outfit1", "name": "Casual Chic", "description": "Burgundy sweater + neutral pants", "imageUrl": "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YnVyZ3VuZHklMjBvdXRmaXR8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60"}
  ],
  "accessories": [
    {"id": "acc1", "name": "Cream or Beige Scarf", "description": "Creates elegant contrast with the rich burgundy", "icon": "ri-scarf-line"}
  ],
  "conclusion": "Remember that burgundy acts almost like a neutral, so you have lots of flexibility."
}
\`\`\`

When analyzing fashion images that users upload:
1. Identify key garments, colors, patterns, and styles present in the image
2. Suggest complementary items or styling options based on what's in the image
3. Recommend appropriate occasions or settings for the outfit or item
4. Offer 2-3 alternative styling ideas using the same core pieces
5. Include color recommendations that would pair well with the items in the image

Important guidelines:
1. For color recommendations, include the name and hex code of each color.
2. For outfit recommendations, include real, accessible image URLs of fashion examples from Unsplash or similar free stock image services.
3. For accessory recommendations, use Remix Icon class names (ri-*) for icons.
4. Always include a brief textual explanation before the JSON block and a conclusion after it.
5. Respond conversationally to small talk while maintaining your fashion expertise persona.
6. Keep responses concise but informative.
7. When responding to image uploads, provide tailored advice specific to what appears in the image.

For non-fashion questions or small talk, respond in a friendly manner while gently steering the conversation back to fashion when appropriate.`;

/**
 * Generate fashion response using OpenAI, optionally with image analysis
 * @param userMessage User's text message
 * @param history Previous conversation history
 * @param imageData Optional base64 encoded image data
 * @returns Response with assistant message
 */
export async function generateFashionResponse(
  userMessage: string, 
  history: Message[] = [], 
  imageData?: string
) {
  // If we've encountered quota issues before, use local data immediately
  if (useLocalDataFallback) {
    const localResponse = generateLocalFashionResponse(userMessage);
    
    // Format the response for the front-end
    let formattedResponse = localResponse.message;
    
    // Add JSON data for the frontend to parse
    if (localResponse.colors || localResponse.outfits || localResponse.accessories) {
      formattedResponse += '\n\n```json\n' + JSON.stringify({
        colors: localResponse.colors || [],
        outfits: localResponse.outfits || [],
        accessories: localResponse.accessories || []
      }, null, 2) + '\n```';
    }
    
    return {
      message: formattedResponse,
      responseType: 'text'
    };
  }
  
  try {
    // Convert history to OpenAI format
    const conversationHistory = prepareConversationHistory(history);
    
    // Create the messages array
    let messages: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationHistory
    ];

    // If image is provided, add it to the messages with appropriate prompt
    if (imageData) {
      // Extract the base64 data from the data URL format if needed
      const base64Data = imageData.includes('base64,') 
        ? imageData 
        : `data:image/jpeg;base64,${imageData}`;
      
      // Add the user message with image
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: userMessage || "Please analyze this fashion item and provide styling advice."
          },
          {
            type: "image_url",
            image_url: {
              url: base64Data
            }
          }
        ]
      });
    } else {
      // Add text-only user message
      messages.push({ role: "user", content: userMessage });
    }

    // Call OpenAI API with multimodal capability
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // newest model
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const assistantMessage = response.choices[0].message.content || "I'm sorry, I couldn't generate a response.";

    return {
      message: assistantMessage,
      responseType: 'text'
    };
  } catch (error: any) {
    console.error("Error generating fashion response:", error);
    
    // Check if it's a quota/rate-limit error
    if (error?.status === 429 || (error?.error?.type === 'insufficient_quota')) {
      console.log("OpenAI API quota exceeded, switching to local data mode");
      useLocalDataFallback = true;
      
      // Use local data as fallback
      const localResponse = generateLocalFashionResponse(userMessage);
      
      // Format the response for the front-end
      let formattedResponse = localResponse.message;
      
      // Add JSON data for the frontend to parse
      if (localResponse.colors || localResponse.outfits || localResponse.accessories) {
        formattedResponse += '\n\n```json\n' + JSON.stringify({
          colors: localResponse.colors || [],
          outfits: localResponse.outfits || [],
          accessories: localResponse.accessories || []
        }, null, 2) + '\n```';
      }
      
      return {
        message: formattedResponse,
        responseType: 'text'
      };
    }
    
    return {
      message: "I'm having trouble connecting to my fashion database. I'll use local data to help you instead.",
      responseType: 'text'
    };
  }
}
