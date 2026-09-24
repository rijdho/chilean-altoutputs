/**
 * OAI-PMH client for ANID repository (DSpace).
 *
 * Harvests from https://repositorio.be-anid.com/server/oai/request
 * using the `dim` (DSpace Internal Metadata) format for the richest metadata.
 * Handles resumptionToken pagination and parses XML via fast-xml-parser.
 */

import { XMLParser } from "fast-xml-parser";

const OAI_ENDPOINT = "https://repositorio.be-anid.com/server/oai/request";
const METADATA_PREFIX = "dim";
const DELAY_MS = 1000; // 1 req/s — polite for OAI-PMH

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) =>
    ["record", "field", "element", "dc:element"].includes(name),
  removeNSPrefix: true,
});

/**
 * Make a single OAI-PMH request.
 *
 * @param {object} params - OAI-PMH verb parameters
 * @param {number} retries
 * @returns {Promise<object>} parsed XML response
 */
async function oaiRequest(params, retries = 3) {
  const url = new URL(OAI_ENDPOINT);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url.toString());

      if (res.status === 503) {
        const retryAfter = parseInt(res.headers.get("retry-after")) || 30;
        console.warn(
          `  OAI 503 — retrying in ${retryAfter}s (attempt ${attempt}/${retries})`,
        );
        await sleep(retryAfter * 1000);
        continue;
      }

      if (!res.ok) {
        throw new Error(`OAI-PMH HTTP ${res.status}: ${res.statusText}`);
      }

      const xml = await res.text();
      const parsed = parser.parse(xml);
      return parsed;
    } catch (err) {
      if (attempt === retries) throw err;
      const backoff = Math.pow(2, attempt) * 2000;
      console.warn(
        `  OAI request failed: ${err.message}. Retrying in ${backoff / 1000}s...`,
      );
      await sleep(backoff);
    }
  }
}

/**
 * Extract metadata fields from a DIM record.
 * DIM format stores fields as <dim:field> elements with @_mdschema, @_element,
 * @_qualifier, and text content.
 *
 * @param {object} metadata - the metadata element from OAI response
 * @returns {object[]} array of { schema, element, qualifier, value }
 */
function parseDimFields(metadata) {
  const fields = [];

  // DIM wraps everything in <dim:dim>
  const dim =
    metadata?.dim ||
    metadata?.["dim:dim"] ||
    metadata;

  if (!dim) return fields;

  // Fields can be at dim.field or dim["dim:field"]
  const rawFields =
    dim.field || dim["dim:field"] || [];

  const fieldArray = Array.isArray(rawFields) ? rawFields : [rawFields];

  for (const f of fieldArray) {
    if (!f) continue;
    fields.push({
      schema: f["@_mdschema"] || "dc",
      element: f["@_element"] || "",
      qualifier: f["@_qualifier"] || "",
      value:
        typeof f === "string"
          ? f
          : typeof f["#text"] === "string"
            ? f["#text"]
            : String(f["#text"] ?? ""),
      language: f["@_lang"] || "",
    });
  }

  return fields;
}

/**
 * Extract the dspace.entity.type from DIM fields.
 *
 * @param {object[]} dimFields - parsed DIM fields
 * @returns {string|null}
 */
function getEntityType(dimFields) {
  const typeField = dimFields.find(
    (f) =>
      f.schema === "dspace" &&
      f.element === "entity" &&
      f.qualifier === "type",
  );
  return typeField?.value ?? null;
}

/**
 * Harvest all records from ANID OAI-PMH endpoint.
 * Uses resumptionToken for pagination.
 *
 * @param {object} opts
 * @param {string[]} opts.entityTypes - filter by dspace.entity.type values
 * @param {string} opts.set - optional OAI set specifier
 * @param {boolean} opts.verbose
 * @returns {AsyncGenerator<{ header: object, dimFields: object[], entityType: string }>}
 */
export async function* harvest({ entityTypes = null, set = null, verbose = true } = {}) {
  const entityTypeSet = entityTypes ? new Set(entityTypes) : null;
  let resumptionToken = null;
  let page = 0;
  let totalYielded = 0;
  let totalSkipped = 0;

  while (true) {
    page++;

    let params;
    if (resumptionToken) {
      params = { verb: "ListRecords", resumptionToken };
    } else {
      params = { verb: "ListRecords", metadataPrefix: METADATA_PREFIX };
      if (set) params.set = set;
    }

    if (verbose) {
      console.log(`  OAI page ${page}${resumptionToken ? " (resuming)" : ""}...`);
    }

    let response;
    try {
      response = await oaiRequest(params);
    } catch (err) {
      console.error(`  OAI harvest error on page ${page}: ${err.message}`);
      break;
    }

    // Check for OAI-PMH errors
    const oaiPmh = response?.["OAI-PMH"] || response?.["oai-pmh"] || response;
    const error = oaiPmh?.error;
    if (error) {
      const code = error["@_code"] || "unknown";
      const msg = typeof error === "string" ? error : error["#text"] || "";
      if (code === "noRecordsMatch") {
        if (verbose) console.log("  No records match the query.");
        break;
      }
      console.error(`  OAI-PMH error: ${code} — ${msg}`);
      break;
    }

    const listRecords = oaiPmh?.ListRecords;
    if (!listRecords) {
      if (verbose) console.log("  No ListRecords in response.");
      break;
    }

    const records = listRecords.record || [];
    const recordArray = Array.isArray(records) ? records : [records];

    for (const record of recordArray) {
      if (!record || record?.header?.["@_status"] === "deleted") continue;

      const metadata = record?.metadata;
      if (!metadata) continue;

      const dimFields = parseDimFields(metadata);
      const entityType = getEntityType(dimFields);

      // Filter by entity type if specified
      if (entityTypeSet && !entityTypeSet.has(entityType)) {
        totalSkipped++;
        continue;
      }

      const header = {
        identifier: record.header?.identifier || "",
        datestamp: record.header?.datestamp || "",
        setSpec: record.header?.setSpec || "",
      };

      totalYielded++;
      yield { header, dimFields, entityType };
    }

    if (verbose && page % 5 === 0) {
      console.log(
        `  → ${totalYielded} records kept, ${totalSkipped} skipped so far`,
      );
    }

    // Check for resumptionToken
    const token = listRecords.resumptionToken;
    if (!token) break;

    // resumptionToken can be an object with #text or a string
    const tokenValue =
      typeof token === "string"
        ? token
        : token["#text"] || "";

    if (!tokenValue || tokenValue.trim() === "") break;

    resumptionToken = tokenValue.trim();
    await sleep(DELAY_MS);
  }

  if (verbose) {
    console.log(`  Harvest complete: ${totalYielded} records, ${totalSkipped} skipped`);
  }
}

/**
 * Helper: extract a specific DIM field value.
 */
export function getDimValue(dimFields, schema, element, qualifier = "") {
  const f = dimFields.find(
    (f) =>
      f.schema === schema &&
      f.element === element &&
      (qualifier === "" ? true : f.qualifier === qualifier),
  );
  return f?.value ?? null;
}

/**
 * Helper: extract ALL values for a DIM field.
 */
export function getDimValues(dimFields, schema, element, qualifier = "") {
  return dimFields
    .filter(
      (f) =>
        f.schema === schema &&
        f.element === element &&
        (qualifier === "" ? true : f.qualifier === qualifier),
    )
    .map((f) => f.value)
    .filter(Boolean);
}
