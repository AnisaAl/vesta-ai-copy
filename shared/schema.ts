import {
  pgTable,
  text,
  serial,
  integer,
  jsonb,
  timestamp,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model from original schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Chat history
export const chatHistories = pgTable("chat_histories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  messages: jsonb("messages").notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertChatHistorySchema = createInsertSchema(chatHistories).pick({
  userId: true,
  messages: true,
});

/**
 * Affiliate / partner catalog (online-only — no inventory qty).
 * Checkout happens on merchant via affiliateUrl (cart UI is Milestone 3).
 */
export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    externalId: text("external_id").notNull(),
    merchant: text("merchant").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    imageUrl: text("image_url").notNull(),
    affiliateUrl: text("affiliate_url").notNull(),
    priceCents: integer("price_cents"),
    currency: text("currency").notNull().default("USD"),
    /** Aligns with GarmentCategory in fashionIntent */
    category: text("category").notNull().default("unknown"),
    /** feminine | masculine | any */
    audience: text("audience").notNull().default("any"),
    colors: jsonb("colors").$type<string[]>().notNull().default([]),
    styleTags: jsonb("style_tags").$type<string[]>().notNull().default([]),
    isActive: boolean("is_active").notNull().default(true),
    raw: jsonb("raw"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    merchantExternalIdx: uniqueIndex("products_merchant_external_idx").on(
      table.merchant,
      table.externalId
    ),
  })
);

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Define types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertChatHistory = z.infer<typeof insertChatHistorySchema>;
export type ChatHistory = typeof chatHistories.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Message schema for validation
export const messageSchema = z.object({
  id: z.string(),
  content: z.string(),
  role: z.enum(["user", "assistant"]),
  timestamp: z.string(),
  imageData: z.string().optional(),
});

export type Message = z.infer<typeof messageSchema>;
