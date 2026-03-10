import { z } from 'zod';
import { insertWorkspaceSchema, workspaces, insertClientSchema, clients, insertAppSchema, apps, insertKeywordSchema, keywords } from './schema';

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

export const api = {
  workspaces: {
    list: {
      method: 'GET' as const,
      path: '/api/workspaces' as const,
      responses: { 200: z.array(z.custom<typeof workspaces.$inferSelect>()) },
    },
  },
  clients: {
    list: {
      method: 'GET' as const,
      path: '/api/clients' as const,
      responses: { 200: z.array(z.custom<typeof clients.$inferSelect>()) },
    },
  },
  apps: {
    list: {
      method: 'GET' as const,
      path: '/api/apps' as const,
      responses: { 200: z.array(z.custom<typeof apps.$inferSelect>()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/apps' as const,
      input: insertAppSchema,
      responses: {
        201: z.custom<typeof apps.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  keywords: {
    list: {
      method: 'GET' as const,
      path: '/api/keywords' as const,
      responses: { 200: z.array(z.custom<typeof keywords.$inferSelect>()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/keywords' as const,
      input: insertKeywordSchema,
      responses: {
        201: z.custom<typeof keywords.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  }
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
