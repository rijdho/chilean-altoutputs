# chilean-altoutputs

How complete is the metadata of Chilean research outputs that are not articles: datasets,
software, images, collections, data management plans? This project harvests them from DataCite
and from ANID's repository, scores each record on ten fields, and shows the result as a dashboard.

🔗 **Live:** https://rijdho.github.io/chilean-altoutputs/

Available in **English, German and Spanish** (auto-detected, switchable).

Part of the [Metadata Audits](https://rijdho.github.io/metaudits-home/) family.

## What it measures

Records with a Chilean creator affiliation in DataCite (13 resource types) plus the non-article
records of ANID's repository (OAI-PMH, `dim` format). Each record is checked for ten fields:

| Field | Counts when |
|---|---|
| hasOrcid | a creator has a **well-formed** ORCID: pattern and check digit, marked as ORCID by scheme, schemeUri or value |
| hasLicense | rights or licence information is present |
| hasOpenLicense | the licence is open (CC BY, CC0, MIT, GPL, Apache, BSD) |
| hasSubjects | subject keywords are present |
| hasDescription | a description of more than 20 words |
| hasFunding | funding or grant information is present |
| hasRelatedWorks | related identifiers are present |
| hasVersion | version information is present |
| hasLanguage | a language is given |
| hasPublisher | a publisher or repository is given |

Since 2026-09-24 a declared ORCID counts only if it is one: DataCite accepts any value under the
ORCID scheme, null included. The rule lives in `pipeline/lib/pids.mjs` and matches
[fair-repo-audit](https://github.com/rijdho/fair-repo-audit) 1.7.1.

## Structure

```
pipeline/
  00-fetch-datacite.mjs   harvest Chilean DataCite DOIs by resource type (network)
  01-fetch-anid.mjs       harvest ANID's OAI-PMH endpoint (network)
  02-analyze.mjs          normalise, deduplicate, score the ten fields
  03-aggregate.mjs        write the dashboard JSON
  lib/                    DataCite and OAI clients, the field schema, identifier checks
web/                      React + Vite + Tailwind + Recharts dashboard, in three languages
  src/i18n/               en.js (source of truth), es.js, de.js
  tests/                  catalogues in step; dashboard files consistent
data/dashboard/           the aggregated results the dashboard reads: the published dataset (CC BY 4.0)
data/raw/, analyzed.json  not in git (~160 MB): raw harvests and analysed records
```

## Running it

```bash
npm install && (cd web && npm install)
npm run pipeline:all      # harvest, analyse, aggregate (hits DataCite and ANID)
npm run pipeline:analyze && npm run pipeline:aggregate   # recompute from existing raw data, no network
cd web && npm run dev
```

The look is the shared house style ([rijdho/house-style](https://github.com/rijdho/house-style)):
`web/src/house/` is an exact copy, refreshed with `npm run sync-house` from a sibling checkout, and a
test fails if it is edited or falls behind. Styles for this dashboard only go in `web/src/index.css`.

A push to `main` runs the tests, builds `web/` and publishes it to GitHub Pages
(`.github/workflows/deploy.yml`). The page loads nothing from any other origin: fonts are
self-hosted, and a Content-Security-Policy in `web/index.html` enforces it.

## Status

Last harvest 2026-04-03; dashboard data regenerated 2026-09-24 from that harvest with the stricter
ORCID rule (10 of 15,310 records changed verdict). 15,310 records, 49.2% average completeness.

## License

Code: [MIT](LICENSE). The aggregated data in `data/dashboard/`:
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). It is derived from public metadata in
DataCite (CC0) and in ANID's repository.

By [Ricardo Hartley Belmar](https://rijdho.github.io) (ORCID
[0000-0001-5058-9309](https://orcid.org/0000-0001-5058-9309)).
