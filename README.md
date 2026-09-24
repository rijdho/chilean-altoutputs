# chilean-altoutputs

How complete is the metadata of Chilean research outputs that are not articles: datasets,
software, images, collections, data management plans? This project harvests them from DataCite
and from ANID's repository, scores each record on ten fields, and shows the result as a dashboard.

Private for now. The dashboard is published, behind a password, as part of the Metadata Audits hub
at https://metaudits.rijdho.org/chilean-altoutputs/.

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
web/                      React + Vite + Tailwind + Recharts dashboard
data/                     not in git (~165 MB): raw harvests, analysed records, dashboard JSON
```

## Running it

```bash
npm install && (cd web && npm install)
npm run pipeline:all      # harvest, analyse, aggregate (hits DataCite and ANID)
npm run pipeline:analyze && npm run pipeline:aggregate   # recompute from existing raw data, no network
cd web && npm run dev
```

The dashboard is built and deployed by the hub, not from here:

```bash
cd ../../rij/metaudits && npm run build:chilean-altoutputs && npm run deploy:quick
```

## Status

Last harvest 2026-04-03; dashboard data regenerated 2026-09-24 from that harvest with the stricter
ORCID rule (10 of 15,310 records changed verdict). 15,310 records, 49.2% average completeness.

## License

No licence yet: all rights reserved while the repository is private.
