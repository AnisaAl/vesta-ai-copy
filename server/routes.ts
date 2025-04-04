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
        message: z.string(),
        history: z.array(messageSchema).optional(),
        imageData: z.string().optional() // Base64 encoded image
      });

      const validatedData = requestSchema.parse(req.body);
      
      // Process the message with OpenAI (with or without image)
      const response = await generateFashionResponse(
        validatedData.message, 
        validatedData.history || [],
        validatedData.imageData
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

  // Save chat history endpoint
  app.post('/api/chat/history', async (req, res) => {
    try {
      const requestSchema = z.object({
        messages: z.array(messageSchema),
        userId: z.number().optional() // Optional for now, would be required in real app with auth
      });

      const validatedData = requestSchema.parse(req.body);
      
      // Create new chat history in database
      const chatHistory = await storage.createChatHistory({
        userId: validatedData.userId,
        messages: validatedData.messages
      });
      
      return res.json({ 
        success: true,
        chatHistoryId: chatHistory.id 
      });
    } catch (error) {
      console.error('Error saving chat history:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid chat history data', errors: error.errors });
      }
      return res.status(500).json({ message: 'Error saving chat history' });
    }
  });
  
  // Get chat history by ID
  app.get('/api/chat/history/:id', async (req, res) => {
    try {
      const historyId = parseInt(req.params.id);
      
      if (isNaN(historyId)) {
        return res.status(400).json({ message: 'Invalid chat history ID' });
      }
      
      const chatHistory = await storage.getChatHistory(historyId);
      
      if (!chatHistory) {
        return res.status(404).json({ message: 'Chat history not found' });
      }
      
      return res.json(chatHistory);
    } catch (error) {
      console.error('Error retrieving chat history:', error);
      return res.status(500).json({ message: 'Error retrieving chat history' });
    }
  });
  
  // Get all chat histories for a user
  app.get('/api/chat/histories/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const chatHistories = await storage.getChatHistoriesByUserId(userId);
      
      return res.json(chatHistories);
    } catch (error) {
      console.error('Error retrieving chat histories:', error);
      return res.status(500).json({ message: 'Error retrieving chat histories' });
    }
  });
  
  // Update chat history
  app.put('/api/chat/history/:id', async (req, res) => {
    try {
      const historyId = parseInt(req.params.id);
      
      if (isNaN(historyId)) {
        return res.status(400).json({ message: 'Invalid chat history ID' });
      }
      
      const requestSchema = z.object({
        messages: z.array(messageSchema)
      });
      
      const validatedData = requestSchema.parse(req.body);
      
      const updatedHistory = await storage.updateChatHistory(
        historyId, 
        validatedData.messages
      );
      
      if (!updatedHistory) {
        return res.status(404).json({ message: 'Chat history not found' });
      }
      
      return res.json({ 
        success: true,
        chatHistory: updatedHistory 
      });
    } catch (error) {
      console.error('Error updating chat history:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid chat history data', errors: error.errors });
      }
      return res.status(500).json({ message: 'Error updating chat history' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
