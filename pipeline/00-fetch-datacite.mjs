#!/usr/bin/env node
/**
 * Step 00: Fetch ALL Chilean non-article DOIs from DataCite.
 *
 * Queries creators.affiliation.name:*Chile* for each resourceTypeGeneral.
 * Saves raw responses to data/raw/datacite/{type}.json
 *
 * Usage: node pipeline/00-fetch-datacite.mjs
 */

import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { countByType, searchByType } from "./lib/datacite-client.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "..", "data");
const RAW_DIR = resolve(DATA_DIR, "raw", "datacite");

mkdirSync(RAW_DIR, { recursive: true });

// Resource types to fetch (everything except Text/JournalArticle)
const RESOURCE_TYPES = [
  "Software",
  "Dataset",
  "Collection",
  "Image",
  "Audiovisual",
  "ComputationalNotebook",
  "Model",
  "InteractiveResource",
  "Workflow",
  "OutputManagementPlan",
  "Other",
  "PhysicalObject",
  "DataPaper",
];

async function main() {
  console.log("=== chilean-outputs: DataCite fetch ===\n");

  // Phase 1: Count all types
  console.log("Phase 1: Counting Chilean DOIs per type...\n");
  const counts = {};
  let totalEstimated = 0;

  for (const type of RESOURCE_TYPES) {
    const count = await countByType(type);
    counts[type] = count;
    totalEstimated += count;
    console.log(`  ${type.padEnd(25)} → ${count.toLocaleString()} DOIs`);
  }

  console.log(`\n  Total estimated: ${totalEstimated.toLocaleString()}\n`);

  // Phase 2: Fetch records for each type
  console.log("Phase 2: Fetching full records...\n");
  const summary = {
    fetchedAt: new Date().toISOString(),
    types: {},
    totalRecords: 0,
  };

  for (const type of RESOURCE_TYPES) {
    const count = counts[type];
    if (count === 0) {
      summary.types[type] = { estimated: 0, fetched: 0 };
      console.log(`  [SKIP] ${type}: 0 DOIs`);
      continue;
    }

    console.log(`\n  [FETCH] ${type}: ${count.toLocaleString()} estimated`);
    const records = [];

    try {
      for await (const record of searchByType(type)) {
        records.push(record);
      }
    } catch (err) {
      console.error(`  ERROR fetching ${type}: ${err.message}`);
    }

    // Save raw records
    const outPath = resolve(RAW_DIR, `${type}.json`);
    const output = {
      type,
      estimatedCount: count,
      fetchedCount: records.length,
      fetchedAt: new Date().toISOString(),
      records,
    };
    writeFileSync(outPath, JSON.stringify(output, null, 2));

    summary.types[type] = { estimated: count, fetched: records.length };
    summary.totalRecords += records.length;

    console.log(
      `  → ${records.length.toLocaleString()} records saved to datacite/${type}.json`,
    );
  }

  // Save summary
  const summaryPath = resolve(RAW_DIR, "_summary.json");
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Total: ${summary.totalRecords.toLocaleString()} records across ${RESOURCE_TYPES.length} types`);
  console.log(`Summary: ${summaryPath}`);
  console.log("Done!");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
