import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const workspaces = pgTable("workspaces", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const apps = pgTable("apps", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull(),
  clientId: integer("client_id"),
  store: text("store").notNull(), // 'apple' or 'google'
  storeId: text("store_id").notNull(),
  name: text("name").notNull(),
  developer: text("developer"),
  iconUrl: text("icon_url"),
  type: text("type").notNull(), // 'owned' or 'competitor'
  createdAt: timestamp("created_at").defaultNow(),
});

export const keywords = pgTable("keywords", {
  id: serial("id").primaryKey(),
  appId: integer("app_id").notNull(),
  term: text("term").notNull(),
  currentRank: integer("current_rank"),
  previousRank: integer("previous_rank"),
  searchVolume: integer("search_volume"),
  country: text("country").default("us"),
});

export const insertWorkspaceSchema = createInsertSchema(workspaces).omit({ id: true, createdAt: true });
export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true });
export const insertAppSchema = createInsertSchema(apps).omit({ id: true, createdAt: true });
export const insertKeywordSchema = createInsertSchema(keywords).omit({ id: true });

export type Workspace = typeof workspaces.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type App = typeof apps.$inferSelect;
export type Keyword = typeof keywords.$inferSelect;

export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertApp = z.infer<typeof insertAppSchema>;
export type InsertKeyword = z.infer<typeof insertKeywordSchema>;
