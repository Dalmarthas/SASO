import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const workspaces = pgTable(
  "workspaces",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: index("workspaces_name_idx").on(table.name),
  }),
);

export const clients = pgTable(
  "clients",
  {
    id: serial("id").primaryKey(),
    workspaceId: integer("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdx: index("clients_workspace_id_idx").on(table.workspaceId),
  }),
);

export const apps = pgTable(
  "apps",
  {
    id: serial("id").primaryKey(),
    workspaceId: integer("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    clientId: integer("client_id").references(() => clients.id, { onDelete: "set null" }),
    store: text("store").notNull(),
    storeId: text("store_id").notNull(),
    name: text("name").notNull(),
    developer: text("developer"),
    iconUrl: text("icon_url"),
    type: text("type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdx: index("apps_workspace_id_idx").on(table.workspaceId),
    clientIdx: index("apps_client_id_idx").on(table.clientId),
    storeLookupIdx: uniqueIndex("apps_store_store_id_uidx").on(table.store, table.storeId),
  }),
);

export const trackedKeywords = pgTable(
  "tracked_keywords",
  {
    id: serial("id").primaryKey(),
    appId: integer("app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    term: text("term").notNull(),
    country: text("country").notNull().default("us"),
    language: text("language").notNull().default("en"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    appIdx: index("tracked_keywords_app_id_idx").on(table.appId),
    appTermMarketIdx: uniqueIndex("tracked_keywords_app_term_market_uidx").on(
      table.appId,
      table.term,
      table.country,
      table.language,
    ),
  }),
);

export const keywordRankSnapshots = pgTable(
  "keyword_rank_snapshots",
  {
    id: serial("id").primaryKey(),
    trackedKeywordId: integer("tracked_keyword_id")
      .notNull()
      .references(() => trackedKeywords.id, { onDelete: "cascade" }),
    rank: integer("rank"),
    searchVolume: integer("search_volume"),
    source: text("source").notNull().default("manual"),
    capturedAt: timestamp("captured_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    trackedKeywordIdx: index("keyword_rank_snapshots_keyword_id_idx").on(table.trackedKeywordId),
    capturedAtIdx: index("keyword_rank_snapshots_captured_at_idx").on(table.capturedAt),
  }),
);

export const insertWorkspaceSchema = createInsertSchema(workspaces).omit({
  id: true,
  createdAt: true,
});
export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});
export const insertAppSchema = createInsertSchema(apps).omit({
  id: true,
  createdAt: true,
});
export const insertTrackedKeywordRecordSchema = createInsertSchema(trackedKeywords).omit({
  id: true,
  createdAt: true,
});
export const insertKeywordRankSnapshotSchema = createInsertSchema(keywordRankSnapshots).omit({
  id: true,
});

export type Workspace = typeof workspaces.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type App = typeof apps.$inferSelect;
export type TrackedKeyword = typeof trackedKeywords.$inferSelect;
export type KeywordRankSnapshot = typeof keywordRankSnapshots.$inferSelect;

export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertApp = z.infer<typeof insertAppSchema>;
export type InsertTrackedKeywordRecord = z.infer<typeof insertTrackedKeywordRecordSchema>;
export type InsertKeywordRankSnapshot = z.infer<typeof insertKeywordRankSnapshotSchema>;
