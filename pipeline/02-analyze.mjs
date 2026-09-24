#!/usr/bin/env node
/**
 * Step 02: Analyze metadata completeness for both DataCite and ANID records.
 *
 * Reads raw data, normalizes into common schema, deduplicates by DOI,
 * evaluates against the metadata schema, and scores each record.
 *
 * Input:  data/raw/datacite/{type}.json
 *         data/raw/anid/records.json
 * Output: data/analyzed.json
 *
 * Usage: node pipeline/02-analyze.mjs
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { isOrcid, isOrcidId } from "./lib/pids.mjs";
import {
  FIELDS,
  evaluateRecord,
  computeCompleteness,
} from "./lib/metadata-schema.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "..", "data");
const DC_RAW_DIR = resolve(DATA_DIR, "raw", "datacite");
const ANID_RAW_DIR = resolve(DATA_DIR, "raw", "anid");

mkdirSync(DATA_DIR, { recursive: true });

// ── DataCite type mapping ───────────────────────────────────────────────────

const DC_TYPE_MAP = {
  software: "Software",
  dataset: "Dataset",
  collection: "Collection",
  image: "Image",
  audiovisual: "Audiovisual",
  computationalnotebook: "ComputationalNotebook",
  model: "Model",
  interactiveresource: "InteractiveResource",
  workflow: "Workflow",
  outputmanagementplan: "OutputManagementPlan",
  other: "Other",
  physicalobject: "PhysicalObject",
  datapaper: "DataPaper",
};

// ── ANID type mapping ───────────────────────────────────────────────────────

const ANID_TYPE_MAP = {
  DatoInvestigacion: "Dataset",
  Software: "Software",
  PlanGestionDatos: "OutputManagementPlan",
  MaterialAudiovisual: "Audiovisual",
  MaterialCartografico: "Image",
  Patente: "Other",
};

// ── Normalize DataCite record ───────────────────────────────────────────────

function normalizeDataCite(rec, sourceType) {
  const doi = rec.doi || null;
  const title =
    rec.titles?.map((t) => t.title).join(" / ") || "(no title)";
  const creators = (rec.creators || []).map((c) => ({
    name: c.name || [c.familyName, c.givenName].filter(Boolean).join(", "),
    orcid: c.nameIdentifiers?.find(isOrcidId)?.nameIdentifier || null,
    affiliation:
      c.affiliation?.map((a) => (typeof a === "string" ? a : a.name)).join("; ") || "",
  }));
  const year = rec.publicationYear || null;
  const publisher = rec.publisher || null;
  const repository =
    rec.container?.title || rec.publisher || null;

  // License
  const rightsEntry = (rec.rightsList || [])[0];
  const license = rightsEntry?.rights || rightsEntry?.rightsIdentifier || null;
  const licenseUrl = rightsEntry?.rightsUri || null;

  // Subjects
  const subjects = (rec.subjects || [])
    .map((s) => s.subject)
    .filter(Boolean);

  // Description
  const description =
    (rec.descriptions || [])
      .map((d) => d.description)
      .filter(Boolean)
      .join(" ") || null;

  // Funding
  const funding = (rec.fundingReferences || []).map((f) => ({
    funderName: f.funderName || null,
    funderIdentifier: f.funderIdentifier || null,
    awardNumber: f.awardNumber || null,
    awardTitle: f.awardTitle || null,
  }));

  // Related identifiers
  const relatedIds = (rec.relatedIdentifiers || []).map((r) => ({
    identifier: r.relatedIdentifier,
    type: r.relatedIdentifierType,
    relation: r.relationType,
  }));

  // ORCIDs
  const orcids = creators
    .map((c) => c.orcid)
    .filter(Boolean);

  // Language
  const language = rec.language || null;

  // Resource type
  const rawType =
    rec.types?.resourceTypeGeneral || sourceType || "Other";
  const type =
    DC_TYPE_MAP[rawType.toLowerCase()] || rawType;

  return {
    id: doi ? `datacite:${doi}` : `datacite:${rec.doi || Math.random().toString(36).slice(2)}`,
    doi,
    source: "DataCite",
    type,
    title,
    creators,
    year,
    publisher,
    repository,
    license,
    licenseUrl,
    subjects,
    description,
    funding,
    relatedIds,
    orcids,
    language,
    _raw: rec, // keep for field evaluation
  };
}

// ── Normalize ANID record ───────────────────────────────────────────────────

function normalizeANID(rec) {
  const doi = rec.doi || null;
  const title = rec.title || "(no title)";
  const creators = (rec.creators || []).map((name) => ({
    name,
    orcid: null,
    affiliation: "",
  }));

  // Extract year from date
  const dateStr = rec.date || rec.datestamp || "";
  const yearMatch = dateStr.match(/(\d{4})/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;

  const publisher = rec.publisher || null;
  const repository = rec.publisher || "ANID Repository";

  // License
  const license =
    rec.rights?.find(
      (r) => r && !r.startsWith("http"),
    ) || null;
  const licenseUrl =
    rec.rights?.find(
      (r) => r && r.startsWith("http"),
    ) || null;

  const subjects = rec.subjects || [];
  const description =
    (rec.descriptions || []).join(" ") || null;

  // Funding
  const funding = (rec.funding || []).map((f) => ({
    funderName: f,
    funderIdentifier: null,
    awardNumber: null,
    awardTitle: null,
  }));

  // Related
  const relatedIds = (rec.relations || []).map((r) => ({
    identifier: r,
    type: r.startsWith("http") ? "URL" : "Other",
    relation: "Related",
  }));

  // ORCIDs from DIM fields
  const orcids = (rec.dimFields || []).map((f) => f.value).filter(isOrcid);

  const language = rec.language || null;
  const type = ANID_TYPE_MAP[rec.entityType] || "Other";

  return {
    id: rec.oaiId || `anid:${Math.random().toString(36).slice(2)}`,
    doi,
    source: "ANID",
    type,
    title,
    creators,
    year,
    publisher,
    repository,
    license,
    licenseUrl,
    subjects,
    description,
    funding,
    relatedIds,
    orcids,
    language,
    _raw: rec.dimFields || [], // DIM fields for evaluation
  };
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== chilean-outputs: analyze ===\n");

  const allRecords = [];

  // 1. Load DataCite records
  console.log("Loading DataCite records...");
  if (existsSync(DC_RAW_DIR)) {
    const files = readdirSync(DC_RAW_DIR).filter(
      (f) => f.endsWith(".json") && !f.startsWith("_"),
    );
    for (const file of files) {
      const filePath = resolve(DC_RAW_DIR, file);
      const data = JSON.parse(readFileSync(filePath, "utf-8"));
      const type = data.type || file.replace(".json", "");
      for (const rec of data.records || []) {
        allRecords.push(normalizeDataCite(rec, type));
      }
    }
    console.log(`  ${allRecords.length} DataCite records loaded`);
  } else {
    console.log("  No DataCite data found (skipping)");
  }

  // 2. Load ANID records
  console.log("Loading ANID records...");
  const anidPath = resolve(ANID_RAW_DIR, "records.json");
  let anidCount = 0;
  if (existsSync(anidPath)) {
    const anidData = JSON.parse(readFileSync(anidPath, "utf-8"));
    for (const rec of anidData.records || []) {
      allRecords.push(normalizeANID(rec));
      anidCount++;
    }
    console.log(`  ${anidCount} ANID records loaded`);
  } else {
    console.log("  No ANID data found (skipping)");
  }

  console.log(`\nTotal raw records: ${allRecords.length}`);

  // 3. Deduplicate by DOI (prefer DataCite if both have it)
  console.log("Deduplicating by DOI...");
  const byDoi = new Map();
  const noDoi = [];

  for (const rec of allRecords) {
    if (rec.doi) {
      const key = rec.doi.toLowerCase();
      if (!byDoi.has(key)) {
        byDoi.set(key, rec);
      } else {
        // Prefer DataCite record
        const existing = byDoi.get(key);
        if (rec.source === "DataCite" && existing.source === "ANID") {
          byDoi.set(key, rec);
        }
      }
    } else {
      noDoi.push(rec);
    }
  }

  const deduplicated = [...byDoi.values(), ...noDoi];
  const dupsRemoved = allRecords.length - deduplicated.length;
  console.log(
    `  ${deduplicated.length} unique records (${dupsRemoved} duplicates removed)`,
  );

  // 4. Evaluate each record
  console.log("\nEvaluating metadata completeness...");
  const analyzed = [];
  const t0 = Date.now();

  for (let i = 0; i < deduplicated.length; i++) {
    const rec = deduplicated[i];

    // Evaluate against schema
    let completeness;
    if (rec.source === "DataCite") {
      completeness = evaluateRecord(rec._raw, "datacite");
    } else {
      completeness = evaluateRecord(rec._raw, "anid");
    }

    const score = computeCompleteness(completeness);

    // Build final record (without _raw to save space)
    const { _raw, ...cleanRec } = rec;
    analyzed.push({
      ...cleanRec,
      completeness,
      score,
    });

    if ((i + 1) % 1000 === 0 || i === deduplicated.length - 1) {
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`  [${i + 1}/${deduplicated.length}] ${elapsed}s`);
    }
  }

  // 5. Summary stats
  const avgScore =
    analyzed.reduce((s, r) => s + r.score, 0) / analyzed.length;

  const bySource = {
    DataCite: analyzed.filter((r) => r.source === "DataCite").length,
    ANID: analyzed.filter((r) => r.source === "ANID").length,
  };

  const byType = {};
  for (const rec of analyzed) {
    byType[rec.type] = (byType[rec.type] || 0) + 1;
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Analyzed: ${analyzed.length} records`);
  console.log(`Average completeness: ${(avgScore * 100).toFixed(1)}%`);
  console.log(`By source: DataCite=${bySource.DataCite}, ANID=${bySource.ANID}`);
  console.log("By type:");
  for (const [type, count] of Object.entries(byType).sort(
    (a, b) => b[1] - a[1],
  )) {
    console.log(`  ${type.padEnd(25)} → ${count}`);
  }

  // 6. Save
  const outPath = resolve(DATA_DIR, "analyzed.json");
  const output = {
    analyzedAt: new Date().toISOString(),
    totalRecords: analyzed.length,
    bySource,
    byType,
    avgCompleteness: Math.round(avgScore * 1000) / 10,
    records: analyzed,
  };
  writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nSaved to ${outPath}`);
  console.log("Done!");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
