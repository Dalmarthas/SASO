import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { importAppFromStoreUrl } from "./store-import";
import { api } from "@shared/routes";
import { z } from "zod";

function parseId(value: string) {
  const id = Number.parseInt(value, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function sendValidationError(res: { status: (code: number) => { json: (body: unknown) => unknown } }, error: unknown) {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      message: error.errors[0].message,
      field: error.errors[0].path.join("."),
    });
  }

  if (error instanceof Error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  return res.status(400).json({
    message: "Invalid request",
  });
}

async function seedKeywordHistory(trackedKeywordId: number, ranks: number[], searchVolume: number) {
  const now = new Date();

  for (let index = 0; index < ranks.length; index += 1) {
    const capturedAt = new Date(now);
    capturedAt.setUTCDate(capturedAt.getUTCDate() - (ranks.length - index - 1));

    await storage.createKeywordRankSnapshot({
      trackedKeywordId,
      rank: ranks[index],
      searchVolume,
      source: "seed",
      capturedAt,
    });
  }
}

async function seedDatabase() {
  const existingWorkspaces = await storage.getWorkspaces();
  if (existingWorkspaces.length > 0) {
    return;
  }

  const workspace = await storage.createWorkspace({ name: "Acme ASO Agency" });
  const fitnessClient = await storage.createClient({
    workspaceId: workspace.id,
    name: "FitnessCorp",
  });
  const fintechClient = await storage.createClient({
    workspaceId: workspace.id,
    name: "FinTech Inc",
  });

  const fitPro = await storage.createApp({
    workspaceId: workspace.id,
    clientId: fitnessClient.id,
    store: "apple",
    storeId: "123456789",
    name: "FitPro Tracker",
    developer: "FitnessCorp",
    iconUrl: null,
    storeUrl: null,
    summary: null,
    description: null,
    rating: null,
    ratingCount: null,
    primaryCategory: null,
    screenshots: null,
    type: "owned",
  });

  const strongLifts = await storage.createApp({
    workspaceId: workspace.id,
    clientId: fitnessClient.id,
    store: "apple",
    storeId: "987654321",
    name: "StrongLifts Competitor",
    developer: "CompetitorLLC",
    iconUrl: null,
    storeUrl: null,
    summary: null,
    description: null,
    rating: null,
    ratingCount: null,
    primaryCategory: null,
    screenshots: null,
    type: "competitor",
  });

  await storage.createApp({
    workspaceId: workspace.id,
    clientId: fintechClient.id,
    store: "google",
    storeId: "com.fintech.wallet",
    name: "Pocket Budget",
    developer: "FinTech Inc",
    iconUrl: null,
    storeUrl: null,
    summary: null,
    description: null,
    rating: null,
    ratingCount: null,
    primaryCategory: null,
    screenshots: null,
    type: "owned",
  });

  const workoutTracker = await storage.createTrackedKeywordRecord({
    appId: fitPro.id,
    term: "workout tracker",
    country: "us",
    language: "en",
  });
  await seedKeywordHistory(workoutTracker.id, [12, 11, 9, 8, 7, 6, 5], 45000);

  const fitnessPlan = await storage.createTrackedKeywordRecord({
    appId: fitPro.id,
    term: "fitness plan",
    country: "us",
    language: "en",
  });
  await seedKeywordHistory(fitnessPlan.id, [18, 17, 16, 14, 13, 12, 11], 32000);

  const competitorWorkout = await storage.createTrackedKeywordRecord({
    appId: strongLifts.id,
    term: "workout tracker",
    country: "us",
    language: "en",
  });
  await seedKeywordHistory(competitorWorkout.id, [4, 4, 3, 3, 3, 2, 2], 45000);
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.get(api.workspaces.list.path, async (_req, res) => {
    const data = await storage.getWorkspaces();
    res.json(data);
  });

  app.get(api.clients.list.path, async (_req, res) => {
    const data = await storage.getClients();
    res.json(data);
  });

  app.get(api.apps.list.path, async (_req, res) => {
    const data = await storage.getApps();
    res.json(data);
  });

  app.post(api.apps.create.path, async (req, res) => {
    try {
      const input = api.apps.create.input.parse(req.body);
      const existing = await storage.findAppByStoreId(input.store, input.storeId);
      if (existing) {
        return res.status(400).json({
          message: "This app is already in your catalog.",
          field: "storeId",
        });
      }

      const newApp = await storage.createApp(input);
      res.status(201).json(newApp);
    } catch (error) {
      return sendValidationError(res, error);
    }
  });

  app.post(api.apps.importFromUrl.path, async (req, res) => {
    try {
      const input = api.apps.importFromUrl.input.parse(req.body);
      const importedApp = await importAppFromStoreUrl(input);
      const existing = await storage.findAppByStoreId(importedApp.store, importedApp.storeId);

      if (existing) {
        return res.status(400).json({
          message: "This app is already in your catalog.",
          field: "url",
        });
      }

      const createdApp = await storage.createApp(importedApp);
      return res.status(201).json(createdApp);
    } catch (error) {
      return sendValidationError(res, error);
    }
  });

  app.delete(api.apps.delete.path, async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(404).json({ message: "App not found" });
    }

    const deleted = await storage.deleteApp(id);
    if (!deleted) {
      return res.status(404).json({ message: "App not found" });
    }

    return res.status(204).end();
  });

  app.get(api.keywords.list.path, async (_req, res) => {
    const data = await storage.getKeywords();
    res.json(data);
  });

  app.get(api.keywords.explore.path, async (req, res) => {
    try {
      const input = api.keywords.explore.input.parse({
        appId: req.query.appId,
        seed: req.query.seed,
        country: req.query.country,
        language: req.query.language,
        limit: req.query.limit,
      });
      const data = await storage.exploreKeywords(input);
      res.json(data);
    } catch (error) {
      return sendValidationError(res, error);
    }
  });

  app.post(api.keywords.create.path, async (req, res) => {
    try {
      const input = api.keywords.create.input.parse(req.body);
      const newKeyword = await storage.createKeyword(input);
      res.status(201).json(newKeyword);
    } catch (error) {
      return sendValidationError(res, error);
    }
  });

  app.delete(api.keywords.delete.path, async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(404).json({ message: "Keyword not found" });
    }

    const deleted = await storage.deleteKeyword(id);
    if (!deleted) {
      return res.status(404).json({ message: "Keyword not found" });
    }

    return res.status(204).end();
  });

  app.get(api.dashboard.summary.path, async (_req, res) => {
    const data = await storage.getDashboard();
    res.json(data);
  });

  seedDatabase().catch(console.error);

  return httpServer;
}

