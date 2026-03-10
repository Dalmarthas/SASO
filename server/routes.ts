import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

async function seedDatabase() {
  const existingWorkspaces = await storage.getWorkspaces();
  if (existingWorkspaces.length === 0) {
    const workspace = await storage.createWorkspace({ name: "Acme ASO Agency" });
    const client1 = await storage.createClient({ workspaceId: workspace.id, name: "FitnessCorp" });
    const client2 = await storage.createClient({ workspaceId: workspace.id, name: "FinTech Inc" });

    // Seed Apps
    const app1 = await storage.createApp({
      workspaceId: workspace.id,
      clientId: client1.id,
      store: "apple",
      storeId: "123456789",
      name: "FitPro Tracker",
      developer: "FitnessCorp",
      type: "owned",
    });
    
    const app2 = await storage.createApp({
      workspaceId: workspace.id,
      clientId: client1.id,
      store: "apple",
      storeId: "987654321",
      name: "StrongLifts Competitor",
      developer: "CompetitorLLC",
      type: "competitor",
    });

    // Seed Keywords
    await storage.createKeyword({ appId: app1.id, term: "workout tracker", currentRank: 5, previousRank: 8, searchVolume: 45000, country: "us" });
    await storage.createKeyword({ appId: app1.id, term: "fitness plan", currentRank: 12, previousRank: 10, searchVolume: 32000, country: "us" });
    await storage.createKeyword({ appId: app2.id, term: "workout tracker", currentRank: 2, previousRank: 2, searchVolume: 45000, country: "us" });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get(api.workspaces.list.path, async (req, res) => {
    const data = await storage.getWorkspaces();
    res.json(data);
  });

  app.get(api.clients.list.path, async (req, res) => {
    const data = await storage.getClients();
    res.json(data);
  });

  app.get(api.apps.list.path, async (req, res) => {
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
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.keywords.list.path, async (req, res) => {
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
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Call seed asynchronously
  seedDatabase().catch(console.error);

  return httpServer;
}
