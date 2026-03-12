import { z } from "zod";
import { insertAppSchema } from "./schema";

const isoDateSchema = z.string();

export const workspaceSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  createdAt: isoDateSchema,
});

export const clientSchema = z.object({
  id: z.number().int(),
  workspaceId: z.number().int(),
  name: z.string(),
  createdAt: isoDateSchema,
});

export const appSchema = z.object({
  id: z.number().int(),
  workspaceId: z.number().int(),
  clientId: z.number().int().nullable(),
  store: z.enum(["apple", "google"]),
  storeId: z.string(),
  name: z.string(),
  developer: z.string().nullable(),
  iconUrl: z.string().nullable(),
  storeUrl: z.string().nullable(),
  summary: z.string().nullable(),
  description: z.string().nullable(),
  rating: z.number().nullable(),
  ratingCount: z.number().int().nullable(),
  primaryCategory: z.string().nullable(),
  screenshots: z.array(z.string()).nullable(),
  type: z.enum(["owned", "competitor"]),
  createdAt: isoDateSchema,
});

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const keywordListItemSchema = z.object({
  id: z.number().int(),
  appId: z.number().int(),
  term: z.string(),
  country: z.string(),
  language: z.string(),
  currentRank: z.number().int().nullable(),
  previousRank: z.number().int().nullable(),
  searchVolume: z.number().int().nullable(),
  lastCheckedAt: z.string().nullable(),
});

export const createKeywordInputSchema = z.object({
  appId: z.number().int().positive(),
  term: z.string().trim().min(1, "Keyword term is required"),
  country: z.string().trim().min(2).max(2).default("us").transform((value) => value.toLowerCase()),
  language: z.string().trim().min(2).max(5).default("en").transform((value) => value.toLowerCase()),
  currentRank: z.number().int().positive().nullable().optional(),
  previousRank: z.number().int().positive().nullable().optional(),
  searchVolume: z.number().int().nonnegative().nullable().optional(),
});

export const exploreKeywordsInputSchema = z.object({
  store: z.enum(["apple", "google"]),
  seed: z.string().trim().min(2, "Enter at least 2 characters to explore keywords"),
  country: z.string().trim().min(2).max(2).default("us").transform((value) => value.toLowerCase()),
  language: z.string().trim().min(2).max(5).default("en").transform((value) => value.toLowerCase()),
  limit: z.coerce.number().int().min(6).max(100).default(25),
});

export const keywordExplorerResultSchema = z.object({
  position: z.number().int().positive(),
  storeId: z.string(),
  name: z.string(),
  developer: z.string().nullable(),
  iconUrl: z.string().nullable(),
  storeUrl: z.string().nullable(),
  rating: z.number().nullable(),
  ratingCount: z.number().int().nullable(),
  summary: z.string().nullable(),
  inCatalogAppId: z.number().int().nullable(),
  inCatalogType: z.enum(["owned", "competitor"]).nullable(),
  isLibraryApp: z.boolean(),
});

export const keywordExplorerResponseSchema = z.object({
  store: z.enum(["apple", "google"]),
  seed: z.string(),
  country: z.string(),
  language: z.string(),
  requestedLimit: z.number().int().positive(),
  generatedAt: z.string(),
  libraryAppCount: z.number().int().nonnegative(),
  results: z.array(keywordExplorerResultSchema),
});

export const importAppFromUrlInputSchema = z.object({
  workspaceId: z.number().int().positive(),
  clientId: z.number().int().positive().nullable().optional(),
  type: z.enum(["owned", "competitor"]),
  url: z.string().trim().url("A valid App Store or Google Play URL is required"),
});

export const dashboardResponseSchema = z.object({
  stats: z.object({
    trackedApps: z.number().int(),
    activeKeywords: z.number().int(),
    averageRank: z.number().nullable(),
    totalVolume: z.number().int(),
  }),
  rankHistory: z.array(
    z.object({
      label: z.string(),
      averageRank: z.number().nullable(),
    }),
  ),
});

export type KeywordListItem = z.infer<typeof keywordListItemSchema>;
export type CreateKeywordInput = z.infer<typeof createKeywordInputSchema>;
export type ExploreKeywordsInput = z.infer<typeof exploreKeywordsInputSchema>;
export type ImportAppFromUrlInput = z.infer<typeof importAppFromUrlInputSchema>;
export type DashboardResponse = z.infer<typeof dashboardResponseSchema>;
export type KeywordExplorerResult = z.infer<typeof keywordExplorerResultSchema>;
export type KeywordExplorerResponse = z.infer<typeof keywordExplorerResponseSchema>;

export const api = {
  workspaces: {
    list: {
      method: "GET" as const,
      path: "/api/workspaces" as const,
      responses: { 200: z.array(workspaceSchema) },
    },
  },
  clients: {
    list: {
      method: "GET" as const,
      path: "/api/clients" as const,
      responses: { 200: z.array(clientSchema) },
    },
  },
  apps: {
    list: {
      method: "GET" as const,
      path: "/api/apps" as const,
      responses: { 200: z.array(appSchema) },
    },
    create: {
      method: "POST" as const,
      path: "/api/apps" as const,
      input: insertAppSchema,
      responses: {
        201: appSchema,
        400: errorSchemas.validation,
      },
    },
    importFromUrl: {
      method: "POST" as const,
      path: "/api/apps/import" as const,
      input: importAppFromUrlInputSchema,
      responses: {
        201: appSchema,
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/apps/:id" as const,
      responses: {
        204: z.undefined(),
        404: errorSchemas.notFound,
      },
    },
  },
  keywords: {
    list: {
      method: "GET" as const,
      path: "/api/keywords" as const,
      responses: { 200: z.array(keywordListItemSchema) },
    },
    create: {
      method: "POST" as const,
      path: "/api/keywords" as const,
      input: createKeywordInputSchema,
      responses: {
        201: keywordListItemSchema,
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/keywords/:id" as const,
      responses: {
        204: z.undefined(),
        404: errorSchemas.notFound,
      },
    },
    explore: {
      method: "GET" as const,
      path: "/api/keyword-explorer" as const,
      input: exploreKeywordsInputSchema,
      responses: {
        200: keywordExplorerResponseSchema,
        400: errorSchemas.validation,
      },
    },
  },
  dashboard: {
    summary: {
      method: "GET" as const,
      path: "/api/dashboard" as const,
      responses: { 200: dashboardResponseSchema },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

