import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { messageSchema } from "@shared/schema";
import { generateFashionResponse } from "./services/openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Chat endpoint
  app.post('/api/chat', async (req, res) => {
    try {
      const requestSchema = z.object({
        message: z.string().min(1),
        history: z.array(messageSchema).optional()
      });

      const validatedData = requestSchema.parse(req.body);
      
      // Process the message with OpenAI
      const response = await generateFashionResponse(
        validatedData.message, 
        validatedData.history || []
      );
      
      return res.json(response);
    } catch (error) {
      console.error('Error processing chat request:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
      }
      return res.status(500).json({ message: 'Error processing your request' });
    }
  });

  // Save chat history endpoint (optional)
  app.post('/api/chat/history', async (req, res) => {
    try {
      const requestSchema = z.object({
        messages: z.array(messageSchema)
      });

      const validatedData = requestSchema.parse(req.body);
      
      // Store in memory without user association for now
      // In a real app, we would associate with user ID
      
      return res.json({ success: true });
    } catch (error) {
      console.error('Error saving chat history:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid chat history data', errors: error.errors });
      }
      return res.status(500).json({ message: 'Error saving chat history' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
