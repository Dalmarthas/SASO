import { desc, eq, inArray } from "drizzle-orm";
import { db } from "./db";
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
import type { CreateKeywordInput, DashboardResponse, KeywordListItem } from "@shared/routes";

function toIsoString(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return Number((values.reduce((total, value) => total + value, 0) / values.length).toFixed(1));
}

export interface IStorage {
  getWorkspaces(): Promise<Workspace[]>;
  getClients(): Promise<Client[]>;
  getApps(): Promise<App[]>;
  createApp(app: InsertApp): Promise<App>;
  deleteApp(id: number): Promise<boolean>;
  getKeywords(): Promise<KeywordListItem[]>;
  createKeyword(input: CreateKeywordInput): Promise<KeywordListItem>;
  deleteKeyword(id: number): Promise<boolean>;
  getDashboard(): Promise<DashboardResponse>;

  createWorkspace(workspace: InsertWorkspace): Promise<Workspace>;
  createClient(client: InsertClient): Promise<Client>;
  createTrackedKeywordRecord(keyword: InsertTrackedKeywordRecord): Promise<TrackedKeyword>;
  createKeywordRankSnapshot(snapshot: InsertKeywordRankSnapshot): Promise<KeywordRankSnapshot>;
}

export class DatabaseStorage implements IStorage {
  async getWorkspaces(): Promise<Workspace[]> {
    return db.select().from(workspaces).orderBy(workspaces.name);
  }

  async getClients(): Promise<Client[]> {
    return db.select().from(clients).orderBy(clients.name);
  }

  async getApps(): Promise<App[]> {
    return db.select().from(apps).orderBy(desc(apps.createdAt));
  }

  async createApp(app: InsertApp): Promise<App> {
    const [created] = await db.insert(apps).values(app).returning();
    return created;
  }

  async deleteApp(id: number): Promise<boolean> {
    const deleted = await db.delete(apps).where(eq(apps.id, id)).returning({ id: apps.id });
    return deleted.length > 0;
  }

  async getKeywords(): Promise<KeywordListItem[]> {
    const keywords = await db.select().from(trackedKeywords).orderBy(desc(trackedKeywords.createdAt));
    return this.hydrateKeywords(keywords);
  }

  async createKeyword(input: CreateKeywordInput): Promise<KeywordListItem> {
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
      await db.insert(keywordRankSnapshots).values(snapshots);
    }

    const [hydrated] = await this.hydrateKeywords([keyword]);
    return hydrated;
  }

  async deleteKeyword(id: number): Promise<boolean> {
    const deleted = await db
      .delete(trackedKeywords)
      .where(eq(trackedKeywords.id, id))
      .returning({ id: trackedKeywords.id });

    return deleted.length > 0;
  }

  async getDashboard(): Promise<DashboardResponse> {
    const appList = await this.getApps();
    const keywordList = await this.getKeywords();
    const snapshotRows = await db.select().from(keywordRankSnapshots).orderBy(keywordRankSnapshots.capturedAt);

    const currentRanks = keywordList
      .map((keyword) => keyword.currentRank)
      .filter((rank): rank is number => rank !== null && rank !== undefined);
    const totalVolume = keywordList.reduce(
      (total, keyword) => total + (keyword.searchVolume ?? 0),
      0,
    );

    const series = new Map<string, number[]>();
    for (const snapshot of snapshotRows) {
      if (snapshot.rank === null || snapshot.rank === undefined) {
        continue;
      }

      const key = toIsoString(snapshot.capturedAt)?.slice(0, 10);
      if (!key) {
        continue;
      }

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
    const [created] = await db.insert(workspaces).values(workspace).returning();
    return created;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [created] = await db.insert(clients).values(client).returning();
    return created;
  }

  async createTrackedKeywordRecord(keyword: InsertTrackedKeywordRecord): Promise<TrackedKeyword> {
    const [created] = await db.insert(trackedKeywords).values(keyword).returning();
    return created;
  }

  async createKeywordRankSnapshot(snapshot: InsertKeywordRankSnapshot): Promise<KeywordRankSnapshot> {
    const [created] = await db.insert(keywordRankSnapshots).values(snapshot).returning();
    return created;
  }

  private async hydrateKeywords(keywords: TrackedKeyword[]): Promise<KeywordListItem[]> {
    if (keywords.length === 0) {
      return [];
    }

    const ids = keywords.map((keyword) => keyword.id);
    const snapshots = await db
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

    return keywords.map((keyword) => {
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

export const storage = new DatabaseStorage();
