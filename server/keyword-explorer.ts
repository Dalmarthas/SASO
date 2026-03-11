import type { App } from "@shared/schema";
import type { ExploreKeywordsInput, KeywordExplorerResponse, KeywordExplorerResult } from "@shared/routes";

const BROWSER_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36";
type SupportedStore = "apple" | "google";
type CatalogAppType = "owned" | "competitor";

export function normalizeKeywordTerm(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num: string) => String.fromCodePoint(Number.parseInt(num, 10)));
}

function stripHtml(value: string | null | undefined) {
  if (!value) return null;

  const plain = decodeHtmlEntities(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return plain || null;
}

function truncate(value: string | null | undefined, length = 180) {
  if (!value) return null;
  return value.length > length ? `${value.slice(0, length - 3).trimEnd()}...` : value;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function toNullableInteger(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? Math.trunc(value) : Number.parseInt(String(value).replace(/,/g, ""), 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function buildCatalogIndex(catalogApps: App[]) {
  return new Map(catalogApps.map((app) => [`${app.store}:${app.storeId}`, app]));
}

function toSupportedStore(value: string): SupportedStore {
  if (value === "apple" || value === "google") {
    return value;
  }

  throw new Error(`Unsupported store: ${value}`);
}

function toCatalogAppType(value: string | null | undefined): CatalogAppType | null {
  if (value === "owned" || value === "competitor") {
    return value;
  }

  return null;
}

function withCatalogState(result: Omit<KeywordExplorerResult, "inCatalogAppId" | "inCatalogType" | "isSelectedApp">, selectedApp: App, catalogIndex: Map<string, App>): KeywordExplorerResult {
  const catalogApp = catalogIndex.get(`${selectedApp.store}:${result.storeId}`) ?? null;

  return {
    ...result,
    inCatalogAppId: catalogApp?.id ?? null,
    inCatalogType: toCatalogAppType(catalogApp?.type),
    isSelectedApp: result.storeId === selectedApp.storeId,
  };
}

async function fetchAppleResults(selectedApp: App, input: ExploreKeywordsInput, catalogIndex: Map<string, App>) {
  const url = new URL("https://itunes.apple.com/search");
  url.searchParams.set("term", input.seed.trim());
  url.searchParams.set("country", input.country.toLowerCase());
  url.searchParams.set("entity", "software");
  url.searchParams.set("media", "software");
  url.searchParams.set("limit", String(input.limit));
  url.searchParams.set("lang", `${input.language.toLowerCase()}_${input.country.toLowerCase()}`);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": BROWSER_USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`App Store keyword search failed with status ${response.status}.`);
  }

  const payload = await response.json() as { results?: Array<Record<string, unknown>> };
  const seen = new Set<string>();
  const results: KeywordExplorerResult[] = [];

  for (const item of payload.results ?? []) {
    const storeId = item.trackId ? String(item.trackId) : null;
    if (!storeId || seen.has(storeId)) {
      continue;
    }

    seen.add(storeId);
    const position = results.length + 1;
    results.push(
      withCatalogState(
        {
          position,
          storeId,
          name: String(item.trackName ?? item.collectionName ?? item.trackCensoredName ?? "Unknown App"),
          developer: typeof item.sellerName === "string"
            ? item.sellerName
            : typeof item.artistName === "string"
              ? item.artistName
              : null,
          iconUrl: typeof item.artworkUrl512 === "string"
            ? item.artworkUrl512
            : typeof item.artworkUrl100 === "string"
              ? item.artworkUrl100
              : null,
          storeUrl: typeof item.trackViewUrl === "string" ? item.trackViewUrl : null,
          rating: toNullableNumber(item.averageUserRating ?? item.averageUserRatingForCurrentVersion),
          ratingCount: toNullableInteger(item.userRatingCount ?? item.userRatingCountForCurrentVersion),
          summary: truncate(stripHtml(typeof item.description === "string" ? item.description : null), 180),
        },
        selectedApp,
        catalogIndex,
      ),
    );

    if (results.length >= input.limit) {
      break;
    }
  }

  return results;
}

function extractMatch(source: string, pattern: RegExp) {
  const match = source.match(pattern);
  return match?.[1] ? decodeHtmlEntities(match[1].trim()) : null;
}

function parseGoogleResultCards(html: string, selectedApp: App, input: ExploreKeywordsInput, catalogIndex: Map<string, App>) {
  // Google Play has no public search API; this parses the server-rendered search cards as a no-key fallback.
  const cardPattern = /<a[^>]+class="Si6A0c Gy4nib"[^>]+href="([^"#]*\/store\/apps\/details\?id=([^"&]+)[^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
  const seen = new Set<string>();
  const results: KeywordExplorerResult[] = [];

  let match: RegExpExecArray | null;
  while ((match = cardPattern.exec(html)) !== null) {
    const href = match[1];
    const storeId = decodeHtmlEntities(match[2]);
    const cardHtml = match[3];

    if (!storeId || seen.has(storeId)) {
      continue;
    }

    const name = extractMatch(cardHtml, /<span class="DdYX5">([\s\S]*?)<\/span>/);
    if (!name) {
      continue;
    }

    seen.add(storeId);
    const position = results.length + 1;
    const developer = extractMatch(cardHtml, /<span class="wMUdtb">([\s\S]*?)<\/span>/);
    const iconUrl = extractMatch(cardHtml, /<img src="([^"]+)"[^>]+class="T75of stzEZd"/);
    const rating = toNullableNumber(extractMatch(cardHtml, /<span class="w2kbF">([\d.,]+)<\/span>/));

    results.push(
      withCatalogState(
        {
          position,
          storeId,
          name,
          developer,
          iconUrl,
          storeUrl: new URL(decodeHtmlEntities(href), "https://play.google.com").toString(),
          rating,
          ratingCount: null,
          summary: null,
        },
        selectedApp,
        catalogIndex,
      ),
    );

    if (results.length >= input.limit) {
      break;
    }
  }

  return results;
}

async function fetchGoogleResults(selectedApp: App, input: ExploreKeywordsInput, catalogIndex: Map<string, App>) {
  const url = new URL("https://play.google.com/store/search");
  url.searchParams.set("q", input.seed.trim());
  url.searchParams.set("c", "apps");
  url.searchParams.set("hl", input.language.toLowerCase());
  url.searchParams.set("gl", input.country.toUpperCase());

  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": `${input.language.toLowerCase()}-${input.country.toUpperCase()},en;q=0.8`,
      "User-Agent": BROWSER_USER_AGENT,
      "sec-ch-ua": '"Chromium";v="132", "Google Chrome";v="132", "Not_A Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
    },
  });

  if (!response.ok) {
    throw new Error(`Google Play keyword search failed with status ${response.status}.`);
  }

  const html = await response.text();
  const results = parseGoogleResultCards(html, selectedApp, input, catalogIndex);

  if (results.length === 0) {
    throw new Error("Google Play returned no parseable app results. The page format may have changed.");
  }

  return results;
}

export async function buildKeywordExplorerResponse(args: {
  selectedApp: App;
  input: ExploreKeywordsInput;
  catalogApps: App[];
}): Promise<KeywordExplorerResponse> {
  const { selectedApp, input, catalogApps } = args;
  const store = toSupportedStore(selectedApp.store);
  const catalogIndex = buildCatalogIndex(catalogApps);
  const results = store === "apple"
    ? await fetchAppleResults(selectedApp, input, catalogIndex)
    : await fetchGoogleResults(selectedApp, input, catalogIndex);
  const selectedResult = results.find((result) => result.isSelectedApp) ?? null;

  return {
    appId: selectedApp.id,
    store,
    selectedAppName: selectedApp.name,
    selectedAppStoreId: selectedApp.storeId,
    seed: input.seed.trim(),
    country: input.country,
    language: input.language,
    requestedLimit: input.limit,
    generatedAt: new Date().toISOString(),
    selectedAppFound: Boolean(selectedResult),
    selectedAppResultPosition: selectedResult?.position ?? null,
    results,
  };
}


