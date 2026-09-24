// The dashboard files must agree with each other before they are published.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const load = (f) => JSON.parse(readFileSync(new URL(`../../data/dashboard/${f}`, import.meta.url)));
const overview = load('overview.json');
const types = load('types.json');
const records = load('records-lite.json');
const fields = load('fields.json');

test('types add up to the total', () => {
  assert.equal(types.reduce((s, t) => s + t.count, 0), overview.totalRecords);
});
test('the records index holds every record', () => {
  assert.equal(records.length, overview.totalRecords);
});
test('sources add up to the total', () => {
  assert.equal(overview.bySource.DataCite + overview.bySource.ANID, overview.totalRecords);
});
test('ten fields, each a percentage', () => {
  assert.equal(fields.length, 10);
  for (const f of fields) assert.ok(f.pct >= 0 && f.pct <= 100, f.id);
});
