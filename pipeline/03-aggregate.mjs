#!/usr/bin/env node
/**
 * Step 03: Aggregate analyzed data into dashboard-ready JSONs.
 *
 * Input:  data/analyzed.json
 * Output: data/dashboard/
 *           overview.json       — KPIs, global stats
 *           types.json          — per-type breakdown with completeness
 *           repositories.json   — top repositories with counts + completeness
 *           fields.json         — per-field completeness percentages
 *           licenses.json       — license distribution
 *           yearly.json         — records per year with avg completeness
 *           institutions.json   — top Chilean institutions by output count
 *
 * Usage: node pipeline/03-aggregate.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { FIELDS } from "./lib/metadata-schema.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "..", "data");
const DASH_DIR = resolve(DATA_DIR, "dashboard");

// Upper bound for the publication-year timeline. Records with a year beyond the
// current year are data errors (e.g. DataCite test records) and are excluded.
const CURRENT_YEAR = new Date().getFullYear();

mkdirSync(DASH_DIR, { recursive: true });

// ── Load ────────────────────────────────────────────────────────────────────

console.log("Loading analyzed data...");
const data = JSON.parse(readFileSync(resolve(DATA_DIR, "analyzed.json"), "utf-8"));
const records = data.records || [];
console.log(`  ${records.length} records`);

const N = records.length;
if (N === 0) {
  console.error("No records found. Run steps 00-02 first.");
  process.exit(1);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
const pct = (n, total) => (total ? Math.round((n / total) * 1000) / 10 : 0);
const round1 = (v) => Math.round(v * 10) / 10;

const write = (name, obj) => {
  const path = resolve(DASH_DIR, name);
  writeFileSync(path, JSON.stringify(obj, null, 2));
  console.log(`  -> ${name}`);
};

// ═══════════════════════════════════════════════════════════════════════════════
//  1. OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════

const bySource = {};
for (const r of records) {
  bySource[r.source] = (bySource[r.source] || 0) + 1;
}

const byType = {};
for (const r of records) {
  byType[r.type] = (byType[r.type] || 0) + 1;
}

const avgCompleteness = round1(avg(records.map((r) => r.score)) * 100);

const overview = {
  totalRecords: N,
  bySource,
  byType,
  avgCompleteness,
  fieldCount: FIELDS.length,
  generatedAt: new Date().toISOString(),
};

write("overview.json", overview);

// ═══════════════════════════════════════════════════════════════════════════════
//  2. TYPES — per-type breakdown
// ═══════════════════════════════════════════════════════════════════════════════

const typeStats = Object.entries(byType)
  .map(([type, count]) => {
    const typeRecords = records.filter((r) => r.type === type);
    const typeAvg = round1(avg(typeRecords.map((r) => r.score)) * 100);

    // Per-field completeness for this type
    const fieldRates = {};
    for (const field of FIELDS) {
      const present = typeRecords.filter(
        (r) => r.completeness[field.id],
      ).length;
      fieldRates[field.id] = pct(present, typeRecords.length);
    }

    // Source split with completeness
    const sourceBreakdown = {};
    const sourceScores = {};
    for (const r of typeRecords) {
      sourceBreakdown[r.source] = (sourceBreakdown[r.source] || 0) + 1;
      if (!sourceScores[r.source]) sourceScores[r.source] = [];
      sourceScores[r.source].push(r.score);
    }
    const sourceCompleteness = {};
    for (const [src, scores] of Object.entries(sourceScores)) {
      sourceCompleteness[src] = round1(avg(scores) * 100);
    }

    // Per-type top repositories
    const typeRepoCounts = {};
    for (const r of typeRecords) {
      const repo = r.repository || r.publisher || "Unknown";
      if (!typeRepoCounts[repo]) typeRepoCounts[repo] = { count: 0, scores: [] };
      typeRepoCounts[repo].count++;
      typeRepoCounts[repo].scores.push(r.score);
    }
    const typeRepos = Object.entries(typeRepoCounts)
      .map(([name, d]) => ({ name, count: d.count, avgCompleteness: round1(avg(d.scores) * 100) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    // Per-type yearly
    const typeByYear = {};
    for (const r of typeRecords) {
      const y = r.year;
      if (!y || y < 2000 || y > CURRENT_YEAR) continue;
      if (!typeByYear[y]) typeByYear[y] = { count: 0, scores: [], dc: 0, anid: 0 };
      typeByYear[y].count++;
      typeByYear[y].scores.push(r.score);
      if (r.source === "DataCite") typeByYear[y].dc++;
      else typeByYear[y].anid++;
    }
    const typeYearly = Object.entries(typeByYear)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .map(([year, d]) => ({
        year: parseInt(year),
        count: d.count,
        avgCompleteness: round1(avg(d.scores) * 100),
        bySource: { DataCite: d.dc, ANID: d.anid },
      }));

    // Per-type per-field by source
    const typeFieldsBySource = {};
    for (const field of FIELDS) {
      const dcRecs = typeRecords.filter((r) => r.source === "DataCite");
      const anidRecs = typeRecords.filter((r) => r.source === "ANID");
      typeFieldsBySource[field.id] = {
        DataCite: dcRecs.length ? pct(dcRecs.filter((r) => r.completeness[field.id]).length, dcRecs.length) : null,
        ANID: anidRecs.length ? pct(anidRecs.filter((r) => r.completeness[field.id]).length, anidRecs.length) : null,
      };
    }

    return {
      type,
      count,
      pct: pct(count, N),
      avgCompleteness: typeAvg,
      fields: fieldRates,
      fieldsBySource: typeFieldsBySource,
      bySource: sourceBreakdown,
      completenessbySource: sourceCompleteness,
      repos: typeRepos,
      yearly: typeYearly,
    };
  })
  .sort((a, b) => b.count - a.count);

write("types.json", typeStats);

// ═══════════════════════════════════════════════════════════════════════════════
//  3. REPOSITORIES — top publishers/repos
// ═══════════════════════════════════════════════════════════════════════════════

const repoCounts = {};
for (const r of records) {
  const repo = r.repository || r.publisher || "Unknown";
  if (!repoCounts[repo]) {
    repoCounts[repo] = { count: 0, scores: [], types: {}, sources: {} };
  }
  repoCounts[repo].count++;
  repoCounts[repo].scores.push(r.score);
  repoCounts[repo].types[r.type] =
    (repoCounts[repo].types[r.type] || 0) + 1;
  repoCounts[repo].sources[r.source] =
    (repoCounts[repo].sources[r.source] || 0) + 1;
}

const repositories = Object.entries(repoCounts)
  .map(([name, data]) => ({
    name,
    count: data.count,
    pct: pct(data.count, N),
    avgCompleteness: round1(avg(data.scores) * 100),
    topTypes: Object.entries(data.types)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count })),
    bySource: data.sources,
  }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 50);

write("repositories.json", repositories);

// ═══════════════════════════════════════════════════════════════════════════════
//  4. FIELDS — per-field completeness percentages
// ═══════════════════════════════════════════════════════════════════════════════

const fieldStats = FIELDS.map((field) => {
  const present = records.filter((r) => r.completeness[field.id]).length;
  const overall = pct(present, N);

  // By source
  const bySourceField = {};
  for (const source of Object.keys(bySource)) {
    const sourceRecords = records.filter((r) => r.source === source);
    const sourcePresent = sourceRecords.filter(
      (r) => r.completeness[field.id],
    ).length;
    bySourceField[source] = pct(sourcePresent, sourceRecords.length);
  }

  // By type (top 5)
  const byTypeField = {};
  for (const [type, count] of Object.entries(byType).sort(
    (a, b) => b[1] - a[1],
  ).slice(0, 8)) {
    const typeRecords = records.filter((r) => r.type === type);
    const typePresent = typeRecords.filter(
      (r) => r.completeness[field.id],
    ).length;
    byTypeField[type] = pct(typePresent, typeRecords.length);
  }

  return {
    id: field.id,
    label: field.label,
    description: field.description,
    pct: overall,
    count: present,
    bySource: bySourceField,
    byType: byTypeField,
  };
});

write("fields.json", fieldStats);

// ═══════════════════════════════════════════════════════════════════════════════
//  5. LICENSES — distribution
// ═══════════════════════════════════════════════════════════════════════════════

// Normalize license names to canonical short forms
function normalizeLicense(raw) {
  if (!raw) return "No license";
  const l = raw.trim();
  if (/^(none|\(none\))$/i.test(l)) return "No license";
  if (/license\s*not\s*specified/i.test(l)) return "No license";
  if (/info:eu-repo\/semantics\/openAccess/i.test(l)) return "Open Access (unspecified)";
  if (/info:eu-repo\/semantics\/restrictedAccess/i.test(l)) return "Restricted Access";
  if (/info:eu-repo\/semantics\/closedAccess/i.test(l)) return "Closed Access";
  if (/^acceso\s*abierto$/i.test(l)) return "Open Access (unspecified)";
  if (/^open\s*access$/i.test(l)) return "Open Access (unspecified)";
  if (/^restricted\s*access$/i.test(l)) return "Restricted Access";
  if (/^closed\s*access$/i.test(l)) return "Closed Access";
  // CC licenses
  if (/cc.?0|creative\s*commons\s*zero/i.test(l)) return "CC0";
  if (/cc.?by.?nc.?nd|atribuci[oó]n.?nocomercial.?sinderivadas|attribution.?non\s*commercial.?no\s*deriv/i.test(l)) return "CC BY-NC-ND";
  if (/cc.?by.?nc.?sa|attribution.?non\s*commercial.?share\s*alike/i.test(l)) return "CC BY-NC-SA";
  if (/cc.?by.?nc|attribution.?non\s*commercial/i.test(l)) return "CC BY-NC";
  if (/cc.?by.?nd|attribution.?no\s*deriv/i.test(l)) return "CC BY-ND";
  if (/cc.?by.?sa|attribution.?share\s*alike/i.test(l)) return "CC BY-SA";
  if (/cc.?by|creative\s*commons\s*attribution/i.test(l)) return "CC BY";
  // Software licenses
  if (/\bMIT\b/i.test(l)) return "MIT";
  if (/GPL.?v?3.*or\s*later/i.test(l)) return "GPL-3.0+";
  if (/GPL.?v?3/i.test(l)) return "GPL-3.0";
  if (/GPL.?v?2/i.test(l)) return "GPL-2.0";
  if (/\bGPL\b/i.test(l)) return "GPL";
  if (/apache/i.test(l)) return "Apache-2.0";
  if (/\bBSD\b/i.test(l)) return "BSD";
  if (/^other$/i.test(l)) return "Other";
  // Truncate long names
  if (l.length > 40) return l.slice(0, 37) + "...";
  return l;
}

const licenseCounts = {};
for (const r of records) {
  const lic = normalizeLicense(r.license);
  if (!licenseCounts[lic]) licenseCounts[lic] = { total: 0, DataCite: 0, ANID: 0 };
  licenseCounts[lic].total++;
  licenseCounts[lic][r.source] = (licenseCounts[lic][r.source] || 0) + 1;
}

const licenses = Object.entries(licenseCounts)
  .map(([name, d]) => ({
    name,
    count: d.total,
    pct: pct(d.total, N),
    DataCite: d.DataCite,
    ANID: d.ANID,
  }))
  .sort((a, b) => b.count - a.count);

// Also compute open vs closed
const openCount = records.filter((r) => r.completeness.hasOpenLicense).length;
const anyLicenseCount = records.filter(
  (r) => r.completeness.hasLicense,
).length;

const licensesSummary = {
  total: N,
  withLicense: anyLicenseCount,
  withLicensePct: pct(anyLicenseCount, N),
  openLicense: openCount,
  openLicensePct: pct(openCount, N),
  distribution: licenses.slice(0, 30),
};

write("licenses.json", licensesSummary);

// ═══════════════════════════════════════════════════════════════════════════════
//  6. YEARLY — records per year + completeness trend
// ═══════════════════════════════════════════════════════════════════════════════

const byYear = {};
for (const r of records) {
  const year = r.year || "Unknown";
  if (!byYear[year]) byYear[year] = [];
  byYear[year].push(r);
}

const yearly = Object.entries(byYear)
  .filter(([y]) => y !== "Unknown" && parseInt(y) >= 2000 && parseInt(y) <= CURRENT_YEAR)
  .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
  .map(([year, recs]) => {
    // Per-field rates for this year
    const fieldRates = {};
    for (const field of FIELDS) {
      const present = recs.filter((r) => r.completeness[field.id]).length;
      fieldRates[field.id] = pct(present, recs.length);
    }

    const dcRecs = recs.filter((r) => r.source === "DataCite");
    const anidRecs = recs.filter((r) => r.source === "ANID");

    return {
      year: parseInt(year),
      count: recs.length,
      avgCompleteness: round1(avg(recs.map((r) => r.score)) * 100),
      dcCompleteness: dcRecs.length ? round1(avg(dcRecs.map((r) => r.score)) * 100) : null,
      anidCompleteness: anidRecs.length ? round1(avg(anidRecs.map((r) => r.score)) * 100) : null,
      bySource: {
        DataCite: dcRecs.length,
        ANID: anidRecs.length,
      },
      fields: fieldRates,
    };
  });

write("yearly.json", yearly);

// ═══════════════════════════════════════════════════════════════════════════════
//  7. INSTITUTIONS — top Chilean institutions by output count
// ═══════════════════════════════════════════════════════════════════════════════

// Extract institution names from creator affiliations
// Normalize known Chilean institutions to canonical names
const INST_ALIASES = [
  { canon: "Universidad de Chile", patterns: [/universidad\s+de\s+chile/i, /university\s+of\s+chile/i, /\bUCh\b/] },
  { canon: "Pontificia Universidad Católica de Chile", patterns: [/pontificia\s+universidad\s+cat[oó]lica\s+de\s+chile/i, /pontifical\s+catholic\s+university\s+of\s+chile/i, /\bPUC\b/] },
  { canon: "Universidad de Santiago de Chile", patterns: [/universidad\s+de\s+santiago\s+de\s+chile/i, /university\s+of\s+santiago\s+chile/i, /\bUSACH\b/] },
  { canon: "Universidad de Concepción", patterns: [/universidad\s+de\s+concepci[oó]n/i, /university\s+of\s+concepci[oó]n/i, /\bUdeC\b/] },
  { canon: "Universidad Austral de Chile", patterns: [/universidad\s+austral\s+de\s+chile/i, /austral\s+university\s+of\s+chile/i] },
  { canon: "Universidad Autónoma de Chile", patterns: [/universidad\s+aut[oó]noma\s+de\s+chile/i] },
  { canon: "Universidad de Valparaíso", patterns: [/universidad\s+de\s+valpara[ií]so/i] },
  { canon: "Universidad de La Frontera", patterns: [/universidad\s+de\s+la\s+frontera/i] },
  { canon: "Universidad Andrés Bello", patterns: [/universidad\s+andr[eé]s\s+bello/i] },
  { canon: "Universidad Católica del Norte", patterns: [/universidad\s+cat[oó]lica\s+del\s+norte/i] },
  { canon: "Universidad de Talca", patterns: [/universidad\s+de\s+talca/i] },
  { canon: "Universidad Diego Portales", patterns: [/universidad\s+diego\s+portales/i] },
  { canon: "ANID", patterns: [/\bANID\b/, /\bCONICYT\b/i] },
];

function canonicalize(name) {
  // Strip parentheses
  const clean = name.replace(/^\(+/, "").replace(/\)+$/, "").trim();
  for (const { canon, patterns } of INST_ALIASES) {
    if (patterns.some((p) => p.test(clean))) return canon;
  }
  return clean;
}

const instCounts = {};
for (const r of records) {
  const seen = new Set();
  for (const creator of r.creators || []) {
    const aff = creator.affiliation || "";
    if (!aff) continue;

    const parts = aff.split(";").map((s) => s.trim()).filter(Boolean);
    for (const part of parts) {
      const isChilean =
        /chile/i.test(part) ||
        /\bUCh\b/i.test(part) ||
        /\bPUC\b/i.test(part) ||
        /\bUSACH\b/i.test(part) ||
        /\bUdeC\b/i.test(part) ||
        /\bANID\b/i.test(part) ||
        /\bCONICYT\b/i.test(part) ||
        /\bSantiago\b/i.test(part) ||
        /\bValparaiso\b/i.test(part) ||
        /\bConcepci/i.test(part);

      if (!isChilean) continue;

      const canon = canonicalize(part);
      if (canon.length < 3 || seen.has(canon)) continue;
      seen.add(canon);

      if (!instCounts[canon]) {
        instCounts[canon] = { count: 0, scores: [], types: {} };
      }
      instCounts[canon].count++;
      instCounts[canon].scores.push(r.score);
      instCounts[canon].types[r.type] =
        (instCounts[canon].types[r.type] || 0) + 1;
    }
  }
}

const institutions = Object.entries(instCounts)
  .map(([name, data]) => ({
    name,
    count: data.count,
    avgCompleteness: round1(avg(data.scores) * 100),
    topTypes: Object.entries(data.types)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type, count]) => ({ type, count })),
  }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 40);

write("institutions.json", institutions);

// ═══════════════════════════════════════════════════════════════════════════════
//  8. RECORDS-LITE — lightweight index for click-to-explore
// ═══════════════════════════════════════════════════════════════════════════════

const recordsLite = records.map((r) => ({
  doi: r.doi || "",
  title: (r.title || "").slice(0, 120),
  type: r.type,
  source: r.source,
  license: normalizeLicense(r.license),
  year: r.year,
  publisher: (r.repository || r.publisher || "").slice(0, 80),
  score: r.score,
}));

write("records-lite.json", recordsLite);

// ── Done ────────────────────────────────────────────────────────────────────

console.log(`\nAll dashboard data generated in ${DASH_DIR}`);
console.log(`  ${N} records analyzed`);
console.log(`  Average completeness: ${avgCompleteness}%`);
console.log("Done!");
