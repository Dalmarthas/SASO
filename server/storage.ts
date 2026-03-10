import { db } from "./db";
import {
  workspaces,
  clients,
  apps,
  keywords,
  type Workspace,
  type Client,
  type App,
  type Keyword,
  type InsertWorkspace,
  type InsertClient,
  type InsertApp,
  type InsertKeyword
} from "@shared/schema";

export interface IStorage {
  getWorkspaces(): Promise<Workspace[]>;
  getClients(): Promise<Client[]>;
  getApps(): Promise<App[]>;
  createApp(app: InsertApp): Promise<App>;
  getKeywords(): Promise<Keyword[]>;
  createKeyword(keyword: InsertKeyword): Promise<Keyword>;
  
  // Seed methods
  createWorkspace(workspace: InsertWorkspace): Promise<Workspace>;
  createClient(client: InsertClient): Promise<Client>;
}

export class DatabaseStorage implements IStorage {
  async getWorkspaces(): Promise<Workspace[]> {
    return await db.select().from(workspaces);
  }

  async getClients(): Promise<Client[]> {
    return await db.select().from(clients);
  }

  async getApps(): Promise<App[]> {
    return await db.select().from(apps);
  }

  async createApp(app: InsertApp): Promise<App> {
    const [created] = await db.insert(apps).values(app).returning();
    return created;
  }

  async getKeywords(): Promise<Keyword[]> {
    return await db.select().from(keywords);
  }

  async createKeyword(keyword: InsertKeyword): Promise<Keyword> {
    const [created] = await db.insert(keywords).values(keyword).returning();
    return created;
  }

  async createWorkspace(workspace: InsertWorkspace): Promise<Workspace> {
    const [created] = await db.insert(workspaces).values(workspace).returning();
    return created;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [created] = await db.insert(clients).values(client).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
