import type { InsertApp } from "@shared/schema";
import type { ImportAppFromUrlInput } from "@shared/routes";

const BROWSER_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36";

type SupportedStore = "apple" | "google";

type ParsedStoreUrl = {
  store: SupportedStore;
  storeId: string;
  canonicalUrl: string;
  country?: string;
  language?: string;
};

type ImportedMetadata = Omit<InsertApp, "workspaceId" | "clientId" | "type">;

type GoogleJsonLd = {
  name?: string;
  url?: string;
  description?: string;
  image?: string;
  applicationCategory?: string;
  author?: {
    name?: string;
  };
  aggregateRating?: {
    ratingValue?: string | number;
    ratingCount?: string | number;
  };
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num: string) => String.fromCodePoint(Number.parseInt(num, 10)));
}

function decodeJsonString(value: string): string {
  try {
    return JSON.parse(`"${value}"`) as string;
  } catch {
    return value;
  }
}

function stripHtml(value: string | null | undefined): string | null {
  if (!value) return null;

  const withTagsDecoded = decodeHtmlEntities(value)
    .replace(/\\u003c/gi, "<")
    .replace(/\\u003e/gi, ">")
    .replace(/\\u0026/gi, "&")
    .replace(/\\u003d/gi, "=")
    .replace(/\\u0027/gi, "'")
    .replace(/\\u003a/gi, ":")
    .replace(/\\n/g, "\n");

  const plain = withTagsDecoded
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li>/gi, "- ")
    .replace(/<[^>]+>/g, "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");

  return plain || null;
}

function normalizeSummary(value: string | null | undefined): string | null {
  const text = stripHtml(value);
  if (!text) return null;
  return text.length > 220 ? `${text.slice(0, 217).trimEnd()}...` : text;
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

function unique(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const items: string[] = [];

  for (const value of values) {
    if (!value) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    items.push(value);
  }

  return items;
}

function parseMetaContent(html: string, name: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${escapeRegExp(name)}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${escapeRegExp(name)}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escapeRegExp(name)}["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${escapeRegExp(name)}["']`, "i"),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return decodeHtmlEntities(match[1]);
    }
  }

  return null;
}

function extractJsonLd(html: string): GoogleJsonLd | null {
  const matches = Array.from(html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi));

  for (const match of matches) {
    try {
      const parsed = JSON.parse(match[1]) as GoogleJsonLd | GoogleJsonLd[];
      const entries = Array.isArray(parsed) ? parsed : [parsed];
      const appEntry = entries.find((entry) => entry && (entry as { "@type"?: string })["@type"] === "SoftwareApplication");
      if (appEntry) {
        return appEntry;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function getGoogleAppWindow(html: string, packageId: string): string {
  const marker = `["${packageId}",7]`;
  const markerIndex = html.indexOf(marker);
  if (markerIndex === -1) {
    return html;
  }

  const window = html.slice(markerIndex, Math.min(markerIndex + 40000, html.length));
  const similarAppsIndex = window.indexOf('["Similar apps"');
  return similarAppsIndex === -1 ? window : window.slice(0, similarAppsIndex);
}

function extractGoogleLongDescription(html: string, packageId: string, developer: string | null): string | null {
  const targetWindow = getGoogleAppWindow(html, packageId);

  if (developer) {
    const developerPattern = new RegExp(`\\[null,\"((?:\\\\.|[^\"\\\\]){120,}?)\"\\],\"${escapeRegExp(developer)}\"`);
    const match = targetWindow.match(developerPattern);
    if (match?.[1]) {
      return stripHtml(decodeJsonString(match[1]));
    }
  }

  const genericPattern = /\[null,"((?:\\.|[^"\\]){120,}?)"\],"[^"]+","[\d,+\.]+"/;
  const fallbackMatch = targetWindow.match(genericPattern);
  return fallbackMatch?.[1] ? stripHtml(decodeJsonString(fallbackMatch[1])) : null;
}

function extractGoogleScreenshots(html: string, packageId: string, iconUrl: string | null): string[] {
  const targetWindow = getGoogleAppWindow(html, packageId);
  const matches = targetWindow.match(/https:\/\/play-lh\.googleusercontent\.com\/[A-Za-z0-9_\-.=]+/g) ?? [];

  return unique(matches)
    .filter((url) => url !== iconUrl)
    .slice(0, 12);
}

function parseStoreUrl(rawUrl: string): ParsedStoreUrl {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    throw new Error("Paste a full App Store or Google Play URL.");
  }

  if (url.hostname.includes("apps.apple.com") || url.hostname.includes("itunes.apple.com")) {
    const idMatch = `${url.pathname}${url.search}`.match(/id(\d+)/i);
    if (!idMatch) {
      throw new Error("Could not find an App Store app ID in that URL.");
    }

    const pathSegments = url.pathname.split("/").filter(Boolean);
    const storefront = pathSegments[0] && /^[a-z]{2}$/i.test(pathSegments[0]) ? pathSegments[0].toLowerCase() : undefined;

    return {
      store: "apple",
      storeId: idMatch[1],
      canonicalUrl: url.toString(),
      country: storefront,
    };
  }

  if (url.hostname.includes("play.google.com")) {
    const packageId = url.searchParams.get("id");
    if (!packageId) {
      throw new Error("Could not find a Google Play package ID in that URL.");
    }

    return {
      store: "google",
      storeId: packageId,
      canonicalUrl: url.toString(),
      country: url.searchParams.get("gl") ?? "US",
      language: url.searchParams.get("hl") ?? "en_US",
    };
  }

  throw new Error("Only App Store and Google Play URLs are supported right now.");
}

async function fetchAppleMetadata(target: ParsedStoreUrl): Promise<ImportedMetadata> {
  const lookupUrl = new URL("https://itunes.apple.com/lookup");
  lookupUrl.searchParams.set("id", target.storeId);
  lookupUrl.searchParams.set("country", (target.country ?? "us").toLowerCase());

  const response = await fetch(lookupUrl, {
    headers: {
      "Accept": "application/json",
      "User-Agent": BROWSER_USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`App Store lookup failed with status ${response.status}.`);
  }

  const payload = await response.json() as { resultCount?: number; results?: Array<Record<string, unknown>> };
  const item = payload.results?.[0];

  if (!item) {
    throw new Error("No app was found for that App Store URL.");
  }

  const description = stripHtml(typeof item.description === "string" ? item.description : null);

  return {
    store: "apple",
    storeId: target.storeId,
    name: String(item.trackName ?? item.collectionName ?? item.trackCensoredName ?? "Unknown App"),
    developer: typeof item.sellerName === "string" ? item.sellerName : typeof item.artistName === "string" ? item.artistName : null,
    iconUrl: typeof item.artworkUrl512 === "string" ? item.artworkUrl512 : typeof item.artworkUrl100 === "string" ? item.artworkUrl100 : null,
    storeUrl: typeof item.trackViewUrl === "string" ? item.trackViewUrl : target.canonicalUrl,
    summary: normalizeSummary(description),
    description,
    rating: toNullableNumber(item.averageUserRating ?? item.averageUserRatingForCurrentVersion),
    ratingCount: toNullableInteger(item.userRatingCount ?? item.userRatingCountForCurrentVersion),
    primaryCategory: typeof item.primaryGenreName === "string" ? item.primaryGenreName : null,
    screenshots: unique([
      ...(Array.isArray(item.screenshotUrls) ? item.screenshotUrls as string[] : []),
      ...(Array.isArray(item.ipadScreenshotUrls) ? item.ipadScreenshotUrls as string[] : []),
      ...(Array.isArray(item.appletvScreenshotUrls) ? item.appletvScreenshotUrls as string[] : []),
    ]),
  };
}

async function fetchGoogleMetadata(target: ParsedStoreUrl): Promise<ImportedMetadata> {
  const detailsUrl = new URL("https://play.google.com/store/apps/details");
  detailsUrl.searchParams.set("id", target.storeId);
  detailsUrl.searchParams.set("hl", target.language ?? "en_US");
  detailsUrl.searchParams.set("gl", target.country ?? "US");

  const response = await fetch(detailsUrl, {
    headers: {
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "User-Agent": BROWSER_USER_AGENT,
      "sec-ch-ua": '"Chromium";v="132", "Google Chrome";v="132", "Not_A Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
    },
  });

  if (!response.ok) {
    throw new Error(`Google Play fetch failed with status ${response.status}.`);
  }

  const html = await response.text();
  const jsonLd = extractJsonLd(html);

  if (!jsonLd) {
    throw new Error("Could not parse the Google Play page. The page format may have changed.");
  }

  const metaTitle = parseMetaContent(html, "og:title");
  const metaDescription = parseMetaContent(html, "og:description") ?? parseMetaContent(html, "description");
  const metaImage = parseMetaContent(html, "og:image");
  const metaUrl = parseMetaContent(html, "og:url");
  const developer = jsonLd.author?.name?.trim() || null;
  const longDescription = extractGoogleLongDescription(html, target.storeId, developer);
  const description = longDescription ?? stripHtml(jsonLd.description) ?? stripHtml(metaDescription);
  const iconUrl = typeof jsonLd.image === "string" ? jsonLd.image : metaImage;

  return {
    store: "google",
    storeId: target.storeId,
    name: (jsonLd.name ?? metaTitle?.replace(/\s+- Apps on Google Play$/i, "") ?? "Unknown App").trim(),
    developer,
    iconUrl,
    storeUrl: decodeHtmlEntities(metaUrl ?? jsonLd.url ?? detailsUrl.toString()),
    summary: normalizeSummary(metaDescription ?? jsonLd.description),
    description,
    rating: toNullableNumber(jsonLd.aggregateRating?.ratingValue),
    ratingCount: toNullableInteger(jsonLd.aggregateRating?.ratingCount),
    primaryCategory: jsonLd.applicationCategory?.replace(/_/g, " ") ?? null,
    screenshots: extractGoogleScreenshots(html, target.storeId, iconUrl),
  };
}

export async function importAppFromStoreUrl(input: ImportAppFromUrlInput): Promise<InsertApp> {
  const target = parseStoreUrl(input.url);
  const metadata = target.store === "apple"
    ? await fetchAppleMetadata(target)
    : await fetchGoogleMetadata(target);

  return {
    workspaceId: input.workspaceId,
    clientId: input.clientId ?? null,
    type: input.type,
    ...metadata,
  };
}

