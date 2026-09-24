#!/usr/bin/env node
/**
 * Step 01: Harvest non-article entity types from ANID OAI-PMH.
 *
 * Endpoint: https://repositorio.be-anid.com/server/oai/request
 * Format: dim (DSpace Internal Metadata)
 *
 * Filters records by dspace.entity.type for:
 *   DatoInvestigacion, Software, PlanGestionDatos,
 *   MaterialAudiovisual, MaterialCartografico, Patente
 *
 * Output: data/raw/anid/records.json
 *
 * Usage: node pipeline/01-fetch-anid.mjs
 */

import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { harvest, getDimValue, getDimValues } from "./lib/oai-client.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "..", "data");
const RAW_DIR = resolve(DATA_DIR, "raw", "anid");

mkdirSync(RAW_DIR, { recursive: true });

// Entity types to keep (non-article outputs)
const ENTITY_TYPES = [
  "DatoInvestigacion",
  "Software",
  "PlanGestionDatos",
  "MaterialAudiovisual",
  "MaterialCartografico",
  "Patente",
];

async function main() {
  console.log("=== chilean-outputs: ANID OAI-PMH harvest ===\n");
  console.log(`Endpoint: https://repositorio.be-anid.com/server/oai/request`);
  console.log(`Format: dim (DSpace Internal Metadata)`);
  console.log(`Entity types: ${ENTITY_TYPES.join(", ")}\n`);

  const records = [];
  const typeCounts = {};
  for (const t of ENTITY_TYPES) typeCounts[t] = 0;

  const t0 = Date.now();

  for await (const { header, dimFields, entityType } of harvest({
    entityTypes: ENTITY_TYPES,
    verbose: true,
  })) {
    // Extract key fields for storage
    const title =
      getDimValue(dimFields, "dc", "title") || "(no title)";
    const doi =
      getDimValue(dimFields, "dc", "identifier", "doi") ||
      getDimValue(dimFields, "dc", "identifier", "uri") ||
      null;
    const date =
      getDimValue(dimFields, "dc", "date", "issued") ||
      getDimValue(dimFields, "dc", "date", "available") ||
      header.datestamp;
    const creators = getDimValues(dimFields, "dc", "contributor", "author");
    const publisher = getDimValue(dimFields, "dc", "publisher");
    const language =
      getDimValue(dimFields, "dc", "language", "iso") ||
      getDimValue(dimFields, "dc", "language");
    const subjects = [
      ...getDimValues(dimFields, "dc", "subject"),
      ...getDimValues(dimFields, "dc", "subject", "keyword"),
    ];
    const descriptions = [
      ...getDimValues(dimFields, "dc", "description"),
      ...getDimValues(dimFields, "dc", "description", "abstract"),
    ];
    const rights = [
      ...getDimValues(dimFields, "dc", "rights"),
      ...getDimValues(dimFields, "dc", "rights", "license"),
      ...getDimValues(dimFields, "dc", "rights", "uri"),
    ];
    const funding = [
      ...getDimValues(dimFields, "dc", "description", "sponsorship"),
      ...getDimValues(dimFields, "dc", "relation", "funding"),
      ...getDimValues(dimFields, "oaire", "fundingStream"),
    ];
    const relations = [
      ...getDimValues(dimFields, "dc", "relation"),
      ...getDimValues(dimFields, "dc", "relation", "ispartof"),
      ...getDimValues(dimFields, "dc", "relation", "isreferencedby"),
      ...getDimValues(dimFields, "dc", "relation", "uri"),
    ];

    records.push({
      oaiId: header.identifier,
      datestamp: header.datestamp,
      entityType,
      title,
      doi,
      date,
      creators,
      publisher,
      language,
      subjects,
      descriptions,
      rights,
      funding,
      relations,
      dimFields, // keep full DIM for analysis step
    });

    typeCounts[entityType] = (typeCounts[entityType] || 0) + 1;

    if (records.length % 100 === 0) {
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`  ${records.length} records harvested (${elapsed}s)`);
    }
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  // Save
  const output = {
    source: "ANID OAI-PMH",
    endpoint: "https://repositorio.be-anid.com/server/oai/request",
    format: "dim",
    entityTypes: ENTITY_TYPES,
    fetchedAt: new Date().toISOString(),
    totalRecords: records.length,
    byType: typeCounts,
    records,
  };

  const outPath = resolve(RAW_DIR, "records.json");
  writeFileSync(outPath, JSON.stringify(output, null, 2));

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Harvested ${records.length} records in ${elapsed}s`);
  console.log("By type:");
  for (const [type, count] of Object.entries(typeCounts)) {
    if (count > 0) {
      console.log(`  ${type.padEnd(25)} → ${count}`);
    }
  }
  console.log(`\nSaved to ${outPath}`);
  console.log("Done!");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
