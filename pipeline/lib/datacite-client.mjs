/**
 * DataCite REST API client for Chilean non-article research outputs.
 *
 * Uses cursor-based pagination and polite rate limiting (~10 req/s).
 * Queries creators.affiliation.name:*Chile* filtered by resourceTypeGeneral.
 */

const BASE = "https://api.datacite.org/dois";
const PAGE_SIZE = 250; // max allowed by DataCite
const DELAY_MS = 100;  // ~10 req/s polite rate

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

let lastRequestTime = 0;

async function rateLimitedFetch(url, retries = 3) {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < DELAY_MS) {
    await sleep(DELAY_MS - elapsed);
  }
  lastRequestTime = Date.now();

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/vnd.api+json" },
      });

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get("retry-after")) || 10;
        console.warn(
          `  Rate limited (429). Waiting ${retryAfter}s... (attempt ${attempt}/${retries})`,
        );
        await sleep(retryAfter * 1000);
        continue;
      }

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`DataCite ${res.status}: ${body.slice(0, 300)}`);
      }

      return await res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      const backoff = Math.pow(2, attempt) * 1000;
      console.warn(
        `  Request failed: ${err.message}. Retrying in ${backoff / 1000}s...`,
      );
      await sleep(backoff);
    }
  }
}

/**
 * Count Chilean DOIs for a given resource type.
 *
 * @param {string} resourceType - e.g. "Software", "Dataset"
 * @returns {Promise<number>}
 */
export async function countByType(resourceType) {
  const url = new URL(BASE);
  url.searchParams.set(
    "query",
    'creators.affiliation.name:*Chile*',
  );
  url.searchParams.set("resource-type-id", resourceType.toLowerCase());
  url.searchParams.set("page[size]", "0");

  const json = await rateLimitedFetch(url.toString());
  return json?.meta?.total ?? 0;
}

/**
 * Fetch ALL Chilean DOIs for a given resourceTypeGeneral.
 * Uses cursor-based pagination (page[cursor]).
 *
 * @param {string} resourceType - e.g. "Software", "Dataset"
 * @param {object} opts
 * @param {number} opts.maxResults - stop after this many (default: Infinity)
 * @param {boolean} opts.verbose - log progress
 * @returns {AsyncGenerator<object>} yields full DOI attribute objects
 */
export async function* searchByType(
  resourceType,
  { maxResults = Infinity, verbose = true } = {},
) {
  let cursor = null;
  let collected = 0;
  let page = 0;

  while (collected < maxResults) {
    const url = new URL(BASE);
    url.searchParams.set(
      "query",
      'creators.affiliation.name:*Chile*',
    );
    url.searchParams.set("resource-type-id", resourceType.toLowerCase());
    url.searchParams.set("page[size]", String(PAGE_SIZE));

    if (cursor) {
      url.searchParams.set("page[cursor]", cursor);
    } else {
      // First page: use cursor=1 to initiate cursor pagination
      url.searchParams.set("page[cursor]", "1");
    }

    const json = await rateLimitedFetch(url.toString());
    const items = json?.data ?? [];

    if (items.length === 0) break;

    for (const item of items) {
      yield item.attributes;
      collected++;
      if (collected >= maxResults) break;
    }

    page++;
    if (verbose) {
      const total = json?.meta?.total ?? "?";
      console.log(
        `  [${resourceType}] page ${page}: ${collected}/${total} collected`,
      );
    }

    // Get next cursor from links
    const nextLink = json?.links?.next;
    if (!nextLink) break;

    // Extract cursor from next link URL
    try {
      const nextUrl = new URL(nextLink);
      cursor = nextUrl.searchParams.get("page[cursor]");
      if (!cursor) break;
    } catch {
      break;
    }

    await sleep(DELAY_MS);
  }
}

/**
 * Fetch ALL Chilean DOIs for multiple resource types.
 *
 * @param {string[]} types - e.g. ["Software", "Dataset", "Collection"]
 * @param {object} opts
 * @param {number} opts.maxPerType - max per type (default: Infinity)
 * @param {boolean} opts.verbose
 * @returns {Promise<Map<string, object[]>>} type -> array of DOI attributes
 */
export async function fetchAll(types, { maxPerType = Infinity, verbose = true } = {}) {
  const results = new Map();

  for (const type of types) {
    const records = [];
    const count = await countByType(type);

    if (verbose) {
      console.log(`\n  ${type}: ${count} Chilean DOIs found`);
    }

    if (count === 0) {
      results.set(type, []);
      continue;
    }

    for await (const record of searchByType(type, { maxResults: maxPerType, verbose })) {
      records.push(record);
    }

    results.set(type, records);

    if (verbose) {
      console.log(`  ${type}: ${records.length} records fetched`);
    }
  }

  return results;
}

/**
 * Fetch a single DOI record.
 */
export async function fetchDoi(doi) {
  const url = `${BASE}/${encodeURIComponent(doi)}`;
  const json = await rateLimitedFetch(url);
  return json?.data?.attributes ?? null;
}
