import { and, desc, eq, inArray } from "drizzle-orm";
import { db, hasDatabase } from "./db";
import { buildKeywordExplorerResponse, normalizeKeywordTerm } from "./keyword-explorer";
import {
  apps,
  clients,
  keywordRankSnapshots,
  trackedKeywords,
  workspaces,
  type App,
  type Client,
  type InsertApp,
  type InsertClient,
  type InsertKeywordRankSnapshot,
  type InsertTrackedKeywordRecord,
  type InsertWorkspace,
  type KeywordRankSnapshot,
  type TrackedKeyword,
  type Workspace,
} from "@shared/schema";
import type {
  CreateKeywordInput,
  DashboardResponse,
  ExploreKeywordsInput,
  KeywordExplorerResponse,
  KeywordListItem,
} from "@shared/routes";

function toIsoString(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Number((values.reduce((total, value) => total + value, 0) / values.length).toFixed(1));
}

export interface IStorage {
  getWorkspaces(): Promise<Workspace[]>;
  getClients(): Promise<Client[]>;
  getApps(): Promise<App[]>;
  findAppByStoreId(store: string, storeId: string): Promise<App | null>;
  createApp(app: InsertApp): Promise<App>;
  deleteApp(id: number): Promise<boolean>;
  getKeywords(): Promise<KeywordListItem[]>;
  createKeyword(input: CreateKeywordInput): Promise<KeywordListItem>;
  deleteKeyword(id: number): Promise<boolean>;
  exploreKeywords(input: ExploreKeywordsInput): Promise<KeywordExplorerResponse>;
  getDashboard(): Promise<DashboardResponse>;
  createWorkspace(workspace: InsertWorkspace): Promise<Workspace>;
  createClient(client: InsertClient): Promise<Client>;
  createTrackedKeywordRecord(keyword: InsertTrackedKeywordRecord): Promise<TrackedKeyword>;
  createKeywordRankSnapshot(snapshot: InsertKeywordRankSnapshot): Promise<KeywordRankSnapshot>;
}

class DatabaseStorage implements IStorage {
  private get database() {
    if (!db) throw new Error("Database is not configured");
    return db;
  }

  async getWorkspaces(): Promise<Workspace[]> {
    return this.database.select().from(workspaces).orderBy(workspaces.name);
  }

  async getClients(): Promise<Client[]> {
    return this.database.select().from(clients).orderBy(clients.name);
  }

  async getApps(): Promise<App[]> {
    return this.database.select().from(apps).orderBy(desc(apps.createdAt));
  }

  async findAppByStoreId(store: string, storeId: string): Promise<App | null> {
    const [app] = await this.database
      .select()
      .from(apps)
      .where(and(eq(apps.store, store), eq(apps.storeId, storeId)))
      .limit(1);

    return app ?? null;
  }

  async createApp(app: InsertApp): Promise<App> {
    const [created] = await this.database.insert(apps).values(app).returning();
    return created;
  }

  async deleteApp(id: number): Promise<boolean> {
    const deleted = await this.database.delete(apps).where(eq(apps.id, id)).returning({ id: apps.id });
    return deleted.length > 0;
  }

  async getKeywords(): Promise<KeywordListItem[]> {
    const keywords = await this.database.select().from(trackedKeywords).orderBy(desc(trackedKeywords.createdAt));
    return this.hydrateKeywords(keywords);
  }

  async createKeyword(input: CreateKeywordInput): Promise<KeywordListItem> {
    await this.assertKeywordNotTracked(input);

    const keyword = await this.createTrackedKeywordRecord({
      appId: input.appId,
      term: input.term,
      country: input.country,
      language: input.language,
    });

    const snapshots: InsertKeywordRankSnapshot[] = [];
    const hasCurrentSnapshot =
      input.currentRank !== null && input.currentRank !== undefined ||
      input.searchVolume !== null && input.searchVolume !== undefined;

    if (input.previousRank !== null && input.previousRank !== undefined) {
      const capturedAt = new Date();
      capturedAt.setUTCDate(capturedAt.getUTCDate() - 1);
      snapshots.push({
        trackedKeywordId: keyword.id,
        rank: input.previousRank,
        searchVolume: input.searchVolume ?? null,
        source: "manual",
        capturedAt,
      });
    }

    if (hasCurrentSnapshot) {
      snapshots.push({
        trackedKeywordId: keyword.id,
        rank: input.currentRank ?? null,
        searchVolume: input.searchVolume ?? null,
        source: "manual",
        capturedAt: new Date(),
      });
    }

    if (snapshots.length > 0) {
      await this.database.insert(keywordRankSnapshots).values(snapshots);
    }

    const [hydrated] = await this.hydrateKeywords([keyword]);
    return hydrated;
  }

  async deleteKeyword(id: number): Promise<boolean> {
    const deleted = await this.database
      .delete(trackedKeywords)
      .where(eq(trackedKeywords.id, id))
      .returning({ id: trackedKeywords.id });

    return deleted.length > 0;
  }

  async exploreKeywords(input: ExploreKeywordsInput): Promise<KeywordExplorerResponse> {
    const catalogApps = await this.getApps();

    return buildKeywordExplorerResponse({
      input,
      catalogApps,
    });
  }

  async getDashboard(): Promise<DashboardResponse> {
    const appList = await this.getApps();
    const keywordList = await this.getKeywords();
    const snapshotRows = await this.database.select().from(keywordRankSnapshots).orderBy(keywordRankSnapshots.capturedAt);

    const currentRanks = keywordList
      .map((keyword) => keyword.currentRank)
      .filter((rank): rank is number => rank !== null && rank !== undefined);
    const totalVolume = keywordList.reduce((total, keyword) => total + (keyword.searchVolume ?? 0), 0);

    const series = new Map<string, number[]>();
    for (const snapshot of snapshotRows) {
      if (snapshot.rank === null || snapshot.rank === undefined) continue;
      const key = toIsoString(snapshot.capturedAt)?.slice(0, 10);
      if (!key) continue;
      const values = series.get(key) ?? [];
      values.push(snapshot.rank);
      series.set(key, values);
    }

    const formatter = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });

    const rankHistory = Array.from(series.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .slice(-7)
      .map(([key, ranks]) => ({
        label: formatter.format(new Date(`${key}T00:00:00Z`)),
        averageRank: average(ranks),
      }));

    return {
      stats: {
        trackedApps: appList.length,
        activeKeywords: keywordList.length,
        averageRank: average(currentRanks),
        totalVolume,
      },
      rankHistory,
    };
  }

  async createWorkspace(workspace: InsertWorkspace): Promise<Workspace> {
    const [created] = await this.database.insert(workspaces).values(workspace).returning();
    return created;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [created] = await this.database.insert(clients).values(client).returning();
    return created;
  }

  async createTrackedKeywordRecord(keyword: InsertTrackedKeywordRecord): Promise<TrackedKeyword> {
    const [created] = await this.database.insert(trackedKeywords).values(keyword).returning();
    return created;
  }

  async createKeywordRankSnapshot(snapshot: InsertKeywordRankSnapshot): Promise<KeywordRankSnapshot> {
    const [created] = await this.database.insert(keywordRankSnapshots).values(snapshot).returning();
    return created;
  }

  private async assertKeywordNotTracked(input: CreateKeywordInput) {
    const existing = await this.database
      .select()
      .from(trackedKeywords)
      .where(
        and(
          eq(trackedKeywords.appId, input.appId),
          eq(trackedKeywords.country, input.country),
          eq(trackedKeywords.language, input.language),
        ),
      );

    const normalizedTerm = normalizeKeywordTerm(input.term);
    if (existing.some((keyword) => normalizeKeywordTerm(keyword.term) === normalizedTerm)) {
      throw new Error("This keyword is already tracked for the selected app and market.");
    }
  }

  private async hydrateKeywords(keywordsToHydrate: TrackedKeyword[]): Promise<KeywordListItem[]> {
    if (keywordsToHydrate.length === 0) return [];

    const ids = keywordsToHydrate.map((keyword) => keyword.id);
    const snapshots = await this.database
      .select()
      .from(keywordRankSnapshots)
      .where(inArray(keywordRankSnapshots.trackedKeywordId, ids))
      .orderBy(desc(keywordRankSnapshots.capturedAt));

    const snapshotMap = new Map<number, KeywordRankSnapshot[]>();
    for (const snapshot of snapshots) {
      const values = snapshotMap.get(snapshot.trackedKeywordId) ?? [];
      values.push(snapshot);
      snapshotMap.set(snapshot.trackedKeywordId, values);
    }

    return keywordsToHydrate.map((keyword) => {
      const entries = snapshotMap.get(keyword.id) ?? [];
      const current = entries[0];
      const previous = entries[1];

      return {
        id: keyword.id,
        appId: keyword.appId,
        term: keyword.term,
        country: keyword.country,
        language: keyword.language,
        currentRank: current?.rank ?? null,
        previousRank: previous?.rank ?? null,
        searchVolume: current?.searchVolume ?? previous?.searchVolume ?? null,
        lastCheckedAt: toIsoString(current?.capturedAt),
      };
    });
  }
}

class MemoryStorage implements IStorage {
  private workspaceId = 1;
  private clientId = 1;
  private appId = 1;
  private trackedKeywordId = 1;
  private snapshotId = 1;

  private workspaces: Workspace[] = [];
  private clients: Client[] = [];
  private apps: App[] = [];
  private trackedKeywords: TrackedKeyword[] = [];
  private snapshots: KeywordRankSnapshot[] = [];

  async getWorkspaces(): Promise<Workspace[]> {
    return [...this.workspaces].sort((a, b) => a.name.localeCompare(b.name));
  }

  async getClients(): Promise<Client[]> {
    return [...this.clients].sort((a, b) => a.name.localeCompare(b.name));
  }

  async getApps(): Promise<App[]> {
    return [...this.apps].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }

  async findAppByStoreId(store: string, storeId: string): Promise<App | null> {
    return this.apps.find((app) => app.store === store && app.storeId === storeId) ?? null;
  }

  async createApp(app: InsertApp): Promise<App> {
    const created: App = {
      id: this.appId++,
      ...app,
      clientId: app.clientId ?? null,
      developer: app.developer ?? null,
      iconUrl: app.iconUrl ?? null,
      storeUrl: app.storeUrl ?? null,
      summary: app.summary ?? null,
      description: app.description ?? null,
      rating: app.rating ?? null,
      ratingCount: app.ratingCount ?? null,
      primaryCategory: app.primaryCategory ?? null,
      screenshots: app.screenshots ?? null,
      createdAt: new Date(),
    };
    this.apps.push(created);
    return created;
  }

  async deleteApp(id: number): Promise<boolean> {
    const existing = this.apps.find((app) => app.id === id);
    if (!existing) return false;

    this.apps = this.apps.filter((app) => app.id !== id);
    const removedKeywordIds = this.trackedKeywords.filter((keyword) => keyword.appId === id).map((keyword) => keyword.id);
    this.trackedKeywords = this.trackedKeywords.filter((keyword) => keyword.appId !== id);
    this.snapshots = this.snapshots.filter((snapshot) => !removedKeywordIds.includes(snapshot.trackedKeywordId));
    return true;
  }

  async getKeywords(): Promise<KeywordListItem[]> {
    return this.hydrateKeywords([...this.trackedKeywords].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)));
  }

  async createKeyword(input: CreateKeywordInput): Promise<KeywordListItem> {
    await this.assertKeywordNotTracked(input);

    const keyword = await this.createTrackedKeywordRecord({
      appId: input.appId,
      term: input.term,
      country: input.country,
      language: input.language,
    });

    if (input.previousRank !== null && input.previousRank !== undefined) {
      const previousDate = new Date();
      previousDate.setUTCDate(previousDate.getUTCDate() - 1);
      await this.createKeywordRankSnapshot({
        trackedKeywordId: keyword.id,
        rank: input.previousRank,
        searchVolume: input.searchVolume ?? null,
        source: "manual",
        capturedAt: previousDate,
      });
    }

    if (
      input.currentRank !== null && input.currentRank !== undefined ||
      input.searchVolume !== null && input.searchVolume !== undefined
    ) {
      await this.createKeywordRankSnapshot({
        trackedKeywordId: keyword.id,
        rank: input.currentRank ?? null,
        searchVolume: input.searchVolume ?? null,
        source: "manual",
        capturedAt: new Date(),
      });
    }

    const [hydrated] = await this.hydrateKeywords([keyword]);
    return hydrated;
  }

  async deleteKeyword(id: number): Promise<boolean> {
    const existing = this.trackedKeywords.find((keyword) => keyword.id === id);
    if (!existing) return false;

    this.trackedKeywords = this.trackedKeywords.filter((keyword) => keyword.id !== id);
    this.snapshots = this.snapshots.filter((snapshot) => snapshot.trackedKeywordId !== id);
    return true;
  }

  async exploreKeywords(input: ExploreKeywordsInput): Promise<KeywordExplorerResponse> {
    const catalogApps = await this.getApps();

    return buildKeywordExplorerResponse({
      input,
      catalogApps,
    });
  }

  async getDashboard(): Promise<DashboardResponse> {
    const appList = await this.getApps();
    const keywordList = await this.getKeywords();
    const currentRanks = keywordList
      .map((keyword) => keyword.currentRank)
      .filter((rank): rank is number => rank !== null && rank !== undefined);
    const totalVolume = keywordList.reduce((total, keyword) => total + (keyword.searchVolume ?? 0), 0);

    const formatter = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });

    const series = new Map<string, number[]>();
    for (const snapshot of [...this.snapshots].sort((a, b) => +new Date(a.capturedAt) - +new Date(b.capturedAt))) {
      if (snapshot.rank === null || snapshot.rank === undefined) continue;
      const key = toIsoString(snapshot.capturedAt)?.slice(0, 10);
      if (!key) continue;
      const values = series.get(key) ?? [];
      values.push(snapshot.rank);
      series.set(key, values);
    }

    return {
      stats: {
        trackedApps: appList.length,
        activeKeywords: keywordList.length,
        averageRank: average(currentRanks),
        totalVolume,
      },
      rankHistory: Array.from(series.entries())
        .sort(([left], [right]) => left.localeCompare(right))
        .slice(-7)
        .map(([key, ranks]) => ({
          label: formatter.format(new Date(`${key}T00:00:00Z`)),
          averageRank: average(ranks),
        })),
    };
  }

  async createWorkspace(workspace: InsertWorkspace): Promise<Workspace> {
    const created: Workspace = {
      id: this.workspaceId++,
      ...workspace,
      createdAt: new Date(),
    };
    this.workspaces.push(created);
    return created;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const created: Client = {
      id: this.clientId++,
      ...client,
      createdAt: new Date(),
    };
    this.clients.push(created);
    return created;
  }

  async createTrackedKeywordRecord(keyword: InsertTrackedKeywordRecord): Promise<TrackedKeyword> {
    const created: TrackedKeyword = {
      id: this.trackedKeywordId++,
      ...keyword,
      country: keyword.country ?? "us",
      language: keyword.language ?? "en",
      createdAt: new Date(),
    };
    this.trackedKeywords.push(created);
    return created;
  }

  async createKeywordRankSnapshot(snapshot: InsertKeywordRankSnapshot): Promise<KeywordRankSnapshot> {
    const created: KeywordRankSnapshot = {
      id: this.snapshotId++,
      ...snapshot,
      rank: snapshot.rank ?? null,
      searchVolume: snapshot.searchVolume ?? null,
      source: snapshot.source ?? "manual",
      capturedAt: snapshot.capturedAt ?? new Date(),
    };
    this.snapshots.push(created);
    return created;
  }

  private async assertKeywordNotTracked(input: CreateKeywordInput) {
    const normalizedTerm = normalizeKeywordTerm(input.term);
    const exists = this.trackedKeywords.some(
      (keyword) =>
        keyword.appId === input.appId &&
        keyword.country === input.country &&
        keyword.language === input.language &&
        normalizeKeywordTerm(keyword.term) === normalizedTerm,
    );

    if (exists) {
      throw new Error("This keyword is already tracked for the selected app and market.");
    }
  }

  private async hydrateKeywords(keywordsToHydrate: TrackedKeyword[]): Promise<KeywordListItem[]> {
    return keywordsToHydrate.map((keyword) => {
      const entries = [...this.snapshots]
        .filter((snapshot) => snapshot.trackedKeywordId === keyword.id)
        .sort((a, b) => +new Date(b.capturedAt) - +new Date(a.capturedAt));
      const current = entries[0];
      const previous = entries[1];

      return {
        id: keyword.id,
        appId: keyword.appId,
        term: keyword.term,
        country: keyword.country,
        language: keyword.language,
        currentRank: current?.rank ?? null,
        previousRank: previous?.rank ?? null,
        searchVolume: current?.searchVolume ?? previous?.searchVolume ?? null,
        lastCheckedAt: toIsoString(current?.capturedAt),
      };
    });
  }
}

export const storage: IStorage = hasDatabase ? new DatabaseStorage() : new MemoryStorage();

