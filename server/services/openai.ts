import OpenAI from "openai";
import { Message } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "" 
});

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

Important guidelines:
1. For color recommendations, include the name and hex code of each color.
2. For outfit recommendations, include real, accessible image URLs of fashion examples from Unsplash or similar free stock image services.
3. For accessory recommendations, use Remix Icon class names (ri-*) for icons.
4. Always include a brief textual explanation before the JSON block and a conclusion after it.
5. Respond conversationally to small talk while maintaining your fashion expertise persona.
6. Keep responses concise but informative.

For non-fashion questions or small talk, respond in a friendly manner while gently steering the conversation back to fashion when appropriate.`;

export async function generateFashionResponse(userMessage: string, history: Message[] = []) {
  try {
    // Convert history to OpenAI format
    const conversationHistory = prepareConversationHistory(history);
    
    // Create the messages array
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationHistory,
      { role: "user", content: userMessage }
    ];

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // newest model
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const assistantMessage = response.choices[0].message.content || "I'm sorry, I couldn't generate a response.";

    return {
      message: assistantMessage,
      // The frontend will parse the JSON embedded in the message
    };
  } catch (error) {
    console.error("Error generating fashion response:", error);
    return {
      message: "I'm having trouble connecting to my fashion database. Could you try asking again in a moment?",
    };
  }
}
