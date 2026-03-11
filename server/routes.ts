import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

function parseId(value: string) {
  const id = Number.parseInt(value, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
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
      const newApp = await storage.createApp(input);
      res.status(201).json(newApp);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
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

  app.post(api.keywords.create.path, async (req, res) => {
    try {
      const input = api.keywords.create.input.parse(req.body);
      const newKeyword = await storage.createKeyword(input);
      res.status(201).json(newKeyword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
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
