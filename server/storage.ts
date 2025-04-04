import { users, chatHistories, type User, type InsertUser, type ChatHistory, type InsertChatHistory, type Message } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Storage interface for user and chat history operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Chat history operations
  getChatHistory(id: number): Promise<ChatHistory | undefined>;
  getChatHistoriesByUserId(userId: number): Promise<ChatHistory[]>;
  createChatHistory(chatHistory: InsertChatHistory): Promise<ChatHistory>;
  updateChatHistory(id: number, messages: Message[]): Promise<ChatHistory | undefined>;
}

// Database implementation of the storage interface
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Chat history operations
  async getChatHistory(id: number): Promise<ChatHistory | undefined> {
    const [history] = await db.select().from(chatHistories).where(eq(chatHistories.id, id));
    return history || undefined;
  }
  
  async getChatHistoriesByUserId(userId: number): Promise<ChatHistory[]> {
    return await db.select().from(chatHistories).where(eq(chatHistories.userId, userId));
  }
  
  async createChatHistory(chatHistory: InsertChatHistory): Promise<ChatHistory> {
    const [history] = await db
      .insert(chatHistories)
      .values(chatHistory)
      .returning();
    return history;
  }
  
  async updateChatHistory(id: number, messages: Message[]): Promise<ChatHistory | undefined> {
    const [updatedHistory] = await db
      .update(chatHistories)
      .set({ 
        messages: messages,
        updatedAt: new Date()
      })
      .where(eq(chatHistories.id, id))
      .returning();
    
    return updatedHistory || undefined;
  }
}

// Export a single instance of the storage interface
export const storage = new DatabaseStorage();
