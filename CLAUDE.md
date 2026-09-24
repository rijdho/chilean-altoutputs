# chilean-altoutputs: Chilean AltOutputs Audit

Audits metadata completeness of Chilean non-article research outputs (software, datasets, notebooks, models, images, etc.) using DataCite API and ANID OAI-PMH.

## Location

`Desarrollos/github/chilean-altoutputs`, its own repository since 2026-09-24 (public, MIT code, CC BY data). Until then it
lived in `rij/metaudits/chilean-altoutputs`, whose git history (8 commits) stays in rij.

## Architecture

```
chilean-altoutputs/
├── pipeline/
│   ├── 00-fetch-datacite.mjs     ← fetch Chilean DOIs by resource type
│   ├── 01-fetch-anid.mjs         ← harvest ANID OAI-PMH (dim format)
│   ├── 02-analyze.mjs            ← normalize, deduplicate, score completeness
│   ├── 03-aggregate.mjs          ← generate dashboard JSONs (year timeline filtered to ≤ current year; excludes DataCite test records dated 2027/2028)
│   └── lib/
│       ├── datacite-client.mjs   ← DataCite REST API client with cursor pagination
│       ├── oai-client.mjs        ← OAI-PMH client for ANID repository
│       └── metadata-schema.mjs   ← 10 completeness fields with check functions
├── web/                          ← React + Vite + Tailwind + Recharts
│   └── src/
│       ├── pages/
│       │   ├── OverviewPage.jsx   ← KPIs, type breakdown, license dist, institutions
│       │   ├── CompletenessPage.jsx ← per-field and per-type completeness
│       │   ├── RepositoriesPage.jsx ← where outputs are deposited
│       │   └── AboutPage.jsx      ← methodology, sources, limitations
│       └── lib/data.js           ← imports pre-generated JSONs
├── data/
│   ├── raw/                      ← gitignored, API responses
│   │   ├── datacite/             ← per-type JSON files
│   │   └── anid/                 ← OAI-PMH harvested records
│   ├── analyzed.json             ← normalized + scored records
│   └── dashboard/                ← aggregated JSONs (git-tracked)
│       ├── overview.json
│       ├── types.json
│       ├── repositories.json
│       ├── fields.json
│       ├── licenses.json
│       ├── yearly.json
│       └── institutions.json
└── package.json
```

## Data Sources

### DataCite API
- Query: `creators.affiliation.name:*Chile*` filtered by resourceTypeGeneral
- Types fetched: Software, Dataset, Collection, Image, Audiovisual, ComputationalNotebook, Model, InteractiveResource, Workflow, OutputManagementPlan, Other, PhysicalObject, DataPaper
- Estimated volume: ~10K+ Chilean DOIs (non-article)
- Cursor-based pagination, polite rate limiting

### ANID OAI-PMH
- Endpoint: `https://repositorio.be-anid.com/server/oai/request`
- Format: `dim` (DSpace Internal Metadata: richest, includes datacite.*, oaire.*, dc.* with qualifiers)
- Entity types: DatoInvestigacion (250), Software (8), PlanGestionDatos (211), MaterialAudiovisual (52), MaterialCartografico (13), Patente (210)
- Total ANID repository: ~170K records, but only ~540 are non-article outputs
- Rich funding info: FONDECYT folio, programa, instrumento
- No ORCID identifiers in ANID records

## 10 Metadata Completeness Fields

| Field | What it checks |
|-------|----------------|
| hasOrcid | Any creator has a well-formed ORCID (pattern + check digit; `pipeline/lib/pids.mjs`). Before 2026-09-24 the scheme alone counted, nulls included |
| hasLicense | Licence or terms of use; access statements do not count (pipeline/lib/rules.mjs) |
| hasOpenLicense | CC BY, CC BY-SA, CC0, OSI; NC/ND excluded |
| hasSubjects | Subject keywords present |
| hasDescription | Non-trivial description (>20 words) |
| hasFunding | Funding/grant info |
| hasRelatedWorks | Link to another work; own files and versions excluded |
| hasVersion | Version info |
| hasLanguage | Language specified |
| hasPublisher | Publisher/repository specified |

## Key Results (pipeline 2026-04-03)

- **15,310 records** total (14,552 DataCite + 758 ANID)
- **49.2% avg metadata completeness** (10 FAIR fields)
- **9,565 datasets**, 4,029 images, 627 collections, **330 software**, 228 DMPs, 164 audiovisual, 23 models
- **0 software** in Chilean institutional repos (UChile, PUC, USACH Dataverse): all 6,184 DOIs typed as "Dataset"
- **330 software DOIs**: 307 on Zenodo (93%), 11 Code Ocean, 8 ANID, 4 other
- **Software completeness: 65.4%** (best type after Collection), 66.1% with ORCID, 83.6% open license
- **ANID policy (2022) does NOT mention software** in its 11 pages: only publications + data
- Top institutions: UChile (7,307), PUC (2,011), UdeC (871), UAustral (825), USACH (636)

## Dashboard Features

- **TypeFilter** (pills) in Overview, Completeness, Repositories: all charts filter by type
- **DataCite vs ANID** separation in all charts (teal/orange, stacked or side-by-side)
- **Click-to-show-records** in license, type, repo, and yearly charts
- **RecordsList** with internal source toggle (All/DataCite/ANID), scrollable, sticky header, year-sorted
- **records-lite.json** loaded lazily via fetch (not bundled): bundle 701KB vs 4.2MB
- **Normalized licenses** (CC BY, MIT, GPL-3.0, etc.) and **canonicalized institutions** (alias merging)
- **Rich tooltips** with field descriptions, counts, and source breakdown
- **ANID policy card** in About with requirements table and critical gap callout

## Commands

```bash
npm run pipeline:datacite    # step 00: fetch DataCite Chilean outputs
npm run pipeline:anid        # step 01: harvest ANID OAI-PMH
npm run pipeline:analyze     # step 02: normalize + score
npm run pipeline:aggregate   # step 03: generate dashboard JSONs
npm run pipeline:all         # all steps sequentially
npm run dev                  # web dev server
npm run build                # production build
```

## Stack

- **Pipeline**: Node.js (ESM), fast-xml-parser
- **Dashboard**: React 19, Vite, Tailwind CSS, Recharts
- **Build**: Terser (drop_console, 3 passes, toplevel mangle)
- **Theme**: Dark/Light toggle, "Obsidian Teal" palette, localStorage key `ca-theme`

## Access

Public since 2026-09-24. Until then the hub served it behind a password; that history is in `_ref/`.

## Deploy

Public on GitHub Pages since 2026-09-24: https://rijdho.github.io/chilean-altoutputs/ . A push to `main`
runs `web` tests and build (`.github/workflows/deploy.yml`). The Metadata Audits hub no longer builds it;
its old path redirects here. UI in EN/ES/DE (`web/src/i18n/`), self-hosted fonts, CSP in `web/index.html`.

## Related work & collaborators

- Standalone audit: no external manuscript or collaborator currently on record.
