# Beyond Articles

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.23498567.svg)](https://doi.org/10.5281/zenodo.23498567)

How complete is the metadata of Chilean research outputs that are not articles: datasets,
software, images, collections, data management plans? This project harvests them from DataCite
and from ANID's repository, scores each record on ten fields, and shows the result as a dashboard.

🔗 **Live:** https://rijdho.github.io/chilean-altoutputs/

Available in **English and Spanish** (auto-detected, switchable).

Part of the [Metaudits](https://rijdho.github.io/metaudits-home/) family.

## What it measures

Records with a Chilean creator affiliation in DataCite (13 resource types) plus the non-article
records of ANID's repository (OAI-PMH, `dim` format). Each record is checked for ten fields:

| Field | Counts when |
|---|---|
| hasOrcid | a creator has a **well-formed** ORCID: pattern and check digit, marked as ORCID by scheme, schemeUri or value (ANID: a field named orcid) |
| hasLicense | a licence or terms of use is given; access statements (Open Access, Restricted Access) do not count |
| hasOpenLicense | the licence is open: CC BY, CC BY-SA, CC0 or an OSI licence; NC and ND do not count |
| hasSubjects | subject keywords are present |
| hasDescription | a description of more than 20 words |
| hasFunding | funding or grant information is present (ANID: also the grant folio or project id) |
| hasRelatedWorks | a link to another work by web address, DOI or handle; links to the record's own files or versions do not count |
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
  02-analyze.mjs          normalise, score the ten fields
  03-aggregate.mjs        write the dashboard JSON
  lib/                    DataCite and OAI clients, the field schema, identifier checks,
                          the reviewed list of Chilean publishers
  tests/                  the field rules and the DataCite type ids
scripts/numbers.mjs       writes NUMBERS.md: every figure the site shows
web/                      React + Vite + Tailwind + Recharts dashboard, in English and Spanish
  src/i18n/               en.js (source of truth), es.js, de.js
  tests/                  catalogues in step; dashboard files consistent; no figure typed into a text
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

The look is the house style shared by rijdho's public tools: `web/src/house/` is an exact copy,
refreshed with `npm run sync-house` from the maintainer's checkout. A test fails if the copy is
edited, and, on the maintainer's computer, if it falls behind the original. Styles for this dashboard
only go in `web/src/index.css`.

A push to `main` runs the tests, builds `web/` and publishes it to GitHub Pages
(`.github/workflows/deploy.yml`). The page loads nothing from any other origin: fonts are
self-hosted, and a Content-Security-Policy in `web/index.html` enforces it.

## Status

Harvested 2026-10-20 from both sources: 18,366 records (17,424 from DataCite, 942 from ANID), 44.9%
average completeness; [`NUMBERS.md`](NUMBERS.md) lists every figure. That harvest corrected three
errors of the April one: five multi-word resource types (computational notebooks, data management
plans and others) returned nothing because DataCite expects them hyphenated; ANID's authors, grant
folios and ORCID fields were not read; and any `dc.relation` value, "No aplica" included, counted as a
related work. The April data and dashboard files are kept outside git.

## License

Code: [MIT](LICENSE), copyright 2026 Ricardo Hartley Belmar. The aggregated data in `data/dashboard/`:
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). It is derived from public metadata in
DataCite (CC0) and in ANID's repository. [`NOTICE`](NOTICE) carries both, and the font's licence;
a derivative keeps it. From 2026-09-24 to 2026-10-13 the code was under Apache-2.0, and a copy
taken then keeps those terms; before and after, MIT.

By [Ricardo Hartley Belmar](https://rijdho.github.io) (ORCID
[0000-0001-5058-9309](https://orcid.org/0000-0001-5058-9309)).

## Citation

If you use this dashboard or its data, please cite it: see [`CITATION.cff`](CITATION.cff) or the "Cite this
repository" button. Archived on Zenodo: concept DOI
[10.5281/zenodo.23498567](https://doi.org/10.5281/zenodo.23498567) (always resolves to the latest version).
