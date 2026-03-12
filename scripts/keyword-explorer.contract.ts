import assert from "node:assert/strict";
import type { App } from "../shared/schema";
import { api } from "../shared/routes";
import { buildKeywordExplorerResponse } from "../server/keyword-explorer";

const parsed = api.keywords.explore.input.parse({
  store: "apple",
  seed: "habit tracker",
  country: "US",
  language: "EN",
  limit: "12",
});

assert.deepEqual(parsed, {
  store: "apple",
  seed: "habit tracker",
  country: "us",
  language: "en",
  limit: 12,
});

assert.throws(() => {
  api.keywords.explore.input.parse({
    seed: "habit tracker",
    country: "us",
    language: "en",
    limit: 12,
  });
});

const ownedCatalogApp: App = {
  id: 1,
  workspaceId: 99,
  clientId: null,
  store: "apple",
  storeId: "42",
  name: "Habit Hero",
  developer: "ACME",
  iconUrl: null,
  storeUrl: "https://apps.apple.com/us/app/habit-hero/id42",
  summary: null,
  description: null,
  rating: null,
  ratingCount: null,
  primaryCategory: "Health & Fitness",
  screenshots: null,
  type: "owned",
  createdAt: new Date("2026-03-12T00:00:00.000Z"),
};

const originalFetch = globalThis.fetch;

globalThis.fetch = async () =>
  new Response(
    JSON.stringify({
      results: [
        {
          trackId: 42,
          trackName: "Habit Hero",
          sellerName: "ACME",
          trackViewUrl: "https://apps.apple.com/us/app/habit-hero/id42",
          averageUserRating: 4.8,
          userRatingCount: 1200,
          description: "Build better habits every day.",
        },
        {
          trackId: 77,
          trackName: "Routine Rocket",
          sellerName: "Rocket Labs",
          trackViewUrl: "https://apps.apple.com/us/app/routine-rocket/id77",
          averageUserRating: 4.5,
          userRatingCount: 640,
          description: "Plan and track routines.",
        },
      ],
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

try {
  const response = await buildKeywordExplorerResponse({
    input: {
      store: "apple",
      seed: "habit tracker",
      country: "us",
      language: "en",
      limit: 10,
    },
    catalogApps: [ownedCatalogApp],
  });

  assert.equal(response.store, "apple");
  assert.equal(response.libraryAppCount, 1);
  assert.equal(response.results.length, 2);
  assert.equal(response.results[0]?.storeId, "42");
  assert.equal(response.results[0]?.inCatalogAppId, 1);
  assert.equal(response.results[0]?.inCatalogType, "owned");
  assert.equal(response.results[0]?.isLibraryApp, true);
  assert.equal(response.results[1]?.isLibraryApp, false);
} finally {
  globalThis.fetch = originalFetch;
}

console.log("keyword explorer contract checks passed");

