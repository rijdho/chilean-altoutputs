// Every figure on the page is computed from data/dashboard/ when the page is shown, so no figure is
// typed into a text. These checks fail when one is, or when the files disagree with what the texts
// say about them (added 2026-10-20).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import en from '../src/i18n/en.js';

const load = (f) => JSON.parse(readFileSync(new URL(`../../data/dashboard/${f}`, import.meta.url)));
const overview = load('overview.json');
const repositories = load('repositories.json');
const fields = load('fields.json');

// Figures a text may carry: definitions (10 fields, 20 words), the law and the policy and their terms,
// checked against the documents (Ley 21.105 of 2018; the 2022 policy, its 11 pages and its deadlines),
// software versions, licence names (CC0, CC BY 4.0) and the author's ORCID iD.
const ALLOWED = new Set(['10', '20', '21.105', '2018', '2022', '2016', '6', '30', '1', '11', '24', '2026',
  '7', '4.0', '0', '0000', '0001', '5058', '9309']);

test('no text carries a figure of its own', () => {
  for (const [key, value] of Object.entries(en)) {
    const text = value.replace(/\{[^}]*\}/g, '').replace(/https?:\/\/[^)\s]+/g, '').replace(/`[^`]*`/g, '');
    for (const n of text.match(/\d+(?:[.,]\d+)*/g) || []) assert.ok(ALLOWED.has(n), `${key}: ${n}`);
  }
});

test('software: DOIs, DataCite DOIs and pieces of software are in order', () => {
  const s = overview.software;
  assert.equal(s.dois, overview.byType.Software);
  assert.ok(s.dataciteDois <= s.dois);
  assert.ok(s.dataciteConcepts > 0 && s.dataciteConcepts <= s.dataciteDois);
});

test('every publisher shown is marked Chilean or not, from the reviewed list', () => {
  for (const r of repositories) assert.equal(typeof r.chilean, 'boolean', r.name);
  assert.ok(repositories.some((r) => r.chilean) && repositories.some((r) => !r.chilean));
});

test('each source has a harvest date, and every field a rate per source', () => {
  for (const src of ['DataCite', 'ANID']) assert.match(overview.harvested[src], /^\d{4}-\d{2}-\d{2}$/);
  for (const f of fields) for (const src of ['DataCite', 'ANID']) {
    assert.ok(f.bySource[src] >= 0 && f.bySource[src] <= 100, `${f.id} ${src}`);
  }
});
